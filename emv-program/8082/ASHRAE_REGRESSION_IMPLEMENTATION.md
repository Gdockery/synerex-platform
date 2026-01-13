# ASHRAE-Compliant Regression Implementation

## Overview

This document describes the implementation of ASHRAE Guideline 14-2014 compliant regression-based weather normalization.

## Implementation Status

✅ **COMPLETED** - Regression-based sensitivity factor calculation and base temperature optimization are now implemented.

## Key Features

### 1. Base Temperature Optimization (NEW)

**Method**: `_optimize_base_temperature()`

- **Automatically calculates the optimal base temperature from baseline data**
- Uses grid search to find the base temperature that maximizes R²
- Implements change-point analysis to find the actual balance point
- Building-specific: Each building/equipment gets its own optimized base temperature
- Range: Tests base temperatures from 10°C to 25°C (configurable)
- Fallback: Uses 18.3°C (ASHRAE standard) if optimization fails

**Why This Matters:**
- Different buildings have different balance points where cooling/heating loads begin
- A fixed 18.3°C may not be accurate for all buildings (e.g., data centers, cold storage)
- Optimized base temperature improves normalization accuracy
- Fully data-driven approach aligns with ASHRAE principles

### 2. Regression-Based Sensitivity Calculation

**Method**: `calculate_sensitivity_from_regression()`

- Performs linear regression on baseline period time series data
- **First optimizes base temperature** (if `optimize_base_temp=True`)
- Calculates sensitivity factors from regression coefficients
- Validates with R² > 0.7 (ASHRAE requirement)
- Supports both temperature-only and temperature + dewpoint models

### 3. Timestamp-by-Timestamp Normalization (NEW)

**Method**: Enhanced `normalize_consumption()` with `after_energy_series`, `after_temp_series`, `after_dewpoint_series`

- **Automatically normalizes each timestamp in the "after" period individually**
- Uses the regression model from baseline period to normalize each 15-minute interval
- Captures intraday weather variations for improved accuracy
- Falls back to average-based normalization if time series data not available
- Still fully ASHRAE-compliant (uses baseline regression model)

**Why This Matters:**
- More accurate: Captures weather variations within the "after" period
- Better precision: Normalizes each timestamp individually, then aggregates
- More robust: Handles cases where weather varies significantly within the period
- ASHRAE-compliant: Uses the same baseline regression model (enhanced implementation)

### 4. ASHRAE Compliance

**Requirements Met:**
- ✅ Sensitivity factors calculated from regression analysis
- ✅ **Base temperature optimized from baseline data** (NEW)
- ✅ R² validation (must be > 0.7)
- ✅ Building-specific calibration from actual meter data
- ✅ Statistical significance validation
- ✅ Proper formula structure (adjustment factor calculation)
- ✅ Falls back to 18.3°C (ASHRAE standard) if optimization fails

### 5. Fallback Mechanism

If regression fails or R² < 0.7:
- Falls back to equipment-specific fixed factors
- Logs warning about non-compliance
- Still performs normalization (just not fully ASHRAE-compliant)

If "after" time series data is not available:
- Falls back to average-based normalization (still ASHRAE-compliant)
- Uses average temp_after and dewpoint_after values

## Usage

### With Time Series Data (ASHRAE-Compliant)

```python
from main_hardened_ready_refactored import WeatherNormalizationML

# Initialize
normalizer = WeatherNormalizationML(equipment_type="chiller")

# Provide time series baseline data
baseline_energy = [63.5, 64.2, 65.1, 63.8, ...]  # kW values
baseline_temp = [22.1, 22.5, 23.0, 21.9, ...]     # Temperature (°C)
baseline_dewpoint = [19.2, 19.5, 20.1, 18.9, ...] # Dewpoint (°C)

# Normalize (regression will be performed automatically)
result = normalizer.normalize_consumption(
    temp_before=22.6,
    temp_after=21.1,
    dewpoint_before=19.4,
    dewpoint_after=17.9,
    kw_before=63.96,
    kw_after=59.68,
    baseline_energy_series=baseline_energy,
    baseline_temp_series=baseline_temp,
    baseline_dewpoint_series=baseline_dewpoint
)

# Check compliance
if result["ashrae_compliant"]:
    print(f"ASHRAE-compliant! R² = {result['regression_r2']:.3f}")
    print(f"Temp sensitivity: {result['regression_temp_sensitivity']*100:.2f}% per °C")
    if result.get("base_temp_optimized", False):
        print(f"Base temperature optimized: {result['optimized_base_temp']:.1f}°C")
    else:
        print(f"Base temperature: {result['base_temp_celsius']:.1f}°C (default)")
    if result.get("timestamp_normalization_used", False):
        print("Timestamp-by-timestamp normalization used (enhanced accuracy)")
else:
    print("Using fixed factors (not fully ASHRAE-compliant)")
```

