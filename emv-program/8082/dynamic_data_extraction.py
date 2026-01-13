
def extract_dynamic_data_for_report(data):
    """Extract all dynamic data for report generation"""
    
    # Initialize all variables with safe defaults
    financial = data.get('financial', {})
    power_quality = data.get('power_quality', {})
    statistical = data.get('statistical', {})
    
    # Financial data
    npv = financial.get('npv', 0)
    sir = financial.get('sir', 0)
    payback_period = financial.get('payback_period', 0)
    irr = financial.get('irr', 0)
    total_savings = financial.get('total_savings_annual', 0)
    energy_savings = financial.get('energy_savings_annual', 0)
    demand_savings = financial.get('demand_savings_annual', 0)
    pf_savings = financial.get('pf_savings_annual', 0)
    om_savings = financial.get('om_savings_annual', 0)
    
    # Power quality data
    kw_before = power_quality.get('kw_before', 0)
    kw_after = power_quality.get('kw_after', 0)
    kva_before = power_quality.get('kva_before', 0)
    kva_after = power_quality.get('kva_after', 0)
    kvar_before = power_quality.get('kvar_before', 0)
    kvar_after = power_quality.get('kvar_after', 0)
    pf_before = power_quality.get('pf_before', 0)
    pf_after = power_quality.get('pf_after', 0)
    thd_before = power_quality.get('thd_before', 0)
    thd_after = power_quality.get('thd_after', 0)
    voltage_before = power_quality.get('voltage_before', 0)
    voltage_after = power_quality.get('voltage_after', 0)
    current_before = power_quality.get('current_before', 0)
    current_after = power_quality.get('current_after', 0)
    
    # Statistical data
    p_value = statistical.get('p_value', 0.0001)
    sample_size_before = statistical.get('sample_size_before', 0)
    sample_size_after = statistical.get('sample_size_after', 0)
    
    # Calculate improvements
    kw_improvement = ((kw_after - kw_before) / kw_before * 100) if kw_before != 0 else 0
    kva_improvement = ((kva_after - kva_before) / kva_before * 100) if kva_before != 0 else 0
    kvar_improvement = ((kvar_after - kvar_before) / kvar_before * 100) if kvar_before != 0 else 0
    pf_improvement = ((pf_after - pf_before) / pf_before * 100) if pf_before != 0 else 0
    thd_improvement = ((thd_after - thd_before) / thd_before * 100) if thd_before != 0 else 0
    
    # Return all dynamic data
    return {
        'financial': {
            'npv': npv, 'sir': sir, 'payback_period': payback_period, 'irr': irr,
            'total_savings': total_savings, 'energy_savings': energy_savings,
            'demand_savings': demand_savings, 'pf_savings': pf_savings, 'om_savings': om_savings
        },
        'power_quality': {
            'kw_before': kw_before, 'kw_after': kw_after, 'kva_before': kva_before, 'kva_after': kva_after,
            'kvar_before': kvar_before, 'kvar_after': kvar_after, 'pf_before': pf_before, 'pf_after': pf_after,
            'thd_before': thd_before, 'thd_after': thd_after, 'voltage_before': voltage_before, 'voltage_after': voltage_after,
            'current_before': current_before, 'current_after': current_after
        },
        'statistical': {
            'p_value': p_value, 'sample_size_before': sample_size_before, 'sample_size_after': sample_size_after
        },
        'improvements': {
            'kw_improvement': kw_improvement, 'kva_improvement': kva_improvement, 'kvar_improvement': kvar_improvement,
            'pf_improvement': pf_improvement, 'thd_improvement': thd_improvement
        }
    }
