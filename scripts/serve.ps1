# Deniz Codex - Local Development HTTP Server with Video Range Support
# Run in PowerShell: .\scripts\serve.ps1

param (
    [int]$Port = 8080
)

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")

try {
    $listener.Start()
} catch {
    Write-Host "Port $Port is busy or unavailable. Trying port 8081..." -ForegroundColor Yellow
    $Port = 8081
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$Port/")
    $listener.Start()
}

Write-Host "==========================================" -ForegroundColor DarkYellow
Write-Host " Deniz Codex Local Server Running" -ForegroundColor Green
Write-Host " URL: http://localhost:$Port/" -ForegroundColor Cyan
Write-Host " Press Ctrl+C in this terminal to stop" -ForegroundColor Gray
Write-Host "==========================================" -ForegroundColor DarkYellow

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".webm" = "video/webm"
    ".mp4"  = "video/mp4"
    ".md"   = "text/markdown; charset=utf-8"
}

$root = (Get-Item .).FullName

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $rawUrl = $request.Url.LocalPath
        if ($rawUrl -eq "/" -or $rawUrl -eq "") {
            $rawUrl = "/index.html"
        }

        $decodedPath = [System.Uri]::UnescapeDataString($rawUrl.TrimStart('/'))
        $filePath = [System.IO.Path]::Combine($root, $decodedPath)

        if ([System.IO.File]::Exists($filePath)) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = $mimeTypes[$ext]
            if (-not $mime) { $mime = "application/octet-stream" }

            $fileInfo = New-Object System.IO.FileInfo($filePath)
            $fileLength = $fileInfo.Length

            $response.ContentType = $mime
            $response.AddHeader("Accept-Ranges", "bytes")
            $response.AddHeader("Access-Control-Allow-Origin", "*")

            $rangeHeader = $request.Headers["Range"]
            if ($rangeHeader -and $rangeHeader.StartsWith("bytes=")) {
                $range = $rangeHeader.Substring(6).Split('-')
                $start = [long]::Parse($range[0])
                $end = if ($range.Length -gt 1 -and $range[1] -ne "") { [long]::Parse($range[1]) } else { $fileLength - 1 }
                if ($end -ge $fileLength) { $end = $fileLength - 1 }
                $count = $end - $start + 1

                $response.StatusCode = 206
                $response.AddHeader("Content-Range", "bytes $start-$end/$fileLength")
                $response.ContentLength64 = $count

                if ($request.HttpMethod -ne "HEAD") {
                    $fs = [System.IO.File]::OpenRead($filePath)
                    $fs.Seek($start, [System.IO.SeekOrigin]::Begin) | Out-Null
                    $buffer = New-Object byte[] 65536
                    $bytesRemaining = $count
                    while ($bytesRemaining -gt 0) {
                        $bytesToRead = [Math]::Min(65536, $bytesRemaining)
                        $read = $fs.Read($buffer, 0, $bytesToRead)
                        if ($read -le 0) { break }
                        $response.OutputStream.Write($buffer, 0, $read)
                        $bytesRemaining -= $read
                    }
                    $fs.Close()
                }
            } else {
                $response.StatusCode = 200
                $response.ContentLength64 = $fileLength

                if ($request.HttpMethod -ne "HEAD") {
                    $bytes = [System.IO.File]::ReadAllBytes($filePath)
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                }
            }
        } else {
            $response.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $decodedPath")
            $response.ContentLength64 = $msg.Length
            if ($request.HttpMethod -ne "HEAD") {
                $response.OutputStream.Write($msg, 0, $msg.Length)
            }
        }
        $response.Close()
    } catch {
        # Continue on any connection drop
    }
}
