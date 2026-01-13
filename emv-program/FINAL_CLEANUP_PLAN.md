# SYNEREX OneForm - Final Comprehensive Codebase Cleanup Plan

## 🎯 Executive Summary

This document provides a complete, updated audit and cleanup plan for the SYNEREX OneForm codebase, addressing:
- Inconsistencies between README and actual code
- Redundant/unused code and files
- Backup files and temporary artifacts
- Missing unit tests
- Dead code identification using static analysis tools
- Duplicate files and documentation issues
- **Best practices for Python projects, security, testing, and maintainability**

**Last Updated**: 2025-01-XX  
**Status**: Ready for implementation

## 📊 Current State Analysis

### Active Production Services (KEEP)
Based on `services.yaml` and `start_services.sh`, these are the **core services**:

| Port | Service | Main File | Status | Purpose |
|------|---------|-----------|--------|---------|
| **8082** | Main App | `8082/main_hardened_ready_refactored.py` | ✅ Active | Core analysis engine, web interface |
| **8083** | PDF Generator | `8083/enhanced_pdf_service.py` | ✅ Active | PDF generation with SVG support |
| **8084** | HTML Reports | `8084/html_report_service.py` | ✅ Active | HTML report generation |
| **8086** | Chart Service | `8086/chart_service.py` | ✅ Active | Data visualization |
| **8200** | Weather Service | `8085/weather_service.py` | ✅ Active | Weather data integration |
| **8090** | Ollama AI Backend | `8082/ollama_ai_backend.py` | ✅ Active | AI backend service |

**Note**: `8082/main_hardened_ready_fixed.py` is kept as a **legacy reference file** for backup purposes, but is NOT the production version.

### Core Infrastructure Files (KEEP)
- `services.yaml` - Service configuration
- `start_services.sh` - Direct service launcher (Mac/Linux)
- `start_services.bat` - Direct service launcher (Windows)
- `start_all_services.sh` - Service manager launcher (alternative)
- `stop_services.sh`, `stop_services.bat` - Service stoppers
- `check_services.sh` - Service health checker
- `service_manager_daemon.py` - Service manager (optional)

## 🚨 Critical Issues Found

### 1. Duplicate main_hardened_ready_refactored.py
- **Location 1**: `/main_hardened_ready_refactored.py` (root directory, 598 lines) - **OUTDATED**
- **Location 2**: `/8082/main_hardened_ready_refactored.py` (production directory, 13,804 lines) - **PRODUCTION**
- **Action**: Remove duplicate from root directory

### 2. Documentation References Wrong File
- **README.md** (line 173, 208) - references `main_hardened_ready_fixed.py` as production
- **README_MAC.md** (line 86) - manual service start example uses fixed version
- **setup_systemd_services.sh** (line 93) - systemd setup references fixed version
- **Action**: Update all to reference `main_hardened_ready_refactored.py` as production

### 3. Multiple Startup Scripts
- `start_services.sh` - Direct startup (uses refactored ✓)
- `start_all_services.sh` - Uses service manager (port 9000)
- **Action**: Document which is recommended, verify both work

### 4. .gitignore Gaps
- Doesn't exclude generated PDFs, Excel files, HTML reports
- Doesn't exclude database files, environment files, secrets
- **Action**: Update .gitignore comprehensively

### 5. Missing Best Practice Files
- No `.env.example` for environment variables
- No `pyproject.toml` or `setup.py` for Python packaging
- No `Makefile` for common tasks
- No `CONTRIBUTING.md` for contributors
- No security scanning tools configured
- **Action**: Add missing best practice files

## Phase 0: Pre-Cleanup Best Practices Setup

### 0.1 Environment Configuration

**Best Practice**: Use environment variables with `.env.example` template

**Actions**:
- [ ] Create `.env.example` file documenting all environment variables:
  - `Synerex_MAX_CONTENT_MB` (default: 32)
  - `Synerex_LOG_LEVEL` (default: INFO)
  - `Synerex_LOG_DIR` (default: results/logs)
  - `Synerex_ALLOWED_EXT` (default: csv,xlsx,xls,json)
  - `Synerex_USE_SQLITE` (default: 0)
  - `Synerex_SQLITE_PATH` (default: results/app.db)
  - `Synerex_AUDIT_DIR` (default: results/audit)
  - `Synerex_CURRENCY` (default: USD)
  - Any API keys or secrets (documented but not included)
- [ ] Add `.env` to `.gitignore` (if not already)
- [ ] Document environment setup in README
- [ ] Consider using `python-dotenv` for .env file loading

### 0.2 Python Project Structure

**Best Practice**: Use `pyproject.toml` for modern Python project configuration

