# Fix HTML formatting issue - more precise
$htmlFile = "html_body.html"
$content = Get-Content $htmlFile -Raw

# Fix the missing closing div tags - look for the exact pattern
$oldPattern = '"Manufacturing Facility Energy Analysis"        <div class="field">'
$newPattern = '"Manufacturing Facility Energy Analysis"</div>`n        </div>`n        <div class="field">'

if ($content -match [regex]::Escape($oldPattern)) {
    $content = $content -replace [regex]::Escape($oldPattern), $newPattern
    Set-Content -Path $htmlFile -Value $content -NoNewline
    Write-Host "Fixed HTML formatting in $htmlFile"
} else {
    Write-Host "Pattern not found. Current content around that area:"
    $content -match '(?s).{0,200}Manufacturing Facility.{0,100}' | Out-Null
    Write-Host $matches[0]
}
