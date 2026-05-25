// Returns an array of email addresses for all active subscribers.
// Used by the admin clients page to show subscription badges.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

function checkAuth(req: NextRequest) {
  return req.cookies.get('admin_auth')?.value === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminDb();

  // Fetch all active subscriptions
  const snap = await db.collection('subscriptions')
    .where('status', '==', 'active')
    .get();

  if (snap.empty) return NextResponse.json([]);

  // Bulk-resolve UIDs → emails in a single Firebase Auth call
  const userIds = snap.docs
    .map((d) => d.data().userId as string)
    .filter(Boolean)
    .map((uid) => ({ uid }));

  const { users } = await adminAuth().getUsers(userIds);
  const emails = users.map((u) => u.email).filter(Boolean) as string[];

  return NextResponse.json(emails);
}
