import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export interface PackSizeStatus {
  stock: number;
  packs: number;
  inStock: boolean;
}

/** Public endpoint — no auth required.
 *  Returns pack-size (grams) → stock status map for the frontend shop.
 *  Aggregates all inventory rows that have a packSize set.
 */
export async function GET() {
  try {
    const db = adminDb();
    const snap = await db.collection('inventory').get();

    const result: Record<string, PackSizeStatus> = {};

    snap.docs.forEach((doc) => {
      const data = doc.data();
      const packSize = data.packSize as number | undefined;
      if (!packSize) return;

      const stock = (data.stock as number) ?? 0;
      const unit = ((data.unit as string) || '').toLowerCase().trim();

      // Convert stock to grams
      const stockGrams =
        unit === 'кг' || unit === 'кг.' ? stock * 1000
        : unit === 'г' || unit === 'гр' || unit === 'г.' ? stock
        : 0;

      const packs = stockGrams > 0 ? Math.floor(stockGrams / packSize) : 0;

      const key = String(packSize);
      if (result[key]) {
        result[key].stock += stock;
        result[key].packs += packs;
        result[key].inStock = result[key].packs > 0;
      } else {
        result[key] = { stock, packs, inStock: packs > 0 };
      }
    });

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
    });
  } catch (err) {
    console.error('[inventory-status]', err);
    // On error: return empty map — shop stays open, no false OOS
    return NextResponse.json({});
  }
}
