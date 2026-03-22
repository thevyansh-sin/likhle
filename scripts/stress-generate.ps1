param(
  [string]$BaseUrl = "http://127.0.0.1:3001",
  [int]$Iterations = 18,
  [int]$DelayMs = 1200,
  [int]$TimeoutSeconds = 90,
  [string]$OwnerSecret = "",
  [string]$OutputDir = "test-results/stress"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Path $PSScriptRoot -Parent
$normalizedBaseUrl = $BaseUrl.TrimEnd("/")
$resolvedOutputDir = if ([System.IO.Path]::IsPathRooted($OutputDir)) {
  $OutputDir
} else {
  Join-Path $projectRoot $OutputDir
}

New-Item -ItemType Directory -Force -Path $resolvedOutputDir | Out-Null

$cookieJarPath = Join-Path $resolvedOutputDir "cookies.txt"
$summaryJsonPath = Join-Path $resolvedOutputDir "summary.json"
$summaryJsonlPath = Join-Path $resolvedOutputDir "summary.jsonl"

if (Test-Path $summaryJsonlPath) {
  Remove-Item $summaryJsonlPath -Force
}

$cases = @(
  @{
    Name = "insta-aesthetic"
    Fields = @{
      input = "Goa sunset photo. Make it aesthetic, warm, and not cringe."
      tone = "Aesthetic"
      platform = "Instagram Caption"
      length = "Medium"
      count = "3"
      hashtags = "true"
      emoji = "false"
      hinglish = "false"
    }
  },
  @{
    Name = "funny-party"
    Fields = @{
      input = "Getting ready to party with my squad tonight. Make it funny."
      tone = "Funny"
      platform = "Instagram Caption"
      length = "Medium"
      count = "3"
      hashtags = "true"
      emoji = "true"
      hinglish = "false"
    }
  },
  @{
    Name = "desi-status"
    Fields = @{
      input = "Need a Hinglish WhatsApp status for exam week stress."
      tone = "Desi"
      platform = "WhatsApp Status"
      length = "Short"
      count = "3"
      hashtags = "false"
      emoji = "false"
      hinglish = "true"
    }
  },
  @{
    Name = "linkedin-update"
    Fields = @{
      input = "Fresh placement post for LinkedIn after landing a software internship."
      tone = "Professional"
      platform = "LinkedIn Bio"
      length = "Medium"
      count = "3"
      hashtags = "false"
      emoji = "false"
      hinglish = "false"
    }
  },
  @{
    Name = "reels-hook"
    Fields = @{
      input = "Need a strong reels hook for a gym transformation video."
      tone = "Motivational"
      platform = "Reels Hook"
      length = "Short"
      count = "3"
      hashtags = "true"
      emoji = "false"
      hinglish = "false"
    }
  },
  @{
    Name = "bio-romantic"
    Fields = @{
      input = "Instagram bio for a girl from Goa who loves books, beaches, and soft romance."
      tone = "Romantic"
      platform = "Instagram Bio"
      length = "Short"
      count = "3"
      hashtags = "false"
      emoji = "true"
      hinglish = "false"
    }
  }
)

function New-CurlResultRecord {
  param(
    [string]$CaseName,
    [int]$Iteration,
    [string]$Url,
    [string]$ResponseFile,
    [string]$HeadersFile,
    [string]$CurlMetadata,
    [int]$CurlExitCode,
    [string]$CurlErrorText
  )

  $statusCode = $null
  $timeTotalSeconds = $null
  $sizeBytes = $null

  if ($CurlMetadata -match "^(?<status>\d{3})\|(?<time>[\d.]+)\|(?<size>\d+)$") {
    $statusCode = [int]$Matches.status
    $timeTotalSeconds = [double]$Matches.time
    $sizeBytes = [int]$Matches.size
  }

  $rawBody = if (Test-Path $ResponseFile) {
    Get-Content -Path $ResponseFile -Raw
  } else {
    ""
  }

  $parsedBody = $null

  if ($rawBody) {
    try {
      $parsedBody = $rawBody | ConvertFrom-Json
    } catch {
      $parsedBody = $null
    }
  }

  $resultsCount = if ($parsedBody -and $parsedBody.results) {
    @($parsedBody.results).Count
  } else {
    0
  }

  $errorText = if ($parsedBody -and $parsedBody.error) {
    [string]$parsedBody.error
  } elseif ($CurlErrorText) {
    $CurlErrorText.Trim()
  } else {
    ""
  }

  return [ordered]@{
    iteration = $Iteration
    case = $CaseName
    url = $Url
    status = $statusCode
    curlExitCode = $CurlExitCode
    timeTotalSeconds = $timeTotalSeconds
    sizeBytes = $sizeBytes
    resultsCount = $resultsCount
    success = ($CurlExitCode -eq 0 -and $statusCode -ge 200 -and $statusCode -lt 300 -and $resultsCount -gt 0)
    error = $errorText
    responseFile = $ResponseFile
    headersFile = $HeadersFile
  }
}

function Invoke-CurlRequest {
  param(
    [string[]]$Arguments
  )

  $rawOutput = & curl.exe @Arguments 2>&1
  $exitCode = $LASTEXITCODE
  $outputText = ($rawOutput | Out-String).Trim()
  $markerLine = ($outputText -split "\r?\n" | Where-Object { $_ -like "__CURL_RESULT__=*" } | Select-Object -Last 1)
  $curlMetadata = ""

  if ($markerLine) {
    $curlMetadata = $markerLine.Substring("__CURL_RESULT__=".Length)
    $outputText = ($outputText -split "\r?\n" | Where-Object { $_ -notlike "__CURL_RESULT__=*" }) -join [Environment]::NewLine
  }

  return @{
    ExitCode = $exitCode
    Metadata = $curlMetadata
    ErrorText = $outputText
  }
}

function Invoke-OwnerUnlock {
  param(
    [string]$Secret
  )

  if (-not $Secret) {
    return $false
  }

  $unlockHeadersPath = Join-Path $resolvedOutputDir "owner-unlock-headers.txt"
  $unlockResponsePath = Join-Path $resolvedOutputDir "owner-unlock-response.json"
  $unlockBody = @{ secret = $Secret } | ConvertTo-Json -Compress
  $unlockArgs = @(
    "--silent",
    "--show-error",
    "--location",
    "--max-time",
    "30",
    "--connect-timeout",
    "10",
    "-c",
    $cookieJarPath,
    "-b",
    $cookieJarPath,
    "-D",
    $unlockHeadersPath,
    "-o",
    $unlockResponsePath,
    "-w",
    "__CURL_RESULT__=%{http_code}|%{time_total}|%{size_download}",
    "-X",
    "POST",
    "-H",
    "Content-Type: application/json",
    "--data-raw",
    $unlockBody,
    "$normalizedBaseUrl/api/owner/unlock"
  )
  $unlockResult = Invoke-CurlRequest -Arguments $unlockArgs
  $unlockRecord = New-CurlResultRecord `
    -CaseName "owner-unlock" `
    -Iteration 0 `
    -Url "$normalizedBaseUrl/api/owner/unlock" `
    -ResponseFile $unlockResponsePath `
    -HeadersFile $unlockHeadersPath `
    -CurlMetadata $unlockResult.Metadata `
    -CurlExitCode $unlockResult.ExitCode `
    -CurlErrorText $unlockResult.ErrorText

  $unlockRecord | ConvertTo-Json -Compress | Add-Content -Path $summaryJsonlPath

  return [bool]$unlockRecord.success
}

if ($Iterations -lt 1) {
  Write-Host "Stress runner is wired. Output directory: $resolvedOutputDir"
  exit 0
}

$ownerModeActive = Invoke-OwnerUnlock -Secret $OwnerSecret
$records = New-Object System.Collections.Generic.List[object]

for ($iteration = 1; $iteration -le $Iterations; $iteration += 1) {
  $case = $cases[($iteration - 1) % $cases.Count]
  $caseName = [string]$case.Name
  $responsePath = Join-Path $resolvedOutputDir ("response-{0:D3}.json" -f $iteration)
  $headersPath = Join-Path $resolvedOutputDir ("headers-{0:D3}.txt" -f $iteration)
  $curlArgs = @(
    "--silent",
    "--show-error",
    "--location",
    "--max-time",
    "$TimeoutSeconds",
    "--connect-timeout",
    "15",
    "-c",
    $cookieJarPath,
    "-b",
    $cookieJarPath,
    "-D",
    $headersPath,
    "-o",
    $responsePath,
    "-w",
    "__CURL_RESULT__=%{http_code}|%{time_total}|%{size_download}",
    "-X",
    "POST",
    "$normalizedBaseUrl/api/generate"
  )

  foreach ($field in $case.Fields.GetEnumerator()) {
    $curlArgs += @("-F", "$($field.Key)=$($field.Value)")
  }

  $curlResult = Invoke-CurlRequest -Arguments $curlArgs
  $record = New-CurlResultRecord `
    -CaseName $caseName `
    -Iteration $iteration `
    -Url "$normalizedBaseUrl/api/generate" `
    -ResponseFile $responsePath `
    -HeadersFile $headersPath `
    -CurlMetadata $curlResult.Metadata `
    -CurlExitCode $curlResult.ExitCode `
    -CurlErrorText $curlResult.ErrorText

  $records.Add($record) | Out-Null
  $record | ConvertTo-Json -Compress | Add-Content -Path $summaryJsonlPath

  $statusLabel = if ($record.success) { "OK" } else { "FAIL" }
  $timeLabel = if ($null -ne $record.timeTotalSeconds) {
    "{0:N2}s" -f $record.timeTotalSeconds
  } else {
    "n/a"
  }

  Write-Host ("[{0}/{1}] {2} {3} {4} results={5}" -f $iteration, $Iterations, $statusLabel, $caseName, $timeLabel, $record.resultsCount)

  if ($record.error) {
    Write-Host ("  error: {0}" -f $record.error)
  }

  if ($DelayMs -gt 0 -and $iteration -lt $Iterations) {
    Start-Sleep -Milliseconds $DelayMs
  }
}

$summary = [ordered]@{
  generatedAt = (Get-Date).ToString("o")
  baseUrl = $normalizedBaseUrl
  ownerModeActive = $ownerModeActive
  iterations = $Iterations
  successCount = @($records | Where-Object { $_.success }).Count
  failureCount = @($records | Where-Object { -not $_.success }).Count
  averageTimeSeconds = if (($records | Where-Object { $null -ne $_.timeTotalSeconds }).Count -gt 0) {
    [Math]::Round(
      (($records | Where-Object { $null -ne $_.timeTotalSeconds } | Measure-Object -Property timeTotalSeconds -Average).Average),
      2
    )
  } else {
    0
  }
  outputDir = $resolvedOutputDir
  cases = $records
}

$summary | ConvertTo-Json -Depth 6 | Set-Content -Path $summaryJsonPath

Write-Host ""
Write-Host ("Completed {0} runs. Success={1} Failure={2}" -f $summary.iterations, $summary.successCount, $summary.failureCount)
Write-Host ("Summary: {0}" -f $summaryJsonPath)
