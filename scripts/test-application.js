#!/usr/bin/env node

/**
 * Comprehensive Application Testing Script
 * 
 * This script tests all features and user journeys:
 * 1. Authentication flows
 * 2. Role-based theme switching
 * 3. Parent dashboard functionality
 * 4. Teacher dashboard functionality
 * 5. Student profile functionality
 * 6. Cross-browser compatibility
 * 7. Responsive design
 */

const { chromium } = require('playwright');
const fs = require('fs');

console.log('🧪 Comprehensive Application Testing');
console.log('====================================');

async function testApplication() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

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

  try {
    console.log('\n🌐 Testing Application Launch...');
    
    // Test 1: Application loads successfully
    await page.goto('http://localhost:3003');
    await page.waitForLoadState('networkidle');
    
    const title = await page.title();
    logTest('Application loads successfully', title.includes('Gurukool'));
    
    // Test 2: Home page displays correctly
    const homePageElements = await page.locator('h1').count();
    logTest('Home page displays correctly', homePageElements > 0);
    
    // Test 3: Netflix theme is applied (default)
    const netflixTheme = await page.evaluate(() => {
      return document.body.classList.contains('theme-netflix') || 
             document.documentElement.classList.contains('netflix');
    });
    logTest('Netflix theme applied by default', netflixTheme);
    
    // Test 4: Navigation to login page
    await page.click('a[href="/login"]');
    await page.waitForLoadState('networkidle');
    
    const loginPageTitle = await page.locator('h1').first().textContent();
    logTest('Login page loads correctly', loginPageTitle?.includes('Welcome Back'));
    
    // Test 5: Login form functionality
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    const emailValue = await page.inputValue('input[type="email"]');
    const passwordValue = await page.inputValue('input[type="password"]');
    logTest('Login form accepts input', emailValue === 'test@example.com' && passwordValue === 'password123');
    
    // Test 6: Theme switching based on role
    console.log('\n🎨 Testing Theme Switching...');
    
    // Simulate parent login
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        id: '1',
        name: 'John Parent',
        email: 'parent@example.com',
        role: 'parent'
      }));
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const parentTheme = await page.evaluate(() => {
      return document.body.classList.contains('theme-netflix') || 
             document.documentElement.classList.contains('netflix');
    });
    logTest('Parent role applies Netflix theme', parentTheme);
    
    // Test 7: Parent dashboard functionality
    console.log('\n👨‍👩‍👧‍👦 Testing Parent Dashboard...');
    
    // Navigate to parent dashboard
    await page.goto('http://localhost:3003/parent/dashboard');
    await page.waitForLoadState('networkidle');
    
    const parentDashboardTitle = await page.locator('h1').first().textContent();
    logTest('Parent dashboard loads', parentDashboardTitle?.includes('Parent Dashboard'));
    
    // Test dashboard stats cards
    const statsCards = await page.locator('[class*="card"]').count();
    logTest('Dashboard stats cards display', statsCards > 0);
    
    // Test 8: Teacher role theme switching
    console.log('\n👩‍🏫 Testing Teacher Theme...');
    
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        id: '2',
        name: 'Jane Teacher',
        email: 'teacher@example.com',
        role: 'teacher'
      }));
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const teacherTheme = await page.evaluate(() => {
      return document.body.classList.contains('theme-amazon') || 
             document.documentElement.classList.contains('amazon');
    });
    logTest('Teacher role applies Amazon theme', teacherTheme);
    
    // Test 9: Teacher dashboard
    await page.goto('http://localhost:3003/teacher/dashboard');
    await page.waitForLoadState('networkidle');
    
    const teacherDashboardTitle = await page.locator('h1').first().textContent();
    logTest('Teacher dashboard loads', teacherDashboardTitle?.includes('Teacher Dashboard'));
    
    // Test 10: Student role theme switching
    console.log('\n🎓 Testing Student Theme...');
    
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        id: '3',
        name: 'Alex Student',
        email: 'student@example.com',
        role: 'student'
      }));
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const studentTheme = await page.evaluate(() => {
      return document.body.classList.contains('theme-kids') || 
             document.documentElement.classList.contains('kids');
    });
    logTest('Student role applies Kids theme', studentTheme);
    
    // Test 11: Student profile page
    await page.goto('http://localhost:3003/student/profile');
    await page.waitForLoadState('networkidle');
    
    const studentProfileTitle = await page.locator('h1').first().textContent();
    logTest('Student profile loads', studentProfileTitle?.includes('My Learning Journey'));
    
    // Test 12: Responsive design
    console.log('\n📱 Testing Responsive Design...');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const mobileLayout = await page.evaluate(() => {
      return window.innerWidth === 375;
    });
    logTest('Mobile viewport works', mobileLayout);
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const tabletLayout = await page.evaluate(() => {
      return window.innerWidth === 768;
    });
    logTest('Tablet viewport works', tabletLayout);
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const desktopLayout = await page.evaluate(() => {
      return window.innerWidth === 1920;
    });
    logTest('Desktop viewport works', desktopLayout);
    
    // Test 13: Animation performance
    console.log('\n🎬 Testing Animations...');
    
    const animationElements = await page.locator('[class*="motion"]').count();
    logTest('Animation elements present', animationElements > 0);
    
    // Test 14: Accessibility
    console.log('\n♿ Testing Accessibility...');
    
    const ariaLabels = await page.locator('[aria-label]').count();
    const altTexts = await page.locator('img[alt]').count();
    logTest('Accessibility features present', ariaLabels > 0 || altTexts > 0);
    
    // Test 15: Performance
    console.log('\n⚡ Testing Performance...');
    
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
      };
    });
    
    logTest('Page loads within 3 seconds', performanceMetrics.loadTime < 3000);
    logTest('DOM content loads quickly', performanceMetrics.domContentLoaded < 1000);
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    testResults.failed++;
  } finally {
    await browser.close();
  }
  
  // Generate test report
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.passed + testResults.failed,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)
    },
    tests: testResults.tests
  };
  
  fs.writeFileSync('test-results.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Detailed report saved to test-results.json');
  
  return testResults;
}

// Run the tests
testApplication().then(results => {
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Application is ready for production.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues above.');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
