#!/usr/bin/env python3
import os

file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'main_hardened_ready_refactored.py')

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update function signature
content = content.replace(
    'function getFixGuidance(metric, issue) {',
    'function getFixGuidance(metric, issue, docStatus) {'
)

# 2. Add buildActions helper function right after the function signature
build_actions_code = '''            // Build action buttons based on affected documents
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
            
'''

# Insert buildActions after function signature
content = content.replace(
    'function getFixGuidance(metric, issue, docStatus) {\n            const metricLower = (metric || \'\').toLowerCase();',
    'function getFixGuidance(metric, issue, docStatus) {\n' + build_actions_code + '            const metricLower = (metric || \'\').toLowerCase();'
)

# 3. Update all the return statements to use buildActions
# Missing weather normalization
content = content.replace(
    '                        actions: [\n                            { text: "← Go to Dashboard", url: "/main-dashboard", primary: true },\n                            { text: "📊 View Analysis", url: "/main-dashboard", primary: false }\n                        ]',
    '                        actions: buildActions(true, true)'
)

# Missing savings
content = content.replace(
    '                        actions: [\n                            { text: "← Go to Dashboard", url: "/main-dashboard", primary: true },\n                            { text: "🔄 Re-run Analysis", url: "/main-dashboard", primary: false }\n                        ]',
    '                        actions: buildActions(true, true)'
)

# Missing critical metrics (single action)
content = content.replace(
    '                        actions: [\n                            { text: "← Go to Dashboard", url: "/main-dashboard", primary: true }\n                        ]',
    '                        actions: buildActions(true, true)',
    1  # Only replace first occurrence
)

# Weather mismatch
content = content.replace(
    '                    actions: [\n                        { text: "← Go to Dashboard", url: "/main-dashboard", primary: true },\n                        { text: "🔄 Re-run Analysis", url: "/main-dashboard", primary: false }\n                    ]',
    '                    actions: buildActions(true, true)'
)

# General discrepancy
content = content.replace(
    '                actions: [\n                    { text: "← Go to Dashboard", url: "/main-dashboard", primary: true },\n                    { text: "📖 View Documentation", url: "/documentation", primary: false }\n                ]',
    '                actions: buildActions(false, true)'
)

# 4. Update steps text to be more actionable
content = content.replace(
    '"Go back to the main dashboard and verify your input data files"',
    '"Go to the Analysis Results section to verify your input data"'
)
content = content.replace(
    '"After re-running, regenerate the HTML Report, Audit Package, and Utility Submission Package"',
    '"After re-running, regenerate the affected documents using the buttons below"'
)
content = content.replace(
    '"Go back to the main dashboard and re-run the analysis"',
    '"Go to the Analysis Results section and re-run the analysis"'
)
content = content.replace(
    '"Go back to the main dashboard where you ran the analysis"',
    '"Go to the Analysis Results section where you ran the analysis"'
)
content = content.replace(
    '"Regenerate the affected documents (HTML Report, Audit Package, or Utility Submission Package)"',
    '"Regenerate the affected documents using the buttons below"'
)
content = content.replace(
    '"Verify that your analysis has been completed successfully"',
    '"Go to the Analysis Results section to verify your analysis"'
)
content = content.replace(
    '"Re-run the analysis to ensure all calculations are complete"',
    '"Go to the Analysis Results section"'
)

# 5. Update the call to pass docStatus
content = content.replace(
    'const fixGuidance = getFixGuidance(discrepancy.metric, discrepancy.issue);',
    'const fixGuidance = getFixGuidance(discrepancy.metric, discrepancy.issue, docStatus);'
)

# 6. Update button rendering
old_button = '${fixGuidance.actions.map(action => \n                                        `<button class="${action.primary ? \'btn-fix\' : \'btn-fix-secondary\'}" onclick="window.location.href=\'${action.url}\'">${action.text}</button>`\n                                    ).join(\'\')}'

new_button = '''${fixGuidance.actions.map(action => {
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

content = content.replace(old_button, new_button)

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated getFixGuidance function")
print("- Added docStatus parameter")
print("- Added buildActions helper function")
print("- Updated all return statements to use buildActions")
print("- Updated steps text to be more actionable")
print("- Updated function call to pass docStatus")
print("- Updated button rendering with localStorage integration")