**Actions**:
- [ ] Create `pyproject.toml` with:
  - Project metadata
  - Build system configuration
  - Tool configurations (black, pytest, mypy, etc.)
  - Dependency groups (dev, test, production)
- [ ] Or create `setup.py` if preferred (legacy but still valid)
- [ ] Document build/install process

### 0.3 Development Tools Configuration

**Best Practice**: Centralize tool configurations

**Actions**:
- [ ] Create `pytest.ini` or configure in `pyproject.toml`
- [ ] Create `.pylintrc` or configure in `pyproject.toml`
- [ ] Create `mypy.ini` or configure in `pyproject.toml`
- [ ] Create `.black` or configure in `pyproject.toml`
- [ ] Create `.flake8` or configure in `pyproject.toml` (if using flake8)

### 0.4 Makefile for Common Tasks

**Best Practice**: Provide Makefile for common development tasks

**Actions**:
- [ ] Create `Makefile` with targets:
  - `make install` - Install dependencies
  - `make install-dev` - Install dev dependencies
  - `make test` - Run tests
  - `make test-cov` - Run tests with coverage
  - `make lint` - Run linters
  - `make format` - Format code
  - `make clean` - Clean temporary files
  - `make start` - Start services
  - `make stop` - Stop services
  - `make check` - Run all checks (lint, test, etc.)

## Phase 1: Documentation Audit and Verification

### 1.1 README Verification and Updates

**Issue**: README.md states `main_hardened_ready_fixed.py` is the main app (line 173), but `start_services.sh` and `services.yaml` use `main_hardened_ready_refactored.py`.

**Clarification**: `main_hardened_ready_refactored.py` is the correct production version. `main_hardened_ready_fixed.py` is a legacy reference file kept for backup/reference purposes.

**Actions**:
- [ ] Update README.md line 173 to reference `main_hardened_ready_refactored.py` as production version
- [ ] Add note in README that `main_hardened_ready_fixed.py` is kept as legacy reference
- [ ] Update README.md line 208 if it references fixed version
- [ ] Verify `start_services.sh` correctly references refactored version ✓
- [ ] Verify `services.yaml` correctly references refactored version ✓
- [ ] Ensure no production code imports the fixed version
- [ ] Add sections to README:
  - Development setup
  - Testing instructions
  - Contributing guidelines (or link to CONTRIBUTING.md)
  - Environment variables documentation
  - Troubleshooting section

**Files to examine**:
- `8082/main_hardened_ready_fixed.py` (keep as reference, verify not used in production)
- `8082/main_hardened_ready_refactored.py` (production version)
- `README.md` (update to reflect correct version)
- `start_services.sh` (verify correct)
- `services.yaml` (verify correct)

### 1.2 Duplicate File Detection and Removal

**Issue**: `main_hardened_ready_refactored.py` exists in both root directory (598 lines) and `8082/` directory (13,804 lines).

**Actions**:
- [ ] Compare both files to determine which is the production version
- [ ] Verify root version is outdated/duplicate
- [ ] Remove duplicate from root directory: `git rm main_hardened_ready_refactored.py`
- [ ] Ensure only `8082/main_hardened_ready_refactored.py` remains

**Files to check**:
- `main_hardened_ready_refactored.py` (root - likely duplicate, remove)
- `8082/main_hardened_ready_refactored.py` (production version, keep)

### 1.3 Documentation Updates for Fixed Version References

**Issue**: Multiple files still reference `main_hardened_ready_fixed.py` as if it's the production version.

**Actions**:
- [ ] Update `README_MAC.md` line 86 (manual service start example) to use refactored version
- [ ] Update `setup_systemd_services.sh` line 93 to use refactored version
- [ ] Review all 37 files referencing fixed version
- [ ] Update code/scripts to use refactored version
- [ ] Add notes in documentation that fixed version is legacy reference only

**Files to update**:
- `README_MAC.md` (line 86)
- `setup_systemd_services.sh` (line 93)
- Any scripts that import or reference the fixed version

### 1.4 Port Architecture Verification

**Issue**: Old port architecture files (8000, 8001, 8002) exist but current architecture uses 8082, 8083, 8084, 8086, 8200.

**Actions**:
- [ ] Verify old port files are not referenced: `main_app_8000.py`, `main_app_8001.py`, `api_gateway_8002.py`
- [ ] Check if `launch_synerex_new.bat` is still used (references old ports)
- [ ] Remove or archive old port architecture files
- [ ] Update any remaining references

**Files to check**:
- `main_app_8000.py`
- `main_app_8001.py`
- `api_gateway_8002.py`
- `launch_synerex_new.bat`

