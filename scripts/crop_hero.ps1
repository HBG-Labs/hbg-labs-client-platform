Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\HBZ\.gemini\antigravity-ide\brain\1a8b5db9-b4bd-4dbd-b9f9-406051d15170\.user_uploaded\media_1788241193515.jpg"
$destPath = "c:\Users\HBZ\Documents\HBG LABS CLIENT PLATFORM\public\images\showcase\soie-et-terre-hero.jpg"

$src = [System.Drawing.Image]::FromFile($sourcePath)
Write-Host "Source Dimensions: $($src.Width) x $($src.Height)"

# Crop the hero section from the browser mockup screenshot
# The Safari window header is top ~42px, the hero ends around y ~ 825px
# The inner content is between left ~30px and right ~src.Width - 30px
$cropX = [int]($src.Width * 0.03)
$cropY = [int]($src.Height * 0.076)
$cropWidth = [int]($src.Width * 0.94)
$cropHeight = [int]($src.Height * 0.748)

$rect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropWidth, $cropHeight)
$bmp = New-Object System.Drawing.Bitmap($cropWidth, $cropHeight)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($src, 0, 0, $rect, [System.Drawing.GraphicsUnit]::Pixel)

$bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)

$g.Dispose()
$bmp.Dispose()
$src.Dispose()

Write-Host "Saved cropped hero to $destPath"
