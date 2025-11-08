/**
 * Prepare Vercel Environment Variables with Actual Values
 *
 * This script reads your local .env file and creates a ready-to-upload
 * .env.vercel file with all placeholder values replaced with actual credentials.
 *
 * Usage: node scripts/prepare-vercel-env.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Manual .env file parsing (no dotenv dependency)
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};

  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return env;
}

// Check if value is a placeholder
function isPlaceholder(value) {
  if (!value) return true;
  const lowerValue = value.toLowerCase();
  return (
    lowerValue.startsWith('your-') ||
    lowerValue.startsWith('your_') ||
    lowerValue === 'replace_with_your_value' ||
    lowerValue.includes('placeholder') ||
    lowerValue.includes('changeme') ||
    lowerValue.includes('example')
  );
}

// Environment variable configuration with descriptions
const ENV_VARS_CONFIG = {
  // Critical - Production Required
  'NEXT_PUBLIC_SUPABASE_URL': {
    required: true,
    scope: 'all',
    description: 'Supabase project URL',
    example: 'https://xxxxx.supabase.co',
    howToGet: 'Supabase Dashboard → Project Settings → API → Project URL',
  },
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': {
    required: true,
    scope: 'all',
    description: 'Supabase anonymous key (public, RLS-protected)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    howToGet: 'Supabase Dashboard → Project Settings → API → anon public key',
  },
  'SUPABASE_SERVICE_ROLE_KEY': {
    required: true,
    scope: 'production',
    description: 'Supabase service role key (server-side only)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    howToGet: 'Supabase Dashboard → Project Settings → API → service_role secret',
    warning: '⚠️  KEEP SECRET - Never expose to client-side code',
  },
  'JWT_SECRET': {
    required: true,
    scope: 'production',
    description: 'JWT signing secret (min 32 characters)',
    example: 'your-super-secret-jwt-key-at-least-32-chars-long',
    howToGet: 'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
  },
  'NEXT_PUBLIC_APP_URL': {
    required: true,
    scope: 'all',
    description: 'Your Vercel deployment URL',
    example: 'https://your-app.vercel.app',
    howToGet: 'Your Vercel deployment URL (after first deploy)',
  },

  // Optional - AI/ML Services
  'OPENAI_API_KEY': {
    required: false,
    scope: 'development',
    description: 'OpenAI API key (local dev only)',
    example: 'sk-proj-...',
    howToGet: 'OpenAI Dashboard → API Keys',
    note: 'Production uses Chomsky LLM instead',
  },
  'PINECONE_API_KEY': {
    required: false,
    scope: 'all',
    description: 'Pinecone vector database API key',
    example: 'pcsk_...',
    howToGet: 'Pinecone Console → API Keys',
  },
  'PINECONE_ENVIRONMENT': {
    required: false,
    scope: 'all',
    description: 'Pinecone environment name',
    example: 'us-east1-gcp',
    howToGet: 'Pinecone Console → Environment',
  },

  // Optional - Rate Limiting
  'UPSTASH_REDIS_REST_URL': {
    required: false,
    scope: 'all',
    description: 'Upstash Redis REST URL for rate limiting',
    example: 'https://xxxxx.upstash.io',
    howToGet: 'Upstash Console → Database → REST API → UPSTASH_REDIS_REST_URL',
  },
  'UPSTASH_REDIS_REST_TOKEN': {
    required: false,
    scope: 'production',
    description: 'Upstash Redis authentication token',
    example: 'AXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXx',
    howToGet: 'Upstash Console → Database → REST API → UPSTASH_REDIS_REST_TOKEN',
  },

  // Optional - Monitoring
  'SENTRY_DSN': {
    required: false,
    scope: 'all',
    description: 'Sentry error tracking DSN',
    example: 'https://xxxxx@xxxxx.ingest.sentry.io/xxxxx',
    howToGet: 'Sentry → Settings → Projects → Client Keys (DSN)',
  },
  'SENTRY_AUTH_TOKEN': {
    required: false,
    scope: 'production',
    description: 'Sentry authentication token',
    example: 'sntrys_xxxxx',
    howToGet: 'Sentry → Settings → Auth Tokens',
  },

  // Optional - WebSocket & MCP
  'NEXT_PUBLIC_WS_URL': {
    required: false,
    scope: 'development',
    description: 'WebSocket URL for real-time features',
    example: 'wss://your-app.vercel.app/ws',
    howToGet: 'Your WebSocket server URL',
  },
  'MCP_EDUCATION_ENDPOINT': {
    required: false,
    scope: 'development',
    description: 'MCP education server endpoint',
    example: 'https://your-mcp-server.com/education',
    howToGet: 'Your MCP server endpoint',
  },
  'MCP_SECURITY_ENDPOINT': {
    required: false,
    scope: 'development',
    description: 'MCP security server endpoint',
    example: 'https://your-mcp-server.com/security',
    howToGet: 'Your MCP server endpoint',
  },
  'MCP_COMMUNICATION_ENDPOINT': {
    required: false,
    scope: 'development',
    description: 'MCP communication server endpoint',
    example: 'https://your-mcp-server.com/communication',
    howToGet: 'Your MCP server endpoint',
  },

  // Development Only
  'DEMO_PARENT_PASSWORD': {
    required: false,
    scope: 'development',
    description: 'Demo parent account password',
    example: 'parent123',
    howToGet: 'Set any password for demo accounts',
    note: 'Development/Preview only - set ENABLE_DEMO_CREDENTIALS=false in production',
  },
  'DEMO_ADMIN_PASSWORD': {
    required: false,
    scope: 'development',
    description: 'Demo admin account password',
    example: 'admin123',
    howToGet: 'Set any password for demo accounts',
  },
  'DEMO_TEACHER_PASSWORD': {
    required: false,
    scope: 'development',
    description: 'Demo teacher account password',
    example: 'teacher123',
    howToGet: 'Set any password for demo accounts',
  },
  'ENABLE_DEMO_CREDENTIALS': {
    required: false,
    scope: 'development',
    description: 'Enable demo credentials',
    example: 'false',
    howToGet: 'Set to "false" in production, "true" in dev/preview',
    note: 'MUST be "false" in production',
  },
};

function generateVercelEnvContent(env, mode = 'auto') {
  const lines = [];
  const missing = [];
  const warnings = [];

  lines.push('# GuruKool HomeSchool - Vercel Environment Variables');
  lines.push('# Generated: ' + new Date().toISOString());
  lines.push('# Mode: ' + mode);
  lines.push('#');
  lines.push('# Ready to upload to Vercel Dashboard');
  lines.push('# Go to: Settings → Environment Variables → Import .env');
  lines.push('');

  // System variables
  lines.push('# =================================================================');
  lines.push('# SYSTEM VARIABLES');
  lines.push('# =================================================================');
  lines.push('');
  lines.push('NODE_ENV=production');
  lines.push('HUSKY=0');
  lines.push('');

  // Process each category
  const categories = {
    'CRITICAL - PRODUCTION REQUIRED': ['production'],
    'ALL ENVIRONMENTS': ['all'],
    'DEVELOPMENT & PREVIEW ONLY': ['development'],
  };

  Object.entries(categories).forEach(([categoryName, scopes]) => {
    lines.push('# =================================================================');
    lines.push(`# ${categoryName}`);
    lines.push('# =================================================================');
    lines.push('');

    Object.entries(ENV_VARS_CONFIG).forEach(([key, config]) => {
      if (!scopes.includes(config.scope)) return;

      const value = env[key] || '';
      const hasValidValue = value && !isPlaceholder(value);

      // Add description
      lines.push(`# ${config.description}`);

      // Add scope info
      if (config.scope === 'production') {
        lines.push('# Vercel Scope: Production only');
      } else if (config.scope === 'development') {
        lines.push('# Vercel Scope: Development, Preview');
      } else {
        lines.push('# Vercel Scope: Production, Preview, Development');
      }

      // Add how to get info
      if (config.howToGet) {
        lines.push(`# How to get: ${config.howToGet}`);
      }

      // Add warnings
      if (config.warning) {
        lines.push(`# ${config.warning}`);
      }

      // Add notes
      if (config.note) {
        lines.push(`# Note: ${config.note}`);
      }

      // Add the variable
      if (hasValidValue) {
        lines.push(`${key}=${value}`);
      } else {
        if (config.required) {
          lines.push(`${key}=REQUIRED_REPLACE_ME  # ⚠️ REQUIRED - ${config.example}`);
          missing.push({ key, config });
        } else {
          lines.push(`# ${key}=${config.example}  # Optional - uncomment and set if needed`);
          warnings.push({ key, config });
        }
      }

      lines.push('');
    });
  });

  return { content: lines.join('\n'), missing, warnings };
}

function generateReport(missing, warnings) {
  console.log('\n' + '='.repeat(70));
  console.log('📋 VERCEL ENVIRONMENT PREPARATION REPORT');
  console.log('='.repeat(70) + '\n');

  if (missing.length === 0) {
    console.log('✅ All required environment variables have values!\n');
  } else {
    console.log('❌ Missing Required Variables:\n');
    missing.forEach(({ key, config }) => {
      console.log(`   ${key}`);
      console.log(`   └─ ${config.description}`);
      console.log(`   └─ How to get: ${config.howToGet}`);
      console.log('');
    });
  }

  if (warnings.length > 0) {
    console.log('⚠️  Optional Variables (not set):\n');
    warnings.forEach(({ key, config }) => {
      console.log(`   ${key} - ${config.description}`);
    });
    console.log('');
  }

  console.log('='.repeat(70));
  console.log('📝 NEXT STEPS');
  console.log('='.repeat(70) + '\n');

  if (missing.length > 0) {
    console.log('1. Edit .env.vercel and replace all REQUIRED_REPLACE_ME values:');
    missing.forEach(({ key }) => {
      console.log(`   - ${key}`);
    });
    console.log('');
  }

  console.log(`${missing.length > 0 ? '2' : '1'}. Upload to Vercel Dashboard:`);
  console.log('   • Go to: https://vercel.com/dashboard');
  console.log('   • Select your project');
  console.log('   • Settings → Environment Variables → Import .env');
  console.log('   • Upload .env.vercel');
  console.log('');

  console.log(`${missing.length > 0 ? '3' : '2'}. Set correct environment scopes:');
  console.log('   • Production only: Service keys, JWT secrets');
  console.log('   • All environments: Public URLs, feature flags');
  console.log('   • Development/Preview: Demo credentials, test endpoints');
  console.log('');

  console.log(`${missing.length > 0 ? '4' : '3'}. Deploy your application:');
  console.log('   vercel --prod');
  console.log('');

  console.log('='.repeat(70) + '\n');
}

async function main() {
  console.log('🔧 Preparing Vercel Environment Variables...\n');

  // Check for .env file
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Error: .env file not found');
    console.error('   Create a .env file based on .env.example\n');
    process.exit(1);
  }

  // Parse .env file
  console.log('📖 Reading .env file...');
  const env = parseEnvFile(envPath);

  if (Object.keys(env).length === 0) {
    console.error('❌ Error: .env file is empty\n');
    process.exit(1);
  }

  // Generate .env.vercel content
  console.log('🔨 Generating .env.vercel file...');
  const { content, missing, warnings } = generateVercelEnvContent(env, 'auto');

  // Write .env.vercel file
  const vercelEnvPath = path.join(process.cwd(), '.env.vercel');
  fs.writeFileSync(vercelEnvPath, content, 'utf8');

  console.log(`✅ Generated: ${vercelEnvPath}\n`);

  // Generate report
  generateReport(missing, warnings);

  // Security reminder
  console.log('🔒 SECURITY REMINDERS:');
  console.log('   • Never commit .env.vercel with real credentials to Git');
  console.log('   • .env.vercel is already in .gitignore');
  console.log('   • Rotate keys if accidentally exposed');
  console.log('   • Use different keys for Production vs Preview/Dev');
  console.log('   • ENABLE_DEMO_CREDENTIALS must be "false" in production');
  console.log('');

  // Exit code
  process.exit(missing.length > 0 ? 1 : 0);
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

module.exports = { generateVercelEnvContent, isPlaceholder };
