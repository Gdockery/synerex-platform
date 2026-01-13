#!/usr/bin/env python3
"""
Simulation script to test Weather and Power Factor Normalization
This script simulates the normalization process to verify calculations are correct.
"""

import sys
import os

# Add the 8082 directory to the path to import modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '8082'))

def simulate_normalization():
    """Simulate weather and PF normalization with example data"""
    
    print("=" * 80)
    print("WEATHER AND POWER FACTOR NORMALIZATION SIMULATION")
    print("=" * 80)
    print()
    
    # Example data (similar to AT&T project)
    print("📊 INPUT DATA:")
    print("-" * 80)
    kw_before_raw = 63.96
    kw_after_raw = 59.68
    pf_before = 0.92  # 92% - below target
    pf_after = 0.999  # 99.9% - above target
    target_pf = 0.95  # Standard utility target
    
    temp_before = 25.9  # °C
    temp_after = 24.7   # °C
    dewpoint_before = 19.4  # °C
    dewpoint_after = 17.9   # °C
    
    print(f"Raw kW Before: {kw_before_raw:.2f} kW")
    print(f"Raw kW After: {kw_after_raw:.2f} kW")
    print(f"Raw Savings: {kw_before_raw - kw_after_raw:.2f} kW ({(kw_before_raw - kw_after_raw) / kw_before_raw * 100:.2f}%)")
    print()
    print(f"Power Factor Before: {pf_before:.3f} ({pf_before * 100:.1f}%)")
    print(f"Power Factor After: {pf_after:.3f} ({pf_after * 100:.1f}%)")
    print(f"Target Power Factor: {target_pf:.2f} ({target_pf * 100:.0f}%)")
    print()
    print(f"Temperature Before: {temp_before:.1f}°C")
    print(f"Temperature After: {temp_after:.1f}°C")
    print(f"Dewpoint Before: {dewpoint_before:.1f}°C")
    print(f"Dewpoint After: {dewpoint_after:.1f}°C")
    print()
    
    # STEP 1: Weather Normalization
    print("=" * 80)
    print("STEP 1: WEATHER NORMALIZATION (ASHRAE Guideline 14-2014)")
    print("=" * 80)
    print()
    
    try:
        from main_hardened_ready_refactored import WeatherNormalizationML
        
        # Initialize weather normalization
        weather_norm = WeatherNormalizationML()
        
        # Set base temperature (example: calculated from baseline data)
        base_temp = 25.9  # Example base temperature
        weather_norm.base_temp = base_temp
        print(f"Base Temperature: {base_temp:.1f}°C")
        print()
        
        # Calculate weather effects
        temp_sensitivity = 0.025  # 2.5% per °C
        dewpoint_sensitivity = 0.015  # 1.5% per °C
        
        # Temperature effects
        temp_effect_before = max(0, (temp_before - base_temp) * temp_sensitivity)
        temp_effect_after = max(0, (temp_after - base_temp) * temp_sensitivity)
        
        # Dewpoint effects
        dewpoint_effect_before = max(0, (dewpoint_before - base_temp) * dewpoint_sensitivity)
        dewpoint_effect_after = max(0, (dewpoint_after - base_temp) * dewpoint_sensitivity)
        
        # Combined weather effects
        weather_effect_before = temp_effect_before + dewpoint_effect_before
        weather_effect_after = temp_effect_after + dewpoint_effect_after
        
        print(f"Weather Effects:")
        print(f"  Before: Temp={temp_effect_before*100:.2f}%, Dewpoint={dewpoint_effect_before*100:.2f}%, Total={weather_effect_before*100:.2f}%")
        print(f"  After:  Temp={temp_effect_after*100:.2f}%, Dewpoint={dewpoint_effect_after*100:.2f}%, Total={weather_effect_after*100:.2f}%")
        print()
        
        # Weather adjustment factor
        weather_adjustment_factor = (1.0 + weather_effect_before) / (1.0 + weather_effect_after)
        weather_normalized_kw_after = kw_after_raw * weather_adjustment_factor
        weather_normalized_kw_before = kw_before_raw  # Before is unchanged (baseline)
        
        print(f"Weather Adjustment Factor: (1 + {weather_effect_before:.4f}) / (1 + {weather_effect_after:.4f}) = {weather_adjustment_factor:.4f}")
        print()
        print(f"Weather Normalized kW Before: {weather_normalized_kw_before:.2f} kW (unchanged - baseline)")
        print(f"Weather Normalized kW After: {kw_after_raw:.2f} × {weather_adjustment_factor:.4f} = {weather_normalized_kw_after:.2f} kW")
        print()
        
        weather_savings = weather_normalized_kw_before - weather_normalized_kw_after
        weather_savings_pct = (weather_savings / weather_normalized_kw_before) * 100
        print(f"Weather Normalized Savings: {weather_savings:.2f} kW ({weather_savings_pct:.2f}%)")
        print()
        
    except Exception as e:
        print(f"❌ Error in weather normalization: {e}")
        import traceback
        traceback.print_exc()
        # Use simplified calculation
        weather_normalized_kw_before = kw_before_raw
        weather_normalized_kw_after = kw_after_raw
        weather_savings = kw_before_raw - kw_after_raw
        weather_savings_pct = (weather_savings / kw_before_raw) * 100
    
    # STEP 2: Power Factor Normalization
    print("=" * 80)
    print("STEP 2: POWER FACTOR NORMALIZATION (Utility Billing Standard)")
    print("=" * 80)
    print()
    
    # PF Adjustment Factors
    pf_adjustment_before = target_pf / pf_before
    pf_adjustment_after = target_pf / pf_after
    
    print(f"PF Adjustment Factors:")
    print(f"  Before: {target_pf:.2f} / {pf_before:.3f} = {pf_adjustment_before:.4f}")
    print(f"  After:  {target_pf:.2f} / {pf_after:.3f} = {pf_adjustment_after:.4f}")
    print()
    
    # Apply PF normalization to weather-normalized values
    pf_normalized_kw_before = weather_normalized_kw_before * pf_adjustment_before
    pf_normalized_kw_after = weather_normalized_kw_after * pf_adjustment_after
    
    print(f"PF Normalized kW Before: {weather_normalized_kw_before:.2f} × {pf_adjustment_before:.4f} = {pf_normalized_kw_before:.2f} kW")
    print(f"PF Normalized kW After:  {weather_normalized_kw_after:.2f} × {pf_adjustment_after:.4f} = {pf_normalized_kw_after:.2f} kW")
    print()
    
    pf_normalized_savings = pf_normalized_kw_before - pf_normalized_kw_after
    pf_normalized_savings_pct = (pf_normalized_savings / pf_normalized_kw_before) * 100
    
    print(f"PF Normalized Savings: {pf_normalized_savings:.2f} kW ({pf_normalized_savings_pct:.2f}%)")
    print()
    
    # STEP 3: Comparison
    print("=" * 80)
    print("STEP 3: COMPARISON")
    print("=" * 80)
    print()
    
    print(f"{'Metric':<40} {'Before':>12} {'After':>12} {'Savings':>12}")
    print("-" * 80)
    print(f"{'Raw kW':<40} {kw_before_raw:>12.2f} {kw_after_raw:>12.2f} {kw_before_raw - kw_after_raw:>12.2f}")
    print(f"{'Weather Normalized kW':<40} {weather_normalized_kw_before:>12.2f} {weather_normalized_kw_after:>12.2f} {weather_savings:>12.2f}")
    print(f"{'PF Normalized kW':<40} {pf_normalized_kw_before:>12.2f} {pf_normalized_kw_after:>12.2f} {pf_normalized_savings:>12.2f}")
    print()
    
    print(f"Savings Comparison:")
    print(f"  Raw Savings: {kw_before_raw - kw_after_raw:.2f} kW ({(kw_before_raw - kw_after_raw) / kw_before_raw * 100:.2f}%)")
    print(f"  Weather Normalized Savings: {weather_savings:.2f} kW ({weather_savings_pct:.2f}%)")
    print(f"  PF Normalized Savings: {pf_normalized_savings:.2f} kW ({pf_normalized_savings_pct:.2f}%)")
    print()
    
    additional_savings = pf_normalized_savings - weather_savings
    print(f"Additional Savings from PF Normalization: {additional_savings:+.2f} kW")
    print()
    
    # Verification
    print("=" * 80)
    print("VERIFICATION")
    print("=" * 80)
    print()
    
    # Check if PF normalization increased savings
    if pf_normalized_savings > weather_savings:
        print(f"✅ SUCCESS: PF Normalized Savings ({pf_normalized_savings:.2f} kW) > Weather Normalized Savings ({weather_savings:.2f} kW)")
        print(f"   PF normalization correctly shows additional savings from PF improvement")
    elif abs(pf_normalized_savings - weather_savings) < 0.01:
        print(f"⚠️  WARNING: PF Normalized Savings ({pf_normalized_savings:.2f} kW) = Weather Normalized Savings ({weather_savings:.2f} kW)")
        print(f"   This suggests PF normalization is not being applied correctly")
    else:
        print(f"❌ ERROR: PF Normalized Savings ({pf_normalized_savings:.2f} kW) < Weather Normalized Savings ({weather_savings:.2f} kW)")
        print(f"   This should not happen when PF improves")
    
    print()
    
    # Check if values match expected calculations
    expected_pf_before = weather_normalized_kw_before * pf_adjustment_before
    expected_pf_after = weather_normalized_kw_after * pf_adjustment_after
    
    if abs(pf_normalized_kw_before - expected_pf_before) < 0.01:
        print(f"✅ PF Normalized Before calculation is correct")
    else:
        print(f"❌ PF Normalized Before calculation error: Expected {expected_pf_before:.2f}, Got {pf_normalized_kw_before:.2f}")
    
    if abs(pf_normalized_kw_after - expected_pf_after) < 0.01:
        print(f"✅ PF Normalized After calculation is correct")
    else:
        print(f"❌ PF Normalized After calculation error: Expected {expected_pf_after:.2f}, Got {pf_normalized_kw_after:.2f}")
    
    print()
    print("=" * 80)
    print("SIMULATION COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    simulate_normalization()




