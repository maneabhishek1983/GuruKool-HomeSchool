# GuruKool - Kimi K2 (Moonshot AI) Setup Script
# Run in PowerShell: .\setup-kimi-k2.ps1

Write-Host "`n🚀 GuruKool - Kimi K2 (Moonshot AI) Setup" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "⚠️  Not running as Administrator. User-level environment variables will be set." -ForegroundColor Yellow
    Write-Host "   For system-wide variables, run as Administrator.`n" -ForegroundColor Yellow
}

# Prompt for API Key
Write-Host "📝 Enter your Moonshot API Key" -ForegroundColor Green
Write-Host "   (Get it from: https://platform.moonshot.cn/console/api-keys)`n" -ForegroundColor Gray
$apiKey = Read-Host "API Key (starts with 'sk-')"

# Validate API Key format
if ([string]::IsNullOrWhiteSpace($apiKey)) {
    Write-Host "`n❌ API key cannot be empty!" -ForegroundColor Red
    exit 1
}

if (-not $apiKey.StartsWith("sk-")) {
    Write-Host "`n❌ Invalid API key format. Must start with 'sk-'" -ForegroundColor Red
    Write-Host "   Example: sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" -ForegroundColor Gray
    exit 1
}

Write-Host "`n✅ API key format valid!`n" -ForegroundColor Green

# Prompt for model selection
Write-Host "📋 Select Kimi Model:" -ForegroundColor Green
Write-Host "   1. moonshot-v1-8k   (8K context - Fast, short conversations)" -ForegroundColor Gray
Write-Host "   2. moonshot-v1-32k  (32K context - Recommended)" -ForegroundColor Cyan
Write-Host "   3. moonshot-v1-128k (128K context - Long documents)`n" -ForegroundColor Gray
$modelChoice = Read-Host "Choice [1/2/3] (default: 2)"

$model = switch ($modelChoice) {
    "1" { "moonshot-v1-8k" }
    "3" { "moonshot-v1-128k" }
    default { "moonshot-v1-32k" }
}

Write-Host "`n✅ Selected model: $model`n" -ForegroundColor Green

# Configuration
$apiBase = "https://api.moonshot.cn/v1"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host "📦 Setting up environment variables...`n" -ForegroundColor Cyan

# Method 1: Set for current PowerShell session
$env:MOONSHOT_API_KEY = $apiKey
$env:MOONSHOT_API_BASE = $apiBase
$env:MOONSHOT_MODEL = $model

# Also set OpenAI aliases for compatibility
$env:OPENAI_API_KEY = $apiKey
$env:OPENAI_API_BASE = $apiBase

Write-Host "✅ Environment variables set for current session" -ForegroundColor Green

