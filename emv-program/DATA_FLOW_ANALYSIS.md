# Data Flow Analysis for Key Endpoints

## Overview
Traced data flow through `/api/analyze` and `/api/generate-report` endpoints to identify redundant operations and data processing duplications.

## /api/analyze Endpoint Data Flow

### 1. **Input Processing** (Lines 21757-21806)
**Operations**:
- Extract form data (before_file_id, after_file_id, manual_mode)
- Handle both JSON and form data
- File upload processing

**Duplication Issues**:
- Manual mode checking duplicated in multiple places
- File ID extraction logic repeated

### 2. **Data Validation** (Lines 11604-11617)
**Operations**:
- `DataValidation.validate_power_data(before_data)`
- `DataValidation.validate_power_data(after_data)`
- `DataValidation.validate_compliance_inputs(before_data, config)`

**Duplication Issues**:
- Power data validation called twice (before and after)
- Similar validation logic in multiple validation functions
- Config validation may overlap with power data validation

### 3. **Data Normalization** (Lines 11633-11641)
**Operations**:
- Input type checking and conversion
- Config normalization with fallback values
- Data structure standardization

**Duplication Issues**:
- Similar normalization logic in multiple places
- Config normalization may be redundant with validation

### 4. **Comprehensive Analysis** (Line 11592)
**Operations**:
- `perform_comprehensive_analysis(before_data, after_data, config)`
- Main analysis pipeline execution

**Duplication Issues**:
- Analysis function calls multiple sub-functions
- Each sub-function may perform similar operations

## /api/generate-report Endpoint Data Flow

### 1. **Input Processing** (Lines 16717-16760)
**Operations**:
- JSON data extraction
- Data structure validation
- Safe float conversion helper function

**Duplication Issues**:
- `safe_float()` helper function defined inline
- Similar data validation logic to analyze endpoint

### 2. **Report Generation** (Lines 16760+)
**Operations**:
- HTML template loading
- Data extraction and formatting
- Template variable replacement (364+ replacements)

**Duplication Issues**:
- Massive HTML template replacement (364+ operations)
- Similar data formatting logic in multiple places

## Data Processing Pipeline Analysis

### **Phase 1: Input Validation**
```
Raw Input → File Upload/JSON → Data Validation → Config Validation → Normalized Input
```

**Redundant Operations**:
- Multiple validation functions called on same data
- Similar validation logic in different functions
- Config validation may duplicate power data validation

### **Phase 2: Data Processing**
```
Normalized Input → Weather Normalization → Power Factor Normalization → Statistical Analysis → Network Loss Calculation
```

**Redundant Operations**:
- Weather data fetched and normalized multiple times
- Power factor calculated and validated multiple times
- Statistical calculations performed multiple times
- Network loss calculations duplicated

### **Phase 3: Report Generation**
```
Processed Data → HTML Template Loading → Template Variable Replacement → Final Report
```

**Redundant Operations**:
- 364+ HTML template replacements
- Similar data formatting in multiple places
- Template variables processed multiple times

## Specific Duplication Patterns

### 1. **Data Validation Duplication**
```python
# Line 11604-11606: Multiple validation calls
before_validation = DataValidation.validate_power_data(before_data)
after_validation = DataValidation.validate_power_data(after_data)
config_validation = DataValidation.validate_compliance_inputs(before_data, config)

# Similar validation logic in:
# - validate_power_factor() (Line 1750)
# - validate_power_relationship() (Line 1768)
# - validate_data_quality() (Line 7888)
```

### 2. **Weather Data Processing Duplication**
```python
# Weather data fetched in analyze endpoint
weather_data = weather_client.fetch_weather_data(...)

# Then normalized in multiple places:
# - WeatherNormalization.normalize_consumption() (Line 2322)
# - OccupancyScheduleNormalizer.normalize_energy_data() (Line 3606)
# - WeatherNormalization.verify_weather_normalization() (Line 6253)
```

### 3. **Power Factor Calculation Duplication**
```python
# Power factor calculated in analyze endpoint
pf = data.get("avgPf", {}).get("mean", 0)
calculated_pf = kw / kva

# Then processed in multiple places:
# - validate_power_factor() (Line 1750)
# - normalize_power_factor() (Line 7975)
# - calculate_power_factor_improvement() (Line 17163)
```

### 4. **Statistical Calculation Duplication**
```python
# Statistical calculations in analyze endpoint
# Then recalculated in multiple places:
# - calculate_uncertainty() (Line 7738)
# - calculate_combined_uncertainty() (Line 9308)
# - calculate_savings_uncertainty() (Line 9320)
```

### 5. **HTML Template Processing Duplication**
```python
# 364+ template replacements in generate-report endpoint
html_content = html_content.replace("{{VARIABLE}}", value)
html_content = html_content.replace("$XXXX", f"${variable:,.2f}")
# ... 362 more replacements
```