### With Timestamp-by-Timestamp Normalization (Enhanced)

```python
# Provide time series data for both baseline and "after" periods
baseline_energy = [63.5, 64.2, 65.1, 63.8, ...]  # Baseline kW values
baseline_temp = [22.1, 22.5, 23.0, 21.9, ...]     # Baseline temperature (°C)
baseline_dewpoint = [19.2, 19.5, 20.1, 18.9, ...] # Baseline dewpoint (°C)

after_energy = [59.2, 58.8, 60.1, 59.5, ...]      # After period kW values
after_temp = [21.1, 20.8, 21.5, 20.9, ...]        # After period temperature (°C)
after_dewpoint = [17.9, 17.5, 18.2, 17.8, ...]    # After period dewpoint (°C)

# Normalize with timestamp-by-timestamp normalization
result = normalizer.normalize_consumption(
    temp_before=22.6,
    temp_after=21.1,
    dewpoint_before=19.4,
    dewpoint_after=17.9,
    kw_before=63.96,
    kw_after=59.68,
    baseline_energy_series=baseline_energy,
    baseline_temp_series=baseline_temp,
    baseline_dewpoint_series=baseline_dewpoint,
    after_energy_series=after_energy,      # NEW: After period time series
    after_temp_series=after_temp,          # NEW: After period temperature
    after_dewpoint_series=after_dewpoint   # NEW: After period dewpoint
)

# Check if timestamp normalization was used
if result.get("timestamp_normalization_used", False):
    print("Enhanced: Timestamp-by-timestamp normalization applied")
    print(f"Normalized {len(after_energy)} timestamps individually")
```

### Without Time Series Data (Fallback)

```python
# If time series data is not provided, uses fixed factors
result = normalizer.normalize_consumption(
    temp_before=22.6,
    temp_after=21.1,
    dewpoint_before=19.4,
    dewpoint_after=17.9,
    kw_before=63.96,
    kw_after=59.68
    # No time series data - will use fixed factors
)

# result["ashrae_compliant"] will be False
```

## Regression Model

### Temperature + Dewpoint Model (Preferred)

```
Energy = β₀ + β₁ × CDD + β₂ × HDD
```

Where:
- `CDD = max(0, Temperature - base_temp)` (Cooling Degree Days)
- `HDD = max(0, Dewpoint - base_temp)` (Humidity Degree Days)
- `base_temp` = Optimized from baseline data (typically 10-25°C, defaults to 18.3°C if optimization fails)
- `β₁` = Temperature coefficient
- `β₂` = Dewpoint coefficient

**Sensitivity Factors:**
- `temp_sensitivity = β₁ / mean_energy`
- `dewpoint_sensitivity = β₂ / mean_energy`

### Temperature-Only Model (Fallback)

```
Energy = β₀ + β₁ × CDD
```

**Sensitivity Factors:**
- `temp_sensitivity = β₁ / mean_energy`
- `dewpoint_sensitivity = temp_sensitivity × 0.6` (estimated)

## Validation

### R² Validation

- **Minimum R²**: 0.7 (per ASHRAE Guideline 14-2014)
- If R² < 0.7: Falls back to fixed factors
- If R² >= 0.7: Uses regression-calculated factors

### Data Requirements

- **Minimum data points**: 10 valid data points
- **Data quality**: Removes NaN and invalid values
- **Alignment**: Energy and temperature data must be aligned by timestamp

