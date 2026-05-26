'use client';

import { useEffect, useState } from 'react';
import { adminGetAll, adminSet, adminDeleteDoc } from '@/lib/admin-api';
import type { InventoryItem } from '@/lib/types';

type Row = InventoryItem;

function fmt(n: number) {
  return (n || 0).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' ₽';
}

/** Show 2 decimal places for kg, whole number otherwise */
function fmtStock(stock: number, unit: string): string {
  const u = unit.toLowerCase().trim();
  if (u === 'кг' || u === 'кг.') {
    return stock.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return stock.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
}

interface ReconcileLine {
  docId: string; name: string; packSize: number;
  currentStock: number; soldKg: number; newStock: number;
  orderCount: number; changed: boolean;
}

export default function AdminInventoryPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [reconcileLines, setReconcileLines] = useState<ReconcileLine[] | null>(null);
  const [reconciling, setReconciling] = useState(false);
  const [reconcileApplied, setReconcileApplied] = useState(false);
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [delta, setDelta] = useState('');
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const [editingCostPrice, setEditingCostPrice] = useState<string | null>(null);
  const [costPriceInput, setCostPriceInput] = useState('');
  const [editingName, setEditingName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [editingUnit, setEditingUnit] = useState<string | null>(null);
  const [unitInput, setUnitInput] = useState('');
  const [editingPackSize, setEditingPackSize] = useState<string | null>(null);
  const [packSizeInput, setPackSizeInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('уп.');
  const [newStock, setNewStock] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCostPrice, setNewCostPrice] = useState('');
  const [newThreshold, setNewThreshold] = useState('10');

  useEffect(() => {
    adminGetAll('inventory')
      .then((docs) => {
        const data = docs.map((d) => ({ price: 0, ...d } as unknown as Row)).sort((a, b) => a.name.localeCompare(b.name, 'ru'));
        setRows(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const saveRow = async (row: Row) => {
    await adminSet('inventory', row.docId, {
      name: row.name,
      unit: row.unit,
      stock: row.stock,
      threshold: row.threshold,
      price: row.price,
      costPrice: row.costPrice ?? 0,
      ...(row.packSize ? { packSize: row.packSize } : {}),
    });
  };

  const handleAdjust = async (row: Row) => {
    const d = parseFloat(delta);
    if (isNaN(d)) return;
    setSaving(true);
    const updated = { ...row, stock: Math.max(0, Math.round((row.stock + d) * 1000) / 1000) };
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

  const handleSaveName = async (row: Row) => {
    const name = nameInput.trim() || row.name;
    const updated = { ...row, name };
    setSaving(true);
    await saveRow(updated);
    setRows((prev) => prev.map((r) => r.docId === row.docId ? updated : r).sort((a, b) => a.name.localeCompare(b.name, 'ru')));
    setEditingName(null);
    setNameInput('');
    setSaving(false);
  };

  const handleSaveUnit = async (row: Row) => {
    const unit = unitInput.trim() || row.unit;
    const updated = { ...row, unit };
    setSaving(true);
    await saveRow(updated);
    setRows((prev) => prev.map((r) => r.docId === row.docId ? updated : r));
    setEditingUnit(null);
    setUnitInput('');
    setSaving(false);
  };

  const handleSavePackSize = async (row: Row) => {
    const packSize = parseInt(packSizeInput, 10) || undefined;
    const updated = { ...row, packSize };
    setSaving(true);
    await saveRow(updated);
    setRows((prev) => prev.map((r) => r.docId === row.docId ? updated : r));
    setEditingPackSize(null);
    setPackSizeInput('');
    setSaving(false);
  };

  const handleSaveCostPrice = async (row: Row) => {
    const costPrice = parseFloat(costPriceInput) || 0;
    const updated = { ...row, costPrice };
    setSaving(true);
    await saveRow(updated);
    setRows((prev) => prev.map((r) => r.docId === row.docId ? updated : r));
    setEditingCostPrice(null);
    setCostPriceInput('');
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
      stock: parseFloat(newStock) || 0,
      price: parseFloat(newPrice) || 0,
      costPrice: parseFloat(newCostPrice) || 0,
      threshold: parseInt(newThreshold, 10) || 10,
    };
    await saveRow(item);
    setRows((prev) => [...prev, item].sort((a, b) => a.name.localeCompare(b.name, 'ru')));
    setNewName(''); setNewUnit('уп.'); setNewStock(''); setNewPrice(''); setNewCostPrice(''); setNewThreshold('10');
    setAdding(false);
    setSaving(false);
  };

  const handleDelete = async (docId: string) => {
    await adminDeleteDoc('inventory', docId);
    setRows((prev) => prev.filter((r) => r.docId !== docId));
  };

  const handleReconcilePreview = async () => {
    setReconciling(true);
    setReconcileApplied(false);
    try {
      const res = await fetch('/api/admin/reconcile-inventory');
      const data = await res.json();
      setReconcileLines(data.lines);
    } finally {
      setReconciling(false);
    }
  };

  const handleReconcileApply = async () => {
    setReconciling(true);
    try {
      const res = await fetch('/api/admin/reconcile-inventory', { method: 'POST' });
      const data = await res.json();
      // Update local rows with new stock values
      setRows((prev) => prev.map((r) => {
        const updated = data.lines.find((l: ReconcileLine) => l.docId === r.docId);
        return updated ? { ...r, stock: updated.newStock } : r;
      }));
      setReconcileApplied(true);
      setReconcileLines(data.lines);
    } finally {
      setReconciling(false);
    }
  };

  const packCount = (row: Row): number | null => {
    if (!row.packSize || !row.stock) return null;
    const u = (row.unit || '').toLowerCase().trim();
    const grams = (u === 'кг' || u === 'кг.') ? row.stock * 1000
                : (u === 'г'  || u === 'гр' || u === 'г.') ? row.stock
                : null;
    return grams !== null ? Math.round(grams / row.packSize) : null;
  };

  const stockColor = (row: Row) => {
    if (row.stock === 0) return 'text-crimson';
    if (row.stock <= (row.threshold || 10)) return 'text-yellow-600';
    return 'text-green-600';
  };

  const totalValue = rows.reduce((s, r) => s + r.stock * (r.price || 0), 0);
  const totalUnits = rows.reduce((s, r) => s + r.stock, 0);

  // Total kg of coffee (rows with unit = кг)
  const totalKg = rows
    .filter((r) => r.unit.toLowerCase().trim() === 'кг' || r.unit.toLowerCase().trim() === 'кг.')
    .reduce((s, r) => s + r.stock, 0);

  // Total packs across all kg-based rows that have packSize
  const totalPacks = rows.reduce((s, r) => {
    const count = packCount(r);
    return count !== null ? s + count : s;
  }, 0);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-5 h-5 border-2 border-espresso/20 border-t-espresso rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-black tracking-wide text-espresso uppercase">Остатки</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReconcilePreview}
            disabled={reconciling}
            className="border border-espresso/30 text-espresso font-heading font-bold text-xs uppercase tracking-wide px-4 py-2.5 hover:bg-espresso/5 disabled:opacity-50 transition-colors"
          >
            {reconciling ? 'Считаю…' : '↺ Пересчитать по заказам'}
          </button>
          <button
            onClick={() => setAdding((v) => !v)}
            className="bg-espresso text-cream font-heading font-bold text-xs uppercase tracking-wide px-4 py-2.5 hover:bg-espresso/90 transition-colors"
          >
            + Добавить SKU
          </button>
        </div>
      </div>

      {/* Reconciliation preview panel */}
      {reconcileLines && (
        <div className={`border p-5 mb-4 ${reconcileApplied ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-heading font-bold text-sm uppercase tracking-wide text-espresso mb-3">
                {reconcileApplied ? '✓ Остатки обновлены' : 'Сверка по оплаченным заказам'}
              </p>
              <div className="space-y-2">
                {reconcileLines.map((line) => (
                  <div key={line.docId} className="flex items-center gap-6 font-body text-sm">
                    <span className="text-espresso font-bold w-32">{line.name}</span>
                    <span className="text-espresso/50">
                      Продано: <span className="font-bold text-espresso">{line.soldKg.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} кг</span>
                      {' '}({Math.round((line.soldKg * 1000) / line.packSize)} уп. из {line.orderCount} заказов)
                    </span>
                    <span className="text-espresso/40">
                      {line.currentStock.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} кг
                      {' '}→{' '}
                      <span className={`font-bold ${line.changed ? 'text-espresso' : 'text-espresso/40'}`}>
                        {line.newStock.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} кг
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!reconcileApplied && reconcileLines.some((l) => l.changed) && (
                <button
                  onClick={handleReconcileApply}
                  disabled={reconciling}
                  className="bg-espresso text-cream font-heading font-bold text-xs uppercase tracking-wide px-4 py-2 hover:bg-espresso/90 disabled:opacity-50 transition-colors"
                >
                  {reconciling ? 'Применяю…' : 'Применить'}
                </button>
              )}
              <button
                onClick={() => { setReconcileLines(null); setReconcileApplied(false); }}
                className="text-espresso/30 hover:text-espresso text-xl leading-none"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      {rows.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white border border-cream/40 p-4">
            <p className="font-heading text-xs uppercase tracking-wide text-espresso/40 mb-1">Позиций</p>
            <p className="font-heading font-black text-xl text-espresso">{rows.length}</p>
          </div>
          <div className="bg-white border border-cream/40 p-4">
            <p className="font-heading text-xs uppercase tracking-wide text-espresso/40 mb-1">Остаток кофе</p>
            <p className="font-heading font-black text-xl text-espresso">
              {fmtStock(totalKg, 'кг')} кг
            </p>
            <p className="font-heading text-xs text-espresso/40 mt-0.5">{totalPacks} упаковок</p>
          </div>
          <div className="bg-white border border-cream/40 p-4">
            <p className="font-heading text-xs uppercase tracking-wide text-espresso/40 mb-1">По фасовкам</p>
            <div className="space-y-0.5 mt-0.5">
              {rows.filter((r) => packCount(r) !== null).map((r) => (
                <p key={r.docId} className="font-heading text-xs text-espresso">
                  <span className="text-espresso/40">{r.packSize}г —</span>{' '}
                  <span className="font-bold">{packCount(r)} уп.</span>
                  <span className="text-espresso/40 ml-1">({fmtStock(r.stock, r.unit)} кг)</span>
                </p>
              ))}
            </div>
          </div>
          <div className="bg-white border border-cream/40 p-4">
            <p className="font-heading text-xs uppercase tracking-wide text-espresso/40 mb-1">Потенц. выручка</p>
            <p className="font-heading font-black text-xl text-espresso">{fmt(totalValue)}</p>
          </div>
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div className="bg-white border border-cream/40 p-4 mb-4 flex items-end gap-3 flex-wrap">
          <div>
            <label className="block font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1">Наименование</label>
            <input
              value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus
              className="border border-espresso/20 px-3 py-1.5 font-body text-sm focus:border-espresso outline-none w-48"
              placeholder="Пакеты 250г"
            />
          </div>
          <div>
            <label className="block font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1">Ед.</label>
            <select value={newUnit} onChange={(e) => setNewUnit(e.target.value)}
              className="border border-espresso/20 px-3 py-1.5 font-body text-sm focus:border-espresso outline-none bg-white">
              {['уп.', 'кг', 'г', 'шт.', 'л', 'мл', 'услуг'].map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1">Остаток</label>
            <input type="number" value={newStock} onChange={(e) => setNewStock(e.target.value)}
              className="border border-espresso/20 px-3 py-1.5 font-body text-sm focus:border-espresso outline-none w-24 text-center" placeholder="0" />
          </div>
          <div>
            <label className="block font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1">Цена продажи ₽</label>
            <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)}
              className="border border-espresso/20 px-3 py-1.5 font-body text-sm focus:border-espresso outline-none w-28 text-center" placeholder="0" />
          </div>
          <div>
            <label className="block font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1">Себестоимость ₽</label>
            <input type="number" value={newCostPrice} onChange={(e) => setNewCostPrice(e.target.value)}
              className="border border-espresso/20 px-3 py-1.5 font-body text-sm focus:border-espresso outline-none w-28 text-center" placeholder="0" />
          </div>
          <div>
            <label className="block font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1">Порог (жёлтый)</label>
            <input type="number" value={newThreshold} onChange={(e) => setNewThreshold(e.target.value)}
              className="border border-espresso/20 px-3 py-1.5 font-body text-sm focus:border-espresso outline-none w-24 text-center" placeholder="10" />
          </div>
          <button onClick={handleAdd} disabled={saving || !newName.trim()}
            className="bg-espresso text-cream font-heading font-bold text-xs uppercase tracking-wide px-4 py-2 hover:bg-espresso/90 disabled:opacity-50 transition-colors">
            Добавить
          </button>
          <button onClick={() => setAdding(false)} className="font-heading text-xs uppercase tracking-wide text-espresso/40 hover:text-espresso transition-colors">
            Отмена
          </button>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="bg-white border border-cream/40 p-12 text-center">
          <p className="font-heading text-sm tracking-widest text-espresso/40 uppercase">Позиций пока нет</p>
          <button onClick={() => setAdding(true)} className="inline-block mt-4 font-heading text-xs uppercase tracking-wide text-crimson hover:text-espresso transition-colors">
            Добавить первую →
          </button>
        </div>
      ) : (
        <div className="bg-white border border-cream/40 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream/40 bg-[#F9F9F9]">
                <th className="text-left px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase">Наименование</th>
                <th className="text-left px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase hidden sm:table-cell">Ед.</th>
                <th className="text-right px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase">Остаток</th>
                <th className="text-right px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase">Цена продажи</th>
                <th className="text-right px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase hidden lg:table-cell">Себестоим.</th>
                <th className="text-right px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase hidden lg:table-cell">Маржа</th>
                <th className="text-right px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase hidden md:table-cell">Потенц. выручка</th>
                <th className="text-right px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase hidden lg:table-cell">Фасовка (г)</th>
                <th className="text-right px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase hidden lg:table-cell">Упаковок</th>
                <th className="text-left px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase hidden md:table-cell">Порог</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cream/30">
              {rows.map((row) => (
                <tr key={row.docId} className="hover:bg-[#FAFAFA] transition-colors group">
                  <td className="px-4 py-3">
                    {editingName === row.docId ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={nameInput} onChange={(e) => setNameInput(e.target.value)}
                          className="border border-espresso/20 px-2 py-1 font-body text-sm focus:border-espresso outline-none w-40"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveName(row);
                            if (e.key === 'Escape') { setEditingName(null); setNameInput(''); }
                          }}
                        />
                        <button onClick={() => handleSaveName(row)} disabled={saving}
                          className="font-heading text-xs uppercase tracking-wide bg-espresso text-cream px-2 py-1 hover:bg-espresso/90 disabled:opacity-50">Ок</button>
                        <button onClick={() => { setEditingName(null); setNameInput(''); }}
                          className="text-espresso/40 hover:text-espresso text-base leading-none">×</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingName(row.docId); setNameInput(row.name); }}
                        className="font-heading font-bold text-espresso text-sm hover:text-espresso/70 transition-colors text-left"
                      >
                        {row.name}
                      </button>
                    )}
                  </td>
                  {/* Unit */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {editingUnit === row.docId ? (
                      <div className="flex items-center gap-2">
                        <input
                          list="unit-options"
                          value={unitInput}
                          onChange={(e) => setUnitInput(e.target.value)}
                          className="w-20 border border-espresso/20 px-2 py-1 font-body text-sm text-center focus:border-espresso outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveUnit(row);
                            if (e.key === 'Escape') { setEditingUnit(null); setUnitInput(''); }
                          }}
                        />
                        <datalist id="unit-options">
                          {['кг', 'г', 'шт.', 'уп.', 'л', 'мл', 'услуг'].map((u) => <option key={u} value={u} />)}
                        </datalist>
                        <button onClick={() => handleSaveUnit(row)} disabled={saving}
                          className="font-heading text-xs uppercase tracking-wide bg-espresso text-cream px-2 py-1 hover:bg-espresso/90 disabled:opacity-50">Ок</button>
                        <button onClick={() => { setEditingUnit(null); setUnitInput(''); }}
                          className="text-espresso/40 hover:text-espresso text-base leading-none">×</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingUnit(row.docId); setUnitInput(row.unit); }}
                        className="font-body text-sm text-espresso/50 hover:text-espresso transition-colors"
                      >
                        {row.unit}
                      </button>
                    )}
                  </td>

                  {/* Stock */}
                  <td className="px-4 py-3 text-right">
                    {adjusting === row.docId ? (
                      <div className="flex items-center gap-2 justify-end">
                        <span className="font-body text-xs text-espresso/50">{fmtStock(row.stock, row.unit)} {row.unit}</span>
                        <input type="number" step="0.001" value={delta} onChange={(e) => setDelta(e.target.value)}
                          placeholder="+0.25 или -1"
                          className="w-24 border border-espresso/20 px-2 py-1 font-body text-sm text-center focus:border-espresso outline-none"
                          autoFocus onKeyDown={(e) => e.key === 'Enter' && handleAdjust(row)} />
                        <button onClick={() => handleAdjust(row)} disabled={saving}
                          className="font-heading text-xs uppercase tracking-wide bg-espresso text-cream px-2 py-1 hover:bg-espresso/90 disabled:opacity-50">Ок</button>
                        <button onClick={() => { setAdjusting(null); setDelta(''); }}
                          className="text-espresso/40 hover:text-espresso text-base leading-none">×</button>
                      </div>
                    ) : (
                      <button onClick={() => setAdjusting(row.docId)}
                        className={`font-heading font-bold text-sm ${stockColor(row)} hover:opacity-70 transition-opacity`}>
                        {fmtStock(row.stock, row.unit)} {row.unit}
                        {row.stock === 0 && <span className="ml-2 font-heading text-xs uppercase tracking-wide bg-red-100 text-red-600 px-1.5 py-0.5 rounded">нет</span>}
                        {row.stock > 0 && row.stock <= (row.threshold || 10) && <span className="ml-2 font-heading text-xs uppercase tracking-wide bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">мало</span>}
                      </button>
                    )}
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3 text-right">
                    {editingPrice === row.docId ? (
                      <div className="flex items-center gap-2 justify-end">
                        <input type="number" value={priceInput} onChange={(e) => setPriceInput(e.target.value)}
                          className="w-24 border border-espresso/20 px-2 py-1 font-body text-sm text-center focus:border-espresso outline-none"
                          autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSavePrice(row)} />
                        <span className="font-body text-xs text-espresso/40">₽</span>
                        <button onClick={() => handleSavePrice(row)} disabled={saving}
                          className="font-heading text-xs uppercase tracking-wide bg-espresso text-cream px-2 py-1 hover:bg-espresso/90 disabled:opacity-50">Ок</button>
                        <button onClick={() => { setEditingPrice(null); setPriceInput(''); }}
                          className="text-espresso/40 hover:text-espresso text-base leading-none">×</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingPrice(row.docId); setPriceInput(String(row.price || '')); }}
                        className="font-body text-sm text-espresso hover:text-espresso/70 transition-opacity tabular-nums"
                      >
                        {row.price ? fmt(row.price) : <span className="text-espresso/30 font-heading text-xs uppercase tracking-wide">— задать</span>}
                      </button>
                    )}
                  </td>

                  {/* Cost price */}
                  <td className="px-4 py-3 text-right hidden lg:table-cell">
                    {editingCostPrice === row.docId ? (
                      <div className="flex items-center gap-2 justify-end">
                        <input type="number" value={costPriceInput} onChange={(e) => setCostPriceInput(e.target.value)}
                          className="w-24 border border-espresso/20 px-2 py-1 font-body text-sm text-center focus:border-espresso outline-none"
                          autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSaveCostPrice(row)} />
                        <span className="font-body text-xs text-espresso/40">₽</span>
                        <button onClick={() => handleSaveCostPrice(row)} disabled={saving}
                          className="font-heading text-xs uppercase tracking-wide bg-espresso text-cream px-2 py-1 hover:bg-espresso/90 disabled:opacity-50">Ок</button>
                        <button onClick={() => { setEditingCostPrice(null); setCostPriceInput(''); }}
                          className="text-espresso/40 hover:text-espresso text-base leading-none">×</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingCostPrice(row.docId); setCostPriceInput(String(row.costPrice || '')); }}
                        className="font-body text-sm text-espresso/70 hover:text-espresso/50 transition-opacity tabular-nums"
                      >
                        {row.costPrice ? fmt(row.costPrice) : <span className="text-espresso/25 font-heading text-xs uppercase tracking-wide">— задать</span>}
                      </button>
                    )}
                  </td>

                  {/* Margin */}
                  <td className="px-4 py-3 text-right hidden lg:table-cell">
                    {row.price > 0 && row.costPrice && row.costPrice > 0 ? (() => {
                      const margin = ((row.price - row.costPrice) / row.price) * 100;
                      return (
                        <span className={`font-heading font-bold text-xs ${margin >= 30 ? 'text-green-600' : margin >= 10 ? 'text-yellow-600' : 'text-crimson'}`}>
                          {margin.toFixed(0)}%
                        </span>
                      );
                    })() : <span className="text-espresso/20 text-xs">—</span>}
                  </td>

                  {/* Potential revenue */}
                  <td className="px-4 py-3 text-right hidden md:table-cell">
                    {row.price > 0 ? (
                      <span className="font-heading font-bold text-sm text-espresso">{fmt(row.stock * row.price)}</span>
                    ) : (
                      <span className="font-body text-espresso/20 text-xs">—</span>
                    )}
                  </td>

                  {/* Pack size */}
                  <td className="px-4 py-3 text-right hidden lg:table-cell">
                    {editingPackSize === row.docId ? (
                      <div className="flex items-center gap-2 justify-end">
                        <input type="number" value={packSizeInput} onChange={(e) => setPackSizeInput(e.target.value)}
                          className="w-20 border border-espresso/20 px-2 py-1 font-body text-sm text-center focus:border-espresso outline-none"
                          autoFocus placeholder="250"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSavePackSize(row);
                            if (e.key === 'Escape') { setEditingPackSize(null); setPackSizeInput(''); }
                          }} />
                        <span className="font-body text-xs text-espresso/40">г</span>
                        <button onClick={() => handleSavePackSize(row)} disabled={saving}
                          className="font-heading text-xs uppercase tracking-wide bg-espresso text-cream px-2 py-1 hover:bg-espresso/90 disabled:opacity-50">Ок</button>
                        <button onClick={() => { setEditingPackSize(null); setPackSizeInput(''); }}
                          className="text-espresso/40 hover:text-espresso text-base leading-none">×</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingPackSize(row.docId); setPackSizeInput(String(row.packSize || '')); }}
                        className="font-body text-sm text-espresso/50 hover:text-espresso transition-colors tabular-nums"
                      >
                        {row.packSize ? `${row.packSize} г` : <span className="text-espresso/25 font-heading text-xs uppercase tracking-wide">— задать</span>}
                      </button>
                    )}
                  </td>

                  {/* Pack count */}
                  <td className="px-4 py-3 text-right hidden lg:table-cell">
                    {(() => {
                      const count = packCount(row);
                      return count !== null
                        ? <span className="font-heading font-bold text-sm text-espresso">{count} уп.</span>
                        : <span className="text-espresso/20 text-xs">—</span>;
                    })()}
                  </td>

                  <td className="px-4 py-3.5 font-body text-espresso/40 text-xs hidden md:table-cell">{row.threshold}</td>

                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(row.docId)}
                      className="opacity-0 group-hover:opacity-100 font-heading text-xs tracking-wide uppercase text-espresso/20 hover:text-crimson transition-all">
                      ×
                    </button>
                  </td>
                </tr>
              ))}

              {/* Totals */}
              <tr className="border-t-2 border-espresso/20 bg-[#F9F9F9] font-heading font-bold">
                <td className="px-4 py-3 text-xs uppercase tracking-wide text-espresso">ИТОГО</td>
                <td className="hidden sm:table-cell" />
                <td className="px-4 py-3 text-right text-xs text-espresso">{totalUnits} ед.</td>
                <td />
                <td className="hidden lg:table-cell" />
                <td className="hidden lg:table-cell" />
                <td className="hidden lg:table-cell" />
                <td className="hidden lg:table-cell" />
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
