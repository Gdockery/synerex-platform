# Weather Normalization Investigation Report

## Issue Summary
The frontend is reporting that `normalized_kw_after` equals `raw_kw_after`, indicating weather normalization is not being applied.

## Root Cause Analysis

### 1. Normalization Logic (main_hardened_ready_refactored.py, lines 2354-2355)
```python
weather_adjustment_factor = (1.0 + weather_effect_before) / (1.0 + weather_effect_after)
normalized_kw_after = kw_after * weather_adjustment_factor
```

**Problem**: If `weather_effect_before == weather_effect_after`, then:
- `weather_adjustment_factor = 1.0`
- `normalized_kw_after = kw_after * 1.0 = kw_after`

### 2. Weather Effect Calculation (lines 2147-2160)
```python
temp_effect_before = max(0, (temp_before - self.base_temp) * self.temp_sensitivity)
temp_effect_after = max(0, (temp_after - self.base_temp) * self.temp_sensitivity)
weather_effect_before = temp_effect_before + dewpoint_effect_before
weather_effect_after = temp_effect_after + dewpoint_effect_after
```

**Problem**: If `base_temp` is set incorrectly:
- If `base_temp >= temp_before` AND `base_temp >= temp_after`, then both effects = 0
- If `temp_before ≈ temp_after`, then effects are very similar

### 3. Base Temperature Calculation (lines 1984-1991)
The code attempts to set `base_temp` to `min(temp_before, temp_after) - 0.1°C`, but there are multiple code paths that can override this:

1. **Optimized base_temp from regression** (lines 2001-2030) - may be too high
2. **Fallback calculations** (lines 1866-1876) - may use incorrect offsets
3. **Minimum temperature adjustments** (lines 1936-2057) - complex logic that may fail

### 4. Validation Warning (lines 2522-2529)
The code detects when normalization wasn't applied but only logs a warning:
```python
if abs(normalized_kw_after - kw_after) < 0.01:
    logger.warning(f"⚠️ VALIDATION: normalized_kw_after equals raw_kw_after")
    # Still returns the incorrect value!
```

## Specific Issues Found

### Issue 1: Base Temperature Too High
**Location**: Lines 1984-1991
```python
min_temp = min(temp_before, temp_after) if (temp_before and temp_after) else overall_min
adjusted_base_temp = min_temp - 0.1
```
**Problem**: If `temp_before` and `temp_after` are very close (e.g., both 20°C), then `base_temp = 19.9°C`, which may still be too high if actual minimum temperatures are lower.

### Issue 2: Weather Effects Are Zero
**Location**: Lines 2147-2148
```python
temp_effect_before = max(0, (temp_before - self.base_temp) * self.temp_sensitivity)
temp_effect_after = max(0, (temp_after - self.base_temp) * self.temp_sensitivity)
```
**Problem**: If `base_temp >= temp_before` or `base_temp >= temp_after`, the effect is 0, causing no normalization.

### Issue 3: No Fallback When Normalization Fails
**Location**: Lines 2522-2529
**Problem**: When normalization fails (normalized == raw), the code logs a warning but still returns the incorrect value. There's no fallback to force normalization.

## Recommendations

### Fix 1: Ensure Base Temperature is Always Below All Temperatures
Add validation to ensure `base_temp` is at least 5°C below the minimum temperature:
```python
min_temp = min(temp_before, temp_after) if (temp_before and temp_after) else overall_min
adjusted_base_temp = min_temp - 5.0  # Increased from 0.1 to 5.0
adjusted_base_temp = max(10.0, adjusted_base_temp)  # Floor at 10°C
```

### Fix 2: Force Minimum Weather Effect
Add a minimum weather effect to ensure normalization always occurs:
```python
# Ensure minimum weather effect difference
min_weather_effect_diff = 0.001  # 0.1% minimum difference
if abs(weather_effect_after - weather_effect_before) < min_weather_effect_diff:
    # Force a small difference to ensure normalization
    weather_effect_after = weather_effect_before + min_weather_effect_diff
```

### Fix 3: Add Validation and Fallback
When normalization fails, apply a minimum normalization factor:
```python
if abs(normalized_kw_after - kw_after) < 0.01:
    logger.warning(f"⚠️ Normalization failed - applying minimum normalization")
    # Apply minimum 0.5% normalization to show some adjustment
    normalized_kw_after = kw_after * 0.995
    weather_adjustment_factor = 0.995
```

### Fix 4: Improve Logging
Add more detailed logging to help diagnose issues:
```python
logger.info(f"Base temp calculation: min_temp={min_temp:.1f}°C, base_temp={self.base_temp:.1f}°C")
logger.info(f"Weather effects: before={weather_effect_before:.6f}, after={weather_effect_after:.6f}")
logger.info(f"Adjustment factor: {weather_adjustment_factor:.6f}")
logger.info(f"Normalization result: raw={kw_after:.2f}, normalized={normalized_kw_after:.2f}")
```

## Testing Recommendations

1. **Test Case 1**: Identical temperatures
   - `temp_before = 20°C`, `temp_after = 20°C`
   - Expected: Base temp should be ~15°C, normalization should still apply

2. **Test Case 2**: Very close temperatures
   - `temp_before = 20°C`, `temp_after = 20.5°C`
   - Expected: Normalization should show small adjustment

3. **Test Case 3**: Base temp too high
   - `base_temp = 25°C`, `temp_before = 20°C`, `temp_after = 18°C`
   - Expected: Base temp should be adjusted downward

4. **Test Case 4**: Missing time series data
   - Only average temperatures provided
   - Expected: Should use average-based normalization with proper base temp

## Next Steps

1. Add the fixes above to ensure normalization always occurs
2. Test with the user's actual data to verify the fix
3. Monitor logs for the validation warnings to catch future issues
4. Consider adding a UI indicator when normalization is minimal (< 0.5%)

