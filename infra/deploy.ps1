<#
.SYNOPSIS
    フロントエンド(nginx)・バックエンド(Spring Boot)をビルドし、EC2へデプロイする。

.DESCRIPTION
    1. Terraform出力からEC2のIP・RDSエンドポイント・DBパスワードを取得
    2. ソース一式をtarに圧縮してEC2へ転送
    3. EC2上でDockerイメージをビルド
    4. 既存のbackend/nginxコンテナを入れ替えて起動
    5. 疎通確認（/ が200、/api/... が403であること）

.EXAMPLE
    ./infra/deploy.ps1
#>

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$InfraDir = Join-Path $RepoRoot "infra"
$TerraformDir = Join-Path $InfraDir "terraform"
$KeyPath = Join-Path $InfraDir "trello-app-key.pem"

function Invoke-Checked {
    param(
        [Parameter(Mandatory)][string]$Description,
        [Parameter(Mandatory)][ScriptBlock]$Action
    )
    Write-Host "==> $Description" -ForegroundColor Cyan
    & $Action
    if ($LASTEXITCODE -ne 0 -and $null -ne $LASTEXITCODE) {
        throw "失敗: $Description (exit code $LASTEXITCODE)"
    }
}

# --- 1. Terraform出力の取得 ---
Write-Host "==> Terraform出力を取得しています" -ForegroundColor Cyan
Push-Location $TerraformDir
try {
    $env:AWS_PROFILE = "trello-app"
    $BackendIp = terraform output -raw backend_public_ip 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($BackendIp)) {
        throw "backend_public_ipの取得に失敗しました。先に infra/terraform で terraform apply を実行してください。"
    }
    $RdsEndpoint = terraform output -raw rds_endpoint 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($RdsEndpoint)) {
        throw "rds_endpointの取得に失敗しました。"
    }
    $DbPassword = terraform output -raw db_password 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($DbPassword)) {
        throw "db_passwordの取得に失敗しました。"
    }
}
finally {
    Pop-Location
}
Write-Host "    EC2 IP: $BackendIp"
Write-Host "    RDS Endpoint: $RdsEndpoint"

if (-not (Test-Path $KeyPath)) {
    throw "SSHキーが見つかりません: $KeyPath"
}

# --- 2. ソース一式をtarに圧縮 ---
# OneDrive配下のディレクトリはNTFSの読み取り専用属性が付くことがあり、
# 素のtarでそのまま固めるとEC2側での展開時に該当ディレクトリが書き込み不可(555)になり
# `Permission denied` で失敗する。OneDriveの外の一時フォルダへ一旦コピーしてから
# tarに固めることで、コピー先で新規作成される（属性が引き継がれない）ディレクトリを使う。
$StageDir = Join-Path $env:TEMP "trello-deploy-stage"
$TarPath = Join-Path $env:TEMP "trello-deploy.tar.gz"

