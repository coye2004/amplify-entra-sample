#!/usr/bin/env pwsh
# PowerShell script to get AWS credentials from Vault and set environment variables

# Set Vault address
$env:VAULT_ADDR = "https://civ1.dv.adskengineer.net"

Write-Host "Logging into Vault..." -ForegroundColor Green

try {
    # Login to Vault using OIDC
    vault login -method=oidc
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to login to Vault. Exit code: $LASTEXITCODE"
        exit 1
    }
    
    Write-Host "Getting AWS credentials from Vault..." -ForegroundColor Green
    
    # Get credentials from Vault
    $vaultResponse = vault write -format=json account/720853352242/sts/Owner -ttl=960m
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to get credentials from Vault. Exit code: $LASTEXITCODE"
        exit 1
    }
    
    # Parse the JSON response
    $credentials = $vaultResponse | ConvertFrom-Json
    
    # Extract credential values
    $accessKey = $credentials.data.access_key
    $secretKey = $credentials.data.secret_key
    $sessionToken = $credentials.data.security_token
    $region = "us-west-2"
    
    # Set environment variables
    $env:AWS_ACCESS_KEY_ID = $accessKey
    $env:AWS_SECRET_ACCESS_KEY = $secretKey
    $env:AWS_SESSION_TOKEN = $sessionToken
    $env:AWS_DEFAULT_REGION = $region
    
    Write-Host "AWS credentials set successfully!" -ForegroundColor Green
    Write-Host "Access Key: $($accessKey.Substring(0,8))..." -ForegroundColor Yellow
    Write-Host "Region: $region" -ForegroundColor Yellow
    Write-Host "TTL: $($credentials.data.ttl) seconds" -ForegroundColor Yellow
    
    # Verify credentials by calling AWS STS
    Write-Host "Verifying credentials..." -ForegroundColor Green
    $identity = aws sts get-caller-identity
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Credentials verified successfully!" -ForegroundColor Green
        Write-Host $identity -ForegroundColor Cyan
    } else {
        Write-Warning "Failed to verify credentials with AWS STS"
    }
    
} catch {
    Write-Error "Error occurred: $($_.Exception.Message)"
    exit 1
}