## Data Flow Issues Identified

### **P0 Critical**: Redundant Data Processing
1. **Weather data fetched once but normalized multiple times**
2. **Power factor calculated multiple times with same logic**
3. **Statistical calculations performed multiple times**
4. **Network loss calculations duplicated**

### **P1 High**: Validation Overlap
1. **Multiple validation functions called on same data**
2. **Similar validation logic in different functions**
3. **Config validation may duplicate power data validation**

### **P2 Medium**: Template Processing Redundancy
1. **364+ HTML template replacements**
2. **Similar data formatting in multiple places**
3. **Template variables processed multiple times**

### **P3 Low**: Helper Function Duplication
1. **safe_float() helper defined inline**
2. **Similar data conversion logic in multiple places**
3. **Repeated error handling patterns**

## Refactoring Recommendations

### 1. **Create Unified Data Processing Pipeline**
```python
class DataProcessingPipeline:
    def __init__(self):
        self.validator = DataValidator()
        self.normalizer = DataNormalizer()
        self.calculator = DataCalculator()
        self.cache = ProcessingCache()
    
    def process_data(self, before_data, after_data, config):
        """Unified data processing pipeline"""
        # Validate data once
        validated_data = self.validator.validate_all(before_data, after_data, config)
        
        # Normalize data once
        normalized_data = self.normalizer.normalize_all(validated_data)
        
        # Calculate results once
        results = self.calculator.calculate_all(normalized_data)
        
        # Cache results to avoid recalculation
        self.cache.store_results(results)
        
        return results
```

### 2. **Implement Processing Result Cache**
```python
class ProcessingCache:
    def __init__(self):
        self.cache = {}
    
    def get_weather_data(self, address, dates):
        """Cache weather data to avoid multiple fetches"""
        cache_key = f"weather_{address}_{dates}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        # Fetch and cache weather data
    
    def get_power_factor(self, kw, kva):
        """Cache power factor calculations"""
        cache_key = f"pf_{kw}_{kva}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        # Calculate and cache power factor
    
    def get_statistical_analysis(self, data):
        """Cache statistical calculations"""
        cache_key = f"stats_{hash(str(data))}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        # Calculate and cache statistical analysis
```

### 3. **Create Template Processing Helper**
```python
class TemplateProcessor:
    def __init__(self):
        self.template_vars = {}
    
    def set_template_variables(self, variables):
        """Set all template variables at once"""
        self.template_vars.update(variables)
    
    def process_template(self, html_content):
        """Process template with all variables in one pass"""
        for placeholder, value in self.template_vars.items():
            html_content = html_content.replace(placeholder, str(value))
        return html_content
```

### 4. **Eliminate Redundant Validation**
```python
class UnifiedValidator:
    def validate_all(self, before_data, after_data, config):
        """Single validation pass for all data"""
        validation_results = {
            'before_data': self.validate_power_data(before_data),
            'after_data': self.validate_power_data(after_data),
            'config': self.validate_config(config),
            'combined': self.validate_combined(before_data, after_data, config)
        }
        return validation_results
```

## Impact Assessment

### **Performance Impact**: HIGH
- Same data processed multiple times
- No caching of intermediate results
- O(n*m) complexity where n=data size, m=processing functions
- 364+ HTML template replacements per report

### **Data Integrity Impact**: MEDIUM
- Multiple processing steps may introduce inconsistencies
- No validation of processing consistency
- Potential for data corruption due to multiple transformations

### **Maintainability Impact**: HIGH
- Data processing logic scattered throughout file
- Difficult to modify processing pipeline
- No clear separation of concerns
- Duplicate logic in multiple places

## Priority Fixes

### **Immediate (P0)**:
1. Implement processing result cache
2. Eliminate redundant data processing
3. Create unified data processing pipeline

### **Short-term (P1)**:
1. Consolidate validation functions
2. Create template processing helper
3. Add processing consistency validation

### **Medium-term (P2)**:
1. Refactor into specialized processing classes
2. Implement comprehensive error handling
3. Add processing result validation

## Next Steps

1. **Map complete data flow** through all processing functions
2. **Identify which processing steps are actually needed**
3. **Create unified processing pipeline with caching**
4. **Implement template processing helper**
5. **Test with sample data to ensure no regressions**

## Data Flow Diagram

```
Input Data
    ↓
Input Validation (DUPLICATE)
    ↓
Data Normalization (DUPLICATE)
    ↓
Weather Processing (DUPLICATE)
    ↓
Power Factor Calculation (DUPLICATE)
    ↓
Statistical Analysis (DUPLICATE)
    ↓
Network Loss Calculation (DUPLICATE)
    ↓
Report Generation (364+ REPLACEMENTS)
    ↓
Final Output
```

**Issues**:
- Each step may process same data multiple times
- No caching of intermediate results
- Multiple validation and normalization steps
- Massive template processing overhead
