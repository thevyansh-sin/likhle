param(
    [string]$OutputName = 'likhle-facebook-cover-v0-3-7.png'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

function New-HexColor {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Hex,
        [int]$Alpha = 255
    )

    $clean = $Hex.TrimStart('#')
    $r = [Convert]::ToInt32($clean.Substring(0, 2), 16)
    $g = [Convert]::ToInt32($clean.Substring(2, 2), 16)
    $b = [Convert]::ToInt32($clean.Substring(4, 2), 16)

    return [System.Drawing.Color]::FromArgb($Alpha, $r, $g, $b)
}

function Draw-Glow {
    param(
        [Parameter(Mandatory = $true)]
        [System.Drawing.Graphics]$Graphics,
        [float]$CenterX,
        [float]$CenterY,
        [float]$BaseSize,
        [string]$HexColor
    )

    $layers = @(
        @{ Alpha = 20; Scale = 3.8 },
        @{ Alpha = 36; Scale = 2.5 },
        @{ Alpha = 58; Scale = 1.5 }
    )

    foreach ($layer in $layers) {
        $size = $BaseSize * $layer.Scale
        $brush = [System.Drawing.SolidBrush]::new((New-HexColor -Hex $HexColor -Alpha $layer.Alpha))
        $Graphics.FillEllipse($brush, $CenterX - ($size / 2), $CenterY - ($size / 2), $size, $size)
        $brush.Dispose()
    }
}

