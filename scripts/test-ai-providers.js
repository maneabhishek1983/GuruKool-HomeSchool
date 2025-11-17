/**
 * Test AI Providers - Verify Kimi K2 and OpenRouter API keys
 * Usage: node scripts/test-ai-providers.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Manual .env parsing (no dotenv dependency)
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const env = {};

  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local not found');
    return env;
  }

  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return env;
}

const env = loadEnv();

// Test configurations
const providers = [
  {
    name: 'Kimi K2 (Moonshot AI)',
    apiKey: env.MOONSHOT_API_KEY,
    baseUrl: 'https://api.moonshot.cn',
    endpoint: '/v1/chat/completions',
    model: env.MOONSHOT_MODEL || 'moonshot-v1-8k',
    testMessage: '你好，请回复：Kimi K2 工作正常',
  },
  {
    name: 'OpenRouter',
    apiKey: env.OPENROUTER_API_KEY,
    baseUrl: 'https://openrouter.ai',
    endpoint: '/api/v1/chat/completions',
    model: 'openai/gpt-3.5-turbo',
    testMessage: 'Say exactly: "OpenRouter is working!" (no other text)',
  },
];

// Test a single provider
function testProvider(provider) {
  return new Promise((resolve, reject) => {
    if (!provider.apiKey) {
      resolve({
        provider: provider.name,
        status: 'skipped',
        reason: 'API key not set',
      });
      return;
    }

    const data = JSON.stringify({
      model: provider.model,
      messages: [
        {
          role: 'user',
          content: provider.testMessage,
        },
      ],
      max_tokens: 20,
      temperature: 0.1,
    });

    const url = new URL(provider.endpoint, provider.baseUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
        'Content-Length': data.length,
        // OpenRouter specific headers
        ...(provider.name === 'OpenRouter' && {
          'HTTP-Referer': 'https://gurukool-homeschool.vercel.app',
          'X-Title': 'GuruKool HomeSchool',
        }),
      },
      timeout: 30000, // 30 second timeout
    };

    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => (body += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(body);
            const message = response.choices[0]?.message?.content || '';
            resolve({
              provider: provider.name,
              status: 'success',
              model: provider.model,
              response: message.trim(),
            });
          } catch (e) {
            resolve({
              provider: provider.name,
              status: 'error',
              reason: `Response parsing error: ${e.message}`,
            });
          }
        } else {
          resolve({
            provider: provider.name,
            status: 'error',
            reason: `HTTP ${res.statusCode}: ${body}`,
          });
        }
      });
    });

    req.on('error', error => {
      resolve({
        provider: provider.name,
        status: 'error',
        reason: `Connection error: ${error.message}`,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        provider: provider.name,
        status: 'error',
        reason: 'Request timeout (30s)',
      });
    });

    req.write(data);
    req.end();
  });
}

// Main test function
async function testAllProviders() {
  console.log('\n🧪 Testing AI Providers\n');
  console.log('='.repeat(60));

  const results = [];

  for (const provider of providers) {
    console.log(`\n📡 Testing: ${provider.name}`);
    console.log('-'.repeat(60));

    const result = await testProvider(provider);
    results.push(result);

    switch (result.status) {
      case 'success':
        console.log(`✅ Status: Working`);
        console.log(`📝 Model: ${result.model}`);
        console.log(`💬 Response: "${result.response}"`);
        break;

      case 'skipped':
        console.log(`⏭️  Status: Skipped`);
        console.log(`ℹ️  Reason: ${result.reason}`);
        break;

      case 'error':
        console.log(`❌ Status: Failed`);
        console.log(`⚠️  Error: ${result.reason}`);
        break;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary\n');

  const working = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'error');
  const skipped = results.filter(r => r.status === 'skipped');

  console.log(`✅ Working: ${working.length}/${providers.length}`);
  if (working.length > 0) {
    working.forEach(r => console.log(`   - ${r.provider}`));
  }

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}`);
    failed.forEach(r => console.log(`   - ${r.provider}: ${r.reason}`));
  }

  if (skipped.length > 0) {
    console.log(`\n⏭️  Skipped: ${skipped.length}`);
    skipped.forEach(r => console.log(`   - ${r.provider}: ${r.reason}`));
  }

  // Recommendations
  console.log('\n' + '='.repeat(60));
  console.log('\n💡 Recommendations\n');

  if (working.length === 0) {
    console.log('❌ No AI providers are working!');
    console.log('   1. Check API keys in .env.local');
    console.log('   2. Verify internet connection');
    console.log('   3. Check API quotas/billing');
  } else {
    console.log(`✅ ${working.length} AI provider(s) available`);
    console.log(`   Priority: ${working.map(r => r.provider).join(' > ')}`);

    if (skipped.length > 0) {
      console.log('\n📝 To enable skipped providers:');
      skipped.forEach(r => {
        const keyName =
          r.provider === 'Kimi K2 (Moonshot AI)'
            ? 'MOONSHOT_API_KEY'
            : 'OPENROUTER_API_KEY';
        console.log(`   - Add ${keyName} to .env.local`);
      });
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Exit code
  process.exit(working.length > 0 ? 0 : 1);
}

// Run tests
testAllProviders().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
