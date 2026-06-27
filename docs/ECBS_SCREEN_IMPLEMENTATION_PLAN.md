# ECBS Screen Implementation Plan

This is the living source of truth for making the ECBS / Synerex screens both
look right and work correctly. Keep this updated whenever a screen, route,
business rule, data source, or deployment process changes.

## Goals

- Match each generated reference screenshot closely on first implementation pass.
- Treat proportions, font sizes, graphics, and vividness as critical acceptance criteria, not polish.
- Wire every visible button, chart, card, and status indicator to real data or a documented route.
- Avoid hardcoded customer values unless they are documented temporary placeholders.
- Preserve known business rules, especially where the database shape is not obvious.
- Make future work reproducible for any agent/model by documenting the screen-by-screen intent.

## Working Process

1. Add or update a screen spec before making large UI changes.
2. Identify all visible components in the reference screenshot.
3. Map every component to an Angular binding, API route, database source, or explicit placeholder.
4. Implement visual match first using existing components and real bindings where available.
5. Verify in browser against the reference screenshot.
6. Wire buttons/actions and verify backend route output.
7. Re-check hardcoded values, empty/loading states, and edge cases.
8. Update this document with any decisions or new facts learned.

## Visual Matching Rules

- The reference screenshot with `XECO ENERGY` in the top-left is the visual authority unless the user says otherwise.
- The master screenshot PDF is the source of truth for the full screen set once available:
  - `ECBS_OS_Master_Spec_v5_Screenshots.pdf`
- Prioritize overall composition first: sidebar width, row heights, card widths, gutters, rounded cards, and chart placement.
- Then match component scale: titles, KPI icons, KPI numbers, gauge sizes, bullets, table text, footer, and chart labels.
- Then match graphics: use the actual visual motif from the reference where possible, especially transformer images, capacity charts, maps, gauge shapes, and device icons.
- Then match polish: neon green/blue vibrancy, glows, border intensity, chart fill, icon color, and text contrast.
- All formerly gray/dim text should be readable near-white unless it is clearly decorative or disabled.
- Use real graphics/assets when the reference has them, rather than approximating with plain CSS.
- Do not rely on repeated micro-tweaks without browser verification. Use screenshot comparison after each meaningful pass.
- A screen is not visually complete if it has the right text/data but wrong proportions, weak colors, missing graphics, or incorrect title/bullet scale.

## Navigation and Sidebar Rules

- Use the latest user-provided full sidebar screenshot as the base sidebar pattern for ECBS screens unless a screen intentionally has a different app shell.
- Avoid creating competing sidebar variants unless there is a clear product reason.
- The sidebar should include these sections when relevant:
  - Enterprise
  - Devices
  - Client Management
  - Data & Analytics
  - Operations
  - Administration
- Add financial/navigation links in the Financial section, including Job Costing and other financial main links required by the master spec.
- Before implementing new navigation, compare all screens in the master spec and remove/merge duplicates.
- If two screenshots appear to represent the same workflow with different names, document the likely canonical route and ask before building both.

## Screen Inventory Workflow

When the master screenshot PDF is available:

1. Extract every screenshot name/title.
2. Group screenshots by app area:
   - Enterprise / portfolio dashboard
   - Energy dashboard / site dashboard
   - Capacity intelligence
   - Digital twin
   - Sites
   - Transformers
   - Current analysis
   - Savings / forecast
   - Alarms / events
   - Reports
   - Devices: gateways, meters, switches, repeaters
   - Financial: job costing and related financial screens
   - Settings/admin
   - Deployment app screens, if included
3. Identify duplicates or overlapping screens.
4. Pick one canonical route/component for each product function.
5. Create or update the screen spec entry for each canonical screen.
6. Mark screens as:
   - `existing-needs-visual-pass`
   - `existing-needs-wiring`
   - `new-screen-needed`
   - `duplicate/merge`
   - `unclear-ask-user`

## Known Design Tokens

- Primary dark background: near `#040b16` / `#060e1a`.
- Card background: dark navy with subtle vertical gradient.
- Primary green: `#00e676`.
- Info blue: `#29b6f6`.
- Warning amber: `#ffd740`.
- Critical red: `#f44336`.
- Text should generally be near-white: `#e8edf5` or high-opacity white.
- Cards should have visible rounded borders and gutters, not flat full-width dividers.

## Current High-Priority Screen: Enterprise Dashboard

Route:

- Angular route: `/ecbs/enterprise-dashboard`
- Component:
  - `tracking-program/8087/src/app/ecbs/enterprise-dashboard/enterprise-dashboard.component.ts`
  - `tracking-program/8087/src/app/ecbs/enterprise-dashboard/enterprise-dashboard.component.html`
  - `tracking-program/8087/src/app/ecbs/enterprise-dashboard/enterprise-dashboard.component.scss`

