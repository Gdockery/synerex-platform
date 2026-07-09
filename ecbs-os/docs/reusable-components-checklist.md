# ECBS Reusable Components Checklist

Use this before implementing every new ECBS screen. The constitution rule is: reuse first, create only when the approved screenshot requires a materially different construction.

## Required Pre-Check

- Read the exact screenshot for the screen.
- Check whether the target route fits one of the existing shells below.
- Search `src/components/ecbs` for an existing card, chart, table, metric, nav, or auth component before creating a new one.
- If a new local component is required for pixel fidelity, keep it small and promote it to shared only after it repeats on another screen.
- Never add `href="#"`; use the best known route from the screen map.

## Shells

| Component | File | Use First For | Current Users |
| --- | --- | --- | --- |
| `EcbsAppShell` | `src/components/ecbs/EcbsAppShell.tsx` | Standard ECBS dashboard screens with the established sidebar | Enterprise dashboard, Energy dashboard, Capacity Intelligence, Digital Twin |
| `ScreenshotShell` | `src/components/ecbs/NextFiveScreens.tsx` | Full-frame screenshot-matched workflow/admin screens with compact custom sidebar/topbar | Settings, Settings subpages, Alarm detail, Alarm events, Configure alert rule, Set notifications |
| `AuthScreen` | `src/components/ecbs/NextFiveScreens.tsx` | Login/authentication flows using the split marketing/form layout | Login error, Forgot password, MFA, Reset password, Session timeout |
| Custom full-frame shell | Screen-local | Only when screenshot navigation/header materially differs from shared shells | Transformer dashboard, Alerts & Events dashboard |

## Shared Dashboard Components

| Component | File | Purpose | Current Users |
| --- | --- | --- | --- |
| `DashboardHeader` | `src/components/ecbs/DashboardCards.tsx` | Standard dashboard title/date/user header | Enterprise, Energy, Capacity, Digital Twin |
| `DashboardKpiCard` | `src/components/ecbs/DashboardCards.tsx` | KPI card strip, site and enterprise variants | Enterprise, Energy, Capacity |
| `DashboardPanel` | `src/components/ecbs/DashboardCards.tsx` | Bordered dashboard section panel | Enterprise, Energy, Capacity, Digital Twin |
| `DashboardFooter` | `src/components/ecbs/DashboardCards.tsx` | Dashboard timestamp/footer | Enterprise, Energy, Capacity, Digital Twin |
| `ScreenStateBanner` | `src/components/ecbs/DashboardCards.tsx` | Loading/empty/error/data state banner | Enterprise dashboard |

## Shared Dashboard Cards

| Component | File | Purpose | Current Users |
| --- | --- | --- | --- |
| `TrendCard` | `src/components/ecbs/DashboardCards.tsx` | Small trend/sparkline card | Energy dashboard |
| `ElectricalNetworkOverviewCard` | `src/components/ecbs/DashboardCards.tsx` | Site electrical topology summary | Energy dashboard |
| `TransformerStatusCard` | `src/components/ecbs/DashboardCards.tsx` | Transformer utilization/status card | Energy dashboard |
| `LivePowerSnapshotCard` | `src/components/ecbs/DashboardCards.tsx` | Live electrical metrics | Energy dashboard |
| `HiddenCapacityRecoveryCard` | `src/components/ecbs/DashboardCards.tsx` | Before/after capacity recovery | Energy dashboard |
| `EcbsImpactCard` | `src/components/ecbs/DashboardCards.tsx` | Impact metrics | Energy dashboard |
| `DeviceHealthCard` | `src/components/ecbs/DashboardCards.tsx` | Site device health gauge/list | Energy dashboard |
| `MonitoringHealthCard` | `src/components/ecbs/DashboardCards.tsx` | Monitoring health list | Energy dashboard |
| `ActiveAlarmsCard` | `src/components/ecbs/DashboardCards.tsx` | Compact active alarm list | Energy dashboard |
| `RecentEventsCard` | `src/components/ecbs/DashboardCards.tsx` | Compact event list | Energy dashboard |
| `QuickActionsCard` | `src/components/ecbs/DashboardCards.tsx` | Dashboard quick action grid | Energy dashboard |
| `SiteInformationCard` | `src/components/ecbs/DashboardCards.tsx` | Site metadata rows | Energy dashboard |
| `PortfolioMapCard` | `src/components/ecbs/DashboardCards.tsx` | Enterprise map panel wrapper | Enterprise dashboard |
| `AiEnergySummaryCard` | `src/components/ecbs/DashboardCards.tsx` | AI summary callouts | Enterprise dashboard |
| `NetworkHealthCard` | `src/components/ecbs/DashboardCards.tsx` | Enterprise network health | Enterprise dashboard |
| `EnterpriseSavingsTrendCard` | `src/components/ecbs/DashboardCards.tsx` | Enterprise savings chart | Enterprise dashboard |
| `TopSitesSavingsCard` | `src/components/ecbs/DashboardCards.tsx` | Top sites list/chart | Enterprise dashboard |
| `TransformerCapacityOverviewCard` | `src/components/ecbs/DashboardCards.tsx` | Enterprise transformer capacity | Enterprise dashboard |
| `HiddenCapacityRecoveredCard` | `src/components/ecbs/DashboardCards.tsx` | Enterprise hidden capacity summary | Enterprise dashboard |
| `NetworkLossesReductionCard` | `src/components/ecbs/DashboardCards.tsx` | Before/after network losses | Enterprise dashboard |
| `EnterpriseDeviceHealthCard` | `src/components/ecbs/DashboardCards.tsx` | Enterprise device health | Enterprise dashboard |
| `LeafletPortfolioMap` | `src/components/ecbs/LeafletPortfolioMap.tsx` | Client-side Leaflet portfolio map | Enterprise dashboard |

