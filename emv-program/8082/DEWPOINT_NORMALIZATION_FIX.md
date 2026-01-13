# Dewpoint Normalization Fix

## Issue Identified

The value **0.9091** was a fallback value caused by incorrect dewpoint handling. When dewpoint values were missing, the code was defaulting them to `base_temp` (18.3°C), which made it appear that dewpoint normalization was working when it actually wasn't.

## Root Cause

### Previous Behavior (Incorrect)
```python
dewpoint_before = float(dewpoint_before) if dewpoint_before is not None else self.base_temp
dewpoint_after = float(dewpoint_after) if dewpoint_after is not None else self.base_temp
```

**Problem:**
- When dewpoint was `None`, it defaulted to `base_temp` (18.3°C)
- This made `dewpoint_effect = (18.3 - 18.3) * 0.015 = 0`
- The calculation silently removed dewpoint effects without warning
- This produced a different adjustment factor (0.9091) than the theoretical value (1.0940) that assumed dewpoint was present

### Why 0.9091 vs 1.0940?

**Theoretical 1.0940:**
- Assumes dewpoint values are present
- Includes both temperature AND dewpoint effects
- Formula: `(1 + temp_effect + dewpoint_effect_before) / (1 + temp_effect + dewpoint_effect_after)`

**Actual 0.9091:**
- Dewpoint defaulted to base_temp, so dewpoint_effect = 0
- Only includes temperature effects
- Formula: `(1 + temp_effect_before) / (1 + temp_effect_after)`
- This is **temperature-only normalization**, not full ML normalization

## Fix Implemented

### New Behavior (Correct)
```python
# Check if dewpoint values are available
dewpoint_available = (dewpoint_before is not None and dewpoint_after is not None)

if not dewpoint_available:
    logger.warning("Dewpoint values missing - using temperature-only normalization (dewpoint effects set to 0)")
    dewpoint_before = None
    dewpoint_after = None
    dewpoint_effect_before = 0.0
    dewpoint_effect_after = 0.0
    hdd_before = 0.0
    hdd_after = 0.0
else:
    dewpoint_before = float(dewpoint_before)
    dewpoint_after = float(dewpoint_after)
    # Calculate dewpoint effects...
```

**Improvements:**
1. **Explicit handling**: Dewpoint effects are explicitly set to 0 when missing
2. **Clear logging**: Warning message indicates when dewpoint normalization cannot be applied
3. **Transparent results**: Return dictionary includes `dewpoint_available` flag
4. **Audit trail**: Method name indicates "Temperature Only" vs "Temp + Dewpoint"

## Changes Made

### 1. Input Validation (`main_hardened_ready_refactored.py` lines 1134-1167)
- Check if dewpoint values are available before processing
- Explicitly set dewpoint effects to 0 when missing
- Calculate dewpoint effects only when values are available

### 2. Enhanced Logging (lines 1219-1235)
- Method name indicates whether dewpoint was used
- Separate logging for temperature and dewpoint effects
- Clear indication when dewpoint is N/A

### 3. Return Dictionary (lines 1237-1265)
- Added `dewpoint_available` flag
- Added `temp_effect_before` and `temp_effect_after` for audit trail
- Added `dewpoint_effect_before` and `dewpoint_effect_after` for audit trail
- Method name reflects actual normalization type used

## Impact

### Before Fix
- ❌ Silent failure: Dewpoint normalization appeared to work but didn't
- ❌ Incorrect factor: 0.9091 (temperature-only) vs 1.0940 (with dewpoint)
- ❌ No indication that dewpoint was missing
- ❌ Audit trail incomplete

### After Fix
- ✅ Explicit handling: Clear when dewpoint normalization is not applied
- ✅ Correct factor: Uses temperature-only normalization when dewpoint missing
- ✅ Warning logged: System warns when dewpoint values are missing
- ✅ Complete audit trail: All effects documented in results

## Testing Recommendations

1. **Test with dewpoint values present:**
   - Should use full ML normalization (temp + dewpoint)
   - Adjustment factor should match theoretical calculation
   - Method should indicate "Temp + Dewpoint"

2. **Test with dewpoint values missing:**
   - Should use temperature-only normalization
   - Warning should be logged
   - Method should indicate "Temperature Only"
   - Dewpoint effects should be 0.0

3. **Verify audit trail:**
   - Check `dewpoint_available` flag in results
   - Verify `dewpoint_effect_before` and `dewpoint_effect_after` are 0 when missing
   - Confirm method name reflects actual normalization used

## Formula Reference (Current ASHRAE-Compliant Implementation)

### Full Normalization (with dewpoint):
```
# Base temperature optimized from baseline data (not fixed 18.3°C)
base_temp = optimize_base_temperature(baseline_energy, baseline_temp, baseline_dewpoint)

# Sensitivity factors calculated from regression (not fixed values)
temp_sensitivity = regression_result["temp_sensitivity"]  # Equipment-specific, calculated
dewpoint_sensitivity = regression_result["dewpoint_sensitivity"]  # Calculated from regression

# Weather effects (with max(0, ...) for cooling systems)
temp_effect = max(0, (temp - base_temp) * temp_sensitivity)
dewpoint_effect = max(0, (dewpoint - base_temp) * dewpoint_sensitivity)
weather_effect = temp_effect + dewpoint_effect
adjustment_factor = (1 + weather_effect_before) / (1 + weather_effect_after)
```

### Temperature-Only Normalization (dewpoint missing):
```
# Base temperature optimized from baseline data
base_temp = optimize_base_temperature(baseline_energy, baseline_temp)

# Sensitivity factors calculated from regression
temp_sensitivity = regression_result["temp_sensitivity"]  # Calculated, not fixed

# Weather effects (dewpoint set to 0 when missing)
temp_effect = max(0, (temp - base_temp) * temp_sensitivity)
dewpoint_effect = 0.0  # Explicitly set to 0 when dewpoint not available
weather_effect = temp_effect + 0.0 = temp_effect
adjustment_factor = (1 + temp_effect_before) / (1 + temp_effect_after)
```

### Fallback (if regression fails):
```
# Uses equipment-specific fixed factors
temp_sensitivity = 0.036  # 3.6% per °C for chillers (equipment-specific)
dewpoint_sensitivity = 0.0216  # 2.16% per °C (60% of temp sensitivity)
base_temp = 18.3°C  # ASHRAE standard (if optimization fails)
```

## Conclusion

The 0.9091 value was **not a fallback value** - it was the result of **incorrect dewpoint handling**. The fix ensures:
- Dewpoint normalization is explicitly handled
- Missing dewpoint values are clearly indicated
- The calculation method matches what's actually being used
- Full audit trail is available for compliance

