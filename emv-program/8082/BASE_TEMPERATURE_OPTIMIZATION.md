# Base Temperature Optimization

## Overview

The weather normalization system now **automatically optimizes the base temperature** from baseline ("before") data. This ensures that the base temperature reflects the actual balance point where cooling/heating loads begin for each specific building/equipment, rather than using a fixed value.

## Why This Matters

### The Problem with Fixed Base Temperature

**Traditional Approach:**
- Uses fixed base temperature: 18.3°C (65°F) for all buildings
- Assumes all buildings have the same balance point
- May not be accurate for:
  - Data centers (require cooling year-round)
  - Cold storage facilities (different balance points)
  - Buildings with unusual HVAC systems
  - Buildings in extreme climates

**Example:**
- Building A: Actually needs cooling at 15°C (data center)
- Building B: Needs cooling at 20°C (well-insulated office)
- Fixed 18.3°C: Inaccurate for both buildings

### The Solution: Data-Driven Base Temperature

**New Approach:**
- **Optimizes base temperature from baseline data**
- Finds the temperature where energy consumption starts to increase
- Building-specific: Each building gets its own optimized base temperature
- More accurate normalization results

## How It Works

### 1. Grid Search Optimization

The system tests different base temperatures and selects the one that maximizes R²:

```python
# Tests base temperatures from 10°C to 25°C (default range)
for candidate_base in [10.0, 10.5, 11.0, ..., 25.0]:
    # Calculate degree days: CDD = max(0, temp - candidate_base)
    cdd = max(0, temp - candidate_base)
    
    # Run regression: Energy = β₀ + β₁ × CDD
    r2 = calculate_r2(energy, cdd)
    
    # Track best result
    if r2 > best_r2:
        best_base_temp = candidate_base
        best_r2 = r2
```

### 2. Change-Point Analysis

The optimization implements **change-point analysis**:
- Finds the temperature where the energy-temperature relationship changes
- Identifies the actual balance point for cooling/heating loads
- Uses statistical methods (R² maximization) to find the optimal point

### 3. Automatic Integration

The optimization is **automatically performed** when:
- Time series baseline data is provided
- `calculate_sensitivity_from_regression()` is called
- `optimize_base_temp=True` (default)

## Implementation Details

### Method: `_optimize_base_temperature()`

**Parameters:**
- `baseline_energy`: List of energy/kW values from baseline period
- `baseline_temp`: List of temperature values (°C) from baseline period
- `baseline_dewpoint`: Optional list of dewpoint values (°C)
- `min_base_temp`: Minimum base temperature to test (default 10°C)
- `max_base_temp`: Maximum base temperature to test (default 25°C)
- `step`: Step size for grid search (default 0.5°C)

**Returns:**
- `success`: Whether optimization was successful
- `optimized_base_temp`: Optimal base temperature (°C)
- `best_r2`: R² value at optimal base temperature
- `method`: Description of method used

### Integration with Regression

The optimization is performed **before** sensitivity factor calculation:

```python
# Step 1: Optimize base temperature
base_opt_result = self._optimize_base_temperature(
    baseline_energy, baseline_temp, baseline_dewpoint
)

# Step 2: Calculate sensitivity factors using optimized base
regression_result = self.calculate_sensitivity_from_regression(
    baseline_energy, baseline_temp, baseline_dewpoint
)
```

## Benefits

### 1. Improved Accuracy

- **Building-specific balance points**: Each building gets its own optimized base
- **Better normalization**: More accurate weather adjustments
- **Reduced errors**: Eliminates assumptions about balance points

### 2. ASHRAE Compliance

- **Data-driven approach**: Aligns with ASHRAE Guideline 14-2014 principles
- **Building-specific calibration**: Uses actual building data, not assumptions
- **Statistical validation**: R² maximization ensures best fit

### 3. Automatic Handling

- **No manual configuration**: Automatically optimizes from baseline data
- **Fallback mechanism**: Uses 18.3°C if optimization fails
- **Transparent**: Results include optimization status and optimized base temperature

## Example Results

### Before Optimization

```python
# Fixed base temperature: 18.3°C
base_temp = 18.3
# May not be accurate for this building
```

### After Optimization

```python
# Optimized base temperature: 15.2°C
base_temp = 15.2  # Calculated from baseline data
base_temp_optimized = True
optimized_base_temp = 15.2
# Reflects actual balance point for this building
```

## Result Dictionary Fields

The normalization results now include:

```python
{
    "base_temp_celsius": 15.2,           # Optimized base temperature
    "base_temp_optimized": True,          # Whether optimization was performed
    "optimized_base_temp": 15.2,          # Optimized value (or None if not optimized)
    # ... other fields ...
}
```

## Fallback Behavior

If optimization fails:
- Uses default 18.3°C (ASHRAE standard)
- Logs warning about optimization failure
- Continues with sensitivity factor calculation
- Still performs normalization (just not with optimized base)

## Configuration

### Disable Optimization

To use fixed base temperature (18.3°C):

```python
regression_result = normalizer.calculate_sensitivity_from_regression(
    baseline_energy,
    baseline_temp,
    baseline_dewpoint,
    optimize_base_temp=False  # Disable optimization
)
```

### Custom Range

To customize the optimization range:

```python
# Modify _optimize_base_temperature() parameters
base_opt_result = normalizer._optimize_base_temperature(
    baseline_energy,
    baseline_temp,
    baseline_dewpoint,
    min_base_temp=12.0,  # Custom minimum
    max_base_temp=22.0,  # Custom maximum
    step=0.25            # Finer step size
)
```

## Technical Notes

### Grid Search Algorithm

- **Range**: 10°C to 25°C (configurable)
- **Step size**: 0.5°C (configurable)
- **Total candidates**: ~30 base temperatures tested
- **Selection criteria**: Maximum R² value

### Performance

- **Time complexity**: O(n × m) where n = data points, m = candidates
- **Typical execution**: < 1 second for 1000 data points
- **Optimization**: Can be disabled if performance is critical

### Validation

- **Minimum data points**: 10 valid data points required
- **R² validation**: Must find at least one valid model (R² > 0)
- **Fallback**: Uses default 18.3°C if no valid models found

## Related Documentation

- `ASHRAE_REGRESSION_IMPLEMENTATION.md`: Full regression implementation details
- `ASHRAE_COMPLIANCE_ISSUE.md`: ASHRAE compliance status
- `README.md`: System overview

