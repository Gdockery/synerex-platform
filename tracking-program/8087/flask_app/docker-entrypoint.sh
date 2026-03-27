#!/bin/bash
set -e
# Run migrations on startup (idempotent)
cd /app/8087-flask
python -c "
from app import create_app
from app.extensions import db
from app import models  # noqa: F401 - register models
app = create_app()
with app.app_context():
    db.create_all()
    from app.db_migrations import add_client_taxid_column, add_client_created_by_column, add_client_org_id_column, add_client_sponsor_org_id_column, add_project_org_id_column, add_project_slug_column, add_project_xecobase_columns, add_user_logo_column, add_mesh_ip_columns, add_meter_xecobase_columns, add_meterdataaggregate_multiplier_column, add_schedule_xecobase_columns, add_emv_analysis_table, add_active_emv_analysis_to_project, alter_emv_analysis_report_html_to_mediumtext, backfill_project_document_share_token, ensure_synerex_admin_user, ensure_client_admin_user, add_harmonic_columns, add_emv_harmonic_baseline_column, add_missing_model_columns
    add_user_logo_column()
    add_mesh_ip_columns()
    add_client_taxid_column()
    add_client_created_by_column()
    add_client_org_id_column()
    add_client_sponsor_org_id_column()
    add_project_org_id_column()
    add_project_slug_column()
    add_project_xecobase_columns()
    add_mesh_ip_columns()
    add_meter_xecobase_columns()
    add_meterdataaggregate_multiplier_column()
    add_schedule_xecobase_columns()
    add_emv_analysis_table()
    add_active_emv_analysis_to_project()
    alter_emv_analysis_report_html_to_mediumtext()
    backfill_project_document_share_token()
    ensure_synerex_admin_user()
    ensure_client_admin_user()
    add_harmonic_columns()
    add_emv_harmonic_baseline_column()
    add_missing_model_columns()
" 2>/dev/null || true
exec "$@"
