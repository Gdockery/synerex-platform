# Sample Variables Analysis for Code Duplication Detection

## Selected Sample Variables

Based on initial analysis, I've identified these key variables to trace throughout the 31K-line file:

### 1. `weather_data` - Weather Data Processing
**Usage Pattern**: Fetched once, used in normalization
- **Line 110**: `def fetch_weather_data()` - WeatherServiceClient method
- **Line 16419**: `weather_data = weather_client.fetch_weather_data()` - Route handler
- **Line 16423**: `logger.info(f"Weather data fetched successfully: {weather_data}")` - Logging
- **Line 16428**: `"weather_data": weather_data,` - Response data

**Analysis**: Appears to be fetched once and passed through, but need to check if weather normalization happens multiple times.

### 2. `pf` (Power Factor) - Power Factor Calculations
**Usage Pattern**: Calculated/validated in multiple places
- **Line 8080-8086**: Power factor validation logic
- **Line 10554-10555**: `pf = data.get("avgPf", {}).get("mean", 0)` - Raw data extraction
- **Line 10571**: `calculated_pf = kw / kva` - Calculated from kw/kva
- **Line 11314**: Used in compliance check

**Analysis**: Power factor is both extracted from data AND calculated from kw/kva. Potential duplication.

### 3. `thd` (Total Harmonic Distortion) - THD Calculations
**Usage Pattern**: Computed in multiple contexts
- **Line 10555**: `thd = data.get("avgTHD", {}).get("mean", 0)` - Raw data extraction
- **Line 8184**: `thd = sum(harmonic_spectrum.values()) / 100.0` - Calculated from harmonics
- **Line 11314**: Used in compliance check

**Analysis**: THD is both extracted from data AND calculated from harmonic spectrum. Clear duplication.

### 4. `cv` (Coefficient of Variation) - Statistical Analysis
**Usage Pattern**: Calculated in multiple statistical contexts
- **Line 3651**: `normalized_cv = (...)` - Normalization calculation
- **Line 3757**: `cv = (...)` - Another calculation
- **Line 7858-7862**: ASHRAE CV threshold calculation
- **Line 8867-8891**: Multiple CV calculations in different contexts
- **Line 9053-9055**: Before/after CV metrics

**Analysis**: CV is calculated in at least 6 different places with similar logic. High duplication potential.

### 5. `html_content` - Template String Manipulation
**Usage Pattern**: 364+ replace operations
- **Line 18352**: `html_content = html_content.replace(logo_placeholder, logo_html)`
- **Line 18368**: `html_content = html_content.replace("<head>", f"<head>{cache_bust_meta}")`
- **Lines 18430-18556**: Multiple dollar amount replacements
- **Total**: 364+ replace operations found

**Analysis**: Massive duplication in template string manipulation. Likely many redundant replacements.

## Additional Variables to Track

### 6. `config` - Configuration Data
**Usage Pattern**: Passed through multiple functions
- Used in validation, normalization, calculation functions
- May be modified/validated multiple times

### 7. `data` - Input Data Processing
**Usage Pattern**: Processed through multiple analysis pipelines
- Raw data extraction
- Validation
- Normalization
- Analysis

### 8. `results` - Analysis Results
**Usage Pattern**: Built up through multiple analysis steps
- May have redundant calculations
- Results may be overwritten

## Next Steps

1. **Trace each variable** through the complete data flow
2. **Identify transformation points** where variables are modified
3. **Flag redundant operations** where same calculation happens multiple times
4. **Document data flow** showing where duplications occur
5. **Prioritize by impact** - which duplications cause the most redundant work

## Initial Observations

- **Power Factor**: Both extracted from data AND calculated from kw/kva
- **THD**: Both extracted from data AND calculated from harmonic spectrum  
- **CV**: Calculated in at least 6 different places with similar logic
- **HTML Template**: 364+ replace operations suggest massive duplication
- **Weather Data**: Appears clean (fetched once, used once)

## Priority for Deep Analysis

1. **P0**: `cv` calculations (6+ similar calculations)
2. **P0**: `html_content` replacements (364+ operations)
3. **P1**: `pf` and `thd` (both extracted AND calculated)
4. **P2**: `config` and `data` processing pipelines
