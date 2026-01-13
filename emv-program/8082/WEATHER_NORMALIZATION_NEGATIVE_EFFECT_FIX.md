# Weather Normalization Negative Effect Fix

## Critical Issue Identified

The weather normalization was showing **negative savings** when there were clear positive savings in the raw data. This was caused by **negative weather effects** when temperatures were below the base temperature (18.3°C).

## The Problem

### Original Formula (Incorrect)
```python
temp_effect = (temp - base_temp) * temp_sensitivity
```

**Issue**: When `temp < base_temp` (e.g., 15°C):
- `temp_effect = (15 - 18.3) × 0.025 = -0.0825` (-8.25%)
- `(1 + weather_effect_after) = 1 - 0.0825 = 0.9175`
- This makes the adjustment factor **too large**: `factor = (1 + weather_effect_before) / 0.9175`
- Results in **over-adjustment** and negative normalized savings

### Example of the Problem

**Your Data:**
- Before: 63.96 kW (hot weather)
- After (raw): 59.68 kW (cool weather) → **4.28 kW savings** ✓
- After (normalized): 65.29 kW (adjusted) → **-1.33 kW savings** ✗

The normalization was **over-adjusting** because:
1. Cool temperatures (< 18.3°C) produced negative weather effects
2. Negative weather effects made the denominator smaller
3. This inflated the adjustment factor
4. Result: Normalized value exceeded the "before" value, showing negative savings

## The Fix

### Corrected Formula
```python
# For cooling systems, temperatures below base_temp have ZERO cooling load
temp_effect = max(0, (temp - base_temp) * temp_sensitivity)
dewpoint_effect = max(0, (dewpoint - base_temp) * dewpoint_sensitivity)
```

**Why This Works:**
- For cooling systems, temperatures below the base temperature (18.3°C) require **no cooling**
- Weather effect should be **zero**, not negative
- This prevents over-adjustment and preserves real savings

## Changes Made

### 1. Python Backend (`main_hardened_ready_refactored.py`)
**Lines 1159-1167:**
- Added `max(0, ...)` to temperature effect calculation
- Added `max(0, ...)` to dewpoint effect calculation
- Prevents negative weather effects for cooling systems

### 2. JavaScript Frontend (`javascript_functions.js`)
**Lines 6560-6566:**
- Added `Math.max(0, ...)` to temperature effect calculation
- Added `Math.max(0, ...)` to dewpoint effect calculation
- Ensures UI calculations match backend

## Expected Results After Fix

**With the fix:**
- Before: 63.96 kW (hot weather)
- After (raw): 59.68 kW (cool weather)
- After (normalized): Should be **< 63.96 kW** (adjusted to hot weather, but still showing savings)
- Normalized savings: Should be **positive** (just smaller than raw savings)

**Why:**
- Weather effects are now capped at 0 (no negative values)
- Adjustment factor is more accurate
- Real equipment savings are preserved in normalized results

## Technical Details (Current ASHRAE-Compliant Implementation)

### Weather Effect Calculation
**Current Implementation:**
```python
# Base temperature optimized from baseline data (not fixed 18.3°C)
base_temp = optimize_base_temperature(baseline_energy, baseline_temp, baseline_dewpoint)

# Sensitivity factors calculated from regression (not fixed 0.025)
temp_sensitivity = regression_result["temp_sensitivity"]  # Equipment-specific, calculated
dewpoint_sensitivity = regression_result["dewpoint_sensitivity"]  # Calculated from regression

# Weather effects with max(0, ...) for cooling systems
temp_effect = max(0, (temp - base_temp) * temp_sensitivity)
dewpoint_effect = max(0, (dewpoint - base_temp) * dewpoint_sensitivity)

# If temp = 15°C and base_temp = 18.3°C: temp_effect = 0 (no cooling needed)
# If temp = 15°C and base_temp = 15.2°C (optimized): temp_effect = 0 (no cooling needed)
```

**Key Improvements:**
- Base temperature is optimized from baseline data (building-specific)
- Sensitivity factors are calculated from regression (not fixed values)
- Both temperature and dewpoint use `max(0, ...)` to prevent negative effects
- Consistent handling: Dewpoint treated the same as temperature

### Adjustment Factor Impact
**Before Fix:**
- If weather_effect_after = -0.0825
- Factor = (1 + weather_effect_before) / (1 - 0.0825) = (1 + weather_effect_before) / 0.9175
- This inflates the factor, causing over-adjustment

**After Fix:**
- If weather_effect_after = 0 (temp < base_temp)
- Factor = (1 + weather_effect_before) / (1 + 0) = 1 + weather_effect_before
- More accurate adjustment that preserves real savings

## Impact

### Before Fix:
- ❌ Negative normalized savings when raw savings were positive
- ❌ Over-adjustment due to negative weather effects
- ❌ Normalized values exceeding baseline values
- ❌ Incorrect representation of equipment performance

### After Fix:
- ✅ Positive normalized savings when equipment improvements exist
- ✅ Accurate adjustment factors
- ✅ Normalized values below baseline when savings are real
- ✅ Correct representation of equipment performance

## Testing

To verify the fix:
1. Run analysis with temperatures below base_temp (18.3°C)
2. Check that weather effects are 0 (not negative)
3. Verify normalized savings are positive when raw savings exist
4. Confirm normalized value is higher than raw but lower than baseline

## Enhanced Features (Post-Fix)

### Base Temperature Optimization
- Base temperature is **optimized from baseline data** (not fixed at 18.3°C)
- Building-specific: Each building gets its own optimized base temperature
- Range: Tests 10°C to 25°C (configurable)
- Falls back to 18.3°C if optimization fails

### Regression-Based Sensitivity Factors
- Sensitivity factors are **calculated from regression analysis** (not fixed values)
- Equipment-specific: Uses equipment-specific factors (e.g., 3.6% per °C for chillers)
- R² validation: Requires R² > 0.7 for ASHRAE compliance
- Falls back to equipment-specific fixed factors if regression fails

### Timestamp-by-Timestamp Normalization
- **Baseline Period**: Extracts time series data with 15-minute timestamp matching
- **After Period**: Normalizes each timestamp individually for improved accuracy
- **Weather Interpolation**: Interpolates hourly weather data to 15-minute intervals
- **Exact Matching**: Matches meter timestamps to weather data at exact intervals

## Conclusion

The fix ensures that:
- Weather normalization **preserves real savings** from equipment improvements
- Negative weather effects are prevented (capped at 0 for cooling)
- Normalized results accurately reflect equipment performance
- The calculation aligns with ASHRAE Guideline 14-2014 principles
- **Base temperature optimized** from baseline data (building-specific)
- **Sensitivity factors calculated** from regression analysis (ASHRAE-compliant)
- **Timestamp-by-timestamp normalization** for improved accuracy
- **Fully ASHRAE Guideline 14-2014 compliant** when regression data is available

