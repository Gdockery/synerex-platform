#!/usr/bin/env python3
"""Script to update getFixGuidance function with enhanced action buttons"""

import re

import os
file_path = os.path.join(os.path.dirname(__file__), 'main_hardened_ready_refactored.py')

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the start and end of the getFixGuidance function
start_marker = '        // Function to get fix guidance based on metric type'
end_marker = '        async function checkConsistency()'

start_pos = content.find(start_marker)
end_pos = content.find(end_marker, start_pos)

if start_pos == -1 or end_pos == -1:
    print("Error: Could not find function boundaries")
    exit(1)

# Extract the old function
old_function = content[start_pos:end_pos]

# New function code
new_function = '''        // Function to get fix guidance based on metric type and affected documents
        function getFixGuidance(metric, issue, docStatus) {
            const metricLower = (metric || '').toLowerCase();
            const issueLower = (issue || '').toLowerCase();
            
            // Build action buttons based on affected documents
            const buildActions = (needsAnalysis, needsRegenerate) => {
                const actions = [];
                
                // Always add "Go to Analysis Results" button
                actions.push({
                    text: "📊 Go to Analysis Results",
                    url: "/main-dashboard",
                    action: "scrollToResults",
                    primary: true
                });
                
                // Add regenerate buttons for affected documents
                if (needsRegenerate) {
                    if (docStatus.clientReport) {
                        actions.push({
                            text: "📄 Regenerate HTML Report",
                            url: "/main-dashboard",
                            action: "regenerateHTML",
                            primary: false
                        });
                    }
                    if (docStatus.audit) {
                        actions.push({
                            text: "📋 Regenerate Audit Package",
                            url: "/main-dashboard",
                            action: "regenerateAudit",
                            primary: false
                        });
                    }
                    if (docStatus.utility) {
                        actions.push({
                            text: "📦 Regenerate Utility Package",
                            url: "/main-dashboard",
                            action: "regenerateUtility",
                            primary: false
                        });
                    }
                }
                
                // Add re-run analysis button if needed
                if (needsAnalysis) {
                    actions.push({
                        text: "🔄 Re-run Analysis",
                        url: "/main-dashboard",
                        action: "rerunAnalysis",
                        primary: false
                    });
                }
                
                return actions;
            };
            
            // Missing or zero value issues
            if (issueLower.includes('missing') || issueLower.includes('zero')) {
                if (metricLower.includes('weather') || metricLower.includes('normalized')) {
                    return {
                        title: "🔧 How to Fix: Missing Weather Normalization Data",
                        steps: [
                            "Go to the Analysis Results section to verify your input data",
                            "Ensure both 'before' and 'after' period CSV files are uploaded",
                            "Check that weather data is available for your analysis period",
                            "Re-run the analysis to regenerate all calculations",
                            "After re-running, regenerate the affected documents using the buttons below"
                        ],
                        actions: buildActions(true, true)
                    };
                } else if (metricLower.includes('savings') || metricLower.includes('kw')) {
                    return {
                        title: "🔧 How to Fix: Missing Savings Calculations",
                        steps: [
                            "Go to the Analysis Results section to verify your analysis",
                            "Check that both 'before' and 'after' period data are properly loaded",
                            "Ensure the analysis period ranges are correctly set",
                            "Re-run the analysis if data appears incomplete",
                            "Regenerate the affected documents after fixing the analysis"
                        ],
                        actions: buildActions(true, true)
                    };
                } else {
                    return {
                        title: "🔧 How to Fix: Missing Critical Metrics",
                        steps: [
                            "Go to the Analysis Results section",
                            "Re-run the analysis to ensure all calculations are complete",
                            "Verify that all required input data is present and valid",
                            "Check the analysis results section for any error messages",
                            "Regenerate the affected documents after re-running the analysis"
                        ],
                        actions: buildActions(true, true)
                    };
                }
            }
            
            // Weather adjustment factor mismatch
            if (metricLower.includes('weather') && issueLower.includes('mismatch')) {
                return {
                    title: "🔧 How to Fix: Weather Adjustment Factor Mismatch",
                    steps: [
                        "This indicates a calculation inconsistency in weather normalization",
                        "Go to the Analysis Results section and re-run the analysis",
                        "The system will recalculate all weather normalization factors",
                        "After re-running, regenerate the affected documents",
                        "All documents will then have consistent weather adjustment calculations"
                    ],
                    actions: buildActions(true, true)
                };
            }
            
            // General discrepancy - only regenerate, no need to re-run analysis
            return {
                title: "🔧 How to Fix: Document Inconsistency",
                steps: [
                    "Go to the Analysis Results section where you ran the analysis",
                    "Regenerate the affected documents using the buttons below",
                    "Click the respective 'Generate' buttons in the analysis results section",
                    "After regenerating, return here and check consistency again",
                    "All documents should now be in sync"
                ],
                actions: buildActions(false, true)
            };
        }

'''

# Replace the function
content = content[:start_pos] + new_function + content[end_pos:]

# Update the call to getFixGuidance to pass docStatus
content = content.replace(
    'const fixGuidance = getFixGuidance(discrepancy.metric, discrepancy.issue);',
    'const fixGuidance = getFixGuidance(discrepancy.metric, discrepancy.issue, docStatus);'
)

# Update the button rendering - find the exact pattern
old_button_pattern = r'\$\{fixGuidance\.actions\.map\(action =>\s+`<button class="\$\{action\.primary \? \'btn-fix\' : \'btn-fix-secondary\'\}" onclick="window\.location\.href=\'\$\{action\.url\}\'">\$\{action\.text\}</button>`\s+\)\.join\(\'\'\)\}'

new_button_code = '''${fixGuidance.actions.map(action => {
                                    let onclickHandler = '';
                                    if (action.action === 'scrollToResults') {
                                        onclickHandler = `localStorage.setItem('syncConsoleAction', 'scrollToResults'); window.location.href='${action.url}';`;
                                    } else if (action.action === 'regenerateHTML') {
                                        onclickHandler = `localStorage.setItem('syncConsoleAction', 'regenerateHTML'); window.location.href='${action.url}';`;
                                    } else if (action.action === 'regenerateAudit') {
                                        onclickHandler = `localStorage.setItem('syncConsoleAction', 'regenerateAudit'); window.location.href='${action.url}';`;
                                    } else if (action.action === 'regenerateUtility') {
                                        onclickHandler = `localStorage.setItem('syncConsoleAction', 'regenerateUtility'); window.location.href='${action.url}';`;
                                    } else if (action.action === 'rerunAnalysis') {
                                        onclickHandler = `localStorage.setItem('syncConsoleAction', 'rerunAnalysis'); window.location.href='${action.url}';`;
                                    } else {
                                        onclickHandler = `window.location.href='${action.url}';`;
                                    }
                                    return `<button class="${action.primary ? 'btn-fix' : 'btn-fix-secondary'}" onclick="${onclickHandler}">${action.text}</button>`;
                                }).join('')}'''

# Find and replace the button rendering code
button_start = content.find('${fixGuidance.actions.map(action =>')
if button_start != -1:
    # Find the end of this map call
    button_end = content.find('}).join(\'\')}', button_start) + len('}).join(\'\')}')
    if button_end > button_start:
        old_button = content[button_start:button_end]
        content = content[:button_start] + new_button_code + content[button_end:]
        print("✓ Updated button rendering")
    else:
        print("⚠ Could not find end of button rendering")
else:
    print("⚠ Could not find button rendering code")

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Successfully updated getFixGuidance function")
print("   - Added docStatus parameter")
print("   - Enhanced action buttons based on affected documents")
print("   - Added localStorage integration for navigation context")
