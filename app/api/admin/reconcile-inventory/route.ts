// Reconcile inventory against all paid orders.
// GET  → returns a preview of what will change (no writes)
// POST → applies the changes (sets stock = current - sold)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

function checkAuth(req: NextRequest) {
  return req.cookies.get('admin_auth')?.value === process.env.ADMIN_PASSWORD;
}

async function computeReconciliation() {
  const db = adminDb();

  // 1. Sum sold kg per packSize across all paid orders
  const orderSnap = await db.collection('orders').where('status', '==', 'paid').get();
  const soldKgByPackSize: Record<number, number> = {};
  const orderCountByPackSize: Record<number, number> = {};

  for (const doc of orderSnap.docs) {
    const items: Array<{ weight?: number; quantity?: number }> = doc.data().items ?? [];
    for (const item of items) {
      const packSizeG = item.weight ?? 0;
      const qty = item.quantity ?? 1;
      if (!packSizeG) continue;
      soldKgByPackSize[packSizeG] = (soldKgByPackSize[packSizeG] ?? 0) + (packSizeG * qty) / 1000;
      orderCountByPackSize[packSizeG] = (orderCountByPackSize[packSizeG] ?? 0) + 1;
    }
  }

  // 2. Match inventory rows by packSize
  const invSnap = await db.collection('inventory').get();
  const lines = invSnap.docs
    .filter((d) => d.data().packSize)
    .map((d) => {
      const data = d.data();
      const packSizeG = data.packSize as number;
      const soldKg = Math.round((soldKgByPackSize[packSizeG] ?? 0) * 1000) / 1000;
      const currentStock = data.stock as number;
      const newStock = Math.max(0, Math.round((currentStock - soldKg) * 1000) / 1000);
      return {
        docId: d.id,
        name: data.name as string,
        packSize: packSizeG,
        currentStock,
        soldKg,
        newStock,
        orderCount: orderCountByPackSize[packSizeG] ?? 0,
        changed: newStock !== currentStock,
      };
    });

  return { lines, totalOrders: orderSnap.size };
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const result = await computeReconciliation();
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { lines } = await computeReconciliation();
  const db = adminDb();

  for (const line of lines.filter((l) => l.changed)) {
    await db.collection('inventory').doc(line.docId).update({
      stock: line.newStock,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  return NextResponse.json({ applied: lines.filter((l) => l.changed).length, lines });
}
