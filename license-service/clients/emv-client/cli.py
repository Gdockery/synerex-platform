from __future__ import annotations
import argparse
import json
from pathlib import Path

from licensing.license_store import LicenseStore
from licensing.offline_verify import load_public_key_file, load_license_file, assert_emv_license_ok, compute_device_fingerprint, require_device_fingerprint
from sealing.draft_seal import create_draft, save_outbox_bundle
from sealing.outbox import Outbox
from sealing.sync import sync_outbox

DEFAULT_HOME = str(Path.home() / ".synerex_emv")


def cmd_fingerprint(args):
    print(compute_device_fingerprint())


def cmd_verify(args):
    license_json = load_license_file(args.license_path)
    pub = load_public_key_file(args.public_key)
    res = assert_emv_license_ok(license_json, pub)
    if res.ok and args.enforce_device_binding:
        fp = compute_device_fingerprint()
        dres = require_device_fingerprint(license_json, fp)
        if not dres.ok:
            print(json.dumps(dres.__dict__, indent=2))
            raise SystemExit(2)
    print(json.dumps(res.__dict__, indent=2))
    if not res.ok:
        raise SystemExit(2)

def cmd_install_license(args):
    store = LicenseStore(args.store_dir)
    payload = load_license_file(args.license_path)
    p = store.save(payload)
    print(f"Saved license to {p}")

def cmd_draft(args):
    meter_ids = [m.strip() for m in (args.meters or "").split(",") if m.strip()]
    raw_files = [p.strip() for p in args.raw_files.split(",") if p.strip()]
    calc_params = json.loads(args.calc_params_json)

    draft, raw_paths = create_draft(
        org_id=args.org_id,
        project_id=args.project_id,
        created_by=args.created_by,
        meter_ids=meter_ids,
        start_date=args.start_date,
        end_date=args.end_date,
        raw_files=raw_files,
        calc_params=calc_params,
        license_id=args.license_id,
        baseline_id=args.baseline_id,
    )
    bundle = save_outbox_bundle(args.outbox_dir, draft, raw_paths)
    print(f"Draft created: {bundle}")

def cmd_outbox(args):
    ob = Outbox(args.outbox_dir)
    print(json.dumps(ob.summary(), indent=2))

def cmd_sync(args):
    res = sync_outbox(
        outbox_dir=args.outbox_dir,
        license_service_base_url=args.base_url,
        api_key=args.api_key,
        max_attempts=args.max_attempts,
    )
    print(json.dumps(res, indent=2))

def main():
    ap = argparse.ArgumentParser(prog="synerex-emv")
    ap.add_argument("--home", default=DEFAULT_HOME, help="Base directory for local state")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("print-fingerprint")
    p.set_defaults(func=cmd_fingerprint)

    p = sub.add_parser("verify-license")
    p.add_argument("--license-path", required=True)
    p.add_argument("--public-key", default=str(Path(__file__).parent / "licensing" / "public_key.pem"))
    p.add_argument("--enforce-device-binding", action="store_true", help="Fail if license has device_fingerprints binding and this device isn't included")
    p.set_defaults(func=cmd_verify)

    p = sub.add_parser("install-license")
    p.add_argument("--license-path", required=True)
    p.add_argument("--store-dir", default=str(Path(DEFAULT_HOME) / "license"))
    p.set_defaults(func=cmd_install_license)

    p = sub.add_parser("create-draft")
    p.add_argument("--org-id", required=True)
    p.add_argument("--project-id", required=True)
    p.add_argument("--created-by", required=True)
    p.add_argument("--meters", default="")
    p.add_argument("--start-date", required=True)
    p.add_argument("--end-date", required=True)
    p.add_argument("--raw-files", required=True, help="comma-separated paths to raw files")
    p.add_argument("--calc-params-json", required=True, help="JSON string with calc params")
    p.add_argument("--license-id", required=True)
    p.add_argument("--baseline-id", default=None)
    p.add_argument("--outbox-dir", default=str(Path(DEFAULT_HOME) / "outbox"))
    p.set_defaults(func=cmd_draft)

    p = sub.add_parser("outbox")
    p.add_argument("--outbox-dir", default=str(Path(DEFAULT_HOME) / "outbox"))
    p.set_defaults(func=cmd_outbox)

    p = sub.add_parser("sync")
    p.add_argument("--outbox-dir", default=str(Path(DEFAULT_HOME) / "outbox"))
    p.add_argument("--base-url", required=True)
    p.add_argument("--api-key", required=True)
    p.add_argument("--max-attempts", type=int, default=5)
    p.set_defaults(func=cmd_sync)

    args = ap.parse_args()
    args.func(args)

if __name__ == "__main__":
    main()
