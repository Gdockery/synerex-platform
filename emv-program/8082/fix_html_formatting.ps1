# Fix HTML formatting issue
$htmlFile = "html_body.html"
$content = Get-Content $htmlFile -Raw

# Fix the missing closing div tags
$content = $content -replace 'Manufacturing Facility Energy Analysis"\s+<div class="field">', "Manufacturing Facility Energy Analysis`"</div>`n        </div>`n        <div class=`"field`">"

Set-Content -Path $htmlFile -Value $content -NoNewline
Write-Host "Fixed HTML formatting in $htmlFile"