## Workflow Components

These are currently local to `NextFiveScreens.tsx` because the workflow screenshots were implemented as a batch and share a compact screenshot shell. Reuse them from that file for the next workflow screens before creating equivalents.

| Component | Purpose | Current Users |
| --- | --- | --- |
| `Panel` | Compact workflow panel | Settings, alarm detail, alert rules, notifications |
| `Button` | Compact workflow button | Settings/workflow screens and auth SSO buttons |
| `Breadcrumb` | Compact breadcrumb trail | Settings and alert workflows |
| `Tabs` | Compact tab navigation | Settings and alert workflows |
| `SimpleTable` | Dense screenshot-style table | Settings subpages, alarm/rule/recipient tables |
| `Field` | Compact label/value form field with multiline support | Configure alert rule |
| `SettingsCard` | Settings overview card | Settings overview |
| `SubpagePanel` and `MiniSidebar` | Settings subpage mini-workspace pattern | Settings subpages |
| `SummaryTile` | Alarm summary card | Alarm detail |
| `Metric` | Alarm/event KPI card | Alarm events |
| `Select` | Compact select/filter control | Alarm events |
| `Stepper` | Alert rule workflow progress | Set notifications |
| `RuleSummary` | Alert rule summary rail | Configure alert rule, Set notifications |

## Auth Components

These are local to `NextFiveScreens.tsx` and should be reused for all login/auth screens.

| Component | Purpose | Current Users |
| --- | --- | --- |
| `AuthMarketing` | Left-side ECBS marketing/technology panel | All login screens |
| `AuthTitle` | Auth card title/subtitle | All login screens |
| `AuthInput` | Auth form input display | Login, Forgot, Reset |
| `AuthButton` | Green primary auth CTA | All login screens |
| `Progress` | Four-step auth progress indicator | Forgot, Reset |
| `LoginForm` | Login error state | `/login` |
| `ForgotForm` | Forgot password | `/login/forgot-password` |
| `MfaForm` | MFA verification | `/login/mfa` |
| `ResetForm` | Reset password | `/login/reset-password` |
| `TimeoutForm` | Session timeout | `/login/session-timeout` |

## Custom Screens And Promotion Candidates

| Screen | Current Pattern | Reuse Status | Promotion Candidate |
| --- | --- | --- | --- |
| Transformer dashboard | Custom full-frame shell | Correct to stay custom because screenshot frame differs from standard shell | Promote `KpiPanel`, `RingGauge`, `SemiGauge`, `Donut`, `LineChart`, `AreaChart`, `BarChart` only if another transformer/power-quality screenshot repeats them |
| Alerts & Events dashboard | Custom full-frame shell | Correct to stay custom because screenshot frame differs from standard shell | Promote `MetricCard`, `SeverityDonut`, `AlertTrend`, `ActiveAlertsTable`, `PriorityMatrix` if the same visual dashboard pattern repeats |
| Capacity Intelligence | Standard shell plus local analytics charts | Correct: uses shared shell/header/KPI/panel/footer; local charts are screen-specific | Promote `CapacityTrend` or `CapacityAssetTable` if capacity drilldowns repeat the same chart/table |
| Digital Twin | Standard shell plus local topology renderer | Correct: uses shared shell/header/panel/footer; topology SVG is screen-specific | Promote `MetricLine`, `LegendDot`, and asset icons only if network screens repeat them |

## Current Audit Result

- Standard dashboard screens already reuse the shared app shell, header, KPI cards, panels, footer, and dashboard card library where possible.
- Workflow/admin screens already reuse `ScreenshotShell`, `Panel`, `Button`, `Breadcrumb`, `Tabs`, `SimpleTable`, `Field`, and workflow-specific subcomponents where possible.
- Login screens now reuse one `AuthScreen` with mode-specific form components.
- Transformer and Alerts & Events dashboards intentionally remain custom because their screenshots have materially different shells and panel structures.
- Fixed during this audit: `DashboardPanel` no longer emits `href="#"`; action links now require explicit `actionHref` targets.

## Every-Screen Reuse Gate

Before coding a new screen, answer:

1. Can it use `EcbsAppShell`, `ScreenshotShell`, or `AuthScreen`?
2. Can its KPI strip use `DashboardKpiCard`?
3. Can its panels use `DashboardPanel` or workflow `Panel`?
4. Can its tables use `SimpleTable` or an existing dashboard table/list card?
5. Can its chart be composed from an existing chart/card before drawing a new SVG?
6. Does every navigation/action link have a real route?
7. If a new component is local, is the reason screenshot-specific and documented?
