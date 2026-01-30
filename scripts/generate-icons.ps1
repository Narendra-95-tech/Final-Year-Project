# PWA Icon Generation Script
# This script creates all required icon sizes from the base 512x512 icon

Write-Host "🎨 Generating PWA Icons..." -ForegroundColor Cyan

$sourceIcon = "public\images\icon-512.png"
$sizes = @(72, 96, 128, 144, 152, 192, 384)

# Check if ImageMagick or similar tool is available
# For now, we'll copy the 512px icon to all sizes
# In production, you should use proper image resizing

foreach ($size in $sizes) {
    $targetPath = "public\images\icon-$size.png"
    Write-Host "Creating $targetPath..." -ForegroundColor Yellow
    Copy-Item $sourceIcon -Destination $targetPath -Force
}

Write-Host "✅ Icon generation complete!" -ForegroundColor Green
Write-Host "⚠️  Note: All icons are currently 512x512. Use an image editor or ImageMagick to resize them properly." -ForegroundColor Yellow
