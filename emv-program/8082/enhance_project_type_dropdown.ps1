# Script to enhance Project Type dropdown with comprehensive options
# This ensures the dropdown has all necessary project types for Audit and Utility Submission PDFs

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$htmlFile = Join-Path $scriptDir "html_body.html"
$backupFile = Join-Path $scriptDir "html_body.html.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# Create backup
if (Test-Path $htmlFile) {
    Copy-Item $htmlFile $backupFile -Force
    Write-Host "Created backup: $backupFile" -ForegroundColor Green
} else {
    Write-Host "ERROR: $htmlFile not found!" -ForegroundColor Red
    exit 1
}

# Read the file
$content = Get-Content $htmlFile -Raw

# Enhanced Project Type dropdown options
$enhancedOptions = @"
            <option value="">-- Select Project Type --</option>
            <option value="energy_audit">Energy Audit</option>
            <option value="power_quality">Power Quality Analysis</option>
            <option value="load_study">Load Study</option>
            <option value="measurement_verification">Measurement & Verification (M&V)</option>
            <option value="energy_savings">Energy Savings Analysis</option>
            <option value="harmonic_analysis">Harmonic Analysis</option>
            <option value="demand_reduction">Demand Reduction Study</option>
            <option value="power_factor_correction">Power Factor Correction</option>
            <option value="utility_submission">Utility Submission Package</option>
            <option value="compliance_audit">Compliance Audit</option>
            <option value="baseline_analysis">Baseline Energy Analysis</option>
            <option value="retrofit_analysis">Retrofit Analysis</option>
            <option value="custom">Custom</option>
"@

# Check if the field exists
if ($content -match 'id="project-type"') {
    Write-Host "Project Type field found. Updating with enhanced options..." -ForegroundColor Yellow
    
    # Pattern to match the select tag and its content
    # This will match: <select...id="project-type"...>...existing options...</select>
    $pattern = '(?s)(<select[^>]*id="project-type"[^>]*>)(.*?)(</select>)'
    
    if ($content -match $pattern) {
        # Replace the options inside the select tag
        $newContent = $content -replace $pattern, "`$1`n$enhancedOptions`n        `$3"
        
        # Also update the help text to mention Audit and Utility Submission PDFs
        $helpPattern = '(?s)(<div class="help">)(.*?)(Select the type of project analysis[^<]*)(</div>)'
        if ($newContent -match $helpPattern) {
            $newContent = $newContent -replace $helpPattern, "`$1`$3 This will appear in your Audit and Utility Submission PDF documents.`$4"
        }
        
        Set-Content -Path $htmlFile -Value $newContent -NoNewline
        Write-Host ""
        Write-Host "✅ Successfully updated Project Type dropdown with enhanced options!" -ForegroundColor Green
        Write-Host ""
        Write-Host "New options include:" -ForegroundColor Cyan
        Write-Host "  • Energy Audit" -ForegroundColor Gray
        Write-Host "  • Power Quality Analysis" -ForegroundColor Gray
        Write-Host "  • Load Study" -ForegroundColor Gray
        Write-Host "  • Measurement & Verification (M&V)" -ForegroundColor Gray
        Write-Host "  • Energy Savings Analysis" -ForegroundColor Gray
        Write-Host "  • Harmonic Analysis" -ForegroundColor Gray
        Write-Host "  • Demand Reduction Study" -ForegroundColor Gray
        Write-Host "  • Power Factor Correction" -ForegroundColor Gray
        Write-Host "  • Utility Submission Package" -ForegroundColor Gray
        Write-Host "  • Compliance Audit" -ForegroundColor Gray
        Write-Host "  • Baseline Energy Analysis" -ForegroundColor Gray
        Write-Host "  • Retrofit Analysis" -ForegroundColor Gray
        Write-Host "  • Custom" -ForegroundColor Gray
        Write-Host ""
        Write-Host "The Project Type field is now available in the UI and will populate in:" -ForegroundColor Cyan
        Write-Host "  • Audit Package PDFs" -ForegroundColor White
        Write-Host "  • Utility Submission Package PDFs" -ForegroundColor White
        Write-Host "  • All project reports" -ForegroundColor White
    } else {
        Write-Host "ERROR: Could not find select tag pattern to replace." -ForegroundColor Red
        Write-Host "The field may have a different structure. Please check manually." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "Project Type field not found. Adding new field..." -ForegroundColor Yellow
    
    # Enhanced Project Type field HTML (complete field)
    $enhancedProjectTypeField = @"
        <div class="field">
          <label>Project Type</label>
          <select id="project-type" name="project_type" aria-label="Project Type" required>
$enhancedOptions
          </select>
          <div class="help">Select the type of project analysis. This will appear in your Audit and Utility Submission PDF documents.</div>
        </div>
"@
    
    # Try to find insertion point after Project Name field
    $insertPattern = '(?s)(<div class="help">Descriptive name for your analysis project[^<]*</div>\s*</div>\s*<div class="field">\s*<label>Facility Address</label>)'
    
    if ($content -match $insertPattern) {
        $newContent = $content -replace $insertPattern, "`$1`n`n$enhancedProjectTypeField"
        Set-Content -Path $htmlFile -Value $newContent -NoNewline
        Write-Host "✅ Successfully added Project Type field with enhanced options!" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Could not find insertion point." -ForegroundColor Red
        Write-Host "Please add the Project Type field manually after the Project Name field." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "Project Type dropdown enhancement completed!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Refresh your browser to see the updated dropdown" -ForegroundColor White
Write-Host "2. Select a Project Type when creating/editing projects" -ForegroundColor White
Write-Host "3. The selected type will appear in all PDF documents" -ForegroundColor White
