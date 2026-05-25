// Returns whether the currently logged-in user has an active subscription.
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  const userId = req.cookies.get('user_session')?.value;
  if (!userId) return NextResponse.json({ isSubscribed: false });

  try {
    const snap = await adminDb()
      .collection('subscriptions')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    return NextResponse.json({ isSubscribed: !snap.empty });
  } catch {
    return NextResponse.json({ isSubscribed: false });
  }
}
