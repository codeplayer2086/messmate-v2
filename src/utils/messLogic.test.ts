import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBillingCsv,
  buildMealEntryAuditDiffs,
  calculateMonthlyBill,
  formatBDT,
  isMealBlackoutLocked,
} from './messLogic';
import { normalizeItemName, searchCatalog } from './bazarCatalog';
import type { BazarTrip, Deposit, MealEntry, Member } from '../types/mess';

const members: Member[] = [
  { id: 'u1', name: 'Omar', email: 'omar@mess.com', phone: '01700000001', role: 'MANAGER', isActive: true, joinDate: '2026-01-01' },
  { id: 'u2', name: 'Jahid', email: 'jahid@mess.com', phone: '01700000002', role: 'MEMBER', isActive: true, joinDate: '2026-01-01' },
];

test('calculateMonthlyBill excludes unapproved bazar trips and computes meal rate & net due accurately', () => {
  const mealEntries: MealEntry[] = [
    { id: 'm1', date: '2026-11-01', memberId: 'u1', meals: { breakfast: 1, lunch: 1, dinner: 1 }, total: 3 },
    { id: 'm2', date: '2026-11-01', memberId: 'u2', meals: { breakfast: 0, lunch: 1, dinner: 1 }, total: 2 },
  ];
  const bazarTrips: BazarTrip[] = [
    { id: 'b1', date: '2026-11-01', buyerId: 'u1', totalCost: 500, note: 'Approved', companionIds: [], approved: true, approvedAt: '2026-11-01', approvedById: 'u1', items: [] },
    { id: 'b2', date: '2026-11-02', buyerId: 'u2', totalCost: 999, note: 'Pending', companionIds: [], approved: false, approvedAt: null, approvedById: null, items: [] },
  ];
  const deposits: Deposit[] = [
    { id: 'd1', date: '2026-11-01', memberId: 'u1', amount: 200, note: 'Cash' },
    { id: 'd2', date: '2026-11-01', memberId: 'u2', amount: 300, note: 'bKash' },
  ];

  const result = calculateMonthlyBill({
    month: 11,
    year: 2026,
    members,
    mealEntries,
    bazarTrips,
    deposits,
  });

  assert.equal(result.totalExpense, 500);
  assert.equal(result.totalMeals, 5);
  assert.equal(result.mealRate, 100);
  assert.equal(result.cashBalance, 0); // 500 deposits - 500 approved expense

  const omar = result.members.find((m) => m.id === 'u1')!;
  const jahid = result.members.find((m) => m.id === 'u2')!;
  assert.equal(omar.mealCost, 300);
  assert.equal(omar.netDue, 100); // 300 cost - 200 deposit = owes 100
  assert.equal(jahid.mealCost, 200);
  assert.equal(jahid.netDue, -100); // 200 cost - 300 deposit = refund 100
});

test('calculateMonthlyBill handles zero meals without NaN', () => {
  const result = calculateMonthlyBill({
    month: 10,
    year: 2026,
    members,
    mealEntries: [],
    bazarTrips: [],
    deposits: [],
  });
  assert.equal(result.mealRate, 0);
  assert.equal(result.totalExpense, 0);
  assert.equal(result.members[0].mealCost, 0);
});

test('isMealBlackoutLocked checks minute-precision cutoff times', () => {
  const blackouts = [
    { meals: ['breakfast', 'lunch'], startHour: 9, startMinute: 30, endHour: 13, endMinute: 0 },
    { meals: ['dinner'], startHour: 16, startMinute: 0, endHour: 20, endMinute: 0 },
  ];
  assert.equal(isMealBlackoutLocked('lunch', blackouts, 9, 29), false);
  assert.equal(isMealBlackoutLocked('lunch', blackouts, 9, 30), true);
  assert.equal(isMealBlackoutLocked('dinner', blackouts, 15, 45), false);
  assert.equal(isMealBlackoutLocked('dinner', blackouts, 16, 0), true);
});

test('buildMealEntryAuditDiffs logs only changed meal slots on UPDATE', () => {
  const logs = buildMealEntryAuditDiffs({
    editedById: 'u1',
    editedByName: 'Omar',
    memberName: 'Jahid',
    recordId: 'm2',
    date: '2026-11-17',
    mealTypes: ['breakfast', 'lunch', 'dinner'],
    oldMeals: { breakfast: 1, lunch: 1, dinner: 1 },
    newMeals: { breakfast: 0.5, lunch: 1, dinner: 0 },
    timestamp: '2026-11-17T10:00:00Z',
  });
  assert.equal(logs.length, 2);
  assert.equal(logs[0].fieldName, 'Jahid · breakfast (2026-11-17)');
  assert.equal(logs[0].oldValue, '1');
  assert.equal(logs[0].newValue, '0.5');
  assert.equal(logs[1].fieldName, 'Jahid · dinner (2026-11-17)');
});

test('bazarCatalog supports Bangla/English fuzzy search and normalization', () => {
  const murgiResults = searchCatalog('murgi', 5);
  assert.equal(murgiResults[0].key, 'chicken');
  assert.equal(murgiResults[0].defaultUnit, 'kg');

  const norm = normalizeItemName('peyaj');
  assert.deepEqual(norm, { normalizedName: 'onion', category: 'vegetable' });
});

test('buildBillingCsv formats valid CSV rows', () => {
  const bill = calculateMonthlyBill({
    month: 11,
    year: 2026,
    members,
    mealEntries: [{ id: 'm1', date: '2026-11-01', memberId: 'u1', meals: { breakfast: 1, lunch: 1, dinner: 1 }, total: 3 }],
    bazarTrips: [{ id: 'b1', date: '2026-11-01', buyerId: 'u1', totalCost: 300, note: '', companionIds: [], approved: true, approvedAt: '2026-11-01', approvedById: 'u1', items: [] }],
    deposits: [{ id: 'd1', date: '2026-11-01', memberId: 'u1', amount: 150, note: '' }],
  });
  const csv = buildBillingCsv(bill);
  assert.ok(csv.includes('"Omar",3,100,300,150,150,Owes Mess'));
});

test('formatBDT formats integers and decimals with consistent thousands separators', () => {
  assert.equal(formatBDT(3000), '৳3,000');
  assert.equal(formatBDT(1945.28), '৳1,945.28');
  assert.equal(formatBDT(-1050.21, true), '-৳1,050.21');
  assert.equal(formatBDT(459.4, true), '+৳459.40');
});
