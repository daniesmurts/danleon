import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const ALLOWED = ['orders', 'purchases', 'inventory', 'batches', 'subscriptions', 'sales_reps', 'rep_allocations'];

function checkAuth(req: NextRequest) {
  return req.cookies.get('admin_auth')?.value === process.env.ADMIN_PASSWORD;
}

// Recursively converts Firestore Admin SDK Timestamps to { seconds } objects
// so existing admin pages (which expect { seconds: number }) don't need changes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serialize(val: any): any {
  if (val === null || val === undefined) return val;
  // Admin SDK Timestamp has _seconds / toDate()
  if (typeof val === 'object' && '_seconds' in val) return { seconds: val._seconds };
  if (val instanceof Date) return { seconds: Math.floor(val.getTime() / 1000) };
  if (Array.isArray(val)) return val.map(serialize);
  if (typeof val === 'object') {
    return Object.fromEntries(Object.entries(val).map(([k, v]) => [k, serialize(v)]));
  }
  return val;
}

// ── GET ─────────────────────────────────────────────────────────────────────
// /api/admin/data?col=orders[&id=docId][&orderBy=field&dir=asc|desc]
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp  = req.nextUrl.searchParams;
  const col = sp.get('col');
  const id  = sp.get('id');
  const ob  = sp.get('orderBy');
  const dir = (sp.get('dir') ?? 'asc') as 'asc' | 'desc';

  if (!col || !ALLOWED.includes(col))
    return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });

  const db = adminDb();

  if (id) {
    const snap = await db.collection(col).doc(id).get();
    if (!snap.exists) return NextResponse.json(null, { status: 404 });
    return NextResponse.json({ docId: snap.id, ...serialize(snap.data()) });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = db.collection(col);
  if (ob) q = q.orderBy(ob, dir);
  const snap = await q.get();
  return NextResponse.json(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    snap.docs.map((d: any) => ({ docId: d.id, ...serialize(d.data()) }))
  );
}

// ── POST ─────────────────────────────────────────────────────────────────────
// Create a new document; server stamps createdAt/updatedAt.
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const col = req.nextUrl.searchParams.get('col');
  if (!col || !ALLOWED.includes(col))
    return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });

  const body = await req.json();
  delete body.createdAt;
  delete body.updatedAt;

  const ref = await adminDb().collection(col).add({
    ...body,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return NextResponse.json({ docId: ref.id });
}

// ── PUT ──────────────────────────────────────────────────────────────────────
// Full set (replaces document) at a specific id.
// Used by inventory (which uses the row's own docId as the Firestore doc id).
export async function PUT(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp  = req.nextUrl.searchParams;
  const col = sp.get('col');
  const id  = sp.get('id');
  if (!col || !ALLOWED.includes(col) || !id)
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });

  const body = await req.json();
  delete body.createdAt;
  delete body.updatedAt;

  await adminDb().collection(col).doc(id).set({
    ...body,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return NextResponse.json({ success: true });
}

// ── PATCH ─────────────────────────────────────────────────────────────────────
// Partial update (merge) at a specific id.
export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp  = req.nextUrl.searchParams;
  const col = sp.get('col');
  const id  = sp.get('id');
  if (!col || !ALLOWED.includes(col) || !id)
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });

  const body = await req.json();
  delete body.updatedAt;

  await adminDb().collection(col).doc(id).update({
    ...body,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return NextResponse.json({ success: true });
}

// ── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp  = req.nextUrl.searchParams;
  const col = sp.get('col');
  const id  = sp.get('id');
  if (!col || !ALLOWED.includes(col) || !id)
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });

  await adminDb().collection(col).doc(id).delete();
  return NextResponse.json({ success: true });
}
