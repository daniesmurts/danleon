import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.redirect(new URL('/admin/login', process.env.NEXT_PUBLIC_APP_URL));
  res.cookies.delete('admin_auth');
  return res;
}
