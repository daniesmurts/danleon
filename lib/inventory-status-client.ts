/**
 * Client-side helper for fetching live inventory status.
 * Module-level promise cache avoids multiple network requests
 * when several components mount on the same page.
 *
 * API keys are  "<productId>:<packSizeGrams>"  e.g. "premium:250"
 * A missing key means the product has no linked inventory row → pre-order.
 */

export interface StockEntry {
  stock: number;
  packs: number;
  inStock: boolean;
}

/** null = fetch in progress or failed (treat as in-stock to avoid blocking) */
export type InventoryStatusMap = Record<string, StockEntry> | null;

let cachedPromise: Promise<InventoryStatusMap> | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000; // 1 minute

export function fetchInventoryStatus(): Promise<InventoryStatusMap> {
  const now = Date.now();
  if (cachedPromise && now - cacheTime < CACHE_TTL) return cachedPromise;
  cacheTime = now;
  cachedPromise = fetch('/api/inventory-status')
    .then((r) => {
      if (!r.ok) return null;
      return r.json() as Promise<Record<string, StockEntry>>;
    })
    .catch(() => null); // network error → null (assume in-stock)
  return cachedPromise;
}

/**
 * Returns true if a product+size combination is in stock.
 *
 * Logic:
 *  - status is null (loading or failed)  → true  (don't block purchases on errors)
 *  - key not found in map                → false (no inventory row = pre-order)
 *  - key found                           → entry.inStock
 */
export function isInStock(
  status: InventoryStatusMap,
  productId: string,
  packSizeGrams: number,
): boolean {
  if (status === null) return true;
  const key = `${productId}:${packSizeGrams}`;
  if (!(key in status)) return false;
  return status[key].inStock;
}
