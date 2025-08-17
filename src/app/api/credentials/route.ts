import { NextRequest, NextResponse } from 'next/server';

const demoCredentials = {
  'parent@example.com': { password: 'parent123', role: 'parent' },
  'admin@example.com': { password: 'admin123', role: 'admin' },
  'teacher@example.com': { password: 'teacher123', role: 'teacher' },
};

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const credentials = demoCredentials[email];

    if (!credentials) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      email,
      password: credentials.password,
      role: credentials.role,
      message: 'Demo credentials retrieved successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Credentials retrieval endpoint',
    availableEmails: Object.keys(demoCredentials),
  });
}
