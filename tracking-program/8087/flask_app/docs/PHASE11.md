# Phase 11: Switch Scheduling & Events, Test Reporting - Complete

## Implemented

### Switch schedulers
- `GET /api/switch/schedulers` – List scheduler switches (deviceType filter)

### Switch schedules (Schedule model – recurring)
- `GET /api/switch/list-schedules` – List Schedule records for project
- `POST /api/switch/schedule` – Create recurring Schedule
- `GET /api/switch/equipment/get-schedule` – Get schedule for a switch (by switch ID)
- `PUT /api/switch/equipment/update-schedule` – Update Schedule
- `PUT /api/switch/delete-schedule` – Delete Schedule and cancel associated SwitchCommands

### Switch events (SwitchCommand – individual commands)
- `GET /api/switch/event` – List SwitchCommands for project
- `POST /api/switch/event` – Create one-off SwitchCommand and send to devices
- `GET /api/switch/event/:id` – Get one SwitchCommand with switch status
- `DELETE /api/switch/event/:id` – Cancel one SwitchCommand
- `DELETE /api/switch/events` – Cancel and delete ALL SwitchCommands for project (?project=X)

### Switch savings
- `GET /api/switch/get-savings` – Equipment savings (Schedule + schedulers, totalHoursOff)

### Test reporting
- `GET /api/test/:id/report` – Get test report (calculates via test_calculation_service if needed)
- `GET /api/test/:id/selected-report` – Report for selected meters (?meters=1,2,3)
- `PUT /api/test/:project/reporting-meters` – Update isReporting for meters
- `GET /api/test/:id/data` – Raw meter data with segment/cycle, ?showHidden, ?page, ?orderBy
- `PUT /api/test/:id/data` – Unhide data rows
- `DELETE /api/test/:id/data` – Hide data rows

## Verify

```bash
curl -s -b cookies.txt "http://localhost:8088/api/switch/schedulers?project=1" | jq
curl -s -b cookies.txt "http://localhost:8088/api/switch/list-schedules?project=1" | jq
curl -s -b cookies.txt "http://localhost:8088/api/switch/event?project=1" | jq
curl -s -b cookies.txt "http://localhost:8088/api/test/1/report" | jq
```

## Notes

- `POST /api/switch/schedule` creates the Schedule record only. The cron job `run_schedule_switches` creates and sends SwitchCommands. Sails creates today's commands immediately; Flask relies on the next cron run (12:01am or 11:55pm daily).
- `DELETE /api/switch/events` cancels **all** SwitchCommands for the project (query: `?project=X`).

## Next: Phase 12

See docs/PHASE12.md – cutover planning, dual-run, migration.
