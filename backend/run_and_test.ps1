# Start uvicorn as a background process and run mock submission test
$cwd = Split-Path -Parent $MyInvocation.MyCommand.Definition
Push-Location $cwd

Write-Output "Starting uvicorn in background..."
$uv = Start-Process -FilePath "uvicorn" -ArgumentList "server:app --reload --host 127.0.0.1 --port 8000" -NoNewWindow -PassThru

# wait for server to be ready
$uri = "http://127.0.0.1:8000"
$max = 20
$i = 0
while ($i -lt $max) {
    try {
        Invoke-RestMethod -Uri "$uri/" -Method Get -TimeoutSec 2 | Out-Null
        break
    } catch {
        Start-Sleep -Seconds 1
        $i++
    }
}
if ($i -ge $max) { Write-Error "Backend didn't start after waiting"; $uv.Kill(); Pop-Location; exit 1 }
Write-Output "Backend is up (waited $i seconds)"

# Register trainer
$trainer = @{ first_name = "Trainer"; last_name = "One"; email = "trainer@example.com"; password = "pass"; role = "trainer" } | ConvertTo-Json -Depth 5
Write-Output "Registering trainer..."
try {
    $rt = Invoke-RestMethod -Uri "$uri/register" -Method Post -Body $trainer -ContentType "application/json"
    Write-Output "Trainer register response: $($rt | ConvertTo-Json -Depth 5)"
} catch {
    Write-Output "Trainer register failed: $_"
}

# Fetch trainer code
try {
    $tc = Invoke-RestMethod -Uri "$uri/trainercode?code=foo&email=trainer@example.com" -Method Get
    Write-Output "Trainer code response: $($tc | ConvertTo-Json -Depth 5)"
    $code = $tc.trainer_code
    Write-Output "Using trainers_code: $code"
} catch {
    Write-Error "Failed to fetch trainer code: $_"
    $uv.Kill()
    Pop-Location
    exit 1
}

# Register client
$client = @{ first_name = "Test"; last_name = "Client"; email = "testclient@example.com"; password = "pass"; role = "client" } | ConvertTo-Json -Depth 5
Write-Output "Registering client..."
try {
    $rc = Invoke-RestMethod -Uri "$uri/register" -Method Post -Body $client -ContentType "application/json"
    Write-Output "Client register response: $($rc | ConvertTo-Json -Depth 5)"
} catch {
    Write-Output "Client register failed: $_"
}

# Submit form
$payload = @{ email = "testclient@example.com"; trainer_code = $code; form_id = "form-mock-1"; values = @{ "field-1" = "Alice"; "field-2" = "alice@example.com"; "note" = "hello" } } | ConvertTo-Json -Depth 10
Write-Output "Submitting mock form..."
try {
    $sub = Invoke-RestMethod -Uri "$uri/form-submit-client" -Method Post -Body $payload -ContentType "application/json"
    Write-Output "Form submit response: $($sub | ConvertTo-Json -Depth 5)"
} catch {
    Write-Error "Form submit failed: $_"
}

# Fetch submissions
try {
    $subs = Invoke-RestMethod -Uri "$uri/api/form-submissions?trainers_code=$code" -Method Get
    Write-Output "Submissions: $($subs | ConvertTo-Json -Depth 10)"
} catch {
    Write-Error "Fetch submissions failed: $_"
}

# Cleanup: stop uvicorn
if ($uv -and -not $uv.HasExited) {
    Write-Output "Stopping uvicorn (pid $($uv.Id))"
    $uv.Kill()
}
Pop-Location
