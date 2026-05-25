import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  const userId = req.cookies.get('user_session')?.value;
  if (!userId) return NextResponse.json({}, { status: 401 });

  try {
    const snap = await adminDb().collection('users').doc(userId).get();
    if (!snap.exists) return NextResponse.json({});
    const { firstName, lastName, phone, email } = snap.data() as Record<string, string>;
    return NextResponse.json({ firstName, lastName, phone, email });
  } catch {
    return NextResponse.json({});
  }
}
