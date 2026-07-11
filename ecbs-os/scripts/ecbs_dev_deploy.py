#!/usr/bin/env python3
"""Deploy the ECBS OS app to the shared dev server.

This script wraps the repeatable parts of the current dev workflow:

1. git pull on the dev server
2. backend build
3. EF database update
4. frontend Docker rebuild/restart
5. API restart
6. optional verifier execution from the local machine

Secrets are intentionally read from environment variables and are not embedded in
the script or verification config.
"""

from __future__ import annotations

import argparse
import os
import shlex
import subprocess
import sys
from pathlib import Path


DEFAULT_REMOTE = "xcorp@100.91.109.59"
DEFAULT_REMOTE_REPO = "/home/xcorp/synerex-platform"
DEFAULT_BRANCH = "master"
DEFAULT_ECBS_OS_DIR = Path(__file__).resolve().parents[1]


def main() -> int:
    parser = argparse.ArgumentParser(description="Deploy ECBS OS to the dev server.")
    parser.add_argument("--remote", default=os.getenv("ECBS_DEV_REMOTE", DEFAULT_REMOTE))
    parser.add_argument("--remote-repo", default=os.getenv("ECBS_DEV_REPO", DEFAULT_REMOTE_REPO))
    parser.add_argument("--branch", default=os.getenv("ECBS_DEV_BRANCH", DEFAULT_BRANCH))
    parser.add_argument("--frontend-api-base-url", default=os.getenv("ECBS_FRONTEND_API_BASE_URL", "http://172.18.0.1:5090"))
    parser.add_argument("--verification-config", help="Run local verifier after deploy.")
    parser.add_argument("--include-mutating", action="store_true", help="Pass --include-mutating to the verifier.")
    parser.add_argument("--skip-migrations", action="store_true", help="Skip EF database update.")
    parser.add_argument("--frontend-only", action="store_true", help="Only rebuild/restart the frontend container.")
    parser.add_argument("--frontend-network", default=os.getenv("ECBS_FRONTEND_DOCKER_NETWORK", "synerex-platform_default"))
    parser.add_argument("--frontend-host-port", default=os.getenv("ECBS_FRONTEND_HOST_PORT", "3001"))
    parser.add_argument("--frontend-container-port", default=os.getenv("ECBS_FRONTEND_CONTAINER_PORT", "3001"))
    args = parser.parse_args()

    required = []
    if not args.frontend_only:
        required = [
            "ECBS_CONNECTION_STRING",
            "TRACKING_DB_HOST",
            "TRACKING_DB_PORT",
            "TRACKING_DB_NAME",
            "TRACKING_DB_USER",
            "TRACKING_DB_PASSWORD",
        ]
    missing = [name for name in required if not os.getenv(name)]
    if missing:
        print("Missing required environment variables:")
        for name in missing:
            print(f"- {name}")
        print("\nSee verification/dev-deploy.env.example.")
        return 2

    remote_command = build_remote_command(args)
    result = run(["ssh", args.remote, remote_command], cwd=DEFAULT_ECBS_OS_DIR)
    if result != 0:
        return result

    if args.verification_config:
        verifier = [
            "python3",
            "scripts/ecbs_batch_verify.py",
            args.verification_config,
        ]
        if args.include_mutating:
            verifier.append("--include-mutating")
        return run(verifier, cwd=DEFAULT_ECBS_OS_DIR)

    return 0


def build_remote_command(args: argparse.Namespace) -> str:
    remote_repo = shlex.quote(args.remote_repo)
    branch = shlex.quote(args.branch)
    frontend_api_base_url = shlex.quote(args.frontend_api_base_url)
    frontend_network = shlex.quote(args.frontend_network)
    frontend_host_port = shlex.quote(str(args.frontend_host_port))
    frontend_container_port = shlex.quote(str(args.frontend_container_port))

    frontend_command = (
        "docker build -t ecbs-os-frontend:dev frontend; "
        "docker rm -f ecbs-os-frontend || true; "
        f"docker run -d --name ecbs-os-frontend --restart unless-stopped --network {frontend_network} "
        f"-p {frontend_host_port}:{frontend_container_port} "
        f"-e HOSTNAME=0.0.0.0 -e PORT={frontend_container_port} "
        f"-e ECBS_API_BASE_URL={frontend_api_base_url} ecbs-os-frontend:dev; "
        "actual_network=$(docker inspect -f '{{range $name, $_ := .NetworkSettings.Networks}}{{println $name}}{{end}}' ecbs-os-frontend | tr -d '\\r'); "
        f"printf '%s\\n' \"$actual_network\" | awk -v expected={frontend_network} '$0 == expected {{found=1}} END {{exit found ? 0 : 1}}'; "
        "docker ps --filter name=ecbs-os-frontend --format '{{.Names}} {{.Networks}} {{.Status}} {{.Ports}}'; "
    )

    if args.frontend_only:
        return (
            "set -e; "
            f"cd {remote_repo}; "
            f"git pull origin {branch}; "
            "cd ecbs-os; "
            f"{frontend_command}"
        )

    ecbs_connection = shell_env("ConnectionStrings__EcbsMySql", os.environ["ECBS_CONNECTION_STRING"])
    tracking_env = " ".join(
        [
            shell_env("TRACKING_DB_HOST", os.environ["TRACKING_DB_HOST"]),
            shell_env("TRACKING_DB_PORT", os.environ["TRACKING_DB_PORT"]),
            shell_env("TRACKING_DB_NAME", os.environ["TRACKING_DB_NAME"]),
            shell_env("TRACKING_DB_USER", os.environ["TRACKING_DB_USER"]),
            shell_env("TRACKING_DB_PASSWORD", os.environ["TRACKING_DB_PASSWORD"]),
        ]
    )
    migration_command = ""
    if not args.skip_migrations:
        migration_command = (
            f"{ecbs_connection} /home/xcorp/.dotnet/dotnet tool run dotnet-ef database update "
            "--project backend/src/ECBS.Infrastructure/ECBS.Infrastructure.csproj "
            "--startup-project backend/src/ECBS.Api/ECBS.Api.csproj;"
        )

    return (
        "set -e; "
        f"cd {remote_repo}; "
        f"git pull origin {branch}; "
        "cd ecbs-os; "
        "/home/xcorp/.dotnet/dotnet build ECBS.sln; "
        f"{migration_command} "
        f"{frontend_command}"
        "pids=$(ps -eo pid,args | awk '/ECBS.Api|dotnet run --project backend\\/src\\/ECBS.Api/ && !/awk/ {print $1}'); "
        "if [ -n \"$pids\" ]; then kill $pids || true; sleep 2; fi; "
        f"{ecbs_connection} {tracking_env} "
        "nohup /home/xcorp/.dotnet/dotnet run --project backend/src/ECBS.Api/ECBS.Api.csproj --urls http://0.0.0.0:5090 "
        "> logs/ecbs-api.log 2>&1 & "
        "echo API_PID=$!; "
        "sleep 5; "
        "ps -eo pid,args | awk '/ECBS.Api|dotnet run --project backend\\/src\\/ECBS.Api/ && !/awk/ {print}'"
    )


def shell_env(name: str, value: str) -> str:
    return f"{name}={shlex.quote(value)}"


def run(command: list[str], cwd: Path) -> int:
    print("+ " + " ".join(shlex.quote(part) for part in command))
    completed = subprocess.run(command, cwd=cwd)
    return completed.returncode


if __name__ == "__main__":
    sys.exit(main())
