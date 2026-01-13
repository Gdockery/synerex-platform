# Calculation and Compute Functions Analysis

## Overview
Found **25+ calculation/compute functions** with significant duplication and redundant calculations.

## Function Categories

### 1. **Network Loss Calculations** - DUPLICATE IMPLEMENTATIONS

#### A. compute_network_losses() (Line 9603)
**Purpose**: Single-feeder network loss calculation
**Features**:
- I²R conductor losses
- Transformer copper + stray losses
- THD impact on losses
- Temperature correction
- **Complexity**: 200+ lines

#### B. compute_network_losses_multi() (Line 9782)
**Purpose**: Multi-feeder network loss calculation
**Features**:
- Per-phase current analysis
- Multiple feeder support
- Aggregate transformer losses
- **DUPLICATION**: Similar logic to compute_network_losses()

#### C. calculate_system_losses() (Line 12168)
**Purpose**: IEEE 519-2014 compliant system losses
**Features**:
- I²R losses calculation
- Eddy current losses
- Harmonic losses
- **DUPLICATION**: Similar to network loss functions

### 2. **Uncertainty Calculations** - MULTIPLE APPROACHES

#### A. calculate_uncertainty() (Line 7738)
**Purpose**: IPMVP measurement uncertainty
**Features**:
- Statistical analysis (mean, std, standard error)
- Confidence intervals
- T-test calculations
- **Complexity**: 50+ lines

#### B. calculate_combined_uncertainty() (Line 9308)
**Purpose**: Root-sum-square uncertainty combination
**Features**:
- Measurement uncertainty
- Model uncertainty
- Sampling uncertainty
- **DUPLICATION**: Similar statistical calculations

#### C. calculate_savings_uncertainty() (Line 9320)
**Purpose**: Savings-specific uncertainty
**Features**:
- Fractional uncertainty calculation
- Confidence bounds
- **DUPLICATION**: Similar to calculate_uncertainty()

### 3. **Power Factor Calculations** - REDUNDANT OPERATIONS

#### A. _calculate_utility_penalty() (Line 8072)
**Purpose**: Utility power factor penalty calculation
**Features**:
- Power factor threshold checking
- Penalty rate calculation
- **DUPLICATION**: Similar to validate_power_factor()

#### B. calculate_power_factor_improvement() (Line 17163)
**Purpose**: Power factor improvement calculation
**Features**:
- Before/after comparison
- Improvement percentage
- **DUPLICATION**: Similar to power factor validation

### 4. **Weather Factor Calculations** - SIMILAR PATTERNS

#### A. _calculate_humidity_factor() (Line 2808)
**Purpose**: Humidity impact on consumption
**Features**:
- Humidity threshold checking
- Factor calculation
- **Pattern**: Similar to other weather factors

#### B. _calculate_wind_factor() (Line 2819)
**Purpose**: Wind speed impact on consumption
**Features**:
- Wind speed threshold checking
- Factor calculation
- **Pattern**: Similar to humidity factor

#### C. _calculate_solar_factor() (Line 2832)
**Purpose**: Solar radiation impact on consumption
**Features**:
- Solar radiation threshold checking
- Factor calculation
- **Pattern**: Similar to other weather factors

### 5. **Financial Calculations** - MULTIPLE IMPLEMENTATIONS

#### A. calculate_lcca() (Line 9224)
**Purpose**: Life Cycle Cost Analysis
**Features**:
- NPV calculations
- IRR calculations
- Payback period
- **Complexity**: 100+ lines

#### B. calculate_demand_savings() (Line 8770)
**Purpose**: Demand charge savings
**Features**:
- Peak demand reduction
- Rate calculation
- **DUPLICATION**: Similar to other financial calculations

### 6. **Data Analysis Calculations** - REDUNDANT OPERATIONS

#### A. calculate_data_completeness() (Line 3833)
**Purpose**: Data quality assessment
**Features**:
- Missing data percentage
- Completeness score
- **DUPLICATION**: Similar to validate_data_quality()

#### B. calculate_ashrae_confidence_intervals() (Line 7826)
**Purpose**: ASHRAE statistical analysis
**Features**:
- Confidence interval calculation
- Statistical significance
- **DUPLICATION**: Similar to calculate_uncertainty()

## Duplication Issues Identified

### **P0 Critical**: Network Loss Calculation Duplication
1. **Three different network loss functions**:
   - `compute_network_losses()` (single feeder)
   - `compute_network_losses_multi()` (multi feeder)
   - `calculate_system_losses()` (IEEE 519 compliant)

2. **Similar calculation logic**:
   - I²R losses calculation
   - Transformer loss calculations
   - THD impact calculations
   - Temperature corrections

### **P1 High**: Uncertainty Calculation Overlap
1. **Multiple uncertainty functions**:
   - `calculate_uncertainty()` (IPMVP)
   - `calculate_combined_uncertainty()` (RSS)
   - `calculate_savings_uncertainty()` (savings-specific)

2. **Similar statistical calculations**:
   - Standard error calculations
   - Confidence interval calculations
   - T-test calculations

### **P2 Medium**: Weather Factor Duplication
1. **Three similar weather factor functions**:
   - `_calculate_humidity_factor()`
   - `_calculate_wind_factor()`
   - `_calculate_solar_factor()`

2. **Identical calculation patterns**:
   - Threshold checking
   - Factor calculation
   - Error handling

### **P3 Low**: Financial Calculation Redundancy
1. **Multiple financial calculation functions**:
   - `calculate_lcca()` (life cycle cost)
   - `calculate_demand_savings()` (demand charges)
   - Various other financial calculations

