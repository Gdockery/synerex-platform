# ECBS Cheap Screen Completion Workflow

Purpose: finish the remaining constitution-approved ECBS screens with the lowest practical token, runtime, and deployment cost while preserving the documentation rules.

## Operating Mode

- Batch by module/component family, normally `12-25` screens at a time.
- Preserve existing TSX layout and visual structure.
- Wire only existing backend/API values, deterministic calculated values, or approved model outputs where required inputs exist.
- Show explicit `No Data` or `source_missing` when a source contract, rollup, baseline, tariff, event store, write model, or model input is missing.
- Skip pixel comparison and screenshot artifact refresh unless the user explicitly asks for visual fidelity work.
- Keep summaries short: changed, verified, deployed, next sequence.

## Batch Selection

Use `scripts/ecbs_select_next_batch.py` against:

`../../ECBS Software Development Project/analysis/screenshot_constitution_validation.csv`

Select screens where:

- `automated_first_pass_status = VALID_CONSTITUTION_APPROVED`
- `validation_sequence` is after the last deployed batch
- Routes share a route family or component family

## Cheap Implementation Rules

- Do not reread huge TSX files. Search for route/component names, then patch narrow sections.
- Do not add direct frontend database access.
- Prefer existing `.NET` API endpoints. If no endpoint exists, leave explicit `source_missing` rather than adding a new endpoint during cheap mode.
- Do not create new UI abstractions unless they remove obvious repeated `No Data`/verification boilerplate.
- Do not run browser automation unless route verification fails or visual fidelity is explicitly requested.

## Verification Minimum

For each batch:

1. `npm run build` in `ecbs-os/frontend`.
2. Add or update a verifier config in `ecbs-os/verification`.
3. Run `scripts/ecbs_batch_verify.py` locally against `localhost`.
4. Commit and push.
5. Deploy dev through git only:
   - local `git push origin master`
   - dev `git pull origin master`
   - rebuild/restart frontend/API as needed
6. Run verifier against `100.91.109.59`.

## Deployment Rule

Never copy working files to dev with `rsync`, `scp`, or tar for normal screen deployment.

Dev must be aligned through GitHub:

1. Commit locally.
2. Push to `origin/master`.
3. Pull on `100.91.109.59`.
4. Rebuild from the pulled repository.

## Output Format

Final checkpoint should stay short:

- Batch range and module.
- Commit hash.
- Dev deploy status.
- Verification result.
- Next sequence.
