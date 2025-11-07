#!/usr/bin/env node

/**
 * Quick Application Test
 * 
 * This script performs basic checks to ensure the application is running correctly
 */

const http = require('http');

console.log('🚀 Quick Application Test');
console.log('========================');

async function testApplication() {
  const testResults = {
    passed: 0,
    failed: 0,
    tests: []
  };

  function logTest(testName, passed, details = '') {
    testResults.tests.push({ testName, passed, details });
    if (passed) {
      testResults.passed++;
      console.log(`✅ ${testName}`);
    } else {
      testResults.failed++;
      console.log(`❌ ${testName}: ${details}`);
    }
  }

  // Test 1: Check if development server is running
  console.log('\n🌐 Testing Server Status...');
  
  try {
    const response = await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3003', (res) => {
        resolve(res);
      });
      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error('Timeout')));
    });
    
    logTest('Development server is running', response.statusCode === 200);
  } catch (error) {
    logTest('Development server is running', false, error.message);
  }

  // Test 2: Check if build process works
  console.log('\n🔨 Testing Build Process...');
  
  const { exec } = require('child_process');
  
  try {
    await new Promise((resolve, reject) => {
      exec('npx tsc --noEmit', (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
    logTest('TypeScript compilation passes', true);
  } catch (error) {
    logTest('TypeScript compilation passes', false, error.message);
  }

  // Test 3: Check if all theme files exist
  console.log('\n🎨 Testing Theme Files...');
  
  const fs = require('fs');
  const themeFiles = [
    'src/design-system/themes/theme-config.ts',
    'src/components/NetflixBackground.tsx',
    'src/components/AmazonBackground.tsx',
    'src/components/KidsBackground.tsx',
    'src/components/RoleBasedTheme.tsx'
  ];

  themeFiles.forEach(file => {
    const exists = fs.existsSync(file);
    logTest(`${file} exists`, exists);
  });

  // Test 4: Check if Tailwind config has theme colors
  console.log('\n🎨 Testing Theme Configuration...');
  
  try {
    const tailwindConfig = fs.readFileSync('tailwind.config.ts', 'utf8');
    const hasNetflixColors = tailwindConfig.includes('netflix-red');
    const hasAmazonColors = tailwindConfig.includes('amazon-orange');
    const hasKidsColors = tailwindConfig.includes('kids-pink');
    
    logTest('Netflix colors in Tailwind config', hasNetflixColors);
    logTest('Amazon colors in Tailwind config', hasAmazonColors);
    logTest('Kids colors in Tailwind config', hasKidsColors);
  } catch (error) {
    logTest('Theme configuration check', false, error.message);
  }

  // Test 5: Check if package.json has required dependencies
  console.log('\n📦 Testing Dependencies...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = ['next', 'react', 'framer-motion', 'tailwindcss'];
    
    requiredDeps.forEach(dep => {
      const hasDep = packageJson.dependencies[dep] || packageJson.devDependencies[dep];
      logTest(`${dep} dependency present`, hasDep);
    });
  } catch (error) {
    logTest('Dependencies check', false, error.message);
  }

  // Test 6: Check if environment variables are set
  console.log('\n🔧 Testing Environment...');
  
  try {
    const envExists = fs.existsSync('.env');
    logTest('.env file exists', envExists);
    
    if (envExists) {
      const envContent = fs.readFileSync('.env', 'utf8');
      const hasSupabaseUrl = envContent.includes('SUPABASE_URL');
      const hasSupabaseKey = envContent.includes('SUPABASE_ANON_KEY');
      
      logTest('Supabase URL configured', hasSupabaseUrl);
      logTest('Supabase key configured', hasSupabaseKey);
    }
  } catch (error) {
    logTest('Environment configuration', false, error.message);
  }

  // Generate test report
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! Application is ready for testing.');
    console.log('\n🌐 Open your browser and visit: http://localhost:3003');
    console.log('\n📋 Follow the manual testing guide: scripts/manual-testing-guide.md');
  } else {
    console.log('\n⚠️  Some tests failed. Please fix the issues above before testing.');
  }
  
  return testResults;
}

// Run the tests
testApplication().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
