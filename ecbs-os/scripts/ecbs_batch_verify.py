#!/usr/bin/env python3
"""Config-driven ECBS batch verifier.

The verifier intentionally uses only Python stdlib so it can run on local machines
and on the dev server without adding package-manager dependencies.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify an ECBS screen/data batch.")
    parser.add_argument("config", help="Path to verification config JSON.")
    parser.add_argument("--include-commands", action="store_true", help="Run configured local shell commands.")
    parser.add_argument("--include-mutating", action="store_true", help="Run mutating API POST checks.")
    parser.add_argument("--base-url", help="Override frontend base URL.")
    parser.add_argument("--api-base-url", help="Override API base URL.")
    args = parser.parse_args()

    config_path = Path(args.config)
    config = json.loads(config_path.read_text())
    base_url = args.base_url or config.get("baseUrl", "")
    api_base_url = args.api_base_url or config.get("apiBaseUrl", "")

    failures: list[str] = []
    print(f"ECBS batch verification: {config.get('name', config_path.name)}")

    if args.include_commands:
        for command in config.get("commands", []):
            check_command(command, failures)

    for route in config.get("routes", []):
        check_route(base_url, route, failures)

    for api_get in config.get("apiGets", []):
        check_api_get(api_base_url, api_get, failures)

    if args.include_mutating:
        for api_post in config.get("apiPosts", []):
            check_api_post(api_base_url, api_post, failures)
    elif config.get("apiPosts"):
        print("SKIP mutating API POST checks; pass --include-mutating to run them.")

    if failures:
        print("\nFAILED")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("\nPASSED")
    return 0


def check_command(command: dict[str, Any], failures: list[str]) -> None:
    label = command.get("label", command.get("run", "command"))
    cwd = command.get("cwd")
    print(f"COMMAND {label}")
    result = subprocess.run(command["run"], cwd=cwd, shell=True, text=True)
    if result.returncode != 0:
        failures.append(f"Command failed ({result.returncode}): {label}")


def check_route(base_url: str, route: dict[str, Any], failures: list[str]) -> None:
    path = route["path"]
    url = join_url(base_url, path)
    status, body = fetch("GET", url)
    expected_status = route.get("status", 200)
    print(f"ROUTE {status} {path}")
    if status != expected_status:
        failures.append(f"{path} returned {status}, expected {expected_status}")
        return

    for href in route.get("expectHrefs", []):
        if href not in body:
            failures.append(f"{path} missing href/text: {href}")
        else:
            print(f"  href-ok {href}")

    for text in route.get("expectText", []):
        if text not in body:
            failures.append(f"{path} missing text: {text}")
        else:
            print(f"  text-ok {text}")


def check_api_get(api_base_url: str, api_get: dict[str, Any], failures: list[str]) -> None:
    path = api_get["path"]
    url = join_url(api_base_url, path)
    status, body = fetch("GET", url)
    expected_status = api_get.get("status", 200)
    print(f"API GET {status} {path}")
    if status != expected_status:
        failures.append(f"GET {path} returned {status}, expected {expected_status}")
        return

    data = parse_json(body, failures, f"GET {path}")
    if data is None:
        return

    for expectation in api_get.get("expectJson", []):
        check_json_expectation(data, expectation, failures, f"GET {path}")


def check_api_post(api_base_url: str, api_post: dict[str, Any], failures: list[str]) -> None:
    path = api_post["path"]
    url = join_url(api_base_url, path)
    body_bytes = json.dumps(api_post.get("body", {})).encode()
    status, body = fetch("POST", url, body_bytes)
    expected_status = api_post.get("status", 200)
    print(f"API POST {status} {path}")
    if status != expected_status:
        failures.append(f"POST {path} returned {status}, expected {expected_status}")
        return

    data = parse_json(body, failures, f"POST {path}")
    if data is None:
        return

    for expectation in api_post.get("expectJson", []):
        check_json_expectation(data, expectation, failures, f"POST {path}")


def check_json_expectation(data: Any, expectation: dict[str, Any], failures: list[str], label: str) -> None:
    path = expectation["path"]
    actual = json_path(data, path)
    if "equals" in expectation and actual != expectation["equals"]:
        failures.append(f"{label} JSON {path} was {actual!r}, expected {expectation['equals']!r}")
    elif "exists" in expectation and expectation["exists"] and actual is None:
        failures.append(f"{label} JSON {path} missing")
    else:
        print(f"  json-ok {path}")


def fetch(method: str, url: str, body: bytes | None = None) -> tuple[int, str]:
    request = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method=method,
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.status, response.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode("utf-8", errors="replace")
    except Exception as error:  # noqa: BLE001 - command-line verifier should report all connection failures.
        return 0, str(error)


def parse_json(body: str, failures: list[str], label: str) -> Any | None:
    try:
        return json.loads(body)
    except json.JSONDecodeError as error:
        failures.append(f"{label} did not return JSON: {error}")
        return None


def json_path(data: Any, path: str) -> Any:
    current = data
    for part in path.split("."):
        if isinstance(current, list):
            current = current[int(part)]
        elif isinstance(current, dict):
            current = current.get(part)
        else:
            return None
    return current


def join_url(base_url: str, path: str) -> str:
    return f"{base_url.rstrip('/')}/{path.lstrip('/')}"


if __name__ == "__main__":
    sys.exit(main())