Invoke-Checked -Description "ソースを一時フォルダへコピー" -Action {
    if (Test-Path $StageDir) {
        Remove-Item $StageDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $StageDir | Out-Null

    $ItemsToCopy = @("package.json", "package-lock.json", "index.html", "vite.config.ts", "tsconfig.json", "src", "backend", "infra\nginx", "infra\ec2")
    foreach ($Item in $ItemsToCopy) {
        $Source = Join-Path $RepoRoot $Item
        $Dest = Join-Path $StageDir $Item
        New-Item -ItemType Directory -Path (Split-Path $Dest -Parent) -Force | Out-Null
        if (Test-Path $Source -PathType Container) {
            robocopy $Source $Dest /E /NFL /NDL /NJH /NJS /XD node_modules target | Out-Null
        }
        else {
            Copy-Item $Source $Dest -Force
        }
    }
    # robocopyは成功時でも0以外(0-7)の終了コードを返すことがあるため正規化する
    if ($LASTEXITCODE -lt 8) {
        $global:LASTEXITCODE = 0
    }

    # Windowsのフォルダには実害のない「読み取り専用」属性が付いていることが多く、
    # robocopyでコピーするとそのまま引き継がれる。tarがこれを拾うとEC2側の展開で
    # ディレクトリが書き込み不可になり失敗するため、ここで明示的に解除する。
    attrib -R "$StageDir\*" /S /D
    $global:LASTEXITCODE = 0
}

Invoke-Checked -Description "ソースをtarに圧縮" -Action {
    Push-Location $StageDir
    try {
        tar -czf $TarPath .
    }
    finally {
        Pop-Location
    }
}

# --- 3. EC2へ転送 ---
Invoke-Checked -Description "EC2へソースとdocker-composeを転送" -Action {
    scp -i $KeyPath -o StrictHostKeyChecking=no `
        $TarPath (Join-Path $InfraDir "ec2\docker-compose.prod.yml") `
        "ec2-user@${BackendIp}:~/"
}

# --- 4. EC2上でビルド・再起動 ---
$RemoteScript = @"
set -e
sudo rm -rf ~/app
mkdir -p ~/app
tar -xzf ~/trello-deploy.tar.gz -C ~/app
cd ~/app
sudo docker build -t trello-app-backend:latest backend/
sudo docker build -t trello-app-nginx:latest -f infra/nginx/Dockerfile .
cp ~/docker-compose.prod.yml ~/docker-compose.yml
sudo docker stop trello-app-backend trello-app-nginx 2>/dev/null || true
sudo docker rm trello-app-backend trello-app-nginx 2>/dev/null || true
export RDS_ENDPOINT='$RdsEndpoint'
export DB_PASSWORD='$DbPassword'
sudo -E docker-compose -f ~/docker-compose.yml up -d
sudo docker restart trello-app-nginx
"@

# BOM無し・LF改行でリモートスクリプトを一時ファイルに書き出し、パイプ経由のBOM混入を回避する
$RemoteScriptPath = Join-Path $env:TEMP "trello-remote-deploy.sh"
$NormalizedScript = $RemoteScript -replace "`r`n", "`n"
[System.IO.File]::WriteAllText($RemoteScriptPath, $NormalizedScript, [System.Text.UTF8Encoding]::new($false))

Invoke-Checked -Description "リモートデプロイスクリプトをEC2へ転送" -Action {
    scp -i $KeyPath -o StrictHostKeyChecking=no $RemoteScriptPath "ec2-user@${BackendIp}:~/remote-deploy.sh"
}

Invoke-Checked -Description "EC2上でイメージをビルドしてコンテナを起動" -Action {
    ssh -i $KeyPath -o StrictHostKeyChecking=no "ec2-user@${BackendIp}" "bash ~/remote-deploy.sh"
}

# --- 5. 疎通確認 ---
# Spring Bootの起動に数秒〜十数秒かかるため、backendが立ち上がるまでポーリングする
Write-Host "==> 疎通確認（backendの起動待ち）" -ForegroundColor Cyan
$MaxAttempts = 12
$ApiStatus = "000"
for ($i = 1; $i -le $MaxAttempts; $i++) {
    $ApiStatus = (curl.exe -s -o NUL -w "%{http_code}" "http://${BackendIp}/api/cards")
    if ($ApiStatus -eq "401") {
        break
    }
    Start-Sleep -Seconds 5
}

$RootStatus = (curl.exe -s -o NUL -w "%{http_code}" "http://${BackendIp}/")

Write-Host "    http://$BackendIp/          -> HTTP $RootStatus (期待値: 200)"
Write-Host "    http://$BackendIp/api/cards -> HTTP $ApiStatus (期待値: 401, 未認証のため)"

if ($RootStatus -ne "200") {
    throw "フロントエンドの疎通確認に失敗しました (HTTP $RootStatus)"
}
if ($ApiStatus -ne "401") {
    Write-Warning "APIのステータスが想定(401)と異なります: HTTP $ApiStatus"
}

Write-Host "==> デプロイ完了: http://$BackendIp" -ForegroundColor Green
