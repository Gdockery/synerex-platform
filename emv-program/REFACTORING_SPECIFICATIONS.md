# Detailed Refactoring Specifications

## Overview
This document provides detailed specifications for refactoring each identified duplication in the main Python file.

## P0 Critical Duplications - Immediate Fixes

### 1. **Exact Duplicate Functions**

#### **Chart Generation Functions (4 duplicates)**
**Current State**:
```python
# Line 9109
def generate_envelope_chart_png(data, config):
    return "Chart generation not implemented"

# Line 9115  
def generate_confidence_interval_chart_png(data, config):
    return "Chart generation not implemented"

# Line 9121
def generate_smoothing_index_chart_png(data, config):
    return "Chart generation not implemented"

# Line 9127
def _generate_error_chart(data, config):
    return "Chart generation not implemented"
```

**Refactoring Specification**:
```python
# Keep only one function
def generate_chart_png(data, config, chart_type="envelope"):
    """Unified chart generation function"""
    if chart_type not in ["envelope", "confidence_interval", "smoothing_index", "error"]:
        raise ValueError(f"Invalid chart type: {chart_type}")
    return "Chart generation not implemented"

# Update all call sites
# OLD: generate_envelope_chart_png(data, config)
# NEW: generate_chart_png(data, config, "envelope")
```

**Migration Steps**:
1. Create unified function
2. Update all call sites (4 locations)
3. Remove duplicate functions
4. Test chart generation functionality

**Risk**: Low - All functions are identical
**Effort**: 2 hours

#### **Money Formatting Functions (2 duplicates)**
**Current State**:
```python
# Line 1364
def _fallback_money(value, currency_code=None):
    if value is None:
        return "$0.00"
    try:
        return f"${float(value):,.2f}"
    except (ValueError, TypeError):
        return "$0.00"

# Line 26338
def money(value, currency_code=None):
    if value is None:
        return "$0.00"
    try:
        return f"${float(value):,.2f}"
    except (ValueError, TypeError):
        return "$0.00"
```

**Refactoring Specification**:
```python
# Keep only money function
def money(value, currency_code=None):
    """Format value as currency"""
    if value is None:
        return "$0.00"
    try:
        return f"${float(value):,.2f}"
    except (ValueError, TypeError):
        return "$0.00"

# Remove _fallback_money function
# Update all call sites
# OLD: _fallback_money(value, currency_code)
# NEW: money(value, currency_code)
```

**Migration Steps**:
1. Update all call sites (2 locations)
2. Remove `_fallback_money` function
3. Test money formatting functionality

**Risk**: Low - Functions are identical
**Effort**: 1 hour

### 2. **HTML Template Processing (364 replacements)**

**Current State**:
```python
# Lines 18352-29567
html_content = html_content.replace("{{VARIABLE1}}", value1)
html_content = html_content.replace("{{VARIABLE2}}", value2)
# ... 362 more replacements
```

**Refactoring Specification**:
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
    
    def add_variable(self, placeholder, value):
        """Add single template variable"""
        self.template_vars[placeholder] = value

# Usage
def _generate_report():
    template_processor = TemplateProcessor()
    
    # Set all variables at once
    template_processor.set_template_variables({
        "{{VARIABLE1}}": value1,
        "{{VARIABLE2}}": value2,
        # ... all 364 variables
    })
    
    # Process template in one pass
    html_content = template_processor.process_template(html_content)
    return html_content
```

**Migration Steps**:
1. Create TemplateProcessor class
2. Extract all template variables into dictionary
3. Replace 364 individual replacements with single call
4. Test template processing functionality

**Risk**: Medium - Template processing is critical
**Effort**: 8 hours

## P1 High Priority Duplications - Short-term Fixes

### 3. **ASHRAE Baseline Model Functions (6 similar functions)**

**Current State**:
```python
# Line 2897
def _fit_3p_cooling(self, data):
    # 80+ lines of cooling-specific logic

# Line 2980  
def _fit_3p_heating(self, data):
    # 80+ lines of heating-specific logic

# Line 3208
def _fit_4p_linear_cooling(self, data):
    # 80+ lines of cooling-specific logic