function Draw-Chip {
    param(
        [Parameter(Mandatory = $true)]
        [System.Drawing.Graphics]$Graphics,
        [Parameter(Mandatory = $true)]
        [string]$Text,
        [float]$X,
        [float]$Y,
        [float]$Width,
        [float]$Height,
        [System.Drawing.Color]$FillColor,
        [System.Drawing.Color]$BorderColor,
        [System.Drawing.Color]$TextColor
    )

    $rect = [System.Drawing.RectangleF]::new($X, $Y, $Width, $Height)
    $radius = 20
    $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $diameter = $radius * 2
    $path.AddArc($rect.X, $rect.Y, $diameter, $diameter, 180, 90)
    $path.AddArc($rect.Right - $diameter, $rect.Y, $diameter, $diameter, 270, 90)
    $path.AddArc($rect.Right - $diameter, $rect.Bottom - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()

    $fill = [System.Drawing.SolidBrush]::new($FillColor)
    $pen = [System.Drawing.Pen]::new($BorderColor, 1.2)
    $font = [System.Drawing.Font]::new('Segoe UI', 18, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $brush = [System.Drawing.SolidBrush]::new($TextColor)
    $format = [System.Drawing.StringFormat]::new()
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center

    $Graphics.FillPath($fill, $path)
    $Graphics.DrawPath($pen, $path)
    $Graphics.DrawString($Text, $font, $brush, $rect, $format)

    $fill.Dispose()
    $pen.Dispose()
    $font.Dispose()
    $brush.Dispose()
    $format.Dispose()
    $path.Dispose()
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$outputDir = Join-Path $repoRoot 'social-assets\facebook'
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$outputPath = Join-Path $outputDir $OutputName

$width = 1640
$height = 624

$bitmap = [System.Drawing.Bitmap]::new($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$bg = New-HexColor '#080808'
$surface = New-HexColor '#111214' -Alpha 230
$surfaceBorder = New-HexColor '#2B2D34' -Alpha 180
$text = New-HexColor '#F2F3EE'
$muted = New-HexColor '#AEB2BA'
$lime = New-HexColor '#CAFF00'
$limeSoft = New-HexColor '#CAFF00' -Alpha 42

$graphics.Clear($bg)

$backgroundRect = [System.Drawing.Rectangle]::new(0, 0, $width, $height)
$backgroundBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    $backgroundRect,
    (New-HexColor '#101114'),
    $bg,
    0
)
$graphics.FillRectangle($backgroundBrush, $backgroundRect)
$backgroundBrush.Dispose()

Draw-Glow -Graphics $graphics -CenterX 1290 -CenterY 210 -BaseSize 108 -HexColor '#CAFF00'
Draw-Glow -Graphics $graphics -CenterX 1385 -CenterY 380 -BaseSize 80 -HexColor '#CAFF00'

$lineBrush = [System.Drawing.SolidBrush]::new((New-HexColor '#CAFF00' -Alpha 28))
$graphics.FillRectangle($lineBrush, 84, 540, 1470, 2)
$lineBrush.Dispose()

$brandFont = [System.Drawing.Font]::new('Segoe UI', 34, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$headlineFont = [System.Drawing.Font]::new('Segoe UI Semibold', 78, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$subFont = [System.Drawing.Font]::new('Segoe UI', 28, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$smallFont = [System.Drawing.Font]::new('Segoe UI', 18, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)

$textBrush = [System.Drawing.SolidBrush]::new($text)
$mutedBrush = [System.Drawing.SolidBrush]::new($muted)
$limeBrush = [System.Drawing.SolidBrush]::new($lime)

$graphics.DrawString('likhle', $brandFont, $textBrush, 92, 74)
$graphics.DrawString('.', $brandFont, $limeBrush, 182, 74)

$headline1Rect = [System.Drawing.RectangleF]::new(92, 162, 760, 110)
$headline2Rect = [System.Drawing.RectangleF]::new(92, 246, 860, 110)
$headline3Rect = [System.Drawing.RectangleF]::new(92, 330, 760, 110)
$graphics.DrawString('Writing for how', $headlineFont, $textBrush, $headline1Rect)
$graphics.DrawString('India actually', $headlineFont, $textBrush, $headline2Rect)
$graphics.DrawString('posts online', $headlineFont, $textBrush, $headline3Rect)

$subRect = [System.Drawing.RectangleF]::new(96, 454, 820, 64)
$graphics.DrawString('Captions, bios, hooks, statuses, and natural Hinglish.', $subFont, $mutedBrush, $subRect)

$panelRect = [System.Drawing.RectangleF]::new(1110, 86, 372, 372)
$path = [System.Drawing.Drawing2D.GraphicsPath]::new()
$radius = 32
$diameter = $radius * 2
$path.AddArc($panelRect.X, $panelRect.Y, $diameter, $diameter, 180, 90)
$path.AddArc($panelRect.Right - $diameter, $panelRect.Y, $diameter, $diameter, 270, 90)
$path.AddArc($panelRect.Right - $diameter, $panelRect.Bottom - $diameter, $diameter, $diameter, 0, 90)
$path.AddArc($panelRect.X, $panelRect.Bottom - $diameter, $diameter, $diameter, 90, 90)
$path.CloseFigure()
$panelFill = [System.Drawing.SolidBrush]::new($surface)
$panelPen = [System.Drawing.Pen]::new($surfaceBorder, 1.4)
$graphics.FillPath($panelFill, $path)
$graphics.DrawPath($panelPen, $path)
$panelFill.Dispose()
$panelPen.Dispose()
$path.Dispose()

$iconPath = Join-Path $repoRoot 'public\icons\icon-512.png'
if (Test-Path $iconPath) {
    $icon = [System.Drawing.Image]::FromFile($iconPath)
    $graphics.DrawImage($icon, 1160, 134, 274, 274)
    $icon.Dispose()
}

Draw-Chip -Graphics $graphics -Text 'Captions' -X 92 -Y 560 -Width 136 -Height 42 -FillColor (New-HexColor '#15171B' -Alpha 232) -BorderColor $surfaceBorder -TextColor $text
Draw-Chip -Graphics $graphics -Text 'Bios' -X 240 -Y 560 -Width 96 -Height 42 -FillColor (New-HexColor '#15171B' -Alpha 232) -BorderColor $surfaceBorder -TextColor $text
Draw-Chip -Graphics $graphics -Text 'Hooks' -X 348 -Y 560 -Width 110 -Height 42 -FillColor (New-HexColor '#15171B' -Alpha 232) -BorderColor $surfaceBorder -TextColor $text
Draw-Chip -Graphics $graphics -Text 'Statuses' -X 470 -Y 560 -Width 140 -Height 42 -FillColor (New-HexColor '#15171B' -Alpha 232) -BorderColor $surfaceBorder -TextColor $text
Draw-Chip -Graphics $graphics -Text 'Hinglish' -X 622 -Y 560 -Width 138 -Height 42 -FillColor (New-HexColor '#CAFF00' -Alpha 255) -BorderColor $limeSoft -TextColor (New-HexColor '#080808')

$graphics.DrawString('Premium creator writing tool for Gen Z India', $smallFont, $mutedBrush, 1120, 488)

$bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$smallFont.Dispose()
$subFont.Dispose()
$headlineFont.Dispose()
$brandFont.Dispose()
$textBrush.Dispose()
$mutedBrush.Dispose()
$limeBrush.Dispose()
$graphics.Dispose()
$bitmap.Dispose()

Write-Output "Saved Facebook cover to: $outputPath"
