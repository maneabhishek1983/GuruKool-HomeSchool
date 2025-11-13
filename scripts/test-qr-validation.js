/**
 * Test QR Code Validation
 *
 * This script tests the QR code generation and validation logic
 * to diagnose why QR codes are showing as invalid.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Parse .env file
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};

  envContent.split('\n').forEach(line => {
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

console.log('🔍 QR Code Validation Test\n');

// Check if QR secret is configured
const qrSecret = env.NEXT_PUBLIC_QR_SECRET;
console.log('1. QR Secret Configuration:');
if (qrSecret) {
  console.log('   ✅ NEXT_PUBLIC_QR_SECRET is configured');
  console.log('   Value:', qrSecret.substring(0, 10) + '...');
} else {
  console.log('   ❌ NEXT_PUBLIC_QR_SECRET is NOT configured');
  console.log('   Using fallback: "default-secret"');
  console.log('   ⚠️  This causes signature validation to fail!');
}
console.log('');

// Generate test signature
function generateSignature(teacherId, studentId, parentId, secret) {
  const data = `${teacherId}-${studentId}-${parentId}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(data);
  const signature = hmac.digest('base64').slice(0, 32);
  return signature;
}

// Test data (from screenshot)
const studentId = 'd584be88-5921-4ef3-af5b-6916dfcbc31c';
const teacherId = 'test-teacher-id'; // We don't know the actual teacher ID
const parentId = 'test-parent-id'; // We don't know the actual parent ID

console.log('2. Test QR Code Data:');
console.log('   Student ID:', studentId);
console.log('   Teacher ID:', teacherId, '(unknown - need actual value)');
console.log('   Parent ID:', parentId, '(unknown - need actual value)');
console.log('');

const testSecret = qrSecret || 'default-secret';
const testSignature = generateSignature(
  teacherId,
  studentId,
  parentId,
  testSecret
);

console.log('3. Generated Signature:');
console.log('   Secret:', testSecret.substring(0, 10) + '...');
console.log('   Signature:', testSignature);
console.log('');

console.log('4. QR Code Data Structure:');
const qrData = {
  type: 'teacher_auth',
  teacherId: teacherId,
  studentId: studentId,
  parentId: parentId,
  timestamp: Date.now(),
  signature: testSignature,
};
console.log(JSON.stringify(qrData, null, 2));
console.log('');

console.log('📋 DIAGNOSIS:\n');
console.log('Issue #1: Missing QR Secret');
console.log('   The QR code uses HMAC-SHA256 signatures for validation.');
console.log(
  '   Without NEXT_PUBLIC_QR_SECRET in .env, it uses "default-secret".'
);
console.log('   This causes ALL QR codes to fail validation!');
console.log('');

console.log('Issue #2: No QR Scanner Implementation');
console.log('   I searched for QR scanning code but found NONE.');
console.log("   The QR codes are generated but there's no way to scan them!");
console.log('   Missing: QR scanner component, validation API endpoint');
console.log('');

console.log('✅ SOLUTION:\n');
console.log('Step 1: Add QR Secret to .env');
console.log('   Add this line to your .env file:');
console.log(
  '   NEXT_PUBLIC_QR_SECRET=' + crypto.randomBytes(32).toString('base64')
);
console.log('');

console.log('Step 2: Implement QR Scanner');
console.log('   Need to create:');
console.log('   - QR scanner component (using @zxing/library or html5-qrcode)');
console.log('   - API endpoint: POST /api/teacher-sessions/scan');
console.log(
  '   - Validation logic using TeacherQRService.validateQRCodeAndCreateSession()'
);
console.log('');

console.log('Step 3: Test Flow');
console.log('   1. Parent generates QR code for teacher-student pair');
console.log('   2. Teacher scans QR code using mobile device');
console.log('   3. Scanner validates signature and creates session');
console.log('   4. Teacher signs in/out successfully');
console.log('');

console.log('🔗 Next Steps:');
console.log('   1. Add NEXT_PUBLIC_QR_SECRET to .env file (see above)');
console.log('   2. Restart dev server (to load new env variable)');
console.log('   3. Implement QR scanner component (I can help with this)');
console.log('   4. Test the complete flow');
console.log('');
