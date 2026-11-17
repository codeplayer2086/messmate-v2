import React, { useMemo } from 'react';
import type { BazarTrip, DutySchedule, MealEntry, Member } from '../types/mess';
import { formatBDT, type MonthlyBillResult } from '../utils/messLogic';

interface TransparencyViewProps {
  bill: MonthlyBillResult;
  members: Member[];
  mealEntries: MealEntry[];
  bazarTrips: BazarTrip[];
  duties: DutySchedule[];
}

export const TransparencyView: React.FC<TransparencyViewProps> = ({
  bill,
  members,
  mealEntries,
  bazarTrips,
  duties,
}) => {
  const bazarTripCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of bazarTrips) {
      if (!t.approved) continue;
      map[t.buyerId] = (map[t.buyerId] ?? 0) + 1;
      for (const cid of t.companionIds) {
        map[cid] = (map[cid] ?? 0) + 1;
      }
    }
    return map;
  }, [bazarTrips]);

  const washroomCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of duties) {
      if (d.type === 'WASHROOM' && d.completed) {
        map[d.memberId] = (map[d.memberId] ?? 0) + 1;
      }
    }
    return map;
  }, [duties]);

  const recentDates = useMemo(() => {
    const set = new Set(mealEntries.map((e) => e.date));
    return Array.from(set).sort((a, b) => b.localeCompare(a)).slice(0, 7);
  }, [mealEntries]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Transparency Board
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Full side-by-side accountability across meals, deposits, rent, and shared duties.
        </p>
      </div>

      {/* Member Scorecard Table */}
      <div className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
            Member Accountability Scorecard
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono-num">
            Meal Rate {formatBDT(bill.mealRate)}/meal
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm min-w-[740px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#0B0F1A] text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <th className="text-left py-3 px-5 font-medium">Member</th>
                <th className="text-right py-3 px-3 font-medium">Meals</th>
                <th className="text-right py-3 px-3 font-medium">Meal Cost</th>
                <th className="text-right py-3 px-3 font-medium">Deposits</th>
                <th className="text-right py-3 px-3 font-medium">Meal Balance</th>
                <th className="text-right py-3 px-3 font-medium">Rent + Util</th>
                <th className="text-right py-3 px-3 font-medium">Paid Bill</th>
                <th className="text-right py-3 px-3 font-medium">Bazar</th>
                <th className="text-right py-3 px-5 font-medium">Washroom</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {bill.members.map((m) => {
                const role = members.find((u) => u.id === m.id)?.role;
                return (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-5 font-medium text-slate-900 dark:text-slate-100">
                      <span>{m.name}</span>
                      {role === 'MANAGER' && (
                        <span className="ml-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          (Manager)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num text-slate-700 dark:text-slate-300">
                      {m.totalMeals}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num text-slate-700 dark:text-slate-300">
                      {formatBDT(m.mealCost)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num text-emerald-600 dark:text-emerald-400">
                      {formatBDT(m.totalDeposit)}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-mono-num font-semibold ${
                        m.netDue > 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {formatBDT(m.netDue, true)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num text-slate-700 dark:text-slate-300">
                      {formatBDT(m.utilityBillDue)}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-mono-num ${
                        m.utilityBillRemaining > 0
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {formatBDT(m.utilityBillPaid)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num text-slate-700 dark:text-slate-300">
                      {bazarTripCounts[m.id] ?? 0}
                    </td>
                    <td className="py-3 px-5 text-right font-mono-num text-slate-700 dark:text-slate-300">
                      {washroomCounts[m.id] ?? 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rent & Utility Payment Progress */}
      <div className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50 mb-4">
          Rent &amp; Utility Payment Progress
        </h2>
        <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
          {bill.members.map((m) => {
            const pct = m.utilityBillDue > 0 ? Math.min(100, (m.utilityBillPaid / m.utilityBillDue) * 100) : 0;
            const settled = m.utilityBillRemaining <= 0;
            return (
              <div key={m.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{m.name}</span>
                  <span
                    className={`font-mono-num text-xs font-semibold ${
                      settled ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {settled ? 'Settled' : `${formatBDT(m.utilityBillRemaining)} due`} ·{' '}
                    {formatBDT(m.utilityBillPaid)} / {formatBDT(m.utilityBillDue)}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${settled ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent 7-Day Daily Meal Matrix */}
      <div className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
            Last 7 Days Meal Matrix
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm min-w-[540px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#0B0F1A] text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <th className="text-left py-2.5 px-5 font-medium">Date</th>
                {members.map((m) => (
                  <th key={m.id} className="text-right py-2.5 px-4 font-medium">
                    {m.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {recentDates.map((dateStr) => (
                <tr key={dateStr} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="py-2.5 px-5 font-mono-num text-slate-700 dark:text-slate-300">
                    {dateStr}
                  </td>
                  {members.map((m) => {
                    const entry = mealEntries.find(
                      (e) => e.date === dateStr && e.memberId === m.id
                    );
                    return (
                      <td
                        key={m.id}
                        className="py-2.5 px-4 text-right font-mono-num text-slate-900 dark:text-slate-100"
                      >
                        {entry ? entry.total : 0}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
