# Kimi K2 (Moonshot AI) Setup Guide

Complete guide to configure Kimi K2 (Moonshot AI) API in your development environment.

## What is Kimi K2?

**Kimi K2** is Moonshot AI's language model accessible via API at https://platform.moonshot.cn/

- **Provider**: Moonshot AI (月之暗面)
- **Model**: Kimi K2 series (e.g., `moonshot-v1-8k`, `moonshot-v1-32k`, `moonshot-v1-128k`)
- **API Endpoint**: `https://api.moonshot.cn/v1`
- **Compatible with**: OpenAI API format

---

## Prerequisites

1. **Get Moonshot API Key**
   - Sign up at: https://platform.moonshot.cn/console/api-keys
   - Create new API key
   - Copy the key (format: `sk-...`)

---

## Configuration Methods

### Method 1: Environment Variables (Recommended)

#### On Windows (Your Environment)

**Option A: PowerShell Profile** (Persistent)

1. Open PowerShell as Administrator
2. Check if profile exists:

   ```powershell
   Test-Path $PROFILE
   ```

3. Create/edit profile:

   ```powershell
   # If False, create profile
   New-Item -Path $PROFILE -Type File -Force

   # Open in notepad
   notepad $PROFILE
   ```

4. Add to profile:

   ```powershell
   # Kimi K2 (Moonshot AI) Configuration
   $env:MOONSHOT_API_KEY = "sk-your-moonshot-api-key-here"
   $env:MOONSHOT_API_BASE = "https://api.moonshot.cn/v1"
   $env:MOONSHOT_MODEL = "moonshot-v1-32k"

   # For OpenAI-compatible libraries, you can alias it
   $env:OPENAI_API_KEY = $env:MOONSHOT_API_KEY
   $env:OPENAI_API_BASE = $env:MOONSHOT_API_BASE

   Write-Host "✅ Kimi K2 API configured" -ForegroundColor Green
   ```

5. Reload profile:

   ```powershell
   . $PROFILE
   ```

6. Verify:
   ```powershell
   echo $env:MOONSHOT_API_KEY
   ```

**Option B: System Environment Variables** (All Users)

1. Right-click **This PC** → **Properties**
2. Click **Advanced system settings**
3. Click **Environment Variables**
4. Under **User variables**, click **New**:
   - Variable name: `MOONSHOT_API_KEY`
   - Variable value: `sk-your-moonshot-api-key-here`
5. Add more variables:
   - `MOONSHOT_API_BASE` = `https://api.moonshot.cn/v1`
   - `MOONSHOT_MODEL` = `moonshot-v1-32k`
6. Click **OK** to save
7. Restart terminal/IDE

---

#### On Linux/macOS (If using WSL or Git Bash)

**For Bash** (`~/.bashrc` or `~/.bash_profile`):

```bash
# Kimi K2 (Moonshot AI) Configuration
export MOONSHOT_API_KEY="sk-your-moonshot-api-key-here"
export MOONSHOT_API_BASE="https://api.moonshot.cn/v1"
export MOONSHOT_MODEL="moonshot-v1-32k"

# For OpenAI-compatible libraries
export OPENAI_API_KEY="$MOONSHOT_API_KEY"
export OPENAI_API_BASE="$MOONSHOT_API_BASE"

echo "✅ Kimi K2 API configured"
```

**For Zsh** (`~/.zshrc`):

```zsh
# Kimi K2 (Moonshot AI) Configuration
export MOONSHOT_API_KEY="sk-your-moonshot-api-key-here"
export MOONSHOT_API_BASE="https://api.moonshot.cn/v1"
export MOONSHOT_MODEL="moonshot-v1-32k"

# For OpenAI-compatible libraries
export OPENAI_API_KEY="$MOONSHOT_API_KEY"
export OPENAI_API_BASE="$MOONSHOT_API_BASE"

echo "✅ Kimi K2 API configured"
```

**Apply changes:**

```bash
# For bash
source ~/.bashrc

# For zsh
source ~/.zshrc
```

---

### Method 2: Project .env File (Local Development)

**For Next.js Web App:**

Create/edit `.env.local` in project root:

```env
# Kimi K2 (Moonshot AI) - Local Development Only
MOONSHOT_API_KEY=sk-your-moonshot-api-key-here
MOONSHOT_API_BASE=https://api.moonshot.cn/v1
MOONSHOT_MODEL=moonshot-v1-32k

# Alias for OpenAI-compatible code
OPENAI_API_KEY=${MOONSHOT_API_KEY}
OPENAI_API_BASE=${MOONSHOT_API_BASE}
```

**For Flutter Mobile App:**

Create/edit `gurukool_teacher/.env`:

```env
# Kimi K2 (Moonshot AI) - Mobile App
MOONSHOT_API_KEY=sk-your-moonshot-api-key-here
MOONSHOT_API_BASE=https://api.moonshot.cn/v1
MOONSHOT_MODEL=moonshot-v1-32k
```

**⚠️ Important:**

- Add `.env.local` and `.env` to `.gitignore` (already configured ✅)
- Never commit API keys to GitHub

