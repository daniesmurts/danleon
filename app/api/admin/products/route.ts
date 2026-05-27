import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/sanity';

function checkAuth(req: NextRequest) {
  return req.cookies.get('admin_auth')?.value === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const products = await getAllProducts();
  return NextResponse.json(products.map((p) => ({ id: p.id, name: p.name })));
}
