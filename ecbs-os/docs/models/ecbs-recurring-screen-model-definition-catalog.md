# ECBS Recurring Screen Model Definition Catalog

Purpose: central catalog for approved recurring ECBS derivation models used by screen payloads.

## Approved For Wiring

### M-016 Cumulative Savings Since Activation

Status: `Approved For Wiring`

Field family: `energy.cumulative_savings_since_activation`

Purpose: calculate total dollar savings accrued from ECBS activation through the current server date for the selected client/site/project context.

Formula:

```text
daily_savings = latest_annual_savings / 365.25
active_days = max(0, today - activation_date)
cumulative_savings_since_activation = daily_savings * active_days
```

Inputs:

- `latest_annual_savings`: Direct Data from `tracking.savings_intelligence.annual_savings`.
- `activation_date`: first available activation anchor. Current implementation uses earliest `tracking.savings_intelligence.bucket_ts` for the project when explicit site/project activation date is unavailable.
- `today`: current server date.

Rules:

- Scope follows the selected client/site/project context.
- Missing or non-positive `annual_savings` returns explicit `No Data`.
- Missing or future `activation_date` returns explicit `No Data`.
- This model is an approved accrual estimate, not a historical invoice/snapshot rollup.

Derivative Labels:

- Lifetime Savings
- Total Savings Since Activation
- Value Since Activation
- Cumulative Savings Since Activation