### 1.5 Create Missing Documentation Files

**Best Practice**: Provide comprehensive project documentation

**Actions**:
- [ ] Create `CONTRIBUTING.md` with:
  - Code style guidelines
  - Pull request process
  - Testing requirements
  - Commit message conventions
- [ ] Create `CHANGELOG.md` (or update existing)
- [ ] Verify `LICENSE` file exists (if open source)
- [ ] Create `SECURITY.md` for security reporting
- [ ] Create `docs/` directory structure for organized documentation

## Phase 2: Static Analysis for Dead Code

### 2.1 Install and Run Vulture

**Tool**: vulture (Python dead code detector)

**Actions**:
- [ ] Install vulture: `pip install vulture`
- [ ] Run vulture on all Python files: `vulture . --min-confidence 80`
- [ ] Generate report: `vulture . --min-confidence 80 > vulture_report.txt`
- [ ] Review findings and categorize:
  - Unused functions/classes (safe to remove)
  - Unused imports (safe to remove)
  - False positives (keep, document why)
- [ ] Create `vulture.ini` or configure in `pyproject.toml` to exclude false positives

### 2.2 Additional Static Analysis Tools

**Tools to use**:
- `pylint` - Code quality and unused imports (already have `pylint_report.txt`)
- `mypy` - Type checking (already have `mypy_report.txt`)
- `pyflakes` - Unused imports and variables
- `autoflake` - Remove unused imports/variables
- `bandit` - Security linting (NEW - best practice)
- `safety` - Dependency vulnerability scanning (NEW - best practice)

**Actions**:
- [ ] Install tools: `pip install pyflakes autoflake bandit safety`
- [ ] Run `pyflakes .` to find unused imports
- [ ] Run `autoflake --check --recursive .` to identify removable code
- [ ] Run `bandit -r .` to find security issues
- [ ] Run `safety check` to find vulnerable dependencies
- [ ] Consolidate findings from existing `mypy_report.txt` and `pylint_report.txt`
- [ ] Create unified dead code and security report
- [ ] Add bandit and safety to `requirements-dev.txt`
- [ ] Configure bandit exclusions in `.bandit` or `pyproject.toml`

### 2.3 Import Dependency Analysis

**Actions**:
- [ ] Create dependency graph of all Python imports
- [ ] Identify orphaned modules (not imported by any production code)
- [ ] Verify utility scripts are not imported by production code
- [ ] Check for any imports referencing `main_hardened_ready_fixed.py` (should be none)
- [ ] Verify no duplicate imports or circular dependencies
- [ ] Document which files are entry points vs utilities
- [ ] Use `pipdeptree` or `pip-audit` to visualize and audit dependencies

## Phase 3: Utility Script Audit

### 3.1 Categorize Utility Scripts

