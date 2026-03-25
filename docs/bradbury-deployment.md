# Bradbury Redeploy

This repo does not include a built-in deployment pipeline for GenLayer contracts.
Use the GenLayer CLI against the `testnet-bradbury` network.

## Prerequisites

1. Install the GenLayer CLI so the `genlayer` command is available in PowerShell.
2. Fund the deployer wallet with Bradbury testnet tokens from the faucet.
3. Make sure the deployer wallet is the address you want as CertLayer admin.
4. Choose the HackDetection admin address you want to pass to the constructor.

## Contracts in this repo

- `contracts/genlayer/certlayer_contract.py`
  - Constructor args: none
- `contracts/genlayer/hack_detection_contract.py`
  - Constructor args: one admin address

## Manual commands

```powershell
genlayer network testnet-bradbury
genlayer deploy --contract contracts/genlayer/certlayer_contract.py
genlayer deploy --contract contracts/genlayer/hack_detection_contract.py --args 0xYourAdminAddress
```

## Helper script

You can run the helper script from repo root:

```powershell
.\scripts\deploy-bradbury.ps1 -AdminAddress 0xYourAdminAddress
```

The script switches the CLI to Bradbury, deploys both contracts, and prints the
contract addresses you need to copy into app env files.

## Post-deploy env updates

Update the repo settings that still point at StudioNet in [README.md](c:\Users\OLUWATOYOSI\parametic insurance\README.md):

- `GENLAYER_CONTRACT_ADDRESS`
- `GENLAYER_SECURITY_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_CONTRACT_ADDRESS`

If your runtime still relies on an explicit network selection, use the Bradbury
network in the CLI instead of the current `studionet` setting.