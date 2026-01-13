# Verification Code System - 10,000 Foot View & Audit

## **HIGH-LEVEL ARCHITECTURE**

### **Flow:**
```
1. User runs analysis
   ↓
2. Analysis session created in database (with session ID)
   ↓
3. Analysis results returned (including session ID)
   ↓
4. User exports HTML report
   ↓
5. System checks: Does this session have a verification code?
   ├─ YES → Reuse existing code
   └─ NO → Generate new code, store in database, use it
   ↓
6. Verification code included in HTML certificate
   ↓
7. User visits /verify/<code>
   ↓
8. System looks up code in database and displays results
```

## **CURRENT PROBLEMS IDENTIFIED**

### **Problem 1: Analysis Session Not Created Properly**
- The `/api/analyze` endpoint may not be creating sessions consistently
- Session ID may not be returned in results
- Session ID may not be passed to HTML generation

### **Problem 2: Verification Code Generation Timing**
- Code is generated during HTML export (correct)
- But it's not reliably stored in database
- Code changes on each export (should reuse)

### **Problem 3: Database Storage Issues**
- `store_verification_code()` may fail silently
- Session lookup may fail
- No fallback mechanism

## **REQUIRED FIXES**

### **Fix 1: Ensure Analysis Session is Created**
- In `/api/analyze`: Always create session, always return session ID
- Store session ID in results_data
- Pass session ID through to HTML generation

### **Fix 2: Centralized Verification Code Management**
- Create function: `get_or_create_verification_code(session_id, project_name, file_ids)`
- This function:
  1. Checks database for existing code
  2. If exists, returns it
  3. If not, generates new one and stores it
  4. Returns the code

### **Fix 3: Store Code When HTML is Exported**
- In `/api/generate-report`: Call get_or_create_verification_code()
- Ensure code is stored BEFORE generating certificate
- Include code in certificate text

### **Fix 4: Verification Endpoint**
- Look up code in database
- Display session information
- Show file integrity data
- Show compliance verification data

## **IMPLEMENTATION CHECKLIST**

- [x] Create `get_or_create_verification_code()` function - **DONE**
- [x] Update HTML generation to use centralized function - **DONE**
- [ ] Fix `/api/analyze` to always create and return session ID
- [ ] Ensure session ID is passed to HTML generation
- [ ] Add logging at each step
- [ ] Test: Run analysis → Export HTML → Check database
- [ ] Test: Export HTML twice → Verify same code
- [ ] Test: Visit verification URL → Verify it works

## **IMPLEMENTATION STATUS**

### ✅ **COMPLETED:**
1. **Created `get_or_create_verification_code()` function** (line ~947)
   - Checks database for existing code
   - Generates new code if needed
   - Stores code in database
   - Always returns a code (even if database fails)

2. **Simplified HTML export verification code logic** (line ~27077)
   - Replaced complex logic with single function call
   - Uses centralized `get_or_create_verification_code()`

### ✅ **FIXED:**
3. **Always Store Verification Code** - Updated `get_or_create_verification_code()` to:
   - ALWAYS create a new session if no existing session found
   - Store code even if project_name is NULL
   - Try multiple matching strategies (session ID, project+files, project only, files only)
   - Create new session as last resort with minimal data
   - Added extensive logging to track what's happening

### ⚠️ **REMAINING ISSUES:**
1. **Analysis Session Creation**: Need to ensure `/api/analyze` always creates session
2. **Session ID Propagation**: Need to ensure session ID is in results and passed to HTML generation
3. **Testing**: Need to verify end-to-end flow works

## **HOW IT WORKS NOW:**

1. **When HTML is exported:**
   - Calls `get_or_create_verification_code(analysis_session_id, project_name, before_file_id, after_file_id)`
   - Function checks database for existing code
   - If found, reuses it
   - If not found, generates new one and stores it
   - Returns code (always succeeds)

2. **Database Storage:**
   - Code is stored in `analysis_sessions.verification_code` column
   - Linked to session by ID, project name, or file IDs
   - Unique index ensures no duplicates

3. **Verification:**
   - `/verify/<code>` endpoint looks up code in database
   - Displays session information and compliance data

