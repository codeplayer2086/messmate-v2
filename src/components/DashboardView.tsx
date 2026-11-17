import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Clock,
  Lock,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  Announcement,
  AuditLogEntry,
  MealEntry,
  MealPlan,
  MealStatusItem,
  MealStatusRequest,
  Member,
  MessConfig,
  NavSection,
} from '../types/mess';
import type { MonthlyBillResult } from '../utils/messLogic';
import { formatBDT } from '../utils/messLogic';

interface DashboardViewProps {
  mess: MessConfig;
  currentUser: Member;
  members: Member[];
  bill: MonthlyBillResult;
  todayStr: string;
  tomorrowStr: string;
  mealEntries: MealEntry[];
  mealStatuses: MealStatusItem[];
  mealStatusRequests: MealStatusRequest[];
  mealPlans: MealPlan[];
  auditLogs: AuditLogEntry[];
  announcements: Announcement[];
  blackoutToday: Record<string, boolean>;
  onToggleMeal: (dateStr: string, meal: string) => void;
  onSubmitBlackoutRequest: (dateStr: string, meal: string, wantOff: boolean, reason: string) => void;
  onNavigate: (section: NavSection) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  mess,
  currentUser,
  members,
  bill,
  todayStr,
  tomorrowStr,
  mealEntries,
  mealStatuses,
  mealStatusRequests,
  mealPlans,
  auditLogs,
  announcements,
  blackoutToday,
  onToggleMeal,
  onSubmitBlackoutRequest,
  onNavigate,
}) => {
  const [requestTarget, setRequestTarget] = useState<{ date: string; meal: string } | null>(null);
  const [requestReason, setRequestReason] = useState('');
  const [requestFeedback, setRequestFeedback] = useState('');

  const myBill = bill.members.find((m) => m.id === currentUser.id);
  const myNetDue = myBill?.netDue ?? 0;
  const exceedsThreshold = myNetDue > mess.dueThreshold;

  const getMealState = (dateStr: string, meal: string) => {
    const statusRow = mealStatuses.find(
      (s) => s.date === dateStr && s.meal === meal && s.memberId === currentUser.id
    );
    const isOff = statusRow?.isOff ?? false;

    const activeCount = members.filter((m) => {
      const mStatus = mealStatuses.find(
        (s) => s.date === dateStr && s.meal === meal && s.memberId === m.id
      );
      return !(mStatus?.isOff ?? false);
    }).length;

    const pendingReq = mealStatusRequests.find(
      (r) =>
        r.date === dateStr &&
        r.meal === meal &&
        r.memberId === currentUser.id &&
        r.status === 'PENDING'
    );

    return { isOff, activeCount, pendingReq };
  };

  const todayPlan = mealPlans.find((p) => p.date === todayStr);
  const tomorrowPlan = mealPlans.find((p) => p.date === tomorrowStr);

  // Build 7-day daily meal count chart data
  const chartData = useMemo(() => {
    const byDate = new Map<string, number>();
    for (const e of mealEntries) {
      byDate.set(e.date, (byDate.get(e.date) ?? 0) + e.total);
    }
    const sorted = Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([date, meals]) => ({
        day: date.slice(5),
        meals,
      }));
    return sorted;
  }, [mealEntries]);

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestTarget) return;
    const { isOff } = getMealState(requestTarget.date, requestTarget.meal);
    onSubmitBlackoutRequest(requestTarget.date, requestTarget.meal, !isOff, requestReason);
    setRequestTarget(null);
    setRequestReason('');
    setRequestFeedback(`Request sent to Manager for ${requestTarget.meal}.`);
    setTimeout(() => setRequestFeedback(''), 3500);
  };

  const renderDayCard = (dateStr: string, heading: string, isToday: boolean) => {
    const plan = isToday ? todayPlan : tomorrowPlan;
    return (
      <div className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
              {heading}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono-num mt-0.5">
              {dateStr}
            </p>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {isToday ? 'Cutoff active' : 'Open for edits'}
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
          {mess.mealTypes.map((meal) => {
            const { isOff, activeCount, pendingReq } = getMealState(dateStr, meal);
            const isLocked = isToday && blackoutToday[meal];
            const isCancelled = plan?.cancelledMeals.includes(meal) ?? false;
            const menuText = plan?.meals[meal] || 'No menu published';
            const isRequestingThis =
              requestTarget?.date === dateStr && requestTarget?.meal === meal;

            return (
              <div key={meal} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                      <span className="capitalize">{meal}</span>
                      <span className="text-slate-400 dark:text-slate-600" aria-hidden="true">·</span>
                      <span className="font-mono-num text-xs text-slate-500 dark:text-slate-400">
                        {activeCount}/{members.length} eating
                      </span>
                      {isCancelled && (
                        <>
                          <span className="text-slate-400 dark:text-slate-600" aria-hidden="true">·</span>
                          <span className="text-xs font-medium text-red-600 dark:text-red-400">
                            Cancelled
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {menuText}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {isLocked && currentUser.role !== 'MANAGER' ? (
                      pendingReq ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                          <Clock className="w-3.5 h-3.5" />
                          Pending Review
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setRequestTarget({ date: dateStr, meal })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                          aria-label={`Request override for locked ${meal} on ${dateStr}`}
                        >
                          <Lock className="w-3.5 h-3.5" />
                          Request Change
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!isOff}
                        aria-label={`Toggle ${meal} on ${dateStr} (currently ${isOff ? 'OFF' : 'ON'})`}
                        onClick={() => onToggleMeal(dateStr, meal)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                          isOff
                            ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-800'
                            : 'bg-emerald-600/10 text-emerald-700 border-emerald-600/30 hover:bg-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30'
                        }`}
                      >
                        {isOff ? 'OFF' : 'ON'}
                      </button>
                    )}
                  </div>
                </div>

                {isRequestingThis && (
                  <form onSubmit={handleRequestSubmit} className="mt-3 flex flex-wrap items-center gap-2">
                    <label htmlFor={`reason-${dateStr}-${meal}`} className="sr-only">
                      Reason for meal override
                    </label>
                    <input
                      id={`reason-${dateStr}-${meal}`}
                      type="text"
                      value={requestReason}
                      onChange={(e) => setRequestReason(e.target.value)}
                      placeholder="Reason (e.g., late lab, going home)..."
                      className="flex-1 min-w-[180px] px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white dark:bg-emerald-500 dark:text-[#020617] rounded-lg hover:opacity-90 cursor-pointer"
                    >
                      Send
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRequestTarget(null);
                        setRequestReason('');
                      }}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Intro */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Welcome back, {currentUser.name}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {mess.name} · {currentUser.role === 'MANAGER' ? 'Manager access enabled' : 'Member read & toggle access'}
          </p>
        </div>
        {requestFeedback && (
          <p role="status" className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {requestFeedback}
          </p>
        )}
      </div>

      {/* Due Threshold Alert */}
      {exceedsThreshold && (
        <div
          role="alert"
          className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold text-red-700 dark:text-red-300">
                Deposit Threshold Exceeded
              </h2>
              <p className="text-xs text-red-700/80 dark:text-red-300/80 mt-0.5">
                Your net meal due of <span className="font-mono-num font-semibold">{formatBDT(myNetDue)}</span> exceeds the mess threshold of{' '}
                <span className="font-mono-num">{formatBDT(mess.dueThreshold)}</span>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('billing')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 dark:text-red-200 bg-red-500/15 hover:bg-red-500/25 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Inspect Breakdown
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Strip — 4 Tabular Metrics */}
      <section aria-label="Personal summary metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">My Meals</p>
          <p className="font-kpi text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mt-2">
            {myBill?.totalMeals ?? 0}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Of {bill.totalMeals} mess meals
          </p>
        </div>

        <div className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">My Deposit</p>
          <p className="font-kpi text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-2">
            {formatBDT(myBill?.totalDeposit ?? 0)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Meal cost {formatBDT(myBill?.mealCost ?? 0)}
          </p>
        </div>

        <div className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Current Meal Rate</p>
          <p className="font-kpi text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mt-2">
            {formatBDT(bill.mealRate)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Per meal · {formatBDT(bill.totalExpense)} approved
          </p>
        </div>

        <div className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">My Net Balance</p>
          <p
            className={`font-kpi text-2xl sm:text-3xl font-bold tracking-tight mt-2 ${
              myNetDue > 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {formatBDT(Math.abs(myNetDue))}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {myNetDue > 0 ? 'Owed to mess' : myNetDue < 0 ? 'Refundable surplus' : 'Fully settled'}
          </p>
        </div>
      </section>

      {/* Main Split: Today & Tomorrow Meal Controls + Mess Ledger / Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderDayCard(todayStr, 'Today', true)}
            {renderDayCard(tomorrowStr, 'Tomorrow', false)}
          </div>

          {/* 7-Day Consumption Chart */}
          <div className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
                  7-Day Meal Volume
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Total daily meals logged across all {members.length} members
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('transparency')}
                className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                View scorecard
              </button>
            </div>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="meals" fill="#22C55E" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Rail: Cash in Hand, Notices, Recent Audit */}
        <div className="space-y-6">
          {/* Manager Cash in Hand */}
          <div className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Mess Cash Balance
              </h2>
            </div>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between items-center">
                <dt className="text-slate-500 dark:text-slate-400">Total Deposits</dt>
                <dd className="font-mono-num font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatBDT(bill.totalDeposits)}
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-slate-500 dark:text-slate-400">Approved Bazar</dt>
                <dd className="font-mono-num font-semibold text-red-600 dark:text-red-400">
                  {formatBDT(bill.totalExpense)}
                </dd>
              </div>
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <dt className="font-medium text-slate-900 dark:text-slate-100">Cash in Hand</dt>
                <dd
                  className={`font-mono-num text-lg font-bold ${
                    bill.cashBalance < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {formatBDT(bill.cashBalance)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Notice Board */}
          <div className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Mess Notices
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('operations')}
                className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                All notices
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {announcements.slice(0, 2).map((a) => (
                <article key={a.id} className="py-3 first:pt-0 last:pb-0">
                  <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {a.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {a.body}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                    {a.authorName} · {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </article>
              ))}
            </div>
          </div>

          {/* Recent Anti-Cheat Audit Activity */}
          <div className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Recent Audit Trail
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('audit-log')}
                className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Full log
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {auditLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="py-2.5 first:pt-0 last:pb-0 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {log.fieldName}
                    </span>
                    <span className="font-mono-num text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                      {log.action}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {log.editedByName} · {log.oldValue ? `${log.oldValue} -> ` : ''}
                    <span className="text-emerald-600 dark:text-emerald-400">{log.newValue ?? 'deleted'}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
