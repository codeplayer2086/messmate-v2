import React, { useMemo, useState } from 'react';
import { Check, Plus, Search, Trash2, X } from 'lucide-react';
import type { BazarTrip, Member } from '../types/mess';
import { searchCatalog, type CatalogItem } from '../utils/bazarCatalog';
import { formatBDT } from '../utils/messLogic';

interface BazarViewProps {
  currentUser: Member;
  members: Member[];
  trips: BazarTrip[];
  todayStr: string;
  onSubmitTrip: (payload: {
    date: string;
    note: string;
    companionIds: string[];
    items: { itemName: string; quantity: number; unit: string; price: number }[];
  }) => void;
  onApproveTrip: (tripId: string) => void;
  onRejectTrip: (tripId: string) => void;
}

interface DraftItem {
  itemName: string;
  quantity: string;
  unit: string;
  price: string;
}

export const BazarView: React.FC<BazarViewProps> = ({
  currentUser,
  members,
  trips,
  todayStr,
  onSubmitTrip,
  onApproveTrip,
  onRejectTrip,
}) => {
  const isManager = currentUser.role === 'MANAGER';
  const pendingTrips = useMemo(() => trips.filter((t) => !t.approved), [trips]);
  const approvedTrips = useMemo(() => trips.filter((t) => t.approved), [trips]);

  const [tab, setTab] = useState<'ledger' | 'submit' | 'pending'>(
    pendingTrips.length > 0 && isManager ? 'pending' : 'ledger'
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [date, setDate] = useState(todayStr);
  const [note, setNote] = useState('');
  const [companions, setCompanions] = useState<string[]>([]);
  const [items, setItems] = useState<DraftItem[]>([
    { itemName: '', quantity: '', unit: 'kg', price: '' },
    { itemName: '', quantity: '', unit: 'kg', price: '' },
  ]);
  const [activeAutoIdx, setActiveAutoIdx] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<CatalogItem[]>([]);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const memberMap = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m.name])),
    [members]
  );

  const draftTotal = items.reduce((s, it) => s + (parseFloat(it.price) || 0), 0);

  const handleItemChange = (index: number, field: keyof DraftItem, value: string) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
    if (field === 'itemName') {
      setSuggestions(searchCatalog(value, 6));
      setActiveAutoIdx(index);
    }
  };

  const pickSuggestion = (index: number, catItem: CatalogItem) => {
    setItems((prev) =>
      prev.map((it, i) =>
        i === index ? { ...it, itemName: catItem.name, unit: catItem.defaultUnit } : it
      )
    );
    setActiveAutoIdx(null);
    setSuggestions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const validItems = items
      .filter((it) => it.itemName.trim().length > 0)
      .map((it) => ({
        itemName: it.itemName.trim(),
        quantity: parseFloat(it.quantity) || 1,
        unit: it.unit,
        price: parseFloat(it.price) || 0,
      }));

    if (validItems.length === 0) {
      setFormError('Add at least one bazar item with a name and price.');
      return;
    }

    if (validItems.some((it) => it.price < 0 || it.quantity <= 0)) {
      setFormError('Item quantities must be positive and prices non-negative.');
      return;
    }

    onSubmitTrip({
      date,
      note,
      companionIds: companions,
      items: validItems,
    });

    setItems([
      { itemName: '', quantity: '', unit: 'kg', price: '' },
      { itemName: '', quantity: '', unit: 'kg', price: '' },
    ]);
    setNote('');
    setCompanions([]);
    setFormSuccess('Bazar trip submitted and queued for Manager approval.');
    setTab('pending');
  };

  const filteredApproved = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return approvedTrips;
    return approvedTrips.filter(
      (t) =>
        t.note.toLowerCase().includes(q) ||
        (memberMap[t.buyerId] || '').toLowerCase().includes(q) ||
        t.items.some((i) => i.itemName.toLowerCase().includes(q))
    );
  }, [approvedTrips, searchQuery, memberMap]);

  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    for (const trip of approvedTrips) {
      for (const item of trip.items) {
        const cat = item.category || 'other';
        map[cat] = (map[cat] ?? 0) + item.price;
      }
    }
    return Object.entries(map).sort(([, a], [, b]) => b - a);
  }, [approvedTrips]);

  const renderTripList = (list: BazarTrip[], allowActions: boolean) => {
    if (list.length === 0) {
      return (
        <div className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No bazar trips match this view.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {list.map((trip) => {
          const buyerName = memberMap[trip.buyerId] || 'Member';
          const companionNames = trip.companionIds.map((id) => memberMap[id]).filter(Boolean);
          const canDelete = isManager || (!trip.approved && trip.buyerId === currentUser.id);

          return (
            <article
              key={trip.id}
              className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
                      {buyerName}
                    </h3>
                    <span className="text-slate-400 dark:text-slate-600" aria-hidden="true">·</span>
                    <span className="font-mono-num text-xs text-slate-500 dark:text-slate-400">
                      {trip.date}
                    </span>
                    <span className="text-slate-400 dark:text-slate-600" aria-hidden="true">·</span>
                    <span
                      className={`text-xs font-semibold ${
                        trip.approved
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {trip.approved ? 'Approved' : 'Pending Approval'}
                    </span>
                  </div>
                  {(trip.note || companionNames.length > 0) && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {trip.note}
                      {trip.note && companionNames.length > 0 ? ' · ' : ''}
                      {companionNames.length > 0 ? `With ${companionNames.join(', ')}` : ''}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono-num text-lg font-bold text-slate-900 dark:text-slate-50">
                    {formatBDT(trip.totalCost)}
                  </span>
                  {allowActions && isManager && !trip.approved && (
                    <button
                      type="button"
                      onClick={() => onApproveTrip(trip.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white dark:bg-emerald-500 dark:text-[#020617] rounded-lg hover:opacity-90 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => onRejectTrip(trip.id)}
                      aria-label={`Delete bazar trip by ${buyerName} on ${trip.date}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {!trip.approved && isManager ? 'Reject' : 'Remove'}
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/80">
                      <th className="text-left py-2 pr-3 font-medium">SL</th>
                      <th className="text-left py-2 pr-3 font-medium">Item</th>
                      <th className="text-left py-2 pr-3 font-medium">Category</th>
                      <th className="text-right py-2 pr-3 font-medium">Qty</th>
                      <th className="text-right py-2 font-medium">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {trip.items.map((it) => (
                      <tr key={it.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 pr-3 font-mono-num text-slate-400">{it.serialNo}</td>
                        <td className="py-2 pr-3 font-medium text-slate-900 dark:text-slate-100">
                          {it.itemName}
                        </td>
                        <td className="py-2 pr-3 capitalize text-slate-500 dark:text-slate-400">
                          {it.category ?? 'general'}
                        </td>
                        <td className="py-2 pr-3 text-right font-mono-num text-slate-700 dark:text-slate-300">
                          {it.quantity} {it.unit}
                        </td>
                        <td className="py-2 text-right font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                          {formatBDT(it.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Bazar Ledger
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Only manager-approved trips are included in monthly meal rate calculations.
          </p>
        </div>

        {/* Segmented Control */}
        <div
          role="tablist"
          aria-label="Bazar views"
          className="inline-flex items-center p-1 bg-slate-200/70 dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-lg self-start"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'ledger'}
            onClick={() => setTab('ledger')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              tab === 'ledger'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-50'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            Approved ({approvedTrips.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'pending'}
            onClick={() => setTab('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              tab === 'pending'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-50'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            Pending ({pendingTrips.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'submit'}
            onClick={() => setTab('submit')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              tab === 'submit'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-50'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            Submit Trip
          </button>
        </div>
      </div>

      {formSuccess && (
        <p role="status" className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
          {formSuccess}
        </p>
      )}

      {tab === 'submit' && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="bazar-date" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Trip Date
              </label>
              <input
                id="bazar-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="bazar-note" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Trip Note
              </label>
              <input
                id="bazar-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., Mirpur-10 morning market"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Companions */}
          <div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
              Market Companions (optional)
            </p>
            <div className="flex flex-wrap gap-2">
              {members
                .filter((m) => m.id !== currentUser.id)
                .map((m) => {
                  const selected = companions.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() =>
                        setCompanions((prev) =>
                          prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                        )
                      }
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        selected
                          ? 'bg-emerald-600/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-50 dark:bg-[#020617] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {m.name}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Dynamic Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Itemized Breakdown (supports Bangla/English search, e.g. &ldquo;murgi&rdquo;, &ldquo;alu&rdquo;, &ldquo;peyaj&rdquo;)
              </p>
              <button
                type="button"
                onClick={() =>
                  setItems((prev) => [...prev, { itemName: '', quantity: '', unit: 'kg', price: '' }])
                }
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Row
              </button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-start relative">
                <div className="col-span-12 sm:col-span-5 relative">
                  <label htmlFor={`item-name-${idx}`} className="sr-only">
                    Item name row {idx + 1}
                  </label>
                  <input
                    id={`item-name-${idx}`}
                    type="text"
                    value={item.itemName}
                    onChange={(e) => handleItemChange(idx, 'itemName', e.target.value)}
                    placeholder="Item name (e.g. Chicken / Murgi)"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {activeAutoIdx === idx && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden">
                      {suggestions.map((s) => (
                        <button
                          key={s.key}
                          type="button"
                          onClick={() => pickSuggestion(idx, s)}
                          className="w-full px-3 py-2 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                        >
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {s.name} · <span className="text-slate-500 dark:text-slate-400">{s.bn}</span>
                          </span>
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                            {s.category} · {s.defaultUnit}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="col-span-4 sm:col-span-2">
                  <label htmlFor={`item-qty-${idx}`} className="sr-only">
                    Quantity row {idx + 1}
                  </label>
                  <input
                    id={`item-qty-${idx}`}
                    type="number"
                    step="0.1"
                    min="0"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    placeholder="Qty"
                    className="w-full px-3 py-2 text-sm font-mono-num bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="col-span-4 sm:col-span-2">
                  <label htmlFor={`item-unit-${idx}`} className="sr-only">
                    Unit row {idx + 1}
                  </label>
                  <select
                    id={`item-unit-${idx}`}
                    value={item.unit}
                    onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                    className="w-full px-2.5 py-2 text-sm bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {['kg', 'g', 'litre', 'ml', 'pcs', 'packet', 'dozen'].map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-3 sm:col-span-2">
                  <label htmlFor={`item-price-${idx}`} className="sr-only">
                    Price row {idx + 1}
                  </label>
                  <input
                    id={`item-price-${idx}`}
                    type="number"
                    step="1"
                    min="0"
                    value={item.price}
                    onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                    placeholder="৳ Price"
                    className="w-full px-3 py-2 text-sm font-mono-num bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="col-span-1 flex justify-end pt-1.5">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                      aria-label={`Remove item row ${idx + 1}`}
                      className="p-1.5 text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {formError && (
            <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
              {formError}
            </p>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Trip Total:{' '}
              <span className="font-mono-num text-lg font-bold text-slate-900 dark:text-slate-50">
                {formatBDT(draftTotal)}
              </span>
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-semibold bg-emerald-600 text-white dark:bg-emerald-500 dark:text-[#020617] rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
            >
              Submit for Approval
            </button>
          </div>
        </form>
      )}

      {tab === 'pending' && renderTripList(pendingTrips, true)}

      {tab === 'ledger' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <label htmlFor="bazar-search" className="sr-only">
                Search approved bazar trips
              </label>
              <input
                id="bazar-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by buyer, item, or note..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              {categoryTotals.slice(0, 4).map(([cat, amt]) => (
                <span key={cat} className="capitalize">
                  {cat}: <strong className="font-mono-num text-slate-900 dark:text-slate-100">{formatBDT(amt)}</strong>
                </span>
              ))}
            </div>
          </div>

          {renderTripList(filteredApproved, false)}
        </div>
      )}
    </div>
  );
};
