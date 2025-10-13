Add-Type -AssemblyName System.Drawing
Add-Type -Namespace Win32 -Name NativeMethods -MemberDefinition @"
    [System.Runtime.InteropServices.DllImport("user32.dll")]
    public static extern bool DestroyIcon(System.IntPtr handle);
"@

$size = 64
$primaryColor = [System.Drawing.Color]::FromArgb(29, 78, 216)

$bitmap = New-Object System.Drawing.Bitmap $size, $size
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.Clear([System.Drawing.Color]::White)

$pen = New-Object System.Drawing.Pen $primaryColor, 5
$pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

# Central column and arms
$graphics.DrawLine($pen, 32, 10, 32, 40)
$graphics.DrawLine($pen, 20, 22, 44, 22)
$graphics.DrawLine($pen, 32, 10, 26, 4)
$graphics.DrawLine($pen, 32, 10, 38, 4)

# Base
$graphics.DrawLine($pen, 24, 50, 40, 50)

# Left scale triangle
$leftPoints = @(
    [System.Drawing.PointF]::new(20, 22),
    [System.Drawing.PointF]::new(12, 34),
    [System.Drawing.PointF]::new(28, 34),
    [System.Drawing.PointF]::new(20, 22)
)
$graphics.DrawLines($pen, $leftPoints)

# Right scale triangle
$rightPoints = @(
    [System.Drawing.PointF]::new(44, 22),
    [System.Drawing.PointF]::new(36, 34),
    [System.Drawing.PointF]::new(52, 34),
    [System.Drawing.PointF]::new(44, 22)
)
$graphics.DrawLines($pen, $rightPoints)

# Left bowl curve
$graphics.DrawBezier($pen, 14, 36, 20, 46, 20, 46, 26, 36)
# Right bowl curve
$graphics.DrawBezier($pen, 38, 36, 44, 46, 44, 46, 50, 36)

$bitmapPath = Join-Path (Get-Item ..).FullName 'public/favicon.png'
$bitmap.Save($bitmapPath, [System.Drawing.Imaging.ImageFormat]::Png)

$iconPath = Join-Path (Get-Item ..).FullName 'public/favicon.ico'
$hIcon = $bitmap.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$stream = [System.IO.File]::Create($iconPath)
$icon.Save($stream)
$stream.Dispose()
[Win32.NativeMethods]::DestroyIcon($hIcon) | Out-Null
$icon.Dispose()

$pen.Dispose()
$graphics.Dispose()
$bitmap.Dispose()
