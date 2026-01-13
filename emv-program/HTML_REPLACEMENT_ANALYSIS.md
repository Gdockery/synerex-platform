# HTML Content Replacement Analysis

## Overview
Found **364 html_content.replace()** calls in the main file, indicating massive template string manipulation duplication.

## Pattern Categories

### 1. Dollar Amount Replacements (6 instances)
**Pattern**: `html_content.replace("$XXXX", f"${variable:,.2f}")`

**Instances**:
- Line 18430: `"$9238"` → `"$0"` (Power Factor Penalty)
- Line 18500: `"$23412"` → `f"${energy_dollars:,.2f}"` (Energy Savings)
- Line 18519: `"$12085"` → `f"${demand_dollars:,.2f}"` (Demand Savings)
- Line 18531: `"$9238"` → `f"${pf_dollars:,.2f}"` (Power Factor Savings)
- Line 18571: `"$1"` → `f"${cp_dollars:,.2f}"` (Capacity Payment)
- Line 18583: `"$76"` → `f"${om_dollars:,.2f}"` (Operations & Maintenance)

**Duplication Issue**: Same dollar amount `$9238` appears twice (lines 18430, 18531) but gets different values.

### 2. Template Variable Replacements (29+ instances)
**Pattern**: `html_content.replace("{{VARIABLE}}", value)`

**ASHRAE Variables** (6 instances):
- `{{ASHRAE_CVRMSE}}` → `cvrmse_str`
- `{{ASHRAE_NMBE}}` → `nmbe_str`
- `{{ASHRAE_R_SQUARED}}` → `r_squared_str`
- `{{ASHRAE_TEMPERATURE_UNITS}}` → `"°F"`
- `{{ASHRAE_RELATIVE_PRECISION}}` → `"—"`
- `{{ASHRAE_PRECISION_STATUS}}` → `"—"`

**Statistical Variables** (6 instances):
- `{{COHENS_D}}` → `cohens_d_str`
- `{{COHENS_D_RATING}}` → `cohens_d_rating`
- `{{T_STATISTIC}}` → `t_statistic_str`
- `{{RELATIVE_PRECISION}}` → `"0.00%"`
- `{{COHENS_D_DETAILED}}` → `cohens_d_str`
- `{{T_STATISTIC_DETAILED}}` → `"0.00"`

**Compliance Variables** (8+ instances):
- `{{BEFORE_CV}}` → `before_quality_rating`
- `{{AFTER_CV}}` → `after_quality_rating`
- `{{IPMVP_STATUS}}` → `ipmvp_status`
- `{{IPMVP_VALUE}}` → `ipmvp_value`
- `{{ANSI_C12_STATUS}}` → `ansi_c12_status`
- `{{ANSI_C12_VALUE}}` → `ansi_c12_value`
- `{{IEEE_519_BEFORE_STATUS}}` → `"✗ FAIL"`
- `{{IEEE_519_AFTER_STATUS}}` → `"✗ FAIL"`

### 3. Hardcoded Value Replacements (100+ instances)
**Pattern**: `html_content.replace("hardcoded_value", f"{calculated_value}")`

**Examples**:
- `"414743 kWh"` → `f"{energy_kwh:,.2f} kWh"`
- `"406453 kWh"` → `f"{base_kwh:,.2f} kWh"`
- `"8290 kWh"` → `f"{network_kwh:,.2f} kWh"`
- `"$0.0565/kWh"` → `f"${energy_rate:.4f}/kWh"`
- `"1 kW"` → `f"{cp_kw:.2f} kW"`
- `"TBD kW"` → `f"{kw_savings:.2f} kW"`

### 4. Technical Specification Replacements (50+ instances)
**Pattern**: `html_content.replace("spec_value", f"{calculated_spec}")`

**Examples**:
- `"ISC/IL Ratio: 8.5"` → `f"ISC/IL Ratio: {isc_il_ratio:.1f}"`
- `"TDD Before: 5.2%"` → `f"TDD Before: {tdd_before:.1f}%"`
- `"TDD After: 2.1%"` → `f"TDD After: {tdd_after:.1f}%"`
- `"8.22%"` → `f"{before_cv:.2f}%"`
- `"6.10%"` → `f"{after_cv:.2f}%"`

## Duplication Issues Identified

### 1. **P0 Critical**: Duplicate Dollar Amounts
- `$9238` appears twice but gets different values
- Line 18430: Set to `$0` (Power Factor Penalty)
- Line 18531: Set to `${pf_dollars:,.2f}` (Power Factor Savings)

### 2. **P1 High**: Redundant Template Processing
- Same template variables processed in multiple code blocks
- Fallback values set after primary values (lines 20128-20167)
- Template variables processed in both success and failure paths

### 3. **P2 Medium**: Hardcoded Value Management
- 100+ hardcoded values that need to be replaced
- No centralized template variable management
- Values scattered throughout the code

### 4. **P3 Low**: Repeated Pattern Logic
- Same replacement pattern used 364 times
- No helper function for template replacement
- Manual string manipulation instead of template engine

## Refactoring Opportunities

### 1. **Template Helper Function**
Create a centralized template replacement system:
```python
def replace_template_variables(html_content, variables):
    """Replace all template variables in one pass"""
    for placeholder, value in variables.items():
        html_content = html_content.replace(placeholder, str(value))
    return html_content
```

### 2. **Template Variable Dictionary**
Organize all replacements into structured data:
```python
template_vars = {
    'financial': {
        'energy_dollars': energy_dollars,
        'demand_dollars': demand_dollars,
        'pf_dollars': pf_dollars,
        # ...
    },
    'technical': {
        'isc_il_ratio': isc_il_ratio,
        'tdd_before': tdd_before,
        'tdd_after': tdd_after,
        # ...
    }
}
```

### 3. **Eliminate Duplicate Processing**
- Process template variables once in a single function
- Remove redundant fallback processing
- Use template engine instead of manual string replacement

## Impact Assessment

### **Performance Impact**: HIGH
- 364 string replacements per report generation
- Each replacement scans entire HTML content
- O(n*m) complexity where n=HTML length, m=364 replacements

### **Maintainability Impact**: HIGH
- Hard to track which values are replaced where
- Difficult to add new template variables
- Error-prone manual string manipulation

### **Data Integrity Impact**: MEDIUM
- Duplicate dollar amount `$9238` could cause confusion
- Fallback values might override intended values
- No validation of replacement success

## Recommendations

1. **Immediate**: Fix duplicate `$9238` replacement
2. **Short-term**: Create template helper function
3. **Medium-term**: Implement proper template engine
4. **Long-term**: Refactor to use Jinja2 or similar template system

## Next Steps

1. Identify all unique template variables
2. Create centralized replacement function
3. Test with sample data to ensure no regressions
4. Gradually migrate from manual replacement to template system