# Line 3293
def _fit_4p_linear_heating(self, data):
    # 80+ lines of heating-specific logic

# Line 3063
def _fit_5p_combined(self, data):
    # 90+ lines of combined logic

# Line 3378
def _fit_6p_combined_linear(self, data):
    # 90+ lines of combined logic
```

**Refactoring Specification**:
```python
def fit_baseline(self, data, model_type="3p_cooling", **kwargs):
    """Unified baseline fitting function"""
    # Common validation
    if not data or len(data) < 3:
        raise ValueError("Insufficient data for baseline fitting")
    
    # Extract common parameters
    temperature = data.get('temperature', [])
    energy = data.get('energy', [])
    
    # Model-specific logic
    if model_type == "3p_cooling":
        return self._fit_3p_cooling_impl(temperature, energy, **kwargs)
    elif model_type == "3p_heating":
        return self._fit_3p_heating_impl(temperature, energy, **kwargs)
    elif model_type == "4p_linear_cooling":
        return self._fit_4p_linear_cooling_impl(temperature, energy, **kwargs)
    elif model_type == "4p_linear_heating":
        return self._fit_4p_linear_heating_impl(temperature, energy, **kwargs)
    elif model_type == "5p_combined":
        return self._fit_5p_combined_impl(temperature, energy, **kwargs)
    elif model_type == "6p_combined_linear":
        return self._fit_6p_combined_linear_impl(temperature, energy, **kwargs)
    else:
        raise ValueError(f"Invalid model type: {model_type}")

def _fit_3p_cooling_impl(self, temperature, energy, **kwargs):
    """Implementation for 3-parameter cooling model"""
    # Extract common logic from _fit_3p_cooling
    # Remove duplicate code
    # Return model-specific results

# ... similar implementations for other models
```

**Migration Steps**:
1. Create unified fit_baseline function
2. Extract common logic into shared methods
3. Create model-specific implementations
4. Update all call sites (6 locations)
5. Remove old functions
6. Test baseline fitting functionality

**Risk**: Medium - Baseline fitting is complex
**Effort**: 16 hours

### 4. **Validation Functions (32 functions)**

**Current State**:
```python
# Line 1750
def validate_power_factor(pf: float) -> float:
    # Power factor validation logic

# Line 1768
def validate_power_relationship(kw: float, kva: float, kvar: float = None) -> dict:
    # Power relationship validation logic

# Line 3693
def validate_power_data(data: Dict) -> Dict:
    # Power data validation logic

# ... 29 more validation functions
```

**Refactoring Specification**:
```python
class UnifiedValidator:
    def __init__(self):
        self.validators = {
            'power_factor': self._validate_power_factor,
            'power_relationship': self._validate_power_relationship,
            'power_data': self._validate_power_data,
            # ... all validation types
        }
    
    def validate(self, validation_type, *args, **kwargs):
        """Unified validation interface"""
        if validation_type not in self.validators:
            raise ValueError(f"Unknown validation type: {validation_type}")
        return self.validators[validation_type](*args, **kwargs)
    
    def validate_all(self, before_data, after_data, config):
        """Validate all data types in one pass"""
        results = {}
        
        # Power factor validation
        if 'power_factor' in before_data:
            results['power_factor'] = self._validate_power_factor(before_data['power_factor'])
        
        # Power relationship validation
        if 'kw' in before_data and 'kva' in before_data:
            results['power_relationship'] = self._validate_power_relationship(
                before_data['kw'], before_data['kva'], before_data.get('kvar')
            )
        
        # ... other validations
        
        return results
    
    def _validate_power_factor(self, pf: float) -> float:
        """Power factor validation implementation"""
        # Extract common logic from validate_power_factor
        # Remove duplicate code
        # Return validation result
    
    # ... other validation implementations
```

**Migration Steps**:
1. Create UnifiedValidator class
2. Extract common validation logic
3. Create validation-specific implementations
4. Update all call sites (32 locations)
5. Remove old validation functions
6. Test validation functionality

**Risk**: Medium - Validation is critical for data integrity
**Effort**: 20 hours

### 5. **Calculation Functions (25+ functions)**

**Current State**:
```python
# Line 9603
def compute_network_losses(before_data: dict, after_data: dict, config: dict) -> dict:
    # Network loss calculation logic

