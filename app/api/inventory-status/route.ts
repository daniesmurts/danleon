import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export interface StockEntry {
  stock: number;   // raw stock in the item's unit (e.g. kg)
  packs: number;   // computed pack count
  inStock: boolean;
}

/**
 * Public GET /api/inventory-status
 *
 * Returns a flat map keyed by  "<productId>:<packSize>"
 * e.g. { "premium:250": { stock: 11, packs: 44, inStock: true }, ... }
 *
 * Only rows that have BOTH productId and packSize are included.
 * The frontend treats "no entry for a given product+size" as pre-order.
 */
export async function GET() {
  try {
    const db = adminDb();
    const snap = await db.collection('inventory').get();

    const result: Record<string, StockEntry> = {};

    snap.docs.forEach((doc) => {
      const d = doc.data();
      const productId = d.productId as string | undefined;
      const packSize  = d.packSize  as number | undefined;

      // Skip rows not linked to a product
      if (!productId || !packSize) return;

      const stock = (d.stock as number) ?? 0;
      const unit  = ((d.unit as string) || '').toLowerCase().trim();

      // Convert stored stock to grams so we can count packs
      const stockG =
        unit === 'кг' || unit === 'кг.' ? stock * 1000
        : unit === 'г' || unit === 'гр' || unit === 'г.' ? stock
        : stock * packSize; // fallback: treat as pack count already

      const packs = stockG > 0 ? Math.floor(stockG / packSize) : 0;

      result[`${productId}:${packSize}`] = { stock, packs, inStock: packs > 0 };
    });

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch (err) {
    console.error('[inventory-status]', err);
    // On error return empty — shop stays open, no false OOS shown
    return NextResponse.json({});
  }
}
