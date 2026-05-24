import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

// Returns a Firebase custom token for the admin UID.
// Only works if the request already has a valid admin_auth cookie.
export async function POST(req: NextRequest) {
  const cookie = req.cookies.get('admin_auth')?.value;
  if (!cookie || cookie !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminUid = process.env.ADMIN_UID;
  if (!adminUid) {
    return NextResponse.json({ error: 'ADMIN_UID not configured' }, { status: 500 });
  }

  try {
    const token = await adminAuth().createCustomToken(adminUid, { role: 'admin' });
    return NextResponse.json({ token });
  } catch (err) {
    console.error('Failed to create custom token:', err);
    return NextResponse.json({ error: 'Token generation failed' }, { status: 500 });
  }
}
