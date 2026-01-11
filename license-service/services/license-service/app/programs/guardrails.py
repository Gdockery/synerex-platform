from typing import Dict, Any, Set

EMV_ALLOWED_FEATURES: Set[str] = {
    "baseline_creation","baseline_edit_preseal","baseline_sealing","test_plan_builder","mv_sampling_scheduler",
    "raw_data_import","calc_parameter_lock","utility_audit_export","compliance_reporting",
    "report_generator_pdf","report_generator_csv","offline_mode","seal_sync_queue"
}

TRACKING_ALLOWED_FEATURES: Set[str] = {
    "continuous_tracking","savings_reporting","dashboard_kpis","alerting","cp_event_detection",
    "compliance_reporting","utility_audit_export","report_generator_pdf","report_generator_csv",
    "api_access"
}

def validate_template(program_id: str, template: Dict[str, Any]) -> None:
    products = template.get("products", {})
    feats = set(template.get("entitlements", {}).get("features", []))

    if program_id == "emv":
        if not products.get("emv", {}).get("enabled", False):
            raise ValueError("EM&V templates must enable products.emv.enabled")
        if products.get("tracking", {}).get("enabled", False):
            raise ValueError("EM&V templates must NOT enable Tracking product")
        if not feats.issubset(EMV_ALLOWED_FEATURES):
            raise ValueError(f"EM&V template contains disallowed features: {sorted(feats-EMV_ALLOWED_FEATURES)}")
    elif program_id == "tracking":
        if not products.get("tracking", {}).get("enabled", False):
            raise ValueError("Tracking templates must enable products.tracking.enabled")
        if products.get("emv", {}).get("enabled", False):
            raise ValueError("Tracking templates must NOT enable EM&V product")
        if not feats.issubset(TRACKING_ALLOWED_FEATURES):
            raise ValueError(f"Tracking template contains disallowed features: {sorted(feats-TRACKING_ALLOWED_FEATURES)}")
        # extra baseline prohibition
        forbidden = {"baseline_creation","baseline_edit_preseal","baseline_sealing"}
        if feats.intersection(forbidden):
            raise ValueError("Tracking templates must NOT include baseline features.")
    else:
        raise ValueError("program_id must be 'emv' or 'tracking'")