### Timestamp Matching and Interpolation

**15-Minute Interval Matching (Implemented)**

The system automatically detects meter data intervals and matches weather data at the same granularity:

1. **Automatic Interval Detection**: 
   - Analyzes meter timestamps to detect the data interval (typically 15 minutes for utility meters)
   - Uses the most common time difference between consecutive readings
   - Logs detected interval for debugging

2. **Weather Data Interpolation**: 
   - Open-Meteo API provides hourly weather data (not 15-minute)
   - System automatically interpolates hourly weather to 15-minute intervals using linear interpolation
   - Example: If 12:00 = 25°C and 13:00 = 27°C:
     - 12:00 = 25.0°C
     - 12:15 = 25.5°C (interpolated)
     - 12:30 = 26.0°C (interpolated)
     - 12:45 = 26.5°C (interpolated)
     - 13:00 = 27.0°C

3. **Exact Timestamp Matching**:
   - Matches meter timestamps to interpolated weather data at exact intervals
   - Ensures Day 1 12:00 meter data matches Day 1 12:00 weather (not Day 1 11:45 or 12:15)
   - Preserves time-of-day relationships critical for accurate regression
   - Falls back to closest match within meter interval window if exact match not found

4. **Benefits**:
   - **4x More Data Points**: 96/day (15-min) vs 24/day (hourly) for regression
   - **Better Accuracy**: Captures short-term temperature variations
   - **ASHRAE Compliance**: More data points improve R² and statistical validity
   - **Utility Standard Alignment**: Matches typical 15-minute demand intervals

**Why This Matters**:
- If Day 1 stays hotter longer than Day 2, exact timestamp matching captures this relationship
- Regression analysis: "At 12:00, when it's 25°C, energy is 68 kW" vs "At 12:00, when it's 22°C, energy is 65 kW"
- Without exact matching, time-of-day relationships are lost, reducing regression accuracy
- Preserves the relationship between temperature at specific times and energy consumption at those times

**Timestamp-by-Timestamp Normalization for "After" Period (NEW)**

When "after" time series data is provided, the system:

1. **Extracts "After" Time Series**: 
   - Reads meter CSV file for "after" period
   - Matches timestamps with weather data (same process as baseline)
   - Interpolates weather data to match meter intervals

2. **Individual Timestamp Normalization**:
   - For each timestamp in "after" period:
     - Calculates weather effects for that specific timestamp
     - Applies normalization: `normalized_kw_i = after_kw_i × (1 + weather_effect_before_ref) / (1 + weather_effect_after_i)`
     - Uses average "before" weather effects as reference

3. **Aggregation**:
   - Averages all normalized timestamps to get final `normalized_kw_after`
   - Provides more accurate normalization than average-based method

4. **Benefits**:
   - **Captures intraday variations**: Handles cases where weather changes significantly within the "after" period
   - **More accurate**: Each timestamp normalized individually, then aggregated
   - **Still ASHRAE-compliant**: Uses baseline regression model (enhanced implementation)
   - **Automatic fallback**: Uses average-based normalization if time series not available

## Result Dictionary

The `normalize_consumption()` method returns a dictionary with:

### ASHRAE Compliance Fields

- `ashrae_compliant`: `bool` - Whether regression was successful and R² >= 0.7
- `regression_r2`: `float` - R² value from regression (if regression was performed)
- `regression_temp_sensitivity`: `float` - Calculated temperature sensitivity (if regression was successful)
- `regression_dewpoint_sensitivity`: `float` - Calculated dewpoint sensitivity (if regression was successful)

### Base Temperature Optimization Fields (NEW)

- `base_temp_celsius`: `float` - Base temperature used for normalization (°C)
- `base_temp_optimized`: `bool` - Whether base temperature was optimized from baseline data
- `optimized_base_temp`: `float` - Optimized base temperature (°C), or `None` if not optimized

### Timestamp Normalization Fields (NEW)

- `timestamp_normalization_used`: `bool` - Whether timestamp-by-timestamp normalization was used for "after" period

### Standard Fields