---

### Method 3: Vercel Environment Variables (Production)

For production deployment:

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - `MOONSHOT_API_KEY` = `sk-your-key` (Secret)
   - `MOONSHOT_API_BASE` = `https://api.moonshot.cn/v1`
   - `MOONSHOT_MODEL` = `moonshot-v1-32k`
5. Select environments: Production, Preview, Development
6. Click **Save**
7. Redeploy: **Deployments** → **Redeploy**

---

## Usage Examples

### JavaScript/TypeScript (Next.js)

```typescript
// src/lib/moonshot.ts
import OpenAI from 'openai';

export const moonshot = new OpenAI({
  apiKey: process.env.MOONSHOT_API_KEY,
  baseURL: process.env.MOONSHOT_API_BASE || 'https://api.moonshot.cn/v1',
});

// Usage
const completion = await moonshot.chat.completions.create({
  model: process.env.MOONSHOT_MODEL || 'moonshot-v1-32k',
  messages: [
    { role: 'system', content: 'You are Kimi, an AI assistant.' },
    { role: 'user', content: 'Hello!' },
  ],
});
```

### Python (Scripts)

```python
# scripts/test_kimi.py
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv('MOONSHOT_API_KEY'),
    base_url=os.getenv('MOONSHOT_API_BASE', 'https://api.moonshot.cn/v1'),
)

response = client.chat.completions.create(
    model=os.getenv('MOONSHOT_MODEL', 'moonshot-v1-32k'),
    messages=[
        {'role': 'system', 'content': 'You are Kimi, an AI assistant.'},
        {'role': 'user', 'content': 'Hello!'},
    ],
)

print(response.choices[0].message.content)
```

### cURL (Testing)

```bash
curl https://api.moonshot.cn/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MOONSHOT_API_KEY" \
  -d '{
    "model": "moonshot-v1-32k",
    "messages": [
      {"role": "system", "content": "You are Kimi, an AI assistant."},
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

---

## Available Models

| Model              | Context Length | Best For                     |
| ------------------ | -------------- | ---------------------------- |
| `moonshot-v1-8k`   | 8,192 tokens   | Short conversations          |
| `moonshot-v1-32k`  | 32,768 tokens  | Standard tasks (recommended) |
| `moonshot-v1-128k` | 128,000 tokens | Long documents, analysis     |

---

## Verification

### Verify Environment Variables

**Windows PowerShell:**

```powershell
echo $env:MOONSHOT_API_KEY
echo $env:MOONSHOT_API_BASE
echo $env:MOONSHOT_MODEL
```

**Linux/macOS/Git Bash:**

```bash
echo $MOONSHOT_API_KEY
echo $MOONSHOT_API_BASE
echo $MOONSHOT_MODEL
```

### Test API Connection

Create `test-kimi-api.js`:

```javascript
// test-kimi-api.js
const https = require('https');

const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;
const MOONSHOT_API_BASE =
  process.env.MOONSHOT_API_BASE || 'https://api.moonshot.cn/v1';

if (!MOONSHOT_API_KEY) {
  console.error('❌ MOONSHOT_API_KEY not set');
  process.exit(1);
}

const data = JSON.stringify({
  model: 'moonshot-v1-32k',
  messages: [
    { role: 'system', content: 'You are Kimi, an AI assistant.' },
    { role: 'user', content: 'Say "Hello from Kimi K2!"' },
  ],
});