Reference:

- Visual authority is the generated screenshot with `XECO ENERGY` top-left.
- Current implementation uses ECBS/Synerex branding but should follow the same visual structure.

Visual status:

- Most component inventory exists.
- Still needs close proportion matching versus reference after each pass.
- Current visual target is not just "same elements"; it must match the generated reference's scale, vividness, card spacing, graphics, and density.
- Important reference traits:
  - Strong rounded card borders and spacing.
  - Vibrant KPI icons and trend lines.
  - Hidden Capacity has green kVA value on left and rising bar/arrow graphic on right.
  - Transformer card uses transformer image + donut + capacity stats.
  - Device Health uses large donut with right-side legend.
  - Bottom row should feel balanced, not cramped or flat.

Known assets added:

- `tracking-program/8087/assets/images/transformer-graphic.png`
- `tracking-program/8087/assets/images/capacity-chart.png`

Current data/API source:

- Portfolio/enterprise summary data comes from backend savings/portfolio routes.
- Verify current exact route before changing bindings; likely route family:
  - `flask_app/app/api/savings_routes.py`
  - `/api/portfolio/summary`

Known business/data rules:

- Savings calculations for the Ochsner Lafayette project use the main PQM only: meter with `isMain = 1`.
- Do not assume "one main meter per every project"; use `isMain = 1`.
- For the current project, the main PQM has been identified as meter `236403`.
- Device health should come from `switch`, not legacy xeco tables.
- Device status is based on `lastCommunicatedAt`:
  - healthy: recently communicated
  - warning: stale but not fully offline
  - offline: not seen for days/null
- Power factor and THD baselines must use the locked baseline logic, not arbitrary UI fallback values.
- Savings should not show old installation-period or old-engine records as valid comparison data.

Known Enterprise Dashboard buttons/actions to verify:

- Sidebar navigation items.
- `View Full Report` in AI Energy Summary.
- `View All Sites`.
- `View Transformer Fleet`.
- `View Details` in Hidden Capacity.
- `View Loss Analysis`.
- `View All Devices`.
- Date range control behavior.
- Alarm button and attention card.

## Screen 2: Clients Page

Route:

- Angular route: `/ecbs/clients`
- Component:
  - `tracking-program/8087/src/app/ecbs/clients/clients.component.ts`
  - `tracking-program/8087/src/app/ecbs/clients/clients.component.html`
  - `tracking-program/8087/src/app/ecbs/clients/clients.component.scss`

Reference:

- User-provided screenshot labeled `2. Clients Page`.
- Reference traits:
  - XECO Energy logo/sidebar on the left.
  - Sidebar sections: Enterprise, Devices, Client Management, Data & Analytics, Operations, Administration.
  - Clients is active under Client Management.
  - Top bar includes organization selector, date range, online status, bell, help, and user block.
  - Main page title: `Clients`.
  - Five KPI cards: Total Clients, Total Sites, Active Projects, Total Capacity, Annual Savings.
  - Search/filter/export row.
  - Large clients table with columns: Client Name, Contract Number, Sites, Active Projects, Total Capacity, Status, Joined Date, Actions.
  - Pagination footer.

Visual status:

- New screen created from scratch.
- Uses the latest sidebar screenshot as the canonical sidebar, not Screenshot 19.
- Needs browser review against the reference screenshot after dev build.
- Proportions, typography, KPI card vividness, logo sizing, table row height, and sidebar density are critical.

Data inventory:

- Clients API: `/api/client/`
- Projects API: `/api/project/`
- Current implementation:
  - Loads clients from `/api/client/`.
  - Loads projects from `/api/project/`.
  - Derives Sites, Active Projects, Total Capacity, and Annual Savings by matching projects to clients where possible.
  - Enriches each client's projects from analytics APIs:
    - `/api/capacity/summary?project_id=...` for installed capacity.
    - `/api/savings/intelligence?project_id=...` for annual savings.
  - Falls back to client/project fields if available.

Known gaps / questions:

- Reference uses generated sample clients; live dev data may not have the same industry names, contract numbers, capacity, or savings fields.
- Need verify actual API response shape on dev and adjust mappings if needed.
- `Filters` is visual-only for now except search; decide whether it should open a menu/status filter.
- `Add New Client` routes to existing legacy create client page (`/project/client/create`) for now.
- Row action routes to existing legacy edit client page (`/project/client/edit/:id`) for now.
- Need decide whether the top org selector/date range should be wired or visual-only on this management page.
- Need decide whether to keep XECO text in this sidebar or switch to ECBS/Synerex after visual match.

