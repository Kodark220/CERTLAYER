param(
    [Parameter(Mandatory = $true)]
    [string]$AdminAddress
)

$ErrorActionPreference = "Stop"

function Require-Command {
    param([string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' is not installed or not on PATH."
    }
}

function Invoke-GenLayerDeploy {
    param(
        [string]$ContractPath,
        [string[]]$Args = @()
    )

    $command = @("deploy", "--contract", $ContractPath)
    if ($Args.Count -gt 0) {
        $command += "--args"
        $command += $Args
    }

    $output = & genlayer @command 2>&1 | Out-String
    $address = ""
    $txHash = ""

    if ($output -match "Contract\s+Address:\s*(0x[a-fA-F0-9]+)") {
        $address = $Matches[1]
    }
    if ($output -match "Transaction\s+Hash:\s*(0x[a-fA-F0-9]+)") {
        $txHash = $Matches[1]
    }

    [pscustomobject]@{
        ContractPath = $ContractPath
        TransactionHash = $txHash
        ContractAddress = $address
        RawOutput = $output.Trim()
    }
}

Require-Command -Name "genlayer"

$repoRoot = Split-Path -Parent $PSScriptRoot
$certLayerPath = Join-Path $repoRoot "contracts/genlayer/certlayer_contract.py"
$hackDetectionPath = Join-Path $repoRoot "contracts/genlayer/hack_detection_contract.py"

if (-not (Test-Path $certLayerPath)) {
    throw "Missing contract file: $certLayerPath"
}
if (-not (Test-Path $hackDetectionPath)) {
    throw "Missing contract file: $hackDetectionPath"
}

Write-Host "Switching GenLayer CLI to Bradbury..."
& genlayer network testnet-bradbury

Write-Host "Deploying CertLayer contract..."
$certResult = Invoke-GenLayerDeploy -ContractPath $certLayerPath

Write-Host "Deploying HackDetection contract..."
$hackResult = Invoke-GenLayerDeploy -ContractPath $hackDetectionPath -Args @($AdminAddress)

Write-Host ""
Write-Host "Deployment summary"
Write-Host "=================="
Write-Host "CertLayer contract:   $($certResult.ContractAddress)"
Write-Host "CertLayer tx hash:    $($certResult.TransactionHash)"
Write-Host "HackDetection:        $($hackResult.ContractAddress)"
Write-Host "HackDetection tx hash:$($hackResult.TransactionHash)"
Write-Host ""
Write-Host "Update your env files with:"
Write-Host "GENLAYER_CONTRACT_ADDRESS=$($certResult.ContractAddress)"
Write-Host "GENLAYER_SECURITY_CONTRACT_ADDRESS=$($hackResult.ContractAddress)"
Write-Host "NEXT_PUBLIC_CONTRACT_ADDRESS=$($certResult.ContractAddress)"
Write-Host ""
Write-Host "Raw CLI output follows for verification."
Write-Host ""
Write-Host "--- CertLayer ---"
Write-Host $certResult.RawOutput
Write-Host ""
Write-Host "--- HackDetection ---"
Write-Host $hackResult.RawOutput