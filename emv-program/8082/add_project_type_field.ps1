# Script to add Project Type field to html_body.html
$htmlFile = "html_body.html"
$backupFile = "html_body.html.backup"

# Create backup
Copy-Item $htmlFile $backupFile -Force
Write-Host "Created backup: $backupFile"

# Read the file
$content = Get-Content $htmlFile -Raw

# Define the Project Type field HTML
$projectTypeField = @"
        <div class="field">
          <label>Project Type</label>
          <select id="project-type" name="project_type" aria-label="Project Type">
            <option value="">-- Select Project Type --</option>
            <option value="energy_audit">Energy Audit</option>
            <option value="power_quality">Power Quality Analysis</option>
            <option value="load_study">Load Study</option>
            <option value="custom">Custom</option>
          </select>
          <div class="help">Select the type of project analysis. This will appear in your reports.</div>
        </div>
"@

# Check if the field already exists
if ($content -match 'id="project-type"') {
    Write-Host "Project Type field already exists in the file."
    exit
}

# Find the insertion point (after Project Name field closes, before Facility Address)
# Look for the pattern: </div> followed by <div class="field"> with Facility Address
$pattern = '(?s)(</div>\s*</div>\s*<div class="field">\s*<label>Facility Address</label>)'

if ($content -match $pattern) {
    # Insert the Project Type field before Facility Address
    $newContent = $content -replace $pattern, "$projectTypeField`n`n`$1"
    
    # Write the modified content
    Set-Content -Path $htmlFile -Value $newContent -NoNewline
    Write-Host "Successfully added Project Type field to $htmlFile"
    Write-Host "The field has been inserted after the Project Name field and before the Facility Address field."
} else {
    Write-Host "Could not find the insertion point. Trying alternative pattern..."
    
    # Alternative pattern: look for Project Name field closing and Facility Address
    $altPattern = '(?s)(<div class="help">Descriptive name for your analysis project[^<]*</div>\s*</div>\s*<div class="field">\s*<label>Facility Address</label>)'
    
    if ($content -match $altPattern) {
        $newContent = $content -replace $altPattern, "`$1`n`n$projectTypeField"
        Set-Content -Path $htmlFile -Value $newContent -NoNewline
        Write-Host "Successfully added Project Type field to $htmlFile (using alternative pattern)"
    } else {
        Write-Host "ERROR: Could not find insertion point. Please add the field manually."
        Write-Host "Look for the line with 'Facility Address' label and insert the Project Type field before it."
        exit 1
    }
}