- `method`: `str` - Description of normalization method used
- `normalized_kw_before`: `float` - Normalized baseline consumption
- `normalized_kw_after`: `float` - Normalized post-intervention consumption
- `weather_adjusted_savings`: `float` - Weather-normalized savings
- `temp_sensitivity_used`: `float` - Sensitivity factor actually used (regression or fixed)
- `dewpoint_sensitivity_used`: `float` - Dewpoint sensitivity factor actually used
- `standards_validation`: `str` - Compliance status message

## Integration with Analysis Pipeline

To enable ASHRAE-compliant normalization, the analysis pipeline needs to:

1. **Extract time series data** from raw meter CSV files
2. **Match with weather data** (temperature, dewpoint) for same time periods
3. **Pass time series to normalization** method

### Example Integration

```python
# In perform_comprehensive_analysis() or similar:

# 1. Read raw meter data CSV
baseline_energy_series = []
baseline_temp_series = []
baseline_dewpoint_series = []

# Parse CSV and extract time series
for row in baseline_csv_data:
    baseline_energy_series.append(row['kW'])
    baseline_temp_series.append(row['temp'])  # From weather service
    baseline_dewpoint_series.append(row['dewpoint'])  # From weather service

# 2. Pass to normalization
weather_norm_ml = WeatherNormalizationML(equipment_type=equipment_type)
results["weather_normalization"] = weather_norm_ml.normalize_consumption(
    config["temp_before"], config["temp_after"],
    dewpoint_before, dewpoint_after,
    kw_before, kw_after,
    baseline_energy_series=baseline_energy_series,
    baseline_temp_series=baseline_temp_series,
    baseline_dewpoint_series=baseline_dewpoint_series
)
```

## Logging

The implementation provides detailed logging:

- **Regression success**: Logs R², sensitivity factors, model equation
- **Regression failure**: Logs reason (R² too low, insufficient data, etc.)
- **Fallback**: Logs when falling back to fixed factors

## Implementation Details

### Time Series Extraction

The `_extract_time_series_for_regression()` function:

1. **Reads meter CSV files** and identifies timestamp and energy columns
2. **Detects meter interval** by analyzing time differences between readings
3. **Fetches weather data** with hourly granularity from Open-Meteo API
4. **Interpolates weather** from hourly to meter interval (e.g., 15-minute) using linear interpolation
5. **Matches timestamps** at exact intervals (e.g., Day 1 12:00 meter → Day 1 12:00 weather)
6. **Returns aligned series** for regression analysis

### Weather Service Integration

- Weather service (`8085/weather_service.py`) supports `include_hourly=True` parameter
- When enabled, fetches hourly weather data from Open-Meteo Archive API
- Returns `hourly_data` array with temperature and dewpoint at hourly intervals
- Main application interpolates this to match meter data intervals

## Next Steps

1. ✅ **Time series extraction** - Implemented in `_extract_time_series_for_regression()`
2. ✅ **CSV parsing** - Implemented with automatic column detection
3. ✅ **Weather data matching** - Implemented with 15-minute interpolation and exact timestamp matching
4. ✅ **Regression analysis** - Implemented with R² validation
5. **Test with real data** - Verify R² values and sensitivity factors in production

## Compliance Status

| Requirement | Status |
|------------|--------|
| Regression analysis | ✅ Implemented |
| R² validation | ✅ Implemented (min 0.7) |
| Building-specific calibration | ✅ Implemented (when time series provided) |
| Formula structure | ✅ Compliant |
| Base temperature | ✅ Compliant (18.3°C) |
| No arbitrary limits | ✅ Compliant |
| Timestamp matching | ✅ Implemented (15-minute intervals) |
| Weather interpolation | ✅ Implemented (hourly to 15-minute) |
| Exact time-of-day matching | ✅ Implemented |

**Note**: Full ASHRAE compliance requires time series data to be provided. The system automatically:
- Detects meter data intervals (typically 15 minutes)
- Interpolates hourly weather to match meter intervals
- Matches timestamps at exact intervals for accurate regression
- Falls back to fixed factors only if regression fails or R² < 0.7

