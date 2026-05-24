// Client-side helpers that call /api/admin/data instead of Firestore directly.
// The API route uses the Admin SDK which bypasses Firestore security rules —
// so admin pages work regardless of Firebase Auth state in the browser.

const BASE = '/api/admin/data';

function url(col: string, id?: string, opts?: { orderBy?: string; dir?: string }) {
  const p = new URLSearchParams({ col });
  if (id) p.set('id', id);
  if (opts?.orderBy) p.set('orderBy', opts.orderBy);
  if (opts?.dir) p.set('dir', opts.dir);
  return `${BASE}?${p}`;
}

export async function adminGetAll(
  col: string,
  opts?: { orderBy?: string; dir?: 'asc' | 'desc' }
): Promise<Record<string, unknown>[]> {
  const res = await fetch(url(col, undefined, opts));
  if (!res.ok) throw new Error(`adminGetAll(${col}) failed: ${res.status}`);
  return res.json();
}

export async function adminGetOne(
  col: string,
  id: string
): Promise<Record<string, unknown> | null> {
  const res = await fetch(url(col, id));
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`adminGetOne(${col}/${id}) failed: ${res.status}`);
  return res.json();
}

/** addDoc equivalent — server assigns a new docId */
export async function adminCreate(
  col: string,
  data: Record<string, unknown>
): Promise<string> {
  const res = await fetch(url(col), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`adminCreate(${col}) failed: ${res.status}`);
  const { docId } = await res.json();
  return docId;
}

/** setDoc equivalent — replaces the document at a known id */
export async function adminSet(
  col: string,
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  const res = await fetch(url(col, id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`adminSet(${col}/${id}) failed: ${res.status}`);
}

/** updateDoc equivalent — merges fields */
export async function adminUpdate(
  col: string,
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  const res = await fetch(url(col, id), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`adminUpdate(${col}/${id}) failed: ${res.status}`);
}

/** deleteDoc equivalent */
export async function adminDeleteDoc(col: string, id: string): Promise<void> {
  const res = await fetch(url(col, id), { method: 'DELETE' });
  if (!res.ok) throw new Error(`adminDeleteDoc(${col}/${id}) failed: ${res.status}`);
}
