/**
 * Client-side helper for fetching live inventory status.
 * Module-level promise cache avoids multiple network requests
 * when several components mount on the same page.
 */

export interface PackSizeStatus {
  stock: number;
  packs: number;
  inStock: boolean;
}

export type InventoryStatusMap = Record<string, PackSizeStatus>;

let cachedPromise: Promise<InventoryStatusMap> | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000; // 1 minute

export function fetchInventoryStatus(): Promise<InventoryStatusMap> {
  const now = Date.now();
  if (cachedPromise && now - cacheTime < CACHE_TTL) return cachedPromise;
  cacheTime = now;
  cachedPromise = fetch('/api/inventory-status')
    .then((r) => r.json() as Promise<InventoryStatusMap>)
    .catch(() => ({} as InventoryStatusMap));
  return cachedPromise;
}

/**
 * Returns true if the given pack size (in grams) is in stock.
 * Defaults to true when the pack size is not tracked in inventory
 * (so we never falsely block purchases due to missing data).
 */
export function isPackSizeInStock(
  status: InventoryStatusMap,
  packSizeGrams: number,
): boolean {
  const key = String(packSizeGrams);
  if (!(key in status)) return true;
  return status[key].inStock;
}
