# Code Cleanup Audit Plan

## Overview

Audit all files with check/demo/temp/test/backup/debug in their names to identify what's actively used in production vs what can be removed (relying on git history). Stop keeping local backups - that's what git is for.

## Phase 1: Identify All Cleanup Candidates

### 1. Find All Suspicious Files

Search for files with these patterns in their names:
- `check*`
- `demo*`
- `temp*`
- `test*`
- `backup*`
- `debug*`
- `*_old*`
- `*_copy*`
- `*_backup*`

Exclude:
- Database backups in `8082/results/backups/` (legitimate)
- `check_services.sh` (actively used)
- Test data files that are required for functionality

### 2. Categorize Files

Group files into categories:
1. **Root-level utility scripts** - check if imported/called by production code
2. **Backup directories** - entire directories that are redundant
3. **Old/archived files** - superseded by newer versions
4. **Test/debug scripts** - development-only files
5. **Documentation files** - reports that can be regenerated

## Phase 2: Analyze Dependencies

### 3. Check for Active Usage

For each suspicious file, verify:
- Is it imported by any production code?
- Is it referenced in any shell scripts?
- Is it called by the service manager?
- Is it documented as required in README files?

Methods:
```bash
# Check if file is imported
grep -r "import <filename>" --include="*.py"
grep -r "from <filename>" --include="*.py"

# Check if file is executed in scripts
grep -r "<filename>" --include="*.sh"

# Check if file is referenced in config
grep -r "<filename>" services.yaml
```

### 4. Analyze Each File Category

#### Root-Level Python Scripts

Files to check:
- `check_*.py` files (analysis.py, backup_db.py, database*.py, db*.py, project.py, results_db.py, tables.py, users.py, backup_for_att.py)
- `debug_*.py` files
- `deep_att_search.py`
- `emergency_att_recovery.py`
- `find_att_*.py` files
- `fix_*.py` files (cohen_syntax.py, database*.py, html.py)
- `recover_from_git.py`
- `remove_duplicate_apis.py`
- `restore_att_from_backup.py`
- `safe_att_search.py`
- `simple_port_update.py`
- `sync_*.py` files
- `test_*.py` files (all_api_functionality.py, post_endpoints.py, services.py, standards_audit.py, variable_assignment.py)
- `update_*.py` files (all_port_references.py, user_guides.py)

Determine:
- Was this a one-time migration script?
- Is this actively used in production?
- Is this just for debugging?

#### Backup Directories

Directories to evaluate:
- `backup_before_port_update_*` (2 directories)
- `cleanup_backup/`
- `archived_services/`

Action: Remove if confirmed redundant (git history preserves everything)

#### Test/Sample Files

Files to check:
- `test_*.html` files
- `test_*.xlsx` files
- `sample_*.html` files
- `*.disabled` files

#### Markdown Reports

Files to evaluate:
- Reports that can be regenerated vs historical documentation
- Keep if they document decisions, remove if they're just status reports

## Phase 3: Create Removal Plan

### 5. Generate Safe-to-Remove List

Create categorized lists:

**Category A: Definitely Remove (one-time scripts)**
- Migration scripts that have already been run
- Old backup directories
- Test output files

**Category B: Probably Remove (debug/analysis scripts)**
- Files used for one-time debugging
- Analysis scripts for specific issues
- Emergency recovery scripts (keep in git history)

**Category C: Keep (actively used)**
- Production scripts
- Required test files
- Current documentation

**Category D: Needs Review**
- Files that might be needed but aren't clearly referenced

### 6. Verify Each File

For each file in categories A and B:
1. Check last modified date
2. Check git history (was it used once and never touched?)
3. Check if it solves a recurring vs one-time problem
4. Verify no production dependencies

## Phase 4: Document Findings

### 7. Create Cleanup Report

Generate a report with:
- Total files found
- Files by category
- Specific recommendations for each file
- Estimated disk space to be freed
- Risk assessment (low/medium/high) for each removal

Format:
```
Filename: check_analysis.py
Category: Debug/Analysis Script
Last Modified: [date]
Size: [bytes]
Used By: [none found]
Recommendation: REMOVE
Risk: LOW
Reason: One-time analysis script, not imported by production code
```

### 8. Create Removal Commands

Generate the exact `git rm` commands needed:
```bash
# Category A: Definitely Remove
git rm -r backup_before_port_update_20251004_231003/
git rm -r backup_before_port_update_20251004_231017/
git rm check_analysis.py
# ... etc

# Commit message
git commit -m "chore: remove redundant backup files and one-time utility scripts

- Removed backup directories (preserved in git history)
- Removed one-time migration/fix scripts
- Removed debug/test scripts not used in production
- Database backups in 8082/results/backups/ retained
"
```

## Key Principles

1. **Never delete database files** (`*.db`, `*.db-*` extensions)
2. **Keep active scripts**: `start_services.sh`, `stop_services.sh`, `check_services.sh`, `service_manager_daemon.py`
3. **Keep production code**: All files in `8082/`, `8083/`, `8084/`, `8085/`, `8086/` that are part of the running application
4. **Keep current docs**: `README.md`, `README_MAC.md`, architecture docs
5. **Git history is backup**: If it's in git, we can always get it back
6. **One commit**: Do all cleanup in a single, well-documented commit

## Verification Checklist

Before executing removals:
- [ ] All files to remove are listed
- [ ] No production dependencies found
- [ ] Database backups are NOT in removal list
- [ ] Active management scripts are NOT in removal list
- [ ] Current documentation is NOT in removal list
- [ ] Git status is clean (no uncommitted changes)
- [ ] Removal commands are in a script for easy execution

## Expected Outcome

A clean codebase with:
- Only production-necessary code
- No redundant backups
- No one-time utility scripts
- Clear structure
- All removed files preserved in git history

## Tasks

- [ ] Find all files with check/demo/temp/test/backup/debug in their names
- [ ] Categorize files into remove/keep/review groups
- [ ] Check if any suspicious files are imported or used by production code
- [ ] Analyze all root-level Python utility scripts for active usage
- [ ] Verify backup directories are redundant (in git history)
- [ ] Create detailed report with recommendations for each file
- [ ] Generate git rm commands for approved removals
- [ ] Double-check no production dependencies before removal