## New Screens To Add From Master Spec

Status: pending PDF access.

The master spec PDF must be reviewed before finalizing this list. Early known requirement:

- Devices Repeaters Page:
  - Use its sidebar as the canonical sidebar pattern.
  - Ensure Devices subnavigation supports gateways, meters, switches, and repeaters.
- Financial / Job Costing:
  - Add Job Costing and other required financial links in the Financial section.
  - Verify whether existing financial routes already cover these functions before adding new screens.

Questions to resolve from the PDF:

- Which screens are truly new versus renamed/duplicate variants of existing screens?
- Which sidebar variants exist, and which should be canonical?
- Which screens belong to Enterprise Dashboard versus Energy/Site Dashboard?
- Which financial screens already have Angular components/routes?
- Which reference screens are pure dashboards versus CRUD/workflow pages?

## Screen Spec Template

Use this template for every screen before implementation.

### Screen Name

Route:

- Angular route:
- Component files:
- Reference screenshot(s):

Visual inventory:

- Sidebar/topbar requirements:
- KPI cards:
- Main cards:
- Charts/graphics:
- Tables/lists:
- Footer/status area:

Data inventory:

- API route(s):
- Backend file(s):
- Database tables:
- Required fields:
- Empty/loading/error behavior:

Actions:

- Buttons:
- Navigation:
- Mutations/API calls:
- Permissions/roles:

Known rules:

- Business rules:
- Values that must not be hardcoded:
- Temporary placeholders:

Verification:

- Browser route to test:
- API calls to inspect:
- Expected visible result:
- Known gaps:

## Backend/API Audit Plan

For every route used by a screen:

1. Find the Angular service call.
2. Find the Flask route.
3. Confirm SQLAlchemy models/raw SQL tables.
4. Query dev DB to verify returned numbers match UI.
5. Confirm stale/cache behavior.
6. Document route contract here.
7. Add or update tests where practical.

Route map to fill in:

| Screen | UI Component | API Route | Backend File | DB Tables | Status |
| --- | --- | --- | --- | --- | --- |
| Enterprise Dashboard | KPIs/site map/top sites/health | `/api/portfolio/summary` | `flask_app/app/api/savings_routes.py` | `savings_intelligence`, `current_balance_metrics`, `project`, `switch`, `meter` | Needs verification |

## Dev Server and Data Sync

Dev server:

- Host: `100.91.109.59` via ProxyJump through `137.184.103.181`.
- SSH pattern:
  - `ssh -i ~/.ssh/id_ed25519 -o ProxyJump=root@137.184.103.181 xcorp@100.91.109.59`

Current deployment flow for Angular dev:

1. Commit and push local changes to `origin master`.
2. SSH to dev.
3. `cd /home/xcorp/synerex-platform/tracking-program/8087`
4. `git pull origin master`
5. `sudo rm -rf .tmp/public`
6. `npm run build:dev`

Current deployment flow for Flask/Python dev:

1. Commit and push local changes to `origin master`.
2. SSH to dev.
3. `cd /home/xcorp/synerex-platform`
4. `git pull origin master`
5. `docker restart synerex-platform_tracking-program_1`

Data sync:

- Dev database currently syncs from production XECO about every 15 minutes.
- Desired sync interval is 5 minutes.
- Before changing:
  - Find the cron/systemd/script currently doing the sync.
  - Confirm runtime is safely under 5 minutes.
  - Confirm overlapping runs are prevented.
  - Confirm production DB load is acceptable.
  - Document exact command and schedule.

## Open Questions

- Exact list of screens to implement after current screenshot generation finishes.
- Which reference screenshot belongs to each route.
- Which screens are visual-only first versus full functional wiring.
- Whether ECBS/Synerex branding should fully replace XECO on all screenshots or retain some generated-reference wording for layout matching.
- Whether browser screenshot diffing should be kept as manual review or scripted.
- The file `ECBS_OS_Master_Spec_v5_Screenshots.pdf` was referenced but was not found locally during this update. Attach/place it in the workspace so the full screen inventory can be completed.

## Change Log

- 2026-06-27: Created this living plan. Captured current Enterprise Dashboard state, known data rules, deployment flow, and dev-sync concerns.
- 2026-06-27: Added stronger visual acceptance criteria, canonical sidebar guidance from Screenshot 19, financial/job costing navigation requirement, screen inventory workflow, and pending master PDF follow-up.
- 2026-06-27: Added Screen 2 Clients Page spec and noted the updated canonical sidebar from the user-provided sidebar screenshot.
