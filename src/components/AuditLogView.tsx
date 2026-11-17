import React, { useMemo, useState } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import type { AuditLogEntry } from '../types/mess';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
}

const TABLE_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'MealEntry', label: 'Meals' },
  { value: 'Deposit', label: 'Deposits' },
  { value: 'BazarTrip', label: 'Bazar' },
  { value: 'MealPlan', label: 'Meal Plan' },
  { value: 'ManagerRotation', label: 'Handover' },
];

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [tableFilter, setTableFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((log) => {
      if (tableFilter !== 'all' && log.tableName !== tableFilter) return false;
      if (!q) return true;
      return (
        log.fieldName.toLowerCase().includes(q) ||
        log.editedByName.toLowerCase().includes(q) ||
        (log.newValue || '').toLowerCase().includes(q) ||
        (log.oldValue || '').toLowerCase().includes(q)
      );
    });
  }, [logs, tableFilter, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Anti-Cheat Audit Log
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Every meal adjustment, deposit, bazar approval, and manager rotation is permanently recorded.
          </p>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono-num">
          {filteredLogs.length} entries
        </span>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div role="tablist" aria-label="Filter audit logs by entity" className="flex flex-wrap gap-1.5">
          {TABLE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              role="tab"
              aria-selected={tableFilter === f.value}
              onClick={() => setTableFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                tableFilter === f.value
                  ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-[#020617]'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <label htmlFor="audit-search" className="sr-only">
            Search audit trail
          </label>
          <input
            id="audit-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search editor or field..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Audit Entries Table */}
      <div className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-10 text-center">
            <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No audit events match the active filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm min-w-[680px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#0B0F1A] text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left py-3 px-5 font-medium">Timestamp</th>
                  <th className="text-left py-3 px-3 font-medium">Action</th>
                  <th className="text-left py-3 px-3 font-medium">Editor</th>
                  <th className="text-left py-3 px-3 font-medium">Entity · Field</th>
                  <th className="text-left py-3 px-5 font-medium">Change Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-5 font-mono-num text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-mono-num text-xs font-semibold">
                      <span
                        className={
                          log.action === 'CREATE' || log.action === 'RESTORE'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : log.action === 'UPDATE'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-red-600 dark:text-red-400'
                        }
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {log.editedByName}
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {log.fieldName}
                      </span>{' '}
                      <span className="text-slate-400 dark:text-slate-500">· {log.tableName}</span>
                    </td>
                    <td className="py-3 px-5 font-mono-num text-xs">
                      {log.oldValue && (
                        <>
                          <span className="text-red-600 dark:text-red-400 line-through">
                            {log.oldValue}
                          </span>
                          <span className="text-slate-400 mx-1.5">-&gt;</span>
                        </>
                      )}
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {log.newValue ?? 'removed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