2. **Similar calculation patterns**:
   - Rate calculations
   - Time value of money
   - Percentage calculations

## Data Flow Analysis

### Network Loss Calculation Flow
```
Raw Data → compute_network_losses() → compute_network_losses_multi() → calculate_system_losses() → Final Results
```

**Issues**:
- Same data processed by multiple functions
- Similar calculations performed multiple times
- No caching of intermediate results
- Potential for inconsistent results

### Uncertainty Calculation Flow
```
Raw Data → calculate_uncertainty() → calculate_combined_uncertainty() → calculate_savings_uncertainty() → Final Results
```

**Issues**:
- Statistical calculations repeated
- Similar confidence interval calculations
- No unified uncertainty framework

## Refactoring Recommendations

### 1. **Consolidate Network Loss Calculations**
```python
class NetworkLossCalculator:
    def __init__(self):
        self.single_feeder = SingleFeederLossCalculator()
        self.multi_feeder = MultiFeederLossCalculator()
        self.ieee_compliant = IEEELossCalculator()
    
    def calculate_losses(self, data, config, method="single"):
        """Unified network loss calculation"""
        if method == "single":
            return self.single_feeder.calculate(data, config)
        elif method == "multi":
            return self.multi_feeder.calculate(data, config)
        elif method == "ieee":
            return self.ieee_compliant.calculate(data, config)
        else:
            raise ValueError("Invalid method")
```

### 2. **Create Unified Uncertainty Framework**
```python
class UncertaintyCalculator:
    def __init__(self):
        self.ipmvp = IPMVPUncertainty()
        self.rss = RootSumSquareUncertainty()
        self.savings = SavingsUncertainty()
    
    def calculate_uncertainty(self, data, uncertainty_type="ipmvp"):
        """Unified uncertainty calculation"""
        if uncertainty_type == "ipmvp":
            return self.ipmvp.calculate(data)
        elif uncertainty_type == "rss":
            return self.rss.calculate(data)
        elif uncertainty_type == "savings":
            return self.savings.calculate(data)
        else:
            raise ValueError("Invalid uncertainty type")
```

### 3. **Consolidate Weather Factor Calculations**
```python
class WeatherFactorCalculator:
    def __init__(self):
        self.factors = {
            'humidity': HumidityFactor(),
            'wind': WindFactor(),
            'solar': SolarFactor()
        }
    
    def calculate_factor(self, weather_type, value):
        """Unified weather factor calculation"""
        if weather_type in self.factors:
            return self.factors[weather_type].calculate(value)
        else:
            raise ValueError(f"Unknown weather type: {weather_type}")
```

### 4. **Create Calculation Result Cache**
```python
class CalculationCache:
    def __init__(self):
        self.cache = {}
    
    def get_calculation_result(self, calculation_type, inputs):
        """Cache calculation results to avoid duplicate processing"""
        cache_key = f"{calculation_type}_{hash(str(inputs))}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        # Perform calculation and cache result
```

## Impact Assessment

### **Performance Impact**: HIGH
- Same calculations performed multiple times
- No caching of intermediate results
- O(n*m) complexity where n=data size, m=calculation functions
- Network loss calculations are particularly expensive

### **Data Integrity Impact**: MEDIUM
- Multiple calculation methods may give different results
- No validation of calculation consistency
- Potential for calculation errors due to duplication

### **Maintainability Impact**: HIGH
- 25+ calculation functions scattered throughout file
- Similar logic implemented multiple times
- Difficult to modify calculation logic
- No clear separation of concerns

## Priority Fixes

### **Immediate (P0)**:
1. Consolidate network loss calculation functions
2. Create unified uncertainty calculation framework
3. Implement calculation result caching

### **Short-term (P1)**:
1. Consolidate weather factor calculations
2. Create financial calculation framework
3. Add calculation validation

### **Medium-term (P2)**:
1. Refactor into specialized calculation classes
2. Implement calculation result validation
3. Add comprehensive error handling

## Next Steps

1. **Map complete calculation flow** through all functions
2. **Identify which calculations are actually needed**
3. **Create unified calculation interfaces**
4. **Implement calculation result caching**
5. **Test with sample data to ensure no regressions**

## Specific Duplication Examples

### Example 1: Network Loss Calculation
```python
# compute_network_losses() - Line 9603
def compute_network_losses(before_data, after_data, config):
    # I²R losses calculation
    # Transformer loss calculation
    # THD impact calculation
    # Temperature correction

# compute_network_losses_multi() - Line 9782
def compute_network_losses_multi(before_data, after_data, config):
    # Similar I²R losses calculation
    # Similar transformer loss calculation
    # Similar THD impact calculation
    # Similar temperature correction

# calculate_system_losses() - Line 12168
def calculate_system_losses(kw, kva, pf, thd, voltage=480):
    # Similar I²R losses calculation
    # Similar transformer loss calculation
    # Similar THD impact calculation
    # Similar temperature correction
```

### Example 2: Uncertainty Calculation
```python
# calculate_uncertainty() - Line 7738
def calculate_uncertainty(before_values, after_values, confidence_level=0.95):
    # Statistical analysis
    # Confidence interval calculation
    # T-test calculation

# calculate_combined_uncertainty() - Line 9308
def calculate_combined_uncertainty(measurement_uncertainty, model_uncertainty, sampling_uncertainty):
    # Similar statistical calculation
    # Similar confidence interval calculation

# calculate_savings_uncertainty() - Line 9320
def calculate_savings_uncertainty(savings, before_uncertainty, after_uncertainty):
    # Similar statistical calculation
    # Similar confidence interval calculation
```

These duplications represent significant opportunities for refactoring and performance improvement.
