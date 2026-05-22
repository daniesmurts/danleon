import { NextRequest, NextResponse } from 'next/server';

const COOKIE = 'user_session';
const OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export async function POST(req: NextRequest) {
  const { uid } = await req.json();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, uid, { ...OPTS, maxAge: 60 * 60 * 24 * 7 });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE);
  return res;
}
