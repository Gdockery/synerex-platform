# PE Dashboard #register Issue - Diagnosis and Fix

## Problem
The page `http://localhost:8082/pe-dashboard#register` is not accessible.

## Root Causes Identified

### 1. **Server Not Running** (Primary Issue)
- The EM&V server on port 8082 is not currently running
- Port 8082 is not listening (confirmed via `netstat`)

### 2. **Missing Hash Fragment Handling** (Secondary Issue)
- The `main_hardened_ready_fixed.py` file (used by `start_8082_service.bat`) does not handle the `#register` hash fragment
- The `main_hardened_ready_refactored.py` file has hash fragment handling, but it's not the active version

## Solutions

### Solution 1: Start the EM&V Server

**Option A: Use the batch file**
```batch
cd C:\Users\Admin\OneDrive\Documents\synerex-platform\emv-program
start_8082_service.bat
```

**Option B: Manual start**
```powershell
cd C:\Users\Admin\OneDrive\Documents\synerex-platform\emv-program\8082
python main_hardened_ready_fixed.py
```

### Solution 2: Add Hash Fragment Handling

The `main_hardened_ready_fixed.py` needs to handle the `#register` hash fragment to automatically show the registration form when the page loads with `#register` in the URL.

**Add this JavaScript code** to the `DOMContentLoaded` event listener in `main_hardened_ready_fixed.py` (around line 27442):

```javascript
// Handle hash fragments on page load
if (window.location.hash === '#register') {
    showRegisterPE();
} else if (window.location.hash === '#verify') {
    showVerifyLicense();
}

// Also handle hash changes dynamically
window.addEventListener('hashchange', function() {
    if (window.location.hash === '#register') {
        showRegisterPE();
    } else if (window.location.hash === '#verify') {
        showVerifyLicense();
    } else {
        hideRegisterPE();
    }
});
```

**Location in code:** After line 27445 in `main_hardened_ready_fixed.py`, inside the `DOMContentLoaded` event listener.

## Current Status

- ✅ Route `/pe-dashboard` exists and is properly defined
- ✅ Registration form exists in the HTML
- ❌ Server is not running
- ❌ Hash fragment `#register` is not handled to auto-show registration form

## Testing Steps

1. Start the EM&V server using `start_8082_service.bat`
2. Verify server is running: `netstat -ano | findstr ":8082"`
3. Access `http://localhost:8082/pe-dashboard` - should load
4. Access `http://localhost:8082/pe-dashboard#register` - should show registration form (after fix)
5. Click "Register New PE" button - should show registration form

## Files Involved

- `C:\Users\Admin\OneDrive\Documents\synerex-platform\emv-program\8082\main_hardened_ready_fixed.py` - Main server file (line ~27442)
- `C:\Users\Admin\OneDrive\Documents\synerex-platform\emv-program\start_8082_service.bat` - Startup script
- `C:\Users\Admin\OneDrive\Documents\synerex-platform\emv-program\8082\main_hardened_ready_refactored.py` - Has hash handling (reference)
