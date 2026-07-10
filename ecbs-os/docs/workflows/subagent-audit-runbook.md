# ECBS Read-Only Subagent Audit Runbook

## When To Use

Use read-only subagents before or during a 5-8 screen batch when the batch has enough surface area that one agent would waste time manually scanning everything.

Good uses:

- Find all route files and components in a route family.
- List hardcoded placeholders / demo values.
- Compare screen flow map actions to implemented `href`, form, and button behavior.
- Identify shared components/data families.
- Inspect existing API loaders and DTO shapes.

Do not use subagents for:

- Making edits.
- Deploying.
- Committing.
- Decisions that require product judgment.

## Do We Need Multitask Mode?

No, not for normal ECBS batches.

The main Agent can launch read-only subagents from Agent mode. Multitask is useful only when the user wants separate visible workstreams or independent long-running branches. For this workflow, read-only subagents are enough.

## Standard Subagent Pattern

Launch up to three read-only audits in parallel:

1. Route and flow audit
2. Field/data classification audit
3. Placeholder/demo-data audit

The main Agent implements only after these return.

## Prompt: Route And Flow Audit

```text
You are auditing an ECBS screen batch in read-only mode.

Scope:
- Module / route family:
- Screens:
- Flow map source:

Tasks:
1. Find all Next.js route files for these screens.
2. Find shared TSX components used by those routes.
3. Compare visible buttons/links/actions to the flow map.
4. Report missing hrefs/forms/actions.
5. Return exact file paths and concise findings only.

Do not edit files.
```

## Prompt: Field/Data Classification Audit

```text
You are auditing ECBS screen data fields in read-only mode.

Scope:
- Module / route family:
- Screens:
- Existing classification docs:

Tasks:
1. List visible KPI/table/panel/form fields.
2. Deduplicate repeated field families.
3. Classify each as Direct Data, Calculated, Estimated / Model Required, or No Data / Question.
4. Identify likely tracking/ecbs_os source tables only when evident from existing code/docs.
5. Return unresolved questions and derivative fields that must inherit No Data / Question.

Do not edit files.
```

## Prompt: Placeholder/Demo Audit

```text
You are auditing for placeholder/demo data in an ECBS screen batch in read-only mode.

Scope:
- Module / route family:
- Screens:

Tasks:
1. Search relevant TSX/lib/backend files for hardcoded demo names, fake values, placeholder arrays, and screenshot-only values.
2. Separate form placeholder affordances from fake displayed data.
3. Report which values should become real data, calculated data, or explicit No Data.
4. Return exact file paths and symbols/components.

Do not edit files.
```

## Parent-Agent Rule

After subagents return, the main Agent must:

- Update the batch checklist.
- Update `ecbs_data_field_classification_index.md` if new reusable field families were found.
- Implement only Direct Data, Calculated fields, approved manual inputs, and explicit No Data decisions.

