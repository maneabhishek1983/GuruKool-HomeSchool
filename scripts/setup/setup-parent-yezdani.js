// Script to setup parent account for yezdanibegum@gmail.com
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
const envFile = fs.readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function setupParentAccount() {
  console.log('🔧 Setting up Parent Account: yezdanibegum@gmail.com\n');

  const userId = 'efff96e1-687d-4ca9-983e-8dd2eeebb2fc';
  const userEmail = 'yezdanibegum@gmail.com';
  const newPassword = 'Parent123!';
  const userName = 'Yezdani Begum';

  try {
    // Step 1: Reset password
    console.log('🔐 Step 1: Resetting password...');
    const { data: authData, error: authError } =
      await supabase.auth.admin.updateUserById(userId, {
        password: newPassword,
        email_confirm: true,
      });

    if (authError) {
      console.error('❌ Error resetting password:', authError.message);
      return;
    }

    console.log('✅ Password reset successful');

    // Step 2: Check if profile exists
    console.log('\n📡 Step 2: Checking user profile...');
    const { data: existingProfile, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      console.log('✅ User profile already exists!');
      console.log('   Name:', existingProfile.name);
      console.log('   Role:', existingProfile.role);
    } else {
      // Step 3: Create user profile
      console.log('\n📝 Step 3: Creating user profile...');
      const { data: newProfile, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            email: userEmail,
            name: userName,
            role: 'parent',
            preferences: {
              notifications: {
                email: true,
                push: true,
                sms: false,
                inApp: true,
                frequency: 'immediate',
              },
              dashboard: {
                layout: 'detailed',
                theme: 'light',
                widgets: ['students', 'sessions', 'analytics'],
              },
              privacy: {
                dataSharing: false,
                analytics: true,
                aiTraining: false,
              },
              accessibility: {
                fontSize: 'medium',
                highContrast: false,
                reducedMotion: false,
                screenReader: false,
              },
            },
            created_at: new Date().toISOString(),
            last_active: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error creating profile:', insertError.message);
        return;
      }

      console.log('✅ User profile created successfully!');
    }

    console.log('\n🎉 SUCCESS! Parent account is ready!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 LOGIN CREDENTIALS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('   Email:    ', userEmail);
    console.log('   Password: ', newPassword);
    console.log(
      '   Login URL:',
      'https://gurukool-homeschool.vercel.app/login'
    );
    console.log(
      '   Dashboard:',
      'https://gurukool-homeschool.vercel.app/parent/dashboard'
    );
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n⚠️  IMPORTANT: Share this password with the user securely!');
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('Stack:', error.stack);
  }
}

setupParentAccount().catch(console.error);
