$files = Get-ChildItem -Path "C:\Users\User\OneDrive\Desktop\shopify-hub" -Filter *.html
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $content = $content -replace 'https://shopify\.pxf\.io/yourafflink', 'https://shopify.pxf.io/Qj5oDz'
    Set-Content $file.FullName -Value $content -NoNewline
    Write-Host "Updated: $($file.Name)"
}

$mdfiles = Get-ChildItem -Path "C:\Users\User\OneDrive\Desktop\shopify-hub" -Filter *.md
foreach ($file in $mdfiles) {
    $content = Get-Content $file.FullName -Raw
    $content = $content -replace 'https://shopify\.pxf\.io/yourafflink', 'https://shopify.pxf.io/Qj5oDz'
    $content = $content -replace '\[YOUR ACTUAL URL\]', 'https://shopify-success-hub.onrender.com'
    $content = $content -replace '\[YOUR SITE URL\]', 'https://shopify-success-hub.onrender.com'
    $content = $content -replace '\[YOUR RENDER URL\]', 'https://shopify-success-hub.onrender.com'
    $content = $content -replace '\[URL\]', 'https://shopify-success-hub.onrender.com'
    Set-Content $file.FullName -Value $content -NoNewline
    Write-Host "Updated: $($file.Name)"
}

Write-Host "`nAll affiliate links updated successfully!"
