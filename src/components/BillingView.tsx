import React from 'react';
import { Download } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { BillSetting } from '../types/mess';
import { buildBillingCsv, formatBDT, type MonthlyBillResult } from '../utils/messLogic';

interface BillingViewProps {
  bill: MonthlyBillResult;
  billSetting: BillSetting;
}

export const BillingView: React.FC<BillingViewProps> = ({ bill, billSetting }) => {
  const monthLabel = new Date(bill.year, bill.month - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const chartData = bill.members.map((m) => ({
    name: m.name,
    Cost: m.mealCost,
    Deposited: m.totalDeposit,
  }));

  const handleExportCsv = () => {
    const csv = buildBillingCsv(bill);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `messmate-bill-${bill.year}-${String(bill.month).padStart(2, '0')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const sharedUtilities =
    billSetting.wifi +
    billSetting.electricity +
    billSetting.gas +
    billSetting.cookSalary +
    billSetting.other;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Billing &amp; Settlement
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {monthLabel} · Automated meal rate &amp; member ledger
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-white dark:bg-[#0E1223] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors self-start cursor-pointer whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Approved Expense
          </p>
          <p className="font-kpi text-2xl sm:text-3xl font-bold tracking-tight text-red-600 dark:text-red-400 mt-1.5">
            {formatBDT(bill.totalExpense)}
          </p>
        </div>

        <div className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Logged Meals
          </p>
          <p className="font-kpi text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mt-1.5">
            {bill.totalMeals}
          </p>
        </div>

        <div className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Calculated Meal Rate
          </p>
          <p className="font-kpi text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1.5">
            {formatBDT(bill.mealRate)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono-num">
            {formatBDT(bill.totalExpense)} / {bill.totalMeals} meals
          </p>
        </div>
      </div>

      {/* Expense vs Deposit Comparison Chart */}
      <div className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50 mb-4">
          Member Cost vs. Deposits
        </h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#94A3B8', fontSize: 12 }}
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
                formatter={(value) => formatBDT(Number(value ?? 0))}
                contentStyle={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Cost" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="Deposited" fill="#22C55E" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-Member Settlement Table */}
      <div className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
            Per-Member Meal Settlement
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Net Due = Cost − Deposited
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#0B0F1A] text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <th className="text-left py-3 px-5 font-medium">Member</th>
                <th className="text-right py-3 px-4 font-medium">Meals</th>
                <th className="text-right py-3 px-4 font-medium">Meal Cost</th>
                <th className="text-right py-3 px-4 font-medium">Deposited</th>
                <th className="text-right py-3 px-4 font-medium">Net Balance</th>
                <th className="text-left py-3 px-5 font-medium">Settlement Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {bill.members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-5 font-medium text-slate-900 dark:text-slate-100">
                    {m.name}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num text-slate-700 dark:text-slate-300">
                    {m.totalMeals}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num text-slate-700 dark:text-slate-300">
                    {formatBDT(m.mealCost)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num text-emerald-600 dark:text-emerald-400">
                    {formatBDT(m.totalDeposit)}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-mono-num font-semibold ${
                      m.netDue > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {formatBDT(m.netDue, true)}
                  </td>
                  <td className="py-3 px-5 text-xs font-medium">
                    {m.netDue > 0 ? (
                      <span className="text-red-600 dark:text-red-400">
                        Owes {formatBDT(m.netDue)}
                      </span>
                    ) : m.netDue < 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Refund {formatBDT(Math.abs(m.netDue))}
                      </span>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400">Settled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 dark:bg-[#0B0F1A] border-t border-slate-200 dark:border-slate-800 font-semibold">
                <td className="py-3 px-5 text-slate-900 dark:text-slate-100">Total</td>
                <td className="py-3 px-4 text-right font-mono-num text-slate-900 dark:text-slate-100">
                  {bill.totalMeals}
                </td>
                <td className="py-3 px-4 text-right font-mono-num text-slate-900 dark:text-slate-100">
                  {formatBDT(bill.totalExpense)}
                </td>
                <td className="py-3 px-4 text-right font-mono-num text-emerald-600 dark:text-emerald-400">
                  {formatBDT(bill.totalDeposits)}
                </td>
                <td className="py-3 px-4 text-right font-mono-num text-slate-900 dark:text-slate-100">
                  {formatBDT(bill.totalExpense - bill.totalDeposits)}
                </td>
                <td className="py-3 px-5"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Shared Utilities Breakdown */}
      <div className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
            Shared Utilities &amp; Cook Salary
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono-num">
            Total {formatBDT(sharedUtilities)} · {formatBDT(sharedUtilities / Math.max(bill.members.length, 1))}/member
          </span>
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
          {[
            { label: 'Cook Salary', value: billSetting.cookSalary },
            { label: 'Electricity', value: billSetting.electricity },
            { label: 'WiFi', value: billSetting.wifi },
            { label: 'Gas', value: billSetting.gas },
            { label: 'Other', value: billSetting.other },
          ].map((u) => (
            <div key={u.label} className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <dt className="text-xs text-slate-500 dark:text-slate-400">{u.label}</dt>
              <dd className="font-mono-num font-semibold text-slate-900 dark:text-slate-100 mt-1">
                {formatBDT(u.value)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};
