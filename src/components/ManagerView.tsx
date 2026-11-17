import React, { useMemo, useState } from 'react';
import { Check, ShieldAlert, Trash2, X } from 'lucide-react';
import type {
  Deposit,
  MealEntry,
  MealStatusRequest,
  Member,
  MessConfig,
} from '../types/mess';
import { formatBDT } from '../utils/messLogic';

interface ManagerViewProps {
  currentUser: Member;
  members: Member[];
  mess: MessConfig;
  todayStr: string;
  mealEntries: MealEntry[];
  deposits: Deposit[];
  mealStatusRequests: MealStatusRequest[];
  onSwitchToManager: () => void;
  onSaveMealEntries: (date: string, draftByMember: Record<string, Record<string, number>>) => void;
  onRecordDeposit: (payload: { date: string; memberId: string; amount: number; note: string }) => void;
  onDeleteDeposit: (depositId: string) => void;
  onReviewRequest: (requestId: string, decision: 'APPROVED' | 'REJECTED') => void;
  onHandoverManager: (nextManagerId: string) => void;
  onUpdateSettings: (patch: { dueThreshold?: number }) => void;
}

const MEAL_VALUES = [0, 0.5, 1];

export const ManagerView: React.FC<ManagerViewProps> = ({
  currentUser,
  members,
  mess,
  todayStr,
  mealEntries,
  deposits,
  mealStatusRequests,
  onSwitchToManager,
  onSaveMealEntries,
  onRecordDeposit,
  onDeleteDeposit,
  onReviewRequest,
  onHandoverManager,
  onUpdateSettings,
}) => {
  const isManager = currentUser.role === 'MANAGER';
  const currentManager = members.find((m) => m.role === 'MANAGER');

  const [tab, setTab] = useState<'meals' | 'deposits' | 'requests' | 'handover'>('meals');

  // Meal Entry state
  const [entryDate, setEntryDate] = useState(todayStr);
  const buildDraftForDate = (date: string) => {
    const draft: Record<string, Record<string, number>> = {};
    for (const m of members) {
      const existing = mealEntries.find((e) => e.date === date && e.memberId === m.id);
      draft[m.id] = {};
      for (const mt of mess.mealTypes) {
        draft[m.id][mt] = existing?.meals[mt] ?? 0;
      }
    }
    return draft;
  };
  const [mealDraft, setMealDraft] = useState<Record<string, Record<string, number>>>(() =>
    buildDraftForDate(todayStr)
  );
  const [mealSavedMsg, setMealSavedMsg] = useState('');

  // Deposit form state
  const [depMemberId, setDepMemberId] = useState(members[0]?.id ?? '');
  const [depAmount, setDepAmount] = useState('');
  const [depDate, setDepDate] = useState(todayStr);
  const [depNote, setDepNote] = useState('');
  const [depMsg, setDepMsg] = useState('');

  // Settings / Handover state
  const [thresholdInput, setThresholdInput] = useState(String(mess.dueThreshold));
  const [handoverTargetId, setHandoverTargetId] = useState(
    members.find((m) => m.id !== currentUser.id)?.id ?? ''
  );
  const [settingsMsg, setSettingsMsg] = useState('');

  const memberMap = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m.name])),
    [members]
  );

  const pendingRequests = mealStatusRequests.filter((r) => r.status === 'PENDING');

  if (!isManager) {
    return (
      <div className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl p-8 max-w-xl mx-auto text-center space-y-4">
        <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto" />
        <h1 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">
          Manager Access Required
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          You are currently viewing as <strong>{currentUser.name}</strong> (Member). Only the active
          mess manager ({currentManager?.name}) can modify daily meals, deposits, or mess settings.
        </p>
        {currentManager && (
          <button
            type="button"
            onClick={onSwitchToManager}
            className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white dark:bg-emerald-500 dark:text-[#020617] rounded-lg cursor-pointer"
          >
            Switch Perspective to {currentManager.name} (Manager)
          </button>
        )}
      </div>
    );
  }

  const handleEntryDateChange = (newDate: string) => {
    setEntryDate(newDate);
    setMealDraft(buildDraftForDate(newDate));
  };

  const handleSaveMeals = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveMealEntries(entryDate, mealDraft);
    setMealSavedMsg(`Saved meal counts for ${entryDate} and logged diffs to Audit Trail.`);
    setTimeout(() => setMealSavedMsg(''), 4000);
  };

  const handleAddDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depAmount);
    if (!depMemberId || isNaN(amount) || amount <= 0) {
      setDepMsg('Enter a valid positive amount.');
      return;
    }
    onRecordDeposit({ date: depDate, memberId: depMemberId, amount, note: depNote });
    setDepAmount('');
    setDepNote('');
    setDepMsg(`Recorded ${formatBDT(amount)} deposit and logged to Audit Trail.`);
    setTimeout(() => setDepMsg(''), 3500);
  };

  const handleSaveThreshold = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(thresholdInput);
    if (isNaN(val) || val < 0) return;
    onUpdateSettings({ dueThreshold: val });
    setSettingsMsg('Updated due threshold.');
    setTimeout(() => setSettingsMsg(''), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Manager Console
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Every change made here automatically writes an immutable diff to the Audit Log.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Manager sections"
          className="inline-flex flex-wrap items-center p-1 bg-slate-200/70 dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-lg self-start"
        >
          {[
            { id: 'meals' as const, label: 'Meal Entry' },
            { id: 'deposits' as const, label: 'Deposits' },
            { id: 'requests' as const, label: `Requests (${pendingRequests.length})` },
            { id: 'handover' as const, label: 'Settings & Handover' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                tab === t.id
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-50'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Meal Entry */}
      {tab === 'meals' && (
        <form
          onSubmit={handleSaveMeals}
          className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
                Daily Meal Count Grid
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Supports full (1), half (0.5), or off (0) portions per meal.
              </p>
            </div>
            <div>
              <label htmlFor="manager-meal-date" className="sr-only">
                Meal entry date
              </label>
              <input
                id="manager-meal-date"
                type="date"
                value={entryDate}
                onChange={(e) => handleEntryDateChange(e.target.value)}
                className="px-3 py-1.5 text-xs font-mono-num bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[540px]">
              <thead>
                <tr className="text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left py-2.5 px-3 font-medium">Member</th>
                  {mess.mealTypes.map((mt) => (
                    <th key={mt} className="text-center py-2.5 px-3 font-medium capitalize">
                      {mt}
                    </th>
                  ))}
                  <th className="text-right py-2.5 px-3 font-medium">Day Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {members.map((m) => {
                  const row = mealDraft[m.id] ?? {};
                  const dayTotal = mess.mealTypes.reduce((s, mt) => s + (row[mt] ?? 0), 0);
                  return (
                    <tr key={m.id}>
                      <td className="py-3 px-3 font-medium text-slate-900 dark:text-slate-100">
                        {m.name}
                      </td>
                      {mess.mealTypes.map((mt) => (
                        <td key={mt} className="py-3 px-3 text-center">
                          <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg">
                            {MEAL_VALUES.map((val) => {
                              const active = (row[mt] ?? 0) === val;
                              return (
                                <button
                                  key={val}
                                  type="button"
                                  aria-label={`Set ${m.name} ${mt} to ${val}`}
                                  onClick={() =>
                                    setMealDraft((prev) => ({
                                      ...prev,
                                      [m.id]: { ...prev[m.id], [mt]: val },
                                    }))
                                  }
                                  className={`px-2.5 py-1 text-xs font-mono-num font-semibold rounded-md transition-colors cursor-pointer ${
                                    active
                                      ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-[#020617]'
                                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                                  }`}
                                >
                                  {val}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      ))}
                      <td className="py-3 px-3 text-right font-mono-num font-bold text-slate-900 dark:text-slate-50">
                        {dayTotal}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <span role="status" className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {mealSavedMsg}
            </span>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-emerald-600 text-white dark:bg-emerald-500 dark:text-[#020617] rounded-lg hover:opacity-90 cursor-pointer"
            >
              Save Meals &amp; Log Audit Diff
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Deposits */}
      {tab === 'deposits' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <form
            onSubmit={handleAddDeposit}
            className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4"
          >
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
              Record Member Deposit
            </h2>
            <div>
              <label htmlFor="dep-member" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Member
              </label>
              <select
                id="dep-member"
                value={depMemberId}
                onChange={(e) => setDepMemberId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="dep-amount" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Amount (BDT)
              </label>
              <input
                id="dep-amount"
                type="number"
                min="1"
                step="1"
                value={depAmount}
                onChange={(e) => setDepAmount(e.target.value)}
                placeholder="e.g., 1000"
                required
                className="w-full px-3 py-2 text-sm font-mono-num bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="dep-date" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Date
              </label>
              <input
                id="dep-date"
                type="date"
                value={depDate}
                onChange={(e) => setDepDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm font-mono-num bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="dep-note" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Note
              </label>
              <input
                id="dep-note"
                type="text"
                value={depNote}
                onChange={(e) => setDepNote(e.target.value)}
                placeholder="Cash / bKash / Nagad"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
            {depMsg && (
              <p role="status" className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {depMsg}
              </p>
            )}
            <button
              type="submit"
              className="w-full py-2.5 text-xs font-semibold bg-emerald-600 text-white dark:bg-emerald-500 dark:text-[#020617] rounded-lg hover:opacity-90 cursor-pointer"
            >
              Add Deposit
            </button>
          </form>

          <div className="lg:col-span-2 bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
                Deposit History
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#0B0F1A] text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <th className="text-left py-3 px-5 font-medium">Date</th>
                    <th className="text-left py-3 px-3 font-medium">Member</th>
                    <th className="text-left py-3 px-3 font-medium">Note</th>
                    <th className="text-right py-3 px-3 font-medium">Amount</th>
                    <th className="text-right py-3 px-5 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {deposits.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-5 font-mono-num text-xs text-slate-500 dark:text-slate-400">
                        {d.date}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900 dark:text-slate-100">
                        {memberMap[d.memberId] || 'Member'}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-500 dark:text-slate-400">
                        {d.note || '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-num font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatBDT(d.amount)}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteDeposit(d.id)}
                          aria-label={`Delete deposit of ${formatBDT(d.amount)} from ${memberMap[d.memberId]}`}
                          className="p-1.5 text-slate-400 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Post-Blackout Override Requests */}
      {tab === 'requests' && (
        <div className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50 mb-4">
            Post-Blackout Meal Status Requests
          </h2>
          {mealStatusRequests.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No special requests submitted yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {mealStatusRequests.map((req) => (
                <div
                  key={req.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {memberMap[req.memberId] || 'Member'} ·{' '}
                      <span className="capitalize">{req.meal}</span> to{' '}
                      <strong>{req.wantOff ? 'OFF' : 'ON'}</strong>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="font-mono-num">{req.date}</span> · {req.reason}
                    </p>
                  </div>

                  {req.status === 'PENDING' ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onReviewRequest(req.id, 'APPROVED')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white dark:bg-emerald-500 dark:text-[#020617] rounded-lg cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => onReviewRequest(req.id, 'REJECTED')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`text-xs font-semibold ${
                        req.status === 'APPROVED'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {req.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Settings & Handover */}
      {tab === 'handover' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form
            onSubmit={handleSaveThreshold}
            className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4"
          >
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
              Mess Alert Settings
            </h2>
            <div>
              <label
                htmlFor="due-threshold"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                High Meal Due Threshold (BDT)
              </label>
              <input
                id="due-threshold"
                type="number"
                min="0"
                value={thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-num bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Members exceeding this net due trigger a dashboard reminder.
              </p>
            </div>
            {settingsMsg && (
              <p role="status" className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {settingsMsg}
              </p>
            )}
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white dark:bg-emerald-500 dark:text-[#020617] rounded-lg cursor-pointer"
            >
              Save Threshold
            </button>
          </form>

          <div className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
              Manager Role Handover
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Transfer manager permissions to another member for next month&apos;s rotation.
            </p>
            <div>
              <label
                htmlFor="handover-member"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                Next Manager
              </label>
              <select
                id="handover-member"
                value={handoverTargetId}
                onChange={(e) => setHandoverTargetId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                {members
                  .filter((m) => m.id !== currentUser.id)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => handoverTargetId && onHandoverManager(handoverTargetId)}
              className="px-4 py-2 text-xs font-semibold bg-red-600 text-white hover:bg-red-500 rounded-lg cursor-pointer"
            >
              Transfer Manager Role
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
