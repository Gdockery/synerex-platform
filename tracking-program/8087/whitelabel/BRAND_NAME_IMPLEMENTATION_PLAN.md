# Brand Name Whitelabeling Implementation Plan

## Overview
Replace all hardcoded "Xeco" and "Xeco Energy" strings throughout the codebase with a dynamic brand name system that reads from `whitelabel/{branding}/brandname.txt` files. Default to "Xeco" when no brandname.txt exists.

## Current State
- **622 occurrences** of "Xeco" or "XECO" across **156 files**
- Found in: Frontend templates (Angular HTML), Backend templates (EJS), PDF generators, Email templates, TypeScript/JavaScript code
- No dynamic brand name system exists

## Architecture

### 1. Backend Brand Name System

**File**: `config/whitelabel.js`
- Add `getBrandName(hostname)` function that:
  - Extracts branding from hostname (same logic as `getBrandingFromHostname`)
  - Reads `whitelabel/{branding}/brandname.txt` if exists
  - Falls back to default "Xeco" if file doesn't exist or branding is null
  - Caches the result to avoid repeated file reads

**File**: `api/helpers/web/whitelabel/get-brand-name.js` (NEW)
- Helper function for controllers/views to get brand name
- Accepts `req` object, extracts hostname, returns brand name
- Usage: `sails.helpers.web.whitelabel.getBrandName({req: this.req})`

### 2. Frontend Brand Name System

**File**: `src/app/shared/services/whitelabel.service.ts`
- Add `getBrandName()` method
- Makes API call to `/api/whitelabel/brand-name` endpoint
- Caches result in service
- Usage: `this.whitelabelService.getBrandName()`

**File**: `api/controllers/web/whitelabel/get-brand-name.js` (NEW)
- API endpoint that returns current brand name based on request hostname
- Returns: `{brandName: "Xeco"}` or `{brandName: "Synerex"}`

### 3. Replacement Strategy

#### Phase 1: Backend Templates (EJS)
- **Files**: `views/*.ejs`, `views/emails/*.ejs`, `views/partials/*.ejs`
- Replace hardcoded strings with EJS variables
- Pass brand name from controllers via `res.locals.brandName`
- Or use helper: `<%= sails.helpers.web.whitelabel.getBrandName({req: req}).execSync() %>`

#### Phase 2: PDF Generators
- **Files**: `api/services/pdf/generators/*.js`, `api/helpers/pdf/*-data-mapper.js`
- Replace "Xeco Energy Corporation" with dynamic brand name
- Pass `req` object through PDF generation chain (already done for assets)
- Use helper in data mappers

#### Phase 3: Email Templates
- **Files**: `views/emails/*.ejs`
- Use same EJS approach as Phase 1
- Update email subject lines in controllers

#### Phase 4: Frontend Templates (Angular)
- **Files**: `src/app/**/*.html`
- Replace hardcoded "Xeco" with `{{whitelabelService.getBrandName()}}`
- Update TypeScript components to inject WhitelabelService where needed

#### Phase 5: TypeScript/JavaScript Code
- **Files**: `src/app/**/*.ts`, `api/**/*.js`
- Replace hardcoded strings in code
- Use service/helper methods
- Update titles, labels, messages

### 4. Implementation Details

#### Brand Name File Format
- **Location**: `whitelabel/{branding}/brandname.txt`
- **Content**: Single line with brand name (e.g., "Synerex")
- **Default**: If file doesn't exist, use "Xeco"

#### Caching Strategy
- Backend: Cache brand name per hostname in memory (simple object cache)
- Frontend: Cache in WhitelabelService after first API call
- Invalidate on server restart (acceptable for whitelabel use case)

#### Common Patterns to Replace
1. `"Xeco"` → dynamic brand name
2. `"Xeco Energy"` → `"{brandName} Energy"` or just brand name
3. `"Xeco Energy Corporation"` → `"{brandName} Energy Corporation"` or just brand name
4. `"Xeco Web Portal"` → `"{brandName} Web Portal"`
5. `"Xeco Units"` → `"{brandName} Units"`
6. `"XECO"` (uppercase) → uppercase version of brand name

### 5. Files to Create

1. `api/helpers/web/whitelabel/get-brand-name.js` - Backend helper
2. `api/controllers/web/whitelabel/get-brand-name.js` - API endpoint
3. `whitelabel/tracking/brandname.txt` - Example brand name file (content: "Synerex")

### 6. Files to Modify (Priority Order)

**High Priority (User-facing):**
- `views/layout.ejs` - Page title
- `views/partials/footer.ejs` - Footer copyright
- `src/app/welcome/welcome.component.html` - Welcome text
- `src/app/shared/navbar/navbar.component.html` - Navigation text
- `views/terms.ejs`, `views/agreement.ejs` - Legal pages
- `views/emails/*.ejs` - Email templates

**Medium Priority (PDFs):**
- `api/services/pdf/generators/*.js` - All PDF generators
- `api/helpers/pdf/*-data-mapper.js` - PDF data mappers

**Lower Priority (Code/Internal):**
- TypeScript services and components
- API controllers
- Configuration files

### 7. Testing Strategy

1. Test default behavior (no brandname.txt) → should show "Xeco"
2. Test with `whitelabel/tracking/brandname.txt` containing "Synerex"
3. Verify all user-facing text updates
4. Verify PDFs use correct brand name
5. Verify emails use correct brand name
6. Test caching doesn't break updates

### 8. Rollout Plan

1. **Step 1**: Create brand name infrastructure (helpers, API endpoint)
2. **Step 2**: Create `brandname.txt` file for tracking domain
3. **Step 3**: Update backend templates (EJS) - highest visibility
4. **Step 4**: Update frontend templates (Angular HTML)
5. **Step 5**: Update PDF generators
6. **Step 6**: Update email templates
7. **Step 7**: Update remaining code references
8. **Step 8**: Test and verify

## Technical Considerations

- **Performance**: Cache brand name lookups to avoid file I/O on every request
- **Fallback**: Always default to "Xeco" if brandname.txt missing
- **Case Handling**: Preserve original case context (e.g., "XECO" → uppercase brand name)
- **Context Awareness**: Some contexts may need "Xeco Energy" vs just "Xeco"
- **Backward Compatibility**: Ensure default behavior unchanged when no whitelabel

## Estimated Impact

- **Files to modify**: ~150+ files
- **String replacements**: ~622 occurrences
- **New files**: 3 (helper, controller, brandname.txt)
- **Risk level**: Medium-High (touches many files, but changes are localized)
