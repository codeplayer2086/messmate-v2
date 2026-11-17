import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  CalendarDays,
  Eye,
  LayoutDashboard,
  Menu,
  Moon,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Sun,
  X,
} from 'lucide-react';
import type { Member, NavSection } from '../types/mess';

interface AppShellProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  messName: string;
  inviteCode: string;
  currentUser: Member;
  members: Member[];
  onSwitchUser: (userId: string) => void;
  onResetDemo: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  pendingCount: number;
  children: React.ReactNode;
}

const SECTION_LABELS: Record<NavSection, string> = {
  dashboard: 'Dashboard',
  bazar: 'Bazar Ledger',
  billing: 'Billing & Settlement',
  transparency: 'Transparency Board',
  'audit-log': 'Audit Log',
  operations: 'Meal Plan & Duties',
  manager: 'Manager Console',
};

export const AppShell: React.FC<AppShellProps> = ({
  activeSection,
  onNavigate,
  messName,
  inviteCode,
  currentUser,
  members,
  onSwitchUser,
  onResetDemo,
  theme,
  onToggleTheme,
  pendingCount,
  children,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navGroups: {
    heading: string;
    items: { id: NavSection; label: string; icon: React.ReactNode; count?: number }[];
  }[] = [
    {
      heading: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'operations', label: 'Meal Plan & Duties', icon: <CalendarDays className="w-4 h-4" /> },
      ],
    },
    {
      heading: 'Ledger & Accountability',
      items: [
        {
          id: 'bazar',
          label: 'Bazar Ledger',
          icon: <ShoppingCart className="w-4 h-4" />,
          count: pendingCount > 0 ? pendingCount : undefined,
        },
        { id: 'billing', label: 'Billing & Settlement', icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'transparency', label: 'Transparency Board', icon: <Eye className="w-4 h-4" /> },
        { id: 'audit-log', label: 'Audit Log', icon: <ShieldCheck className="w-4 h-4" /> },
      ],
    },
    {
      heading: 'Administration',
      items: [
        {
          id: 'manager',
          label: 'Manager Console',
          icon: <SlidersHorizontal className="w-4 h-4" />,
        },
      ],
    },
  ];

  const handleSelectNav = (id: NavSection) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  const primaryCta =
    activeSection === 'bazar'
      ? { label: 'Record Meals', target: 'manager' as NavSection }
      : { label: 'Log Bazar Trip', target: 'bazar' as NavSection };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#0B0F1A] border-r border-slate-200 dark:border-slate-800/90">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800/90">
        <div className="flex items-center justify-between">
          <span className="font-display text-base font-bold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap">
            MessMate V2
          </span>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-2 -mr-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg cursor-pointer"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
          {messName} · <span className="font-mono-num">{inviteCode}</span>
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6" aria-label="Main navigation">
        {navGroups.map((group) => (
          <div key={group.heading}>
            <p className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-500">
              {group.heading}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = activeSection === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectNav(item.id)}
                      aria-current={active ? 'page' : undefined}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-emerald-600/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        {item.icon}
                        <span className="truncate">{item.label}</span>
                      </span>
                      {item.count !== undefined && (
                        <span className="font-mono-num text-xs font-semibold text-amber-600 dark:text-amber-400">
                          {item.count}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800/90 space-y-3">
        <div>
          <label
            htmlFor="active-member-select"
            className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5"
          >
            Active Perspective
          </label>
          <select
            id="active-member-select"
            value={currentUser.id}
            onChange={(e) => onSwitchUser(e.target.value)}
            className="w-full px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-[#0E1223] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.role === 'MANAGER' ? 'Manager' : 'Member'})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5 truncate">
            <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">{currentUser.email}</span>
          </span>
          <button
            type="button"
            onClick={onResetDemo}
            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
            title="Reset demo ledger data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 dark:bg-[#020617] dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10">{sidebarContent}</div>
        </div>
      )}

      {/* Workspace Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract: Breadcrumb | Theme + 1 Primary Action */}
        <header className="sticky top-0 z-30 h-14 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8 bg-white/90 dark:bg-[#020617]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/90">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden sm:inline text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {messName}
              </span>
              <span className="hidden sm:inline text-slate-400 dark:text-slate-600" aria-hidden="true">
                /
              </span>
              <span className="font-display font-semibold text-slate-900 dark:text-slate-50 truncate">
                {SECTION_LABELS[activeSection]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => handleSelectNav(primaryCta.target)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 dark:text-[#020617] dark:bg-emerald-500 dark:hover:bg-emerald-400 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {primaryCta.label}
            </button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
};
