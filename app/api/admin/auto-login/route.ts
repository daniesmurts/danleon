import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

// Accepts a Firebase ID token in the Authorization header.
// If the token has role: 'admin' claim, issues the admin_auth cookie so the
// admin panel layout accepts the request — no password form needed.
export async function POST(req: NextRequest) {
  const idToken = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!idToken) {
    return NextResponse.json({ error: 'No token' }, { status: 401 });
  }

  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Not an admin account' }, { status: 403 });
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_auth', adminPassword, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    return response;
  } catch (err) {
    console.error('auto-login failed:', err);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