# Line 9782
def compute_network_losses_multi(before_data, after_data, config):
    # Multi-feeder network loss calculation logic

# Line 12168
def calculate_system_losses(kw, kva, pf, thd, voltage=480):
    # System loss calculation logic

# ... 22+ more calculation functions
```

**Refactoring Specification**:
```python
class UnifiedCalculator:
    def __init__(self):
        self.calculators = {
            'network_losses': self._calculate_network_losses,
            'system_losses': self._calculate_system_losses,
            'uncertainty': self._calculate_uncertainty,
            # ... all calculation types
        }
        self.cache = CalculationCache()
    
    def calculate(self, calculation_type, *args, **kwargs):
        """Unified calculation interface"""
        if calculation_type not in self.calculators:
            raise ValueError(f"Unknown calculation type: {calculation_type}")
        
        # Check cache first
        cache_key = f"{calculation_type}_{hash(str(args))}_{hash(str(kwargs))}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        # Perform calculation
        result = self.calculators[calculation_type](*args, **kwargs)
        
        # Cache result
        self.cache[cache_key] = result
        return result
    
    def _calculate_network_losses(self, before_data, after_data, config, method="single"):
        """Unified network loss calculation"""
        if method == "single":
            return self._calculate_single_feeder_losses(before_data, after_data, config)
        elif method == "multi":
            return self._calculate_multi_feeder_losses(before_data, after_data, config)
        else:
            raise ValueError(f"Invalid method: {method}")
    
    def _calculate_single_feeder_losses(self, before_data, after_data, config):
        """Single feeder loss calculation implementation"""
        # Extract common logic from compute_network_losses
        # Remove duplicate code
        # Return calculation result
    
    # ... other calculation implementations

class CalculationCache:
    def __init__(self):
        self.cache = {}
    
    def get(self, key):
        return self.cache.get(key)
    
    def set(self, key, value):
        self.cache[key] = value
```

**Migration Steps**:
1. Create UnifiedCalculator class
2. Extract common calculation logic
3. Create calculation-specific implementations
4. Implement calculation result caching
5. Update all call sites (25+ locations)
6. Remove old calculation functions
7. Test calculation functionality

**Risk**: High - Calculations are critical for accuracy
**Effort**: 24 hours

## P2 Medium Priority Duplications - Medium-term Fixes

### 6. **Weather Functions (13 functions)**

**Current State**:
```python
# Line 110
def fetch_weather_data(self, address, before_start, before_end, after_start, after_end):
    # Weather service client logic

# Line 16211
def fetch_weather():
    # Weather API endpoint logic

# Line 16564
def _fetch_weather_from_api(address, before_dates, after_dates):
    # Direct API weather fetching logic

# ... 10 more weather functions
```

**Refactoring Specification**:
```python
class WeatherManager:
    def __init__(self):
        self.service_client = WeatherServiceClient()
        self.direct_api = OpenMeteoAPI()
        self.cache = WeatherCache()
    
    def fetch_weather_data(self, address, before_dates, after_dates, method="service"):
        """Unified weather data fetching"""
        # Check cache first
        cache_key = f"weather_{address}_{before_dates}_{after_dates}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        # Fetch weather data
        if method == "service":
            result = self.service_client.fetch_weather_data(address, before_dates, after_dates)
        elif method == "direct":
            result = self.direct_api.fetch_weather_data(address, before_dates, after_dates)
        else:
            raise ValueError(f"Invalid method: {method}")
        
        # Cache result
        self.cache[cache_key] = result
        return result
    
    def normalize_weather_data(self, weather_data, normalization_type="basic"):
        """Unified weather data normalization"""
        if normalization_type == "basic":
            return self._basic_normalization(weather_data)
        elif normalization_type == "enhanced":
            return self._enhanced_normalization(weather_data)
        else:
            raise ValueError(f"Invalid normalization type: {normalization_type}")
    
    def _basic_normalization(self, weather_data):
        """Basic weather normalization implementation"""
        # Extract common logic from weather normalization functions
        # Remove duplicate code
        # Return normalized data
    
    # ... other normalization implementations