**Categories**:
1. **One-time migration scripts** (remove after verification)
2. **Debug/analysis scripts** (remove or move to `scripts/archive/`)
3. **Cleanup scripts** (keep if reusable, remove if one-time)
4. **Recovery scripts** (archive, don't delete)

**Scripts to audit** (root level):
- `check_att_project.py`, `check_att_structure.py`
- `cleanup_codebase.py`, `cleanup_js_console_logs.py`
- `deep_att_search.py`, `emergency_att_recovery.py`
- `find_att_data.py`, `find_att_now.py`
- `fix_cohen_syntax.py`, `fix_database_paths.py`, `fix_database.py`, `fix_html.py`
- `recover_from_git.py`
- `remove_duplicate_apis.py`
- `safe_att_search.py`
- `similarity_detector.py`
- `sync_ui_from_server.py`
- `update_user_guides.py`
- `excel_audit_generator.py`
- `preview_cleanup.py`
- `quick_fix.py`

**Actions**:
- [ ] For each script, check:
  - Last modified date
  - Git history (one-time use?)
  - Imported by production code?
  - Referenced in documentation?
- [ ] Create removal/archive list
- [ ] Create `scripts/archive/` directory for scripts to keep but not use

### 3.2 8082 Directory Utility Scripts

**Scripts in 8082/**:
- `cleanup_duplicate_files.py`
- `create_fingerprint_files.py`
- `diagnose_synerex_ai_issue.py`
- `dynamic_data_extraction.py`
- `dynamic_standards_audit.py`
- `file_protection_system.py`
- `find_lineage_winsor.py`
- `fix_hardcoded_values.py`
- `generate_standards_audit_report.py`
- `implement_knowledge_enhancement.py`
- `integrate_knowledge_enhancement.py`
- `migrate_files_to_organized_structure.py`
- `verify_data_source.py`
- `verify_system_compliance.py`
- `synerex_ai_knowledge_enhancement.py`
- `xeco_website_integration.py`, `xeco_website_integration_simple.py`
- `location_based_energy_intelligence.py`

**Actions**:
- [ ] Same audit process as root-level scripts
- [ ] Determine if these are part of production or utilities
- [ ] Move utility scripts to `scripts/` directory if not production code

## Phase 4: Backup and Temporary File Removal

### 4.1 Backup Files

**Files to remove**:
- `synerex-oneform-backup.code-workspace` (backup workspace file)
- `*.backup` files in `8082/files/protected/verified/` and `8082/files/raw/`
- Backup files in JSON: `8082/files/protected/audit_logs/*.backup_*`
- Any `*_backup_*.py` files created by scripts

**Actions**:
- [ ] Search for all `*.backup`, `*.orig`, `*~` files
- [ ] Verify they're not needed (check git history)
- [ ] Remove with git: `git rm <files>`
- [ ] Check for backup references in code (like `file_protection_system.py`)

### 4.2 Temporary and Generated Files

**Files to check**:
- `analysis_results.json` (generated?)
- `complete_html_report.html` (generated?)
- Excel audit files: `My_Project_Audit.xlsx`, `SYNEREX_Audit_Trail_*.xlsx`
- Log files (should be in `.gitignore`, verify)
- Generated PDFs: `8083/generated_pdfs/`, `8084/generated_pdfs_8084/`
- Generated HTML reports

**Actions**:
- [ ] Verify `.gitignore` properly excludes logs, cache, temp files
- [ ] Update `.gitignore` comprehensively to exclude:
  - Generated PDFs (`**/generated_pdfs/`, `**/generated_pdfs_*/`)
  - Generated Excel files (`*_Audit_Trail_*.xlsx` unless documentation)
  - Generated HTML reports
  - Analysis result JSON files
  - SSH keys (`calc_rsa` if it's a private key)
  - Environment files (`.env`, `.env.local`, `.env.*.local`)
  - Database files (`*.db`, `*.sqlite`, `*.sqlite3`)
  - IDE files (`.vscode/`, `.idea/`, `*.swp`, `*.swo`)
  - OS files (`.DS_Store`, `Thumbs.db`, `desktop.ini`)
  - Python cache (`__pycache__/`, `*.pyc`, `*.pyo`, `.pytest_cache/`)
  - Coverage reports (`htmlcov/`, `.coverage`, `.coverage.*`)
  - Distribution files (`dist/`, `build/`, `*.egg-info/`)
- [ ] Remove generated files that can be recreated
- [ ] Keep audit trail Excel files if they're documentation

## Phase 5: Documentation Consolidation

### 5.1 Markdown Documentation Audit

**Issue**: 50+ markdown files, many may be redundant or outdated.

**Categories**:
1. **Keep** (current documentation):
   - `README.md`, `README_MAC.md`
   - Architecture docs: `SYNEREX_ARCHITECTURE_OVERVIEW.md`
   - Standards docs: `SYNEREX_STANDARDS_COMPLIANCE_ANALYSIS.md`
   - User guides in `8082/` subdirectories

2. **Archive** (historical, move to `docs/archive/`):
   - Analysis reports: `*_ANALYSIS.md`, `*_REPORT.md`
   - Progress reports: `*_PROGRESS_*.md`, `*_SUMMARY.md`
   - Fix summaries: `*_FIXES_*.md`, `*_CLEANUP_*.md`

3. **Remove** (regenerable or superseded):
   - Duplicate cleanup plans
   - Old migration guides if superseded

**Actions**:
- [ ] Review each markdown file
- [ ] Consolidate duplicate information
- [ ] Move historical docs to `docs/archive/`
- [ ] Remove truly redundant files
- [ ] Update main README with links to current docs only
- [ ] Create `docs/` directory structure:
  ```
  docs/
  ├── architecture/
  ├── api/
  ├── deployment/
  ├── development/
  ├── user-guides/
  └── archive/
  ```

**Files to review** (sample):
- `API_CLEANUP_REPORT.md`, `API_DUPLICATE_ANALYSIS.md`, `API_FUNCTIONALITY_REPORT.md`
- `BUTTON_FIXES_SUMMARY.md`, `BUTTON_OVERLAP_FIXES.md`
- `CLEANUP_REPORT.md`, `CODE_CLEANUP_PLAN.md`, `CODE_CLEANUP_SUMMARY.md`
- `COMPREHENSIVE_CODEBASE_CLEANUP_PLAN.md` (may be superseded by this plan)
- `DUPLICATION_ANALYSIS_REPORT.md`
- `FINAL_REFACTORING_REPORT.md`, `REFACTORING_PROGRESS_REPORT.md`
- And 30+ more...

## Phase 6: Unit Testing Implementation

### 6.1 Current Test Coverage Assessment

**Current state**: Only `8086/test_chart_service.py` found.

**Actions**:
- [ ] Identify critical functions that need testing
- [ ] Review existing test file as template
- [ ] Create test structure
- [ ] Identify test data requirements
- [ ] Create `tests/fixtures/` for test data

### 6.2 Test Framework Setup

**Framework**: pytest (standard Python testing)

**Actions**:
- [ ] Create `tests/` directory structure:
  ```
  tests/
  ├── unit/
  │   ├── test_analysis_helpers.py
  │   ├── test_common_validators.py
  │   ├── test_template_helpers.py
  │   └── test_calculations.py
  ├── integration/
  │   ├── test_api_endpoints.py
  │   ├── test_services.py
  │   └── test_report_generation.py
  ├── fixtures/
  │   └── test_data/
  └── conftest.py
  ```
- [ ] Create `requirements-dev.txt` for development dependencies:
  - `pytest>=7.0.0`
  - `pytest-cov>=4.0.0` (for coverage)
  - `pytest-mock>=3.0.0` (for mocking)
  - `pytest-asyncio>=0.21.0` (if async code)
  - `pytest-timeout>=2.1.0` (for timeout tests)
  - `vulture>=2.0.0`
  - `pyflakes>=3.0.0`
  - `autoflake>=2.0.0`
  - `bandit>=1.7.0` (security)
  - `safety>=2.3.0` (dependency scanning)
  - `black>=23.0.0` (optional, for formatting)
- [ ] Add `pytest` to main requirements or document in README
- [ ] Create `pytest.ini` or configure in `pyproject.toml`:
  - Test paths
  - Coverage settings
  - Markers
  - Options
- [ ] Create `.coveragerc` or configure coverage in `pyproject.toml`
- [ ] Document test setup in README
- [ ] Add test coverage badge to README (if using coverage service)

### 6.3 Critical Functions to Test

**Priority functions** (from codebase analysis):
- `analysis_helpers.py`: `safe_float`, `validate_analysis_inputs`, calculation functions
- `common_validators.py`: `UnifiedValidator`, `validate_power_factor`, `validate_power_data`
- `template_helpers.py`: `TemplateProcessor`
- Main app: API endpoints, data processing, report generation

**Actions**:
- [ ] Write unit tests for calculation functions
- [ ] Write unit tests for validation functions
- [ ] Write integration tests for API endpoints
- [ ] Write integration tests for service health checks
- [ ] Write tests for error handling
- [ ] Write tests for edge cases
- [ ] Target: 60%+ code coverage for critical paths
- [ ] Set up coverage reporting (HTML and terminal)
- [ ] Add coverage threshold checks to CI/CD (if applicable)

## Phase 7: Code Quality Improvements

### 7.1 Unused Imports Cleanup

**Actions**:
- [ ] Run `autoflake --in-place --remove-all-unused-imports --recursive .`
- [ ] Review changes before committing
- [ ] Fix any broken imports
- [ ] Verify all imports are used

### 7.2 Code Formatting

**Tool**: black (code formatter)

**Actions**:
- [ ] Run `black --check .` to see formatting issues
- [ ] Review formatting changes
- [ ] Optionally run `black .` to auto-format (with caution, review first)
- [ ] Add `.black` configuration or configure in `pyproject.toml`
- [ ] Consider adding `isort` for import sorting
- [ ] Document formatting standards in CONTRIBUTING.md

### 7.3 Linting Fixes

**Actions**:
- [ ] Review existing `pylint_report.txt` and `mypy_report.txt`
- [ ] Fix critical linting issues
- [ ] Suppress false positives appropriately (with comments)
- [ ] Update linting configuration (`.pylintrc`, `mypy.ini`, or `pyproject.toml`)
- [ ] Set up pre-commit hooks (optional but recommended):
  - Install `pre-commit`
  - Create `.pre-commit-config.yaml`
  - Add hooks for: black, isort, flake8/pylint, mypy, bandit

### 7.4 Security Improvements

**Best Practice**: Security-first approach

**Actions**:
- [ ] Run `bandit -r .` and fix security issues
- [ ] Review and fix:
  - Hardcoded secrets (move to environment variables)
  - SQL injection risks (use parameterized queries)
  - XSS vulnerabilities (sanitize user input)
  - CSRF protection (verify Flask-WTF or similar)
  - Insecure file uploads (validate file types and sizes)
  - Path traversal vulnerabilities
- [ ] Review CORS configuration
- [ ] Add security headers (if not already)
- [ ] Review authentication/authorization
- [ ] Add rate limiting if needed
- [ ] Document security practices in SECURITY.md

## Phase 8: Service Configuration Verification

### 8.1 Service File Consistency

**Actions**:
- [ ] Verify all services use correct entry points
- [ ] Ensure `services.yaml` matches `start_services.sh`
- [ ] Verify port numbers are consistent everywhere
- [ ] Check health endpoints are correct
- [ ] Verify environment variable usage is consistent
- [ ] Check for hardcoded paths (should use environment variables or config)

### 8.2 Startup Scripts Audit

**Scripts to verify**:
- `start_services.sh` (Mac/Linux - direct startup, uses refactored ✓)
- `start_services.bat` (Windows)
- `start_all_services.sh` (uses service manager daemon on port 9000)
- `stop_services.sh`, `stop_services.bat`
- `check_services.sh`
- `restart_8082.sh` (service-specific restart)
- `service_manager_daemon.py` (service manager)

**Actions**:
- [ ] Verify which startup method is recommended (direct vs service manager)
- [ ] Ensure `start_services.sh` correctly uses `main_hardened_ready_refactored.py` ✓
- [ ] Verify `start_all_services.sh` uses service manager correctly
- [ ] Check `service_manager_daemon.py` configuration matches `services.yaml`
- [ ] Ensure scripts are consistent
- [ ] Remove duplicates or document when to use each
- [ ] Verify they reference correct service files
- [ ] Document recommended startup method in README
- [ ] Add error handling to startup scripts
- [ ] Add logging to startup scripts

### 8.3 Database and Data Management

**Best Practice**: Proper database management

**Actions**:
- [ ] Verify database files are in `.gitignore`
- [ ] Create database migration system (if needed)
- [ ] Document database schema
- [ ] Create database backup/restore procedures
- [ ] Add database initialization script if needed
- [ ] Document data retention policies

## Phase 9: Requirements and Dependencies Consolidation

### 9.1 Review All Requirements Files

**Current requirements files**:
- `requirements_service_manager.txt` (root)
- `8082/requirements.txt`
- `8082/requirements_ollama.txt`
- `8083/requirements.txt`
- `8085/requirements.txt`

**Actions**:
- [ ] Review each requirements file for purpose
- [ ] Document purpose of each file in README
- [ ] Identify common dependencies that could be consolidated
- [ ] Verify all versions are compatible
- [ ] Pin dependency versions (use `==` for exact versions in production)
- [ ] Add development dependencies to `requirements-dev.txt`:
  - pytest, pytest-cov, pytest-mock
  - vulture, pyflakes, autoflake
  - bandit, safety
  - black, isort (optional)
- [ ] Create `requirements.txt` in root if needed for overall dependencies
- [ ] Consider using `pip-tools` for dependency management:
  - `requirements.in` for unpinned dependencies
  - `requirements.txt` for pinned dependencies (generated)
- [ ] Run `safety check` regularly and update vulnerable dependencies
- [ ] Document dependency update process

### 9.2 Dependency Documentation

**Actions**:
- [ ] Document which services need which dependencies
- [ ] Create dependency installation guide
- [ ] Update README with dependency information
- [ ] Document minimum Python version required
- [ ] Document platform-specific requirements (if any)

## Phase 10: Verification and Testing

### 10.1 Pre-Cleanup Verification

**Actions**:
- [ ] Create git tag: `git tag pre-cleanup-$(date +%Y%m%d)`
- [ ] Create git branch: `git checkout -b cleanup-$(date +%Y%m%d)`
- [ ] Verify all 5 services start correctly
- [ ] Run basic functionality tests
- [ ] Document current state
- [ ] Take screenshots of working system (if applicable)
- [ ] Document known issues

### 10.2 Post-Cleanup Verification

**Actions**:
- [ ] Start all services: `./start_services.sh`
- [ ] Verify each service health endpoint
- [ ] Test main application functionality
- [ ] Test PDF generation
- [ ] Test HTML report generation
- [ ] Test chart service
- [ ] Test weather service
- [ ] Run new unit tests: `pytest`
- [ ] Run tests with coverage: `pytest --cov`
- [ ] Verify no broken imports
- [ ] Run security scan: `bandit -r .`
- [ ] Run dependency scan: `safety check`
- [ ] Verify all services work as before cleanup

### 10.3 Rollback Plan

**Actions**:
- [ ] Document rollback procedure
- [ ] Ensure git tag allows easy rollback: `git checkout pre-cleanup-YYYYMMDD`
- [ ] Test rollback process
- [ ] Document rollback steps in README or separate document

## Phase 11: Documentation Updates

### 11.1 Update README

**Actions**:
- [ ] Fix inconsistencies found in Phase 1
- [ ] Update to reflect `main_hardened_ready_refactored.py` is production version
- [ ] Add note that `main_hardened_ready_fixed.py` is legacy reference
- [ ] Remove references to deleted files
- [ ] Update service information
- [ ] Add testing section with pytest setup
- [ ] Add development setup section
- [ ] Document which startup script to use (start_services.sh vs start_all_services.sh)
- [ ] Update file structure documentation
- [ ] Add requirements and dependencies section
- [ ] Add environment variables section
- [ ] Add troubleshooting section
- [ ] Add contributing section (or link to CONTRIBUTING.md)
- [ ] Add badges (build status, coverage, etc. if applicable)
- [ ] Add table of contents for long README

### 11.2 Update Other Documentation

**Actions**:
- [ ] Update `README_MAC.md` with correct service file references
- [ ] Update any other user-facing documentation
- [ ] Ensure all examples use refactored version
- [ ] Create API documentation (if not exists)
- [ ] Create deployment guide
- [ ] Create architecture diagram (if not exists)

### 11.3 Create Cleanup Report

**Actions**:
- [ ] Document all files removed
- [ ] Document all files archived
- [ ] Document code improvements
- [ ] Document duplicate files removed
- [ ] Document .gitignore updates
- [ ] Document security improvements
- [ ] Document test coverage improvements
- [ ] Create `CLEANUP_2025_REPORT.md` with findings
- [ ] Update CHANGELOG.md with cleanup changes

## Implementation Checklist

### Phase 0: Pre-Cleanup Best Practices
- [ ] Create `.env.example` file
- [ ] Create `pyproject.toml` or `setup.py`
- [ ] Create `Makefile` for common tasks
- [ ] Configure tool configs (pytest.ini, .pylintrc, etc.)
- [ ] Create `CONTRIBUTING.md`
- [ ] Create `SECURITY.md`
- [ ] Create `CHANGELOG.md` (or update)

### Phase 1: Documentation Audit
- [ ] Update README to reflect that `main_hardened_ready_refactored.py` is production version
- [ ] Add note in README that `main_hardened_ready_fixed.py` is kept as legacy reference
- [ ] Check for duplicate `main_hardened_ready_refactored.py` files (root vs 8082/)
- [ ] Remove duplicate from root directory if found
- [ ] Update README_MAC.md to use refactored version (line 86)
- [ ] Update setup_systemd_services.sh to use refactored version (line 93)
- [ ] Verify no production code imports the fixed version
- [ ] Remove/archive old port architecture files
- [ ] Update README with correct service information

### Phase 2: Static Analysis
- [ ] Install vulture, pyflakes, autoflake, bandit, safety
- [ ] Run vulture and generate report
- [ ] Run pyflakes and autoflake
- [ ] Run bandit for security issues
- [ ] Run safety for dependency vulnerabilities
- [ ] Create unified dead code and security report
- [ ] Review and categorize findings
- [ ] Check for duplicate Python files across directories
- [ ] Verify no imports reference main_hardened_ready_fixed.py

### Phase 3: Utility Script Audit
- [ ] Audit all root-level utility scripts
- [ ] Audit 8082 utility scripts
- [ ] Create removal/archive list
- [ ] Verify no production dependencies
- [ ] Create `scripts/archive/` directory

### Phase 4: Backup Removal
- [ ] Find all backup files
- [ ] Remove backup workspace file (`synerex-oneform-backup.code-workspace`)
- [ ] Remove .backup files from `8082/files/` directories
- [ ] Remove backup references in code if any
- [ ] Update .gitignore comprehensively
- [ ] Add SSH keys to .gitignore if needed (`calc_rsa`)
- [ ] Verify .gitignore is comprehensive

### Phase 5: Documentation Consolidation
- [ ] Review all markdown files
- [ ] Archive historical docs to `docs/archive/`
- [ ] Remove redundant docs
- [ ] Update README links
- [ ] Create `docs/` directory structure

### Phase 6: Unit Testing
- [ ] Set up pytest framework
- [ ] Create test structure
- [ ] Create requirements-dev.txt
- [ ] Configure pytest.ini and .coveragerc
- [ ] Write unit tests for critical functions
- [ ] Write integration tests
- [ ] Achieve 60%+ coverage
- [ ] Set up coverage reporting

### Phase 7: Code Quality
- [ ] Remove unused imports
- [ ] Fix critical linting issues
- [ ] Format code (optional, careful)
- [ ] Fix security issues found by bandit
- [ ] Update vulnerable dependencies
- [ ] Set up pre-commit hooks (optional)

### Phase 8: Service Verification
- [ ] Verify service configurations
- [ ] Audit startup scripts
- [ ] Ensure consistency
- [ ] Document recommended startup method
- [ ] Add error handling to scripts
- [ ] Document database management

### Phase 9: Requirements Consolidation
- [ ] Review all requirements.txt files
- [ ] Document purpose of each
- [ ] Pin dependency versions
- [ ] Create requirements-dev.txt
- [ ] Run safety check
- [ ] Update README with dependency info

### Phase 10: Verification
- [ ] Pre-cleanup verification (git tag, branch)
- [ ] Execute cleanup
- [ ] Post-cleanup verification
- [ ] Test all services
- [ ] Run security scans
- [ ] Test rollback process

### Phase 11: Documentation
- [ ] Update README comprehensively
- [ ] Update README_MAC.md
- [ ] Create cleanup report
- [ ] Update CHANGELOG.md
- [ ] Document all changes

## Expected Outcomes

### Files Removed
- ~50-100 utility/cleanup scripts (one-time use)
- ~20-30 backup/temporary files
- ~20-30 redundant markdown documentation files
- Dead code identified by vulture
- Duplicate `main_hardened_ready_refactored.py` from root

### Files Added (Best Practices)
- `.env.example` - Environment variable template
- `pyproject.toml` or `setup.py` - Python project configuration
- `Makefile` - Common development tasks
- `CONTRIBUTING.md` - Contribution guidelines
- `SECURITY.md` - Security reporting
- `CHANGELOG.md` - Change log
- `requirements-dev.txt` - Development dependencies
- `pytest.ini` - Test configuration
- `.coveragerc` - Coverage configuration
- `.pre-commit-config.yaml` - Pre-commit hooks (optional)

### Files Archived
- Historical documentation moved to `docs/archive/`
- Recovery scripts moved to `scripts/archive/`

### Code Quality
- Unused imports removed
- Dead code removed
- 60%+ test coverage on critical paths
- Consistent service configuration
- Security issues fixed
- Vulnerable dependencies updated

### Documentation
- README matches actual codebase
- Clear file structure
- Up-to-date service information
- Testing documentation
- All references point to correct production files
- Comprehensive development setup guide

## Risk Mitigation

1. **Git Backup**: All changes committed, tagged state before cleanup
2. **Branch Strategy**: Work on cleanup branch, merge after verification
3. **Incremental**: Cleanup done in phases with verification
4. **Testing**: Services tested after each major change
5. **Rollback**: Easy rollback via git tag
6. **Careful Review**: Manual review of vulture findings (false positives)
7. **Security**: Security scanning before and after cleanup
8. **Documentation**: All changes documented

## Tools Required

### Development Tools
- `vulture` - Dead code detection
- `pyflakes` - Unused imports/variables
- `autoflake` - Auto-remove unused code
- `pytest` - Testing framework
- `pytest-cov` - Coverage reporting
- `pytest-mock` - Mocking support
- `pylint` - Code quality (already have reports)
- `mypy` - Type checking (already have reports)
- `black` - Code formatting (optional)
- `isort` - Import sorting (optional)
- `bandit` - Security linting
- `safety` - Dependency vulnerability scanning
- `pre-commit` - Git hooks (optional)
- `pip-tools` - Dependency management (optional)

## Success Criteria

- [ ] All 5 services start and run correctly
- [ ] README matches actual codebase
- [ ] No broken imports or references
- [ ] Unit tests pass with 60%+ coverage
- [ ] Dead code identified and removed
- [ ] Utility scripts categorized and archived/removed
- [ ] Backup files removed
- [ ] Documentation consolidated
- [ ] Code quality improved (linting issues reduced)
- [ ] Clean, maintainable codebase structure
- [ ] No duplicate main_hardened_ready_refactored.py files
- [ ] All documentation references correct production file
- [ ] .gitignore excludes all generated content
- [ ] pytest is in requirements-dev.txt
- [ ] All startup scripts use correct file references
- [ ] Security issues fixed (bandit clean)
- [ ] Vulnerable dependencies updated (safety check clean)
- [ ] Best practice files created (.env.example, Makefile, etc.)
- [ ] Pre-commit hooks configured (optional)
- [ ] Test coverage reporting working
- [ ] All environment variables documented

---

**Created**: 2025-01-XX  
**Status**: Ready for implementation  
**Next Step**: Begin Phase 0 - Pre-Cleanup Best Practices Setup

