'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { InventoryItem } from '@/lib/types';

type Row = InventoryItem;

function fmt(n: number) {
  return (n || 0).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' ₽';
}

export default function AdminInventoryPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [delta, setDelta] = useState('');
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('уп.');
  const [newStock, setNewStock] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newThreshold, setNewThreshold] = useState('10');

  useEffect(() => {
    getDocs(collection(db, 'inventory'))
      .then((snap) => {
        const data = snap.docs
          .map((d) => ({ docId: d.id, price: 0, ...d.data() } as Row))
          .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
        setRows(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const saveRow = async (row: Row) => {
    await setDoc(doc(db, 'inventory', row.docId), {
      name: row.name,
      unit: row.unit,
      stock: row.stock,
      threshold: row.threshold,
      price: row.price,
      updatedAt: serverTimestamp(),
    });
  };

  const handleAdjust = async (row: Row) => {
    const d = parseInt(delta, 10);
    if (isNaN(d)) return;
    setSaving(true);
    const updated = { ...row, stock: Math.max(0, row.stock + d) };
    await saveRow(updated);
    setRows((prev) => prev.map((r) => r.docId === row.docId ? updated : r));
    setAdjusting(null);
    setDelta('');
    setSaving(false);
  };

  const handleSavePrice = async (row: Row) => {
    const price = parseFloat(priceInput) || 0;
    const updated = { ...row, price };
    setSaving(true);
    await saveRow(updated);
    setRows((prev) => prev.map((r) => r.docId === row.docId ? updated : r));
    setEditingPrice(null);
    setPriceInput('');
    setSaving(false);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const docId = Date.now().toString();
    const item: Row = {
      docId,
      name: newName.trim(),
      unit: newUnit,
      stock: parseInt(newStock, 10) || 0,
      price: parseFloat(newPrice) || 0,
      threshold: parseInt(newThreshold, 10) || 10,
    };
    await saveRow(item);
    setRows((prev) => [...prev, item].sort((a, b) => a.name.localeCompare(b.name, 'ru')));
    setNewName(''); setNewUnit('уп.'); setNewStock(''); setNewPrice(''); setNewThreshold('10');
    setAdding(false);
    setSaving(false);
  };

  const handleDelete = async (docId: string) => {
    await deleteDoc(doc(db, 'inventory', docId));
    setRows((prev) => prev.filter((r) => r.docId !== docId));
  };

  const stockColor = (row: Row) => {
    if (row.stock === 0) return 'text-crimson';
    if (row.stock <= (row.threshold || 10)) return 'text-yellow-600';
    return 'text-green-600';
  };

  const totalValue = rows.reduce((s, r) => s + r.stock * (r.price || 0), 0);
  const totalUnits = rows.reduce((s, r) => s + r.stock, 0);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-5 h-5 border-2 border-espresso/20 border-t-espresso rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-xl font-black tracking-widest text-espresso uppercase">Остатки</h1>
        <button
          onClick={() => setAdding((v) => !v)}
          className="bg-espresso text-cream font-heading font-bold text-xs uppercase tracking-widest px-4 py-2.5 hover:bg-espresso/90 transition-colors"
        >
          + Добавить SKU
        </button>
      </div>

      {/* Summary cards */}
      {rows.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-white border border-cream/40 p-4">
            <p className="font-heading text-[9px] uppercase tracking-widest text-espresso/40 mb-1">Позиций</p>
            <p className="font-heading font-black text-xl text-espresso">{rows.length}</p>
          </div>
          <div className="bg-white border border-cream/40 p-4">
            <p className="font-heading text-[9px] uppercase tracking-widest text-espresso/40 mb-1">Единиц на складе</p>
            <p className="font-heading font-black text-xl text-espresso">{totalUnits}</p>
          </div>
          <div className="bg-white border border-cream/40 p-4">
            <p className="font-heading text-[9px] uppercase tracking-widest text-espresso/40 mb-1">Потенциальная выручка</p>
            <p className="font-heading font-black text-xl text-espresso">{fmt(totalValue)}</p>
          </div>
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div className="bg-white border border-cream/40 p-4 mb-4 flex items-end gap-3 flex-wrap">
          <div>
            <label className="block font-heading text-[9px] uppercase tracking-widest text-espresso/50 mb-1">Наименование</label>
            <input
              value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus
              className="border border-espresso/20 px-3 py-1.5 font-body text-sm focus:border-espresso outline-none w-48"
              placeholder="Пакеты 250г"
            />
          </div>
          <div>
            <label className="block font-heading text-[9px] uppercase tracking-widest text-espresso/50 mb-1">Ед.</label>
            <select value={newUnit} onChange={(e) => setNewUnit(e.target.value)}
              className="border border-espresso/20 px-3 py-1.5 font-body text-sm focus:border-espresso outline-none bg-white">
              {['уп.', 'кг', 'шт.', 'л', 'услуг'].map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-heading text-[9px] uppercase tracking-widest text-espresso/50 mb-1">Остаток</label>
            <input type="number" value={newStock} onChange={(e) => setNewStock(e.target.value)}
              className="border border-espresso/20 px-3 py-1.5 font-body text-sm focus:border-espresso outline-none w-24 text-center" placeholder="0" />
          </div>
          <div>
            <label className="block font-heading text-[9px] uppercase tracking-widest text-espresso/50 mb-1">Цена продажи ₽</label>
            <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)}
              className="border border-espresso/20 px-3 py-1.5 font-body text-sm focus:border-espresso outline-none w-28 text-center" placeholder="0" />
          </div>
          <div>
            <label className="block font-heading text-[9px] uppercase tracking-widest text-espresso/50 mb-1">Порог (жёлтый)</label>
            <input type="number" value={newThreshold} onChange={(e) => setNewThreshold(e.target.value)}
              className="border border-espresso/20 px-3 py-1.5 font-body text-sm focus:border-espresso outline-none w-24 text-center" placeholder="10" />
          </div>
          <button onClick={handleAdd} disabled={saving || !newName.trim()}
            className="bg-espresso text-cream font-heading font-bold text-xs uppercase tracking-widest px-4 py-2 hover:bg-espresso/90 disabled:opacity-50 transition-colors">
            Добавить
          </button>
          <button onClick={() => setAdding(false)} className="font-heading text-[10px] uppercase tracking-widest text-espresso/40 hover:text-espresso transition-colors">
            Отмена
          </button>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="bg-white border border-cream/40 p-12 text-center">
          <p className="font-heading text-sm tracking-widest text-espresso/40 uppercase">Позиций пока нет</p>
          <button onClick={() => setAdding(true)} className="inline-block mt-4 font-heading text-xs uppercase tracking-widest text-crimson hover:text-espresso transition-colors">
            Добавить первую →
          </button>
        </div>
      ) : (
        <div className="bg-white border border-cream/40 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream/40 bg-[#F9F9F9]">
                <th className="text-left px-4 py-3 font-heading text-[10px] tracking-widest text-espresso/50 uppercase">Наименование</th>
                <th className="text-left px-4 py-3 font-heading text-[10px] tracking-widest text-espresso/50 uppercase hidden sm:table-cell">Ед.</th>
                <th className="text-right px-4 py-3 font-heading text-[10px] tracking-widest text-espresso/50 uppercase">Остаток</th>
                <th className="text-right px-4 py-3 font-heading text-[10px] tracking-widest text-espresso/50 uppercase">Цена</th>
                <th className="text-right px-4 py-3 font-heading text-[10px] tracking-widest text-espresso/50 uppercase hidden md:table-cell">Потенц. выручка</th>
                <th className="text-left px-4 py-3 font-heading text-[10px] tracking-widest text-espresso/50 uppercase hidden md:table-cell">Порог</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cream/30">
              {rows.map((row) => (
                <tr key={row.docId} className="hover:bg-[#FAFAFA] transition-colors group">
                  <td className="px-4 py-3 font-heading font-bold text-espresso text-xs tracking-wide">{row.name}</td>
                  <td className="px-4 py-3 font-body text-espresso/50 text-xs hidden sm:table-cell">{row.unit}</td>

                  {/* Stock */}
                  <td className="px-4 py-3 text-right">
                    {adjusting === row.docId ? (
                      <div className="flex items-center gap-2 justify-end">
                        <span className="font-body text-xs text-espresso/50">{row.stock}</span>
                        <input type="number" value={delta} onChange={(e) => setDelta(e.target.value)}
                          placeholder="+10 или -5"
                          className="w-24 border border-espresso/20 px-2 py-1 font-body text-xs text-center focus:border-espresso outline-none"
                          autoFocus onKeyDown={(e) => e.key === 'Enter' && handleAdjust(row)} />
                        <button onClick={() => handleAdjust(row)} disabled={saving}
                          className="font-heading text-[9px] uppercase tracking-widest bg-espresso text-cream px-2 py-1 hover:bg-espresso/90 disabled:opacity-50">Ок</button>
                        <button onClick={() => { setAdjusting(null); setDelta(''); }}
                          className="text-espresso/40 hover:text-espresso text-base leading-none">×</button>
                      </div>
                    ) : (
                      <button onClick={() => setAdjusting(row.docId)}
                        className={`font-heading font-bold text-sm ${stockColor(row)} hover:opacity-70 transition-opacity`}>
                        {row.stock} {row.unit}
                        {row.stock === 0 && <span className="ml-2 font-heading text-[8px] uppercase tracking-widest bg-red-100 text-red-600 px-1.5 py-0.5 rounded">нет</span>}
                        {row.stock > 0 && row.stock <= (row.threshold || 10) && <span className="ml-2 font-heading text-[8px] uppercase tracking-widest bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">мало</span>}
                      </button>
                    )}
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3 text-right">
                    {editingPrice === row.docId ? (
                      <div className="flex items-center gap-2 justify-end">
                        <input type="number" value={priceInput} onChange={(e) => setPriceInput(e.target.value)}
                          className="w-24 border border-espresso/20 px-2 py-1 font-body text-xs text-center focus:border-espresso outline-none"
                          autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSavePrice(row)} />
                        <span className="font-body text-xs text-espresso/40">₽</span>
                        <button onClick={() => handleSavePrice(row)} disabled={saving}
                          className="font-heading text-[9px] uppercase tracking-widest bg-espresso text-cream px-2 py-1 hover:bg-espresso/90 disabled:opacity-50">Ок</button>
                        <button onClick={() => { setEditingPrice(null); setPriceInput(''); }}
                          className="text-espresso/40 hover:text-espresso text-base leading-none">×</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingPrice(row.docId); setPriceInput(String(row.price || '')); }}
                        className="font-body text-sm text-espresso hover:text-espresso/70 transition-opacity tabular-nums"
                      >
                        {row.price ? fmt(row.price) : <span className="text-espresso/30 font-heading text-[10px] uppercase tracking-widest">— задать</span>}
                      </button>
                    )}
                  </td>

                  {/* Potential revenue */}
                  <td className="px-4 py-3 text-right hidden md:table-cell">
                    {row.price > 0 ? (
                      <span className="font-heading font-bold text-sm text-espresso">{fmt(row.stock * row.price)}</span>
                    ) : (
                      <span className="font-body text-espresso/20 text-xs">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3 font-body text-espresso/40 text-xs hidden md:table-cell">{row.threshold}</td>

                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(row.docId)}
                      className="opacity-0 group-hover:opacity-100 font-heading text-[10px] tracking-widest uppercase text-espresso/20 hover:text-crimson transition-all">
                      ×
                    </button>
                  </td>
                </tr>
              ))}

              {/* Totals */}
              <tr className="border-t-2 border-espresso/20 bg-[#F9F9F9] font-heading font-bold">
                <td className="px-4 py-3 text-xs uppercase tracking-widest text-espresso">ИТОГО</td>
                <td className="hidden sm:table-cell" />
                <td className="px-4 py-3 text-right text-xs text-espresso">{totalUnits} ед.</td>
                <td />
                <td className="px-4 py-3 text-right text-sm text-espresso hidden md:table-cell">{fmt(totalValue)}</td>
                <td colSpan={2} className="hidden md:table-cell" />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
