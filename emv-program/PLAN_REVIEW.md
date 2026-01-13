# Codebase Cleanup Plan - Review and Issues Found

## Critical Issues Found

### 1. Duplicate main_hardened_ready_refactored.py
- **Location 1**: `/main_hardened_ready_refactored.py` (root directory, 598 lines)
- **Location 2**: `/8082/main_hardened_ready_refactored.py` (production directory, 13,804 lines)
- **Issue**: Need to verify which is correct or if root version is outdated
- **Action**: Compare both files, determine which is production version, remove duplicate

### 2. Multiple References to main_hardened_ready_fixed.py Still Exist
Found 37 files referencing the fixed version:
- **README.md** (line 173, 208) - needs update
- **README_MAC.md** (line 86) - manual service start example still uses fixed
- **setup_systemd_services.sh** (line 93) - systemd setup script references fixed
- **MIGRATION_AND_TESTING_GUIDE.md** - references fixed (expected, but should note it's legacy)
- Many markdown documentation files (expected, but should be reviewed)

### 3. Multiple Startup Scripts - Need Clarification
- `start_services.sh` - Direct service startup (uses refactored ✓)
- `start_all_services.sh` - Uses service manager daemon (port 9000)
- **Issue**: Which is the recommended approach?
- **Action**: Verify both work, document which to use, or consolidate

### 4. Service Manager Configuration
- `service_manager_daemon.py` exists and uses `services.yaml`
- `services.yaml` correctly references `main_hardened_ready_refactored.py` ✓
- **Action**: Verify service manager is production-ready or if direct startup is preferred

### 5. .gitignore Gaps
Current .gitignore doesn't exclude:
- Generated PDFs (`generated_pdfs/`, `generated_pdfs_8084/`)
- Excel audit files (`*.xlsx` audit files)
- Generated HTML reports
- Analysis result JSON files
- **Action**: Update .gitignore to exclude generated content

### 6. Requirements Files Consolidation
Multiple requirements.txt files:
- `requirements_service_manager.txt` (root)
- `8082/requirements.txt`
- `8082/requirements_ollama.txt`
- `8083/requirements.txt`
- `8085/requirements.txt`
- **Action**: Verify all are needed, consider consolidating or documenting purpose

### 7. Backup Files in Code
Found `.backup` references in:
- `8082/files/protected/verified/*.backup_*` files
- `8082/files/raw/*.backup_*` files
- JSON files with backup references
- **Action**: These should be removed (git is backup)

### 8. Test Framework Requirements
- Plan mentions pytest but doesn't specify adding it to requirements
- **Action**: Add pytest to appropriate requirements.txt file(s)

## Plan Improvements Needed

### Phase 1 Enhancements
1. **Add step to check for duplicate main_hardened_ready_refactored.py files**
2. **Add step to update README_MAC.md** (line 86)
3. **Add step to update setup_systemd_services.sh** (line 93)
4. **Add step to verify which startup script is recommended** (start_services.sh vs start_all_services.sh)

### Phase 2 Enhancements
1. **Add step to check for duplicate files** (like main_hardened_ready_refactored.py in root)
2. **Add step to verify import statements** don't reference fixed version

### Phase 4 Enhancements
1. **Add step to update .gitignore** to exclude generated files
2. **Add step to remove .backup files** from 8082/files/ directories

### Phase 6 Enhancements
1. **Add step to add pytest to requirements.txt**
2. **Add step to create requirements-dev.txt** for development dependencies

### Phase 8 Enhancements
1. **Add step to verify service manager** (service_manager_daemon.py) configuration
2. **Add step to document** which startup method is recommended
3. **Add step to verify** all startup scripts reference correct files

### New Phase: Requirements Consolidation
1. **Review all requirements.txt files**
2. **Document purpose of each**
3. **Consolidate if possible** or create clear documentation
4. **Add pytest and other dev tools** to appropriate files

## Additional Findings

### Files That Need Review
1. `main_hardened_ready_refactored.py` (root) - likely duplicate, should be removed
2. `calc_rsa` - SSH key file, should be in .gitignore if not needed
3. `restart_8082.sh` - service-specific restart script, verify if needed
4. `minimal_deploy.sh` - deployment script, verify if current
5. `sync_ui_simple.sh` vs `sync_ui_from_server.py` - verify which is used

### Documentation Files Needing Update
1. **README_MAC.md** - Update manual service start example (line 86)
2. **setup_systemd_services.sh** - Update to use refactored version
3. **All markdown files** referencing fixed version should note it's legacy

## Recommended Plan Updates

### Add to Phase 1:
- [ ] Check for duplicate main_hardened_ready_refactored.py files
- [ ] Update README_MAC.md to use refactored version
- [ ] Update setup_systemd_services.sh to use refactored version
- [ ] Verify which startup script is recommended (start_services.sh vs start_all_services.sh)

### Add to Phase 2:
- [ ] Check for duplicate Python files across directories
- [ ] Verify no imports reference main_hardened_ready_fixed.py

### Add to Phase 4:
- [ ] Update .gitignore to exclude generated files (PDFs, Excel, HTML reports)
- [ ] Remove .backup files from 8082/files/ directories
- [ ] Add calc_rsa to .gitignore if it's a private key

### Add to Phase 6:
- [ ] Add pytest to requirements file(s)
- [ ] Create requirements-dev.txt for development dependencies
- [ ] Document test setup in README

### Add to Phase 8:
- [ ] Verify service_manager_daemon.py configuration
- [ ] Document recommended startup method
- [ ] Consolidate or document multiple startup scripts

### New Phase 11: Requirements and Dependencies
- [ ] Review all requirements.txt files
- [ ] Document purpose of each requirements file
- [ ] Consolidate common dependencies
- [ ] Add development dependencies (pytest, vulture, etc.)

## Verification Checklist Additions

- [ ] No duplicate main_hardened_ready_refactored.py files remain
- [ ] All documentation references correct production file
- [ ] .gitignore excludes all generated content
- [ ] pytest is in requirements
- [ ] All startup scripts use correct file references
- [ ] Service manager configuration is correct (if used)

