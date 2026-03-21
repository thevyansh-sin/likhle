param(
    [Parameter(Mandatory = $true)]
    [string]$Version,

    [Parameter(Mandatory = $true)]
    [string]$Headline,

    [Parameter(Mandatory = $true)]
    [string[]]$Bullets,

    [Parameter(Mandatory = $true)]
    [string]$Cta,

    [ValidateSet('png', 'jpg')]
    [string]$Format = 'png',

    [string]$OutputName
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
    if ($clean.Length -ne 6) {
        throw "Invalid color hex: $Hex"
    }

    $r = [Convert]::ToInt32($clean.Substring(0, 2), 16)
    $g = [Convert]::ToInt32($clean.Substring(2, 2), 16)
    $b = [Convert]::ToInt32($clean.Substring(4, 2), 16)

    return [System.Drawing.Color]::FromArgb($Alpha, $r, $g, $b)
}

function New-RoundedPath {
    param(
        [Parameter(Mandatory = $true)]
        [System.Drawing.RectangleF]$Rect,
        [float]$Radius
    )

    $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $diameter = $Radius * 2
    $path.AddArc($Rect.X, $Rect.Y, $diameter, $diameter, 180, 90)
    $path.AddArc($Rect.Right - $diameter, $Rect.Y, $diameter, $diameter, 270, 90)
    $path.AddArc($Rect.Right - $diameter, $Rect.Bottom - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($Rect.X, $Rect.Bottom - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()
    return $path
}

function Draw-RoundedPanel {
    param(
        [Parameter(Mandatory = $true)]
        [System.Drawing.Graphics]$Graphics,
        [Parameter(Mandatory = $true)]
        [System.Drawing.RectangleF]$Rect,
        [Parameter(Mandatory = $true)]
        [System.Drawing.Color]$FillColor,
        [Parameter(Mandatory = $true)]
        [System.Drawing.Color]$BorderColor,
        [float]$Radius = 26
    )

    $path = New-RoundedPath -Rect $Rect -Radius $Radius
    $fill = [System.Drawing.SolidBrush]::new($FillColor)
    $pen = [System.Drawing.Pen]::new($BorderColor, 1.4)
    $Graphics.FillPath($fill, $path)
    $Graphics.DrawPath($pen, $path)
    $fill.Dispose()
    $pen.Dispose()
    $path.Dispose()
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
        @{ Alpha = 16; Scale = 3.0 },
        @{ Alpha = 28; Scale = 2.2 },
        @{ Alpha = 42; Scale = 1.6 },
        @{ Alpha = 64; Scale = 1.05 }
    )

    foreach ($layer in $layers) {
        $size = $BaseSize * $layer.Scale
        $brush = [System.Drawing.SolidBrush]::new((New-HexColor -Hex $HexColor -Alpha $layer.Alpha))
        $Graphics.FillEllipse($brush, $CenterX - ($size / 2), $CenterY - ($size / 2), $size, $size)
        $brush.Dispose()
    }
}

function Fit-Font {
    param(
        [Parameter(Mandatory = $true)]
        [System.Drawing.Graphics]$Graphics,
        [Parameter(Mandatory = $true)]
        [string]$Text,
        [Parameter(Mandatory = $true)]
        [string]$FontName,
        [Parameter(Mandatory = $true)]
        [System.Drawing.FontStyle]$Style,
        [float]$MaxSize,
        [float]$MinSize,
        [float]$Width,
        [float]$Height
    )

    for ($size = $MaxSize; $size -ge $MinSize; $size -= 2) {
        $font = [System.Drawing.Font]::new($FontName, $size, $Style, [System.Drawing.GraphicsUnit]::Pixel)
        $measured = $Graphics.MeasureString($Text, $font, [int][Math]::Ceiling($Width))
        if ($measured.Width -le $Width -and $measured.Height -le $Height) {
            return $font
        }
        $font.Dispose()
    }

    return [System.Drawing.Font]::new($FontName, $MinSize, $Style, [System.Drawing.GraphicsUnit]::Pixel)
}

function Convert-ToSlug {
    param([string]$Value)

    $slug = $Value.ToLowerInvariant() -replace '[^a-z0-9]+', '-' -replace '(^-|-$)', ''
    if ([string]::IsNullOrWhiteSpace($slug)) {
        return 'release'
    }

    return $slug
}

function Normalize-Bullets {
    param([string[]]$Values)

    $items = @()
    foreach ($value in $Values) {
        if ([string]::IsNullOrWhiteSpace($value)) {
            continue
        }

        if ($value.Contains('|')) {
            $items += $value.Split('|')
        }
        else {
            $items += $value
        }
    }

    $clean = @()
    foreach ($item in $items) {
        $trimmed = $item.Trim()
        if (-not [string]::IsNullOrWhiteSpace($trimmed)) {
            $clean += $trimmed
        }
    }

    return $clean
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$outputDir = Join-Path $repoRoot 'social-assets\releases'
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$bulletItems = Normalize-Bullets -Values $Bullets
if ($bulletItems.Count -ne 3) {
    throw 'Pass exactly 3 bullets. You can supply them separately or as one string split by |.'
}

$headline = $Headline.Trim()
$ctaText = $Cta.Trim()
$versionText = $Version.Trim()

if (-not $OutputName) {
    $OutputName = "release-{0}-{1}.{2}" -f (Convert-ToSlug $versionText), (Convert-ToSlug $headline), $Format
}
elseif (-not $OutputName.EndsWith(".$Format")) {
    $OutputName = "$OutputName.$Format"
}

$outputPath = Join-Path $outputDir $OutputName

$canvasWidth = 1080
$canvasHeight = 1350

$bgColor = New-HexColor '#080808'
$surfaceColor = New-HexColor '#121317' -Alpha 236
$surfaceBorder = New-HexColor '#2B2D34' -Alpha 180
$textColor = New-HexColor '#F2F3EE'
$mutedTextColor = New-HexColor '#AEB2BA'
$limeColor = New-HexColor '#CAFF00'
$limeSoft = New-HexColor '#CAFF00' -Alpha 60
$labelFill = New-HexColor '#17191E' -Alpha 230
$labelBorder = New-HexColor '#2E3138' -Alpha 180

$bitmap = [System.Drawing.Bitmap]::new($canvasWidth, $canvasHeight)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.Clear($bgColor)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$backgroundRect = [System.Drawing.Rectangle]::new(0, 0, $canvasWidth, $canvasHeight)
$backgroundBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    $backgroundRect,
    (New-HexColor '#111214'),
    $bgColor,
    90
)
$graphics.FillRectangle($backgroundBrush, $backgroundRect)
$backgroundBrush.Dispose()

Draw-Glow -Graphics $graphics -CenterX 850 -CenterY 1114 -BaseSize 96 -HexColor '#CAFF00'
Draw-Glow -Graphics $graphics -CenterX 930 -CenterY 310 -BaseSize 54 -HexColor '#CAFF00'

$lineBrush = [System.Drawing.SolidBrush]::new((New-HexColor '#CAFF00' -Alpha 34))
$graphics.FillRectangle($lineBrush, 96, 1128, 888, 2)
$lineBrush.Dispose()

$labelRect = [System.Drawing.RectangleF]::new(76, 68, 188, 54)
Draw-RoundedPanel -Graphics $graphics -Rect $labelRect -FillColor $labelFill -BorderColor $labelBorder -Radius 22
$labelFont = [System.Drawing.Font]::new('Segoe UI', 18, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$labelBrush = [System.Drawing.SolidBrush]::new($mutedTextColor)
$labelFormat = [System.Drawing.StringFormat]::new()
$labelFormat.Alignment = [System.Drawing.StringAlignment]::Center
$labelFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
$graphics.DrawString('Release post', $labelFont, $labelBrush, $labelRect, $labelFormat)

$versionRect = [System.Drawing.RectangleF]::new(826, 68, 178, 54)
Draw-RoundedPanel -Graphics $graphics -Rect $versionRect -FillColor $labelFill -BorderColor $labelBorder -Radius 22
$versionBrush = [System.Drawing.SolidBrush]::new($limeColor)
$graphics.DrawString($versionText, $labelFont, $versionBrush, $versionRect, $labelFormat)

$siteFont = [System.Drawing.Font]::new('Segoe UI', 26, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$siteBrush = [System.Drawing.SolidBrush]::new($textColor)
$graphics.DrawString('likhle.', $siteFont, $siteBrush, 76, 156)

$headlineRect = [System.Drawing.RectangleF]::new(76, 252, 590, 280)
$headlineFont = Fit-Font -Graphics $graphics -Text $headline -FontName 'Segoe UI Semibold' -Style ([System.Drawing.FontStyle]::Bold) -MaxSize 92 -MinSize 52 -Width $headlineRect.Width -Height $headlineRect.Height
$headlineBrush = [System.Drawing.SolidBrush]::new($textColor)
$headlineFormat = [System.Drawing.StringFormat]::new()
$headlineFormat.Alignment = [System.Drawing.StringAlignment]::Near
$headlineFormat.LineAlignment = [System.Drawing.StringAlignment]::Near
$graphics.DrawString($headline, $headlineFont, $headlineBrush, $headlineRect, $headlineFormat)

$bulletStartY = 640
$bulletHeight = 108
$bulletGap = 20
$bulletWidth = 556
$bulletFont = [System.Drawing.Font]::new('Segoe UI', 26, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$bulletBrush = [System.Drawing.SolidBrush]::new($textColor)
$bulletPanelFill = New-HexColor '#15171B' -Alpha 226
$bulletPanelBorder = New-HexColor '#2D3037' -Alpha 170

for ($index = 0; $index -lt 3; $index++) {
    $y = $bulletStartY + (($bulletHeight + $bulletGap) * $index)
    $bulletRect = [System.Drawing.RectangleF]::new(76, $y, $bulletWidth, $bulletHeight)
    Draw-RoundedPanel -Graphics $graphics -Rect $bulletRect -FillColor $bulletPanelFill -BorderColor $bulletPanelBorder -Radius 28

    $accentBrush = [System.Drawing.SolidBrush]::new($limeColor)
    $graphics.FillEllipse($accentBrush, 104, $y + 39, 24, 24)
    $accentBrush.Dispose()

    $textRect = [System.Drawing.RectangleF]::new(148, $y + 26, 450, 56)
    $graphics.DrawString($bulletItems[$index], $bulletFont, $bulletBrush, $textRect, $headlineFormat)
}

$ctaRect = [System.Drawing.RectangleF]::new(76, 1180, 304, 86)
Draw-RoundedPanel -Graphics $graphics -Rect $ctaRect -FillColor $surfaceColor -BorderColor $limeSoft -Radius 30
$ctaFont = [System.Drawing.Font]::new('Segoe UI', 26, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$ctaBrush = [System.Drawing.SolidBrush]::new($textColor)
$ctaFormat = [System.Drawing.StringFormat]::new()
$ctaFormat.Alignment = [System.Drawing.StringAlignment]::Center
$ctaFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
$graphics.DrawString($ctaText, $ctaFont, $ctaBrush, $ctaRect, $ctaFormat)

$brandIconPath = Join-Path $repoRoot 'public\icons\icon-512.png'
if (Test-Path $brandIconPath) {
    $icon = [System.Drawing.Image]::FromFile($brandIconPath)
    $iconRect = [System.Drawing.Rectangle]::new(704, 322, 272, 272)
    $graphics.DrawImage($icon, $iconRect)
    $icon.Dispose()
}

$footerFont = [System.Drawing.Font]::new('Segoe UI', 18, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$footerBrush = [System.Drawing.SolidBrush]::new($mutedTextColor)
$graphics.DrawString('Dark matte release exporter for socials', $footerFont, $footerBrush, 76, 1088)

if ($Format -eq 'png') {
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
}
else {
    $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $encoderParams = [System.Drawing.Imaging.EncoderParameters]::new(1)
    $encoderParams.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality, 95L)
    $bitmap.Save($outputPath, $encoder, $encoderParams)
    $encoderParams.Dispose()
}

$footerBrush.Dispose()
$footerFont.Dispose()
$versionBrush.Dispose()
$ctaBrush.Dispose()
$ctaFont.Dispose()
$bulletBrush.Dispose()
$bulletFont.Dispose()
$headlineBrush.Dispose()
$headlineFont.Dispose()
$siteBrush.Dispose()
$siteFont.Dispose()
$labelBrush.Dispose()
$labelFont.Dispose()
$labelFormat.Dispose()
$headlineFormat.Dispose()
$ctaFormat.Dispose()
$graphics.Dispose()
$bitmap.Dispose()

Write-Output "Saved release post to: $outputPath"
