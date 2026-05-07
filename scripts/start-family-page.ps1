$ErrorActionPreference = 'Continue'

$Root = 'C:\Users\온유\Workspace\New project 2'
$Backend = Join-Path $Root 'backend'
$Frontend = Join-Path $Root 'frontend'
$Node = 'C:\Program Files\nodejs\node.exe'
$BackendLog = Join-Path $Root 'backend-prod.log'
$BackendErr = Join-Path $Root 'backend-prod.err.log'
$FrontendLog = Join-Path $Root 'frontend-dev.log'
$FrontendErr = Join-Path $Root 'frontend-dev.err.log'

$machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
$cleanPath = (($machinePath, $userPath, 'C:\Program Files\nodejs') | Where-Object { $_ }) -join ';'
[Environment]::SetEnvironmentVariable('Path', $cleanPath, 'Process')

function Write-Step($message) {
  Write-Host "[family-page] $message"
}

function Quote-Arg($value) {
  return '"' + ($value -replace '"', '\"') + '"'
}

function Start-DetachedNode($workingDirectory, $arguments, $stdoutLog, $stderrLog) {
  $runnerName = if ($workingDirectory -eq $Backend) { 'run-backend.cmd' } else { 'run-frontend.cmd' }
  $runnerPath = Join-Path $Root "scripts\$runnerName"
  $argumentText = ($arguments | ForEach-Object { '"' + $_ + '"' }) -join ' '
  $runnerContent = @(
    '@echo off',
    'chcp 65001 > nul',
    "cd /d ""$workingDirectory""",
    ('"' + $Node + '" ' + $argumentText)
  )
  Set-Content -LiteralPath $runnerPath -Value $runnerContent -Encoding UTF8
  & cmd.exe /d /c "start `"`" /min `"$runnerPath`""
}

function Test-Http($url) {
  try {
    Invoke-RestMethod -Uri $url -TimeoutSec 4 | Out-Null
    return $true
  } catch {
    return $false
  }
}

function Stop-Port($port) {
  try {
    $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($connection in $connections) {
      Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
    }
  } catch {}
}

Set-Location $Root

Write-Step 'PostgreSQL 확인 중...'
$dbReady = $false
try {
  $dbReady = (Test-NetConnection -ComputerName 127.0.0.1 -Port 5432 -InformationLevel Quiet)
} catch {
  $dbReady = $false
}

if (-not $dbReady) {
  Write-Step 'PostgreSQL이 내려가 있어 docker compose로 실행합니다.'
  docker compose up -d postgres
  Start-Sleep -Seconds 5
} else {
  Write-Step 'PostgreSQL 정상.'
}

Write-Step 'Prisma migration 확인 중...'
$env:DATABASE_URL = 'postgresql://postgres:postgres@127.0.0.1:5432/onyu_page?schema=public'
& $Node '.\node_modules\prisma\build\index.js' migrate deploy --schema '.\prisma\schema.prisma' 2>$null | Out-Null

Write-Step '백엔드 확인 중...'
if (-not (Test-Http 'http://127.0.0.1:4000/api/health')) {
  Write-Step '백엔드가 없거나 응답하지 않아 재시작합니다.'
  Stop-Port 4000
  Start-Sleep -Seconds 1
  Start-DetachedNode $Backend @('dist/src/server.js') $BackendLog $BackendErr
  Start-Sleep -Seconds 7
} else {
  Write-Step '백엔드 정상.'
}

Write-Step '프론트엔드 확인 중...'
if (-not (Test-Http 'http://127.0.0.1:5173/api/health')) {
  Write-Step '프론트엔드가 없거나 백엔드 프록시가 맞지 않아 재시작합니다.'
  Stop-Port 5173
  Start-Sleep -Seconds 1
  Start-DetachedNode $Frontend @('.\node_modules\vite\bin\vite.js', '--host', '127.0.0.1') $FrontendLog $FrontendErr
  Start-Sleep -Seconds 7
} else {
  Write-Step '프론트엔드 정상.'
}

Write-Step '최종 확인 중...'
$backendOk = Test-Http 'http://127.0.0.1:4000/api/health'
$frontendOk = Test-Http 'http://127.0.0.1:5173/api/health'

if ($backendOk -and $frontendOk) {
  Write-Step '완료: http://127.0.0.1:5173/'
} else {
  Write-Step "확인 필요: backend=$backendOk frontend=$frontendOk"
  Write-Step "로그: $BackendErr / $FrontendErr"
}

