#!/usr/bin/env python3
"""
Script to add field mapping functionality to Document Sync Console
"""

import re

file_path = 'main_hardened_ready_refactored.py'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add getFieldTarget function after getDocumentStatus
getFieldTarget_function = '''        }

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
        }'''

# Find the insertion point (after getDocumentStatus function)
pattern1 = r'(            \};\s*\n        \}\s*\n\s*// Function to get fix guidance)'
replacement1 = getFieldTarget_function + r'\n\n        \1'
content = re.sub(pattern1, replacement1, content)

# 2. Update buildActions to include "Go to Field" button
old_buildActions = r'            // Build action buttons based on affected documents\s+const buildActions = \(needsAnalysis, needsRegenerate\) => \{\s+const actions = \[\];\s+// Always add "Go to Analysis Results" button'
new_buildActions = '''            // Build action buttons based on affected documents
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
                
                // Always add "Go to Analysis Results" button'''
pattern2 = re.escape(old_buildActions.split('\n')[0]) + r'.*?' + re.escape(old_buildActions.split('\n')[-1])
content = re.sub(pattern2, new_buildActions, content, flags=re.DOTALL)

# Also update the primary flag for scrollToResults
pattern3 = r'(action: "scrollToResults",\s+primary: )true'
replacement3 = r'\1(!fieldTarget || fieldTarget.field === \'results\')'
content = re.sub(pattern3, replacement3, content)

# 3. Update button rendering to handle goToField action
old_button_rendering = r'if \(action\.action === \'scrollToResults\'\)'
new_button_rendering = '''if (action.action === 'goToField') {
                                            onclickHandler = `localStorage.setItem('syncConsoleAction', 'goToField'); localStorage.setItem('syncConsoleFieldId', '${action.fieldId}'); window.location.href='${action.url}';`;
                                        } else if (action.action === 'scrollToResults')'''
pattern4 = re.escape(old_button_rendering)
replacement4 = new_button_rendering
content = re.sub(pattern4, replacement4, content)

# Write the updated content
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Field mapping functionality added successfully!")
