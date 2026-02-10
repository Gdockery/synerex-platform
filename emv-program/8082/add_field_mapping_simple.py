#!/usr/bin/env python3
"""
Simple script to add field mapping functionality
"""

import os

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(script_dir, 'main_hardened_ready_refactored.py')

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find insertion point for getFieldTarget (after getDocumentStatus, before getFixGuidance)
insertion_idx = None
for i, line in enumerate(lines):
    if '// Function to get fix guidance based on metric type' in line:
        insertion_idx = i
        break

if insertion_idx is None:
    print("ERROR: Could not find insertion point")
    exit(1)

# 1. Add getFieldTarget function
getFieldTarget_code = '''        }

        // Function to map discrepancy metrics to specific UI field targets
        function getFieldTarget(metric, issue) {
            const metricLower = (metric || '').toLowerCase();
            const issueLower = (issue || '').toLowerCase();
            
            // Map metrics to UI field IDs or section selectors
            const fieldMap = {
                // Financial/Input fields
                'annual_dollar_savings': { field: 'energy_rate', section: 'input', label: 'Energy Rate' },
                'annual_kwh_savings': { field: 'energy_rate', section: 'input', label: 'Energy Rate' },
                'npv': { field: 'project_cost', section: 'input', label: 'Project Cost' },
                'sir': { field: 'project_cost', section: 'input', label: 'Project Cost' },
                'payback_years': { field: 'project_cost', section: 'input', label: 'Project Cost' },
                
                // Power Quality fields
                'pf_before': { field: 'target_pf', section: 'input', label: 'Target Power Factor' },
                'pf_after': { field: 'target_pf', section: 'input', label: 'Target Power Factor' },
                'thd_before': { field: 'harmonic_analysis_level', section: 'input', label: 'Harmonic Analysis Level' },
                'thd_after': { field: 'harmonic_analysis_level', section: 'input', label: 'Harmonic Analysis Level' },
                
                // Weather/Data fields
                'weather_adjustment_factor': { field: 'weather_normalization', section: 'input', label: 'Weather Normalization' },
                'normalized_kw_after': { field: 'weather_normalization', section: 'input', label: 'Weather Normalization' },
                'normalized_kw_savings': { field: 'weather_normalization', section: 'input', label: 'Weather Normalization' },
                'total_normalized_savings_kw': { field: 'weather_normalization', section: 'input', label: 'Weather Normalization' },
                
                // File upload fields
                'kw_before_avg': { field: 'before_file_id', section: 'file', label: 'Before Period File' },
                'kw_after_avg': { field: 'after_file_id', section: 'file', label: 'After Period File' },
            };
            
            // Check for direct metric match
            if (fieldMap[metricLower]) {
                return fieldMap[metricLower];
            }
            
            // Check for partial matches
            for (const [key, value] of Object.entries(fieldMap)) {
                if (metricLower.includes(key) || key.includes(metricLower)) {
                    return value;
                }
            }
            
            // Default: point to results section for calculated metrics
            if (issueLower.includes('missing') || issueLower.includes('zero')) {
                if (metricLower.includes('weather') || metricLower.includes('normalized')) {
                    return { field: 'weather_normalization', section: 'input', label: 'Weather Normalization Settings' };
                }
                if (metricLower.includes('savings') || metricLower.includes('kw')) {
                    return { field: 'results', section: 'results', label: 'Analysis Results' };
                }
            }
            
            // Default to results section
            return { field: 'results', section: 'results', label: 'Analysis Results' };
        }

'''

# Insert getFieldTarget function
lines.insert(insertion_idx, getFieldTarget_code)

# 2. Update buildActions - find and replace
for i, line in enumerate(lines):
    if '// Build action buttons based on affected documents' in line:
        # Find the buildActions function start
        start_idx = i
        # Find where actions.push for "Go to Analysis Results" starts
        for j in range(i, min(i+20, len(lines))):
            if '// Always add "Go to Analysis Results" button' in lines[j]:
                # Replace the section from buildActions start to before "Always add"
                old_section = ''.join(lines[start_idx:j])
                new_section = '''            // Build action buttons based on affected documents
            const buildActions = (needsAnalysis, needsRegenerate) => {
                const actions = [];
                
                // Get field target for this metric
                const fieldTarget = getFieldTarget(metric, issue);
                
                // Add "Go to Field" button if we have a specific field target (not just results)
                if (fieldTarget && fieldTarget.field !== 'results' && fieldTarget.section === 'input') {
                    actions.push({
                        text: `📍 Go to ${fieldTarget.label} Field`,
                        url: "/main-dashboard",
                        action: "goToField",
                        fieldId: fieldTarget.field,
                        primary: true
                    });
                }
                
                // Always add "Go to Analysis Results" button
'''
                lines[start_idx:j] = [new_section]
                break
        # Update primary flag for scrollToResults
        for j in range(i, min(i+30, len(lines))):
            if 'action: "scrollToResults",' in lines[j] and 'primary: true' in lines[j+1]:
                lines[j+1] = '                    primary: (!fieldTarget || fieldTarget.field === \'results\')\n'
                break
        break

# 3. Update button rendering to handle goToField
for i, line in enumerate(lines):
    if 'if (action.action === \'scrollToResults\')' in line:
        # Insert goToField handler before scrollToResults
        new_handler = '''                                        if (action.action === 'goToField') {
                                            onclickHandler = `localStorage.setItem('syncConsoleAction', 'goToField'); localStorage.setItem('syncConsoleFieldId', '${action.fieldId}'); window.location.href='${action.url}';`;
                                        } else if (action.action === 'scrollToResults') {
'''
        lines[i] = new_handler
        break

# Write updated file
with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("✅ Field mapping functionality added successfully!")
print("Please restart the service for changes to take effect.")
