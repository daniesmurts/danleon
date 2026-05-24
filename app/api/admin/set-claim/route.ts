import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

// One-time (idempotent) setup: permanently stamps { role: 'admin' } onto the
// Firebase user identified by ADMIN_UID so they never need to re-enter the
// admin password after logging into the main site.
// Protected by the admin_auth cookie.
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
    await adminAuth().setCustomUserClaims(adminUid, { role: 'admin' });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to set admin claim:', err);
    return NextResponse.json({ error: 'Failed to set claim' }, { status: 500 });
  }
}
