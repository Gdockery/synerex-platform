# Phase 2: SQLAlchemy Models - Complete

## Models created

| Model | Table | Notes |
|-------|-------|------|
| BaseModel | (abstract) | id, createdAt, updatedAt |
| Client | client | |
| User | user | |
| Project | project | project_users__user_projects join |
| Synerex | synerex | |
| Gateway | gateway | |
| Repeater | repeater | |
| Switch | switch | |
| Meter | meter | |
| MeterData | meterdata | |
| MeterDataAggregate | meterdataaggregate | |
| PerMeterDataAggregate | permeterdataaggregate | |
| Schedule | schedule | |
| SwitchCommand | switchcommand | |
| Test | test | gateway_tests__test_gateways join |
| MeterAlertGroup | meteralertgroup | meteralertgroup_users join |
| MeterAlert | meteralert | |
| MeterAlertEvent | meteralertevent | |
| RepeaterAlertGroup | repeateralertgroup | |
| RepeaterAlert | repeateralert | |
| RepeaterAlertEvent | repeateralertevent | |
| SwitchAlertGroup | switchalertgroup | |
| SwitchAlert | switchalert | |
| SwitchAlertEvent | switchalertevent | |
| GatewayCommand | gatewaycommand | |
| MeterCSV | metercsv | |
| SavingsReport | savingsreport | |
| ReportData | reportdata | |
| File | file | |
| ServicePlan | serviceplan | |
| PiBoard | piboard | |

## Verify

```bash
cd tracking-program/8087/flask_app && . venv/bin/activate
python -c "
from app import create_app
from app.extensions import db
app = create_app()
with app.app_context():
    db.create_all()
    print('OK')
"
```

## Not ported

- EquipmentData, EquipmentDataAggregate (can add if needed)

## Next: Phase 3

Auth, JWT, SSO, password reset, policy decorators.