const url = new URL('/chat/completions', MOONSHOT_API_BASE);
const options = {
  hostname: url.hostname,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${MOONSHOT_API_KEY}`,
    'Content-Length': data.length,
  },
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', chunk => (body += chunk));
  res.on('end', () => {
    if (res.statusCode === 200) {
      const response = JSON.parse(body);
      console.log('✅ Kimi K2 API Working!');
      console.log('Response:', response.choices[0].message.content);
    } else {
      console.error('❌ API Error:', res.statusCode, body);
    }
  });
});

req.on('error', error => {
  console.error('❌ Connection Error:', error.message);
});

req.write(data);
req.end();
```

Run test:

```bash
node test-kimi-api.js
```

---

## Integration with GuruKool Project

### 1. Update CLAUDE.md Instructions

Already configured in your `CLAUDE.md`:

```markdown
- For local testing ONLY use OPEN AI api key, but only for local LLM
- When pushing code to DevOps or GitHub only use chomsky, okta and apim
```

To add Kimi K2 support:

```markdown
### AI Model Configuration

- **Local Development**: Use OpenAI API or Kimi K2 (Moonshot)
- **Production**: Use Chomsky LLM + OKTA + APIM (no external APIs)

#### Kimi K2 Setup (Optional)

Set environment variables:

- `MOONSHOT_API_KEY`: Your Moonshot API key
- `MOONSHOT_API_BASE`: https://api.moonshot.cn/v1
- `MOONSHOT_MODEL`: moonshot-v1-32k (or moonshot-v1-128k)
```

### 2. Create AI Service Abstraction

```typescript
// src/services/ai-provider.service.ts
import OpenAI from 'openai';

export type AIProvider = 'openai' | 'moonshot' | 'chomsky';

class AIProviderService {
  private provider: AIProvider;
  private client: OpenAI;

  constructor() {
    // Auto-detect provider based on environment
    if (process.env.MOONSHOT_API_KEY) {
      this.provider = 'moonshot';
      this.client = new OpenAI({
        apiKey: process.env.MOONSHOT_API_KEY,
        baseURL: process.env.MOONSHOT_API_BASE,
      });
    } else if (process.env.OPENAI_API_KEY) {
      this.provider = 'openai';
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } else {
      this.provider = 'chomsky';
      // Chomsky integration here
    }
  }

  async chat(messages: Array<{ role: string; content: string }>) {
    const model =
      this.provider === 'moonshot'
        ? process.env.MOONSHOT_MODEL || 'moonshot-v1-32k'
        : 'gpt-4';

    return await this.client.chat.completions.create({
      model,
      messages,
    });
  }

  getProvider(): AIProvider {
    return this.provider;
  }
}

export const aiProvider = new AIProviderService();
```

---

## Security Best Practices

1. **Never commit API keys**
   - Use `.env` files (already in `.gitignore` ✅)
   - Use environment variables

2. **Rotate keys regularly**
   - Generate new keys every 90 days
   - Delete old keys in Moonshot console

3. **Use different keys for environments**
   - Development: Personal key
   - Staging: Team key
   - Production: Chomsky (per project requirements)

4. **Monitor usage**
   - Check Moonshot console: https://platform.moonshot.cn/console/usage
   - Set usage alerts

---

## Troubleshooting

### Error: "Invalid API Key"

```bash
# Verify key is set
echo $MOONSHOT_API_KEY  # Should show sk-...

# Check format
# Correct: sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Wrong: Missing 'sk-' prefix
```

### Error: "Connection timeout"

```bash
# Check if you can reach Moonshot API
curl -I https://api.moonshot.cn/v1/models

# If fails, check firewall/VPN
```

### Error: "Model not found"

```bash
# List available models
curl https://api.moonshot.cn/v1/models \
  -H "Authorization: Bearer $MOONSHOT_API_KEY"
```

---

## Quick Setup Script (Windows PowerShell)

Save as `setup-kimi-k2.ps1`:

```powershell
# GuruKool - Kimi K2 Setup Script
Write-Host "🚀 Setting up Kimi K2 (Moonshot AI)..." -ForegroundColor Cyan

$apiKey = Read-Host "Enter your Moonshot API Key (sk-...)"

if (-not $apiKey.StartsWith("sk-")) {
    Write-Host "❌ Invalid API key format. Must start with 'sk-'" -ForegroundColor Red
    exit 1
}

# Add to PowerShell profile
$profileContent = @"

# Kimi K2 (Moonshot AI) Configuration - Added $(Get-Date -Format "yyyy-MM-dd")
`$env:MOONSHOT_API_KEY = "$apiKey"
`$env:MOONSHOT_API_BASE = "https://api.moonshot.cn/v1"
`$env:MOONSHOT_MODEL = "moonshot-v1-32k"
Write-Host "✅ Kimi K2 API configured" -ForegroundColor Green
"@

Add-Content -Path $PROFILE -Value $profileContent
Write-Host "✅ Added to PowerShell profile: $PROFILE" -ForegroundColor Green

# Set for current session
$env:MOONSHOT_API_KEY = $apiKey
$env:MOONSHOT_API_BASE = "https://api.moonshot.cn/v1"
$env:MOONSHOT_MODEL = "moonshot-v1-32k"

Write-Host "✅ Kimi K2 configured successfully!" -ForegroundColor Green
Write-Host "Restart your terminal or run: . `$PROFILE" -ForegroundColor Yellow
```

Run:

```powershell
.\setup-kimi-k2.ps1
```

---

## Resources

- **Moonshot Console**: https://platform.moonshot.cn/console
- **API Documentation**: https://platform.moonshot.cn/docs
- **Pricing**: https://platform.moonshot.cn/pricing
- **Model List**: https://platform.moonshot.cn/docs/api-reference#list-models

---

## Summary

**To add Kimi K2 to your environment:**

1. **Get API Key**: https://platform.moonshot.cn/console/api-keys
2. **Choose method**:
   - Windows: Add to PowerShell profile or System Environment Variables
   - Linux/Mac: Add to `.bashrc` or `.zshrc`
   - Project: Add to `.env.local` (web) or `gurukool_teacher/.env` (mobile)
3. **Set variables**:
   ```bash
   MOONSHOT_API_KEY=sk-your-key
   MOONSHOT_API_BASE=https://api.moonshot.cn/v1
   MOONSHOT_MODEL=moonshot-v1-32k
   ```
4. **Verify**: `echo $env:MOONSHOT_API_KEY` (PowerShell) or `echo $MOONSHOT_API_KEY` (Bash)
5. **Test**: Run `node test-kimi-api.js`

Your project is now configured to use Kimi K2! 🎉
