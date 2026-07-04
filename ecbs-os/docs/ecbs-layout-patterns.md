# ECBS Layout Patterns

Source of truth:
- `01 ECBS_CONSTITUTION.md`
- `analysis/approved_stack_master_screen_map.csv`
- Step 1-4 approved-stack notes and compliance audit
- Screenshot Library PNGs

These patterns are implementation guidance for future ECBS screens. Screenshots remain law; these patterns only describe repeated structures found while implementing the current batches.

## 1. Fixed Screenshot Frame

- All screenshot-matched web screens are authored against a fixed `1024px x 682px` frame.
- The frame uses a dark ECBS/XECO theme:
  - Page background near `#020a12` / `#02080d`
  - Panel background near `#061521`
  - Primary green near `#05ff5e` or login green near `#7ed321`
  - Cyan/blue highlights for intelligence and links
- Layout should avoid page scroll inside this fixed frame unless the screenshot explicitly shows scrollable content.

## 2. Enterprise / Admin Shell Pattern

Used by:
- Settings overview
- Settings subpages
- Alarm detail
- Alarm rule list/editor
- Configure alert rule
- Notification setup

Structure:
- Left sidebar:
  - XECO logo at top.
  - Grouped navigation sections.
  - Active nav item uses green text, green left border, and dark green active background.
  - Every nav item must use a real route. No `href="#"` placeholders.
  - Current Balance Index panel near bottom when shown in screenshot.
  - Footer copyright text at bottom.
- Topbar:
  - `XECO ENERGY INTELLIGENCE PORTAL`
  - Client/site selector.
  - Date range selector.
  - Live indicator.
  - Notification/help/settings/user controls.
- Content:
  - Breadcrumb row when shown.
  - Screen title and subtitle exactly as screenshot.
  - Reusable bordered panels with uppercase panel titles.
  - Dense tables use small type, subtle separators, and colored status text.
- Footer:
  - Privacy Policy / Terms of Service / Support links.
  - Data updated timestamp and Live indicator.

## 3. Alerts & Events Workflow Pattern

Used by:
- Alerts & Events dashboard
- Alarm detail
- Alert rule management
- Configure alert rule
- Set notifications

Common components:
- KPI strip with colored status cards.
- Active alarm/rule tables.
- Right rail summary panels.
- Stepper for rule creation workflows.
- Alert severity color rules:
  - Critical: red
  - Warning: orange/yellow
  - Info: blue
  - Normal/active/healthy: green
- Route family:
  - Primary current implementation: `/enterprise/alerts-events`
  - SOOT workflow candidate routes: `/enterprise/alarms-events/...`

Implementation note:
- Keep both route families intentional until route normalization is explicitly resolved. Do not silently remap SOOT candidate routes away from the CSV.

## 4. Settings Pattern

Used by:
- Settings overview
- Settings subpages

Settings overview:
- 3 x 3 card grid.
- Each card has a circular colored icon, title, short description, three key rows, and a green action link.

Settings subpages:
- 3 x 3 dashboard of mini workspaces.
- Each panel includes an internal settings sidebar and its local content.
- The page is a visual overview of all settings subareas, not a single detail form.

## 5. Authentication Shell Pattern

Used by:
- Login error state
- Forgot password
- MFA verification
- Reset password
- Session timeout

Structure:
- Split-screen `1024px x 682px` layout.
- Left marketing panel:
  - ECBS Operating System logo.
  - Hero headline: `Intelligence That Optimizes Every Amp.`
  - Electrical infrastructure / digital twin visual composition.
  - Five intelligence value props.
  - Trusted-by logos strip.
  - Security/powered-by footer.
- Right auth card:
  - Rounded dark card with ECBS shield icon.
  - Centered title and subtitle.
  - Screen-specific controls:
    - Login error: red error banner, email/password fields, SSO buttons.
    - Forgot password: four-step progress, email field.
    - MFA: six verification boxes, backup code option.
    - Reset password: four-step progress, password checklist.
    - Session timeout: clock icon, redirect message, info box, sign-in CTA.
  - Privacy / Terms / version footer.

## 6. Route And Component Rules

- Every mapped screen gets a Next.js App Router page at the route candidate unless there is an explicit documented normalization decision.
- Reuse existing screen components and shells before adding new components.
- New components should be route-agnostic where possible, with route pages acting as thin wrappers.
- Never add placeholder navigation links. Use the best known target route from the routing map.
- Legacy Angular/Flask code can inform data shape and behavior only; it is not implementation authority.

## 7. Validation Rules

For each batch:
- Re-read relevant constitution/step notes before implementing.
- Open the exact screenshots for the batch.
- Build with `npm run build`.
- Check lints for touched files.
- Check for `href="#"` in new/changed screen components.
- Push to `master` before dev deploy.
- Deploy the `ecbs-os-frontend` container to dev.
- Verify new route responses with dev HTTP checks.