```

**Migration Steps**:
1. Create WeatherManager class
2. Extract common weather logic
3. Implement weather data caching
4. Create normalization-specific implementations
5. Update all call sites (13 locations)
6. Remove old weather functions
7. Test weather functionality

**Risk**: Medium - Weather data is important for analysis
**Effort**: 12 hours

### 7. **Data Processing Pipeline**

**Current State**:
```python
# Multiple processing steps scattered throughout code
# No unified pipeline
# Duplicate processing in multiple places
```

**Refactoring Specification**:
```python
class DataProcessingPipeline:
    def __init__(self):
        self.validator = UnifiedValidator()
        self.normalizer = DataNormalizer()
        self.calculator = UnifiedCalculator()
        self.weather_manager = WeatherManager()
        self.cache = ProcessingCache()
    
    def process_data(self, before_data, after_data, config):
        """Unified data processing pipeline"""
        # Step 1: Validate data once
        validated_data = self.validator.validate_all(before_data, after_data, config)
        
        # Step 2: Normalize data once
        normalized_data = self.normalizer.normalize_all(validated_data)
        
        # Step 3: Process weather data once
        if 'weather_data' in normalized_data:
            weather_data = self.weather_manager.normalize_weather_data(
                normalized_data['weather_data']
            )
            normalized_data['weather_data'] = weather_data
        
        # Step 4: Calculate results once
        results = self.calculator.calculate_all(normalized_data)
        
        # Step 5: Cache results to avoid recalculation
        self.cache.store_results(results)
        
        return results
    
    def get_cached_result(self, data_key):
        """Get cached processing result"""
        return self.cache.get(data_key)
    
    def clear_cache(self):
        """Clear processing cache"""
        self.cache.clear()

class ProcessingCache:
    def __init__(self):
        self.cache = {}
    
    def store_results(self, results):
        """Store processing results in cache"""
        cache_key = self._generate_cache_key(results)
        self.cache[cache_key] = results
    
    def get(self, data_key):
        """Get cached result by key"""
        return self.cache.get(data_key)
    
    def clear(self):
        """Clear all cached results"""
        self.cache.clear()
    
    def _generate_cache_key(self, results):
        """Generate cache key for results"""
        return hash(str(results))
```

**Migration Steps**:
1. Create DataProcessingPipeline class
2. Integrate all processing components
3. Implement processing result caching
4. Update main processing functions
5. Test data processing functionality

**Risk**: High - Data processing is core functionality
**Effort**: 16 hours

## Implementation Timeline

### **Week 1: Immediate Fixes**
- Remove exact duplicate functions (4 hours)
- Implement template processing helper (8 hours)
- Create processing result cache (4 hours)
- Remove dead code (4 hours)
- **Total: 20 hours**

### **Week 2-3: Consolidation**
- Consolidate ASHRAE baseline functions (16 hours)
- Implement unified validation framework (20 hours)
- Create unified calculation framework (24 hours)
- **Total: 60 hours**

### **Week 4-6: Architecture**
- Implement weather management system (12 hours)
- Create data processing pipeline (16 hours)
- Add comprehensive error handling (8 hours)
- Implement result validation (8 hours)
- **Total: 44 hours**

### **Total Effort: 124 hours (3.1 weeks)**

## Risk Assessment

### **Low Risk (P0)**
- Exact duplicate functions
- Template processing helper
- Dead code removal

### **Medium Risk (P1)**
- ASHRAE baseline functions
- Validation framework
- Weather management system

### **High Risk (P2)**
- Calculation framework
- Data processing pipeline
- Result validation

## Success Metrics

### **Performance Improvements**
- 50-70% reduction in processing time
- Elimination of duplicate calculations
- Caching of intermediate results

### **Code Quality Improvements**
- Elimination of 49 similarity issues
- Reduction of function complexity
- Clear separation of concerns

### **Maintainability Improvements**
- Unified interfaces for common operations
- Comprehensive error handling
- Standardized patterns

## Conclusion

This refactoring plan addresses all identified duplications with a phased approach that minimizes risk while maximizing benefits. The immediate fixes provide quick wins, while the longer-term architectural improvements create a solid foundation for future development.