# Method 2: Add to PowerShell Profile (persistent)
try {
    # Check if profile exists
    if (-not (Test-Path $PROFILE)) {
        Write-Host "📝 Creating PowerShell profile..." -ForegroundColor Yellow
        New-Item -Path $PROFILE -Type File -Force | Out-Null
    }

    # Read existing profile
    $profileContent = ""
    if (Test-Path $PROFILE) {
        $profileContent = Get-Content $PROFILE -Raw
    }

    # Check if Kimi config already exists
    if ($profileContent -match "MOONSHOT_API_KEY") {
        Write-Host "⚠️  Kimi K2 configuration already exists in profile" -ForegroundColor Yellow
        $overwrite = Read-Host "   Overwrite? [y/N]"
        if ($overwrite -ne "y" -and $overwrite -ne "Y") {
            Write-Host "   Skipping profile update" -ForegroundColor Gray
        } else {
            # Remove old config
            $profileContent = $profileContent -replace "(?ms)# Kimi K2.*?Write-Host.*?Green\s*", ""
            Set-Content -Path $PROFILE -Value $profileContent.TrimEnd()
        }
    }

    if (-not ($profileContent -match "MOONSHOT_API_KEY") -or $overwrite -eq "y" -or $overwrite -eq "Y") {
        # Add new config
        $newConfig = @"

# ============================================
# Kimi K2 (Moonshot AI) Configuration
# Added: $timestamp
# ============================================
`$env:MOONSHOT_API_KEY = "$apiKey"
`$env:MOONSHOT_API_BASE = "$apiBase"
`$env:MOONSHOT_MODEL = "$model"

# OpenAI-compatible aliases
`$env:OPENAI_API_KEY = `$env:MOONSHOT_API_KEY
`$env:OPENAI_API_BASE = `$env:MOONSHOT_API_BASE

Write-Host "✅ Kimi K2 API configured" -ForegroundColor Green
"@

        Add-Content -Path $PROFILE -Value $newConfig
        Write-Host "✅ Added to PowerShell profile: $PROFILE" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Could not update PowerShell profile: $_" -ForegroundColor Yellow
    Write-Host "   Variables are still set for this session" -ForegroundColor Gray
}

# Method 3: Create .env file in project
$envPath = ".\.env.local"
try {
    $envContent = @"
# Kimi K2 (Moonshot AI) - Local Development
# Added: $timestamp
MOONSHOT_API_KEY=$apiKey
MOONSHOT_API_BASE=$apiBase
MOONSHOT_MODEL=$model

# OpenAI-compatible aliases
OPENAI_API_KEY=$apiKey
OPENAI_API_BASE=$apiBase
"@

    Set-Content -Path $envPath -Value $envContent
    Write-Host "✅ Created $envPath" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not create $envPath : $_" -ForegroundColor Yellow
}

# Test API connection
Write-Host "`n🧪 Testing API connection...`n" -ForegroundColor Cyan

$testScript = @"
const https = require('https');
const apiKey = process.env.MOONSHOT_API_KEY || '$apiKey';
const data = JSON.stringify({
  model: '$model',
  messages: [{ role: 'user', content: 'Say "API works!"' }],
  max_tokens: 10
});
const url = new URL('$apiBase/chat/completions');
const req = https.request({
  hostname: url.hostname,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + apiKey,
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ API connection successful!');
      try {
        const json = JSON.parse(body);
        console.log('Response:', json.choices[0].message.content);
      } catch (e) {
        console.log('Response received (parsing error)');
      }
    } else {
      console.log('❌ API Error:', res.statusCode);
      console.log(body);
    }
  });
});
req.on('error', (e) => console.error('❌ Connection failed:', e.message));
req.write(data);
req.end();
"@

$testScript | node 2>&1 | ForEach-Object {
    if ($_ -match "✅") {
        Write-Host $_ -ForegroundColor Green
    } elseif ($_ -match "❌") {
        Write-Host $_ -ForegroundColor Red
    } else {
        Write-Host $_ -ForegroundColor Gray
    }
}

# Summary
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "🎉 Kimi K2 Setup Complete!" -ForegroundColor Green
Write-Host "================================================`n" -ForegroundColor Cyan

Write-Host "📋 Configuration Summary:" -ForegroundColor Cyan
Write-Host "   API Base:  $apiBase" -ForegroundColor Gray
Write-Host "   Model:     $model" -ForegroundColor Gray
Write-Host "   Profile:   $PROFILE" -ForegroundColor Gray
Write-Host "   Env File:  $envPath`n" -ForegroundColor Gray

Write-Host "🔧 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Restart your terminal/IDE to load profile" -ForegroundColor Gray
Write-Host "   2. Or run: . `$PROFILE" -ForegroundColor Yellow
Write-Host "   3. Verify: echo `$env:MOONSHOT_API_KEY`n" -ForegroundColor Gray

Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   Setup Guide:  KIMI_K2_SETUP_GUIDE.md" -ForegroundColor Gray
Write-Host "   Moonshot Docs: https://platform.moonshot.cn/docs`n" -ForegroundColor Gray

Write-Host "Press any key to continue..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
