import type {
  AuditLogEntry,
  BazarTrip,
  BillPayment,
  BillSetting,
  BlackoutWindow,
  Deposit,
  MealEntry,
  Member,
} from '../types/mess';

export interface MemberBillSummary {
  id: string;
  name: string;
  totalMeals: number;
  mealCost: number;
  totalDeposit: number;
  netDue: number; // positive = member owes mess; negative = refund owed to member
  utilityBillDue: number;
  utilityBillPaid: number;
  utilityBillRemaining: number;
}

export interface MonthlyBillResult {
  month: number;
  year: number;
  totalExpense: number;
  totalMeals: number;
  totalDeposits: number;
  mealRate: number;
  cashBalance: number;
  members: MemberBillSummary[];
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatBDT(amount: number, showSign = false): string {
  const abs = Math.abs(amount);
  const formatted = Number.isInteger(abs)
    ? abs.toLocaleString('en-US')
    : abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (showSign && amount !== 0) {
    return `${amount < 0 ? '-' : '+'}৳${formatted}`;
  }
  return `${amount < 0 ? '-' : ''}৳${formatted}`;
}

export function calculateMonthlyBill(params: {
  month: number;
  year: number;
  members: Member[];
  mealEntries: MealEntry[];
  bazarTrips: BazarTrip[];
  deposits: Deposit[];
  billSetting?: BillSetting;
  billPayments?: BillPayment[];
}): MonthlyBillResult {
  const { month, year, members, mealEntries, bazarTrips, deposits, billSetting, billPayments = [] } = params;

  const prefix = `${year}-${String(month).padStart(2, '0')}`;

  const monthMeals = mealEntries.filter((e) => e.date.startsWith(prefix));
  const monthDeposits = deposits.filter((d) => d.date.startsWith(prefix));
  // Strictly include ONLY approved bazar trips in financial calculations
  const monthApprovedTrips = bazarTrips.filter((t) => t.approved && t.date.startsWith(prefix));

  const totalExpense = round2(monthApprovedTrips.reduce((sum, trip) => sum + trip.totalCost, 0));
  const totalMeals = round2(monthMeals.reduce((sum, entry) => sum + entry.total, 0));
  const totalDeposits = round2(monthDeposits.reduce((sum, dep) => sum + dep.amount, 0));
  const mealRate = totalMeals > 0 ? totalExpense / totalMeals : 0;

  const activeMembers = members.filter((m) => m.isActive);
  const sharedUtilities =
    billSetting && billSetting.month === month && billSetting.year === year
      ? billSetting.wifi +
        billSetting.electricity +
        billSetting.gas +
        billSetting.cookSalary +
        billSetting.other
      : 0;
  const perMemberUtility = activeMembers.length > 0 ? sharedUtilities / activeMembers.length : 0;

  const memberResults: MemberBillSummary[] = activeMembers.map((member) => {
    const memberMeals = round2(
      monthMeals
        .filter((e) => e.memberId === member.id)
        .reduce((sum, e) => sum + e.total, 0)
    );
    const memberDeposit = round2(
      monthDeposits
        .filter((d) => d.memberId === member.id)
        .reduce((sum, d) => sum + d.amount, 0)
    );

    const mealCost = round2(memberMeals * mealRate);
    const netDue = round2(mealCost - memberDeposit);

    const rent =
      billSetting && billSetting.month === month && billSetting.year === year
        ? billSetting.rents[member.id] ?? 0
        : 0;
    const utilityBillDue = round2(rent + perMemberUtility);
    const utilityBillPaid = round2(
      billPayments
        .filter(
          (p) =>
            p.memberId === member.id &&
            p.month === month &&
            p.year === year &&
            p.confirmed
        )
        .reduce((sum, p) => sum + p.amount, 0)
    );
    const utilityBillRemaining = round2(utilityBillDue - utilityBillPaid);

    return {
      id: member.id,
      name: member.name,
      totalMeals: memberMeals,
      mealCost,
      totalDeposit: memberDeposit,
      netDue,
      utilityBillDue,
      utilityBillPaid,
      utilityBillRemaining,
    };
  });

  return {
    month,
    year,
    totalExpense,
    totalMeals,
    totalDeposits,
    mealRate: round2(mealRate),
    cashBalance: round2(totalDeposits - totalExpense),
    members: memberResults,
  };
}

export function isMealBlackoutLocked(
  meal: string,
  blackouts: BlackoutWindow[],
  currentHour: number,
  currentMinute: number
): boolean {
  const nowTotal = currentHour * 60 + currentMinute;
  for (const b of blackouts) {
    if (!b.meals.includes(meal)) continue;
    const startTotal = b.startHour * 60 + (b.startMinute ?? 0);
    if (nowTotal >= startTotal) return true;
  }
  return false;
}

export function buildMealEntryAuditDiffs(params: {
  editedById: string;
  editedByName: string;
  memberName: string;
  recordId: string;
  date: string;
  mealTypes: string[];
  oldMeals: Record<string, number> | null;
  newMeals: Record<string, number>;
  timestamp: string;
}): AuditLogEntry[] {
  const {
    editedById,
    editedByName,
    memberName,
    recordId,
    date,
    mealTypes,
    oldMeals,
    newMeals,
    timestamp,
  } = params;

  if (!oldMeals) {
    const summary = mealTypes
      .map((mt) => `${mt.charAt(0).toUpperCase()}:${newMeals[mt] ?? 0}`)
      .join(' ');
    return [
      {
        id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        editedById,
        editedByName,
        tableName: 'MealEntry',
        recordId,
        fieldName: `${memberName} (${date})`,
        oldValue: null,
        newValue: summary,
        action: 'CREATE',
        createdAt: timestamp,
      },
    ];
  }

  const logs: AuditLogEntry[] = [];
  for (const mt of mealTypes) {
    const oldVal = Number(oldMeals[mt] ?? 0);
    const newVal = Number(newMeals[mt] ?? 0);
    if (oldVal !== newVal) {
      logs.push({
        id: `audit_${Date.now()}_${mt}_${Math.random().toString(36).slice(2, 6)}`,
        editedById,
        editedByName,
        tableName: 'MealEntry',
        recordId,
        fieldName: `${memberName} · ${mt} (${date})`,
        oldValue: String(oldVal),
        newValue: String(newVal),
        action: 'UPDATE',
        createdAt: timestamp,
      });
    }
  }
  return logs;
}

export function buildBillingCsv(bill: MonthlyBillResult): string {
  const headers = ['Member', 'Total Meals', 'Meal Rate (BDT)', 'Meal Cost (BDT)', 'Deposited (BDT)', 'Net Due (BDT)', 'Status'];
  const rows = bill.members.map((m) => {
    const status = m.netDue > 0 ? 'Owes Mess' : m.netDue < 0 ? 'Refund Owed' : 'Settled';
    return [
      `"${m.name.replace(/"/g, '""')}"`,
      m.totalMeals,
      bill.mealRate,
      m.mealCost,
      m.totalDeposit,
      m.netDue,
      status,
    ].join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}
