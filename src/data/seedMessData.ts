import type { MealEntry, MealStatusItem, MessState } from '../types/mess';

function getDateStr(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getMonthYearNow(): { month: number; year: number; todayStr: string; tomorrowStr: string } {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    todayStr: getDateStr(0),
    tomorrowStr: getDateStr(1),
  };
}

export function createInitialMessState(): MessState {
  const { month, year, todayStr, tomorrowStr } = getMonthYearNow();
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const currentDay = new Date().getDate();
  const daysToSeed = Math.max(1, Math.min(currentDay, 17));

  const members = [
    { id: 'u_omar', name: 'Omar', email: 'omar@mess.com', phone: '01700000001', role: 'MANAGER' as const, isActive: true, joinDate: '2026-01-01' },
    { id: 'u_jahid', name: 'Jahid', email: 'jahid@mess.com', phone: '01700000002', role: 'MEMBER' as const, isActive: true, joinDate: '2026-01-01' },
    { id: 'u_zobayer', name: 'Zobayer', email: 'zobayer@mess.com', phone: '01700000003', role: 'MEMBER' as const, isActive: true, joinDate: '2026-01-01' },
    { id: 'u_kabbo', name: 'Kabbo', email: 'kabbo@mess.com', phone: '01700000004', role: 'MEMBER' as const, isActive: true, joinDate: '2026-01-01' },
    { id: 'u_mahbub', name: 'Mahbub', email: 'mahbub@mess.com', phone: '01700000005', role: 'MEMBER' as const, isActive: true, joinDate: '2026-01-01' },
  ];

  // Deterministic meal entries for the current month up to today
  const mealEntries: MealEntry[] = [];
  for (let d = 1; d <= daysToSeed; d++) {
    const dateStr = `${prefix}-${String(d).padStart(2, '0')}`;
    const patterns: Record<string, { b: number; l: number; du: number }> = {
      u_omar: { b: d % 4 === 0 ? 0 : 1, l: 1, du: 1 },
      u_jahid: { b: d % 3 === 0 ? 0.5 : 1, l: 1, du: d % 5 === 0 ? 0 : 1 },
      u_zobayer: { b: 0, l: 1, du: 1 },
      u_kabbo: { b: 1, l: d % 6 === 0 ? 0 : 1, du: 1 },
      u_mahbub: { b: d % 2 === 0 ? 1 : 0, l: 1, du: d % 7 === 0 ? 0 : 1 },
    };
    for (const m of members) {
      const p = patterns[m.id];
      const total = p.b + p.l + p.du;
      mealEntries.push({
        id: `me_${dateStr}_${m.id}`,
        date: dateStr,
        memberId: m.id,
        meals: { breakfast: p.b, lunch: p.l, dinner: p.du },
        total,
      });
    }
  }

  // Meal statuses for today and tomorrow
  // Note: breakfast is intentionally past cutoff (locked) to showcase blackout request workflow; lunch/dinner depend or are unlocked for tomorrow
  const mealStatuses: MealStatusItem[] = [
    { date: todayStr, meal: 'breakfast', memberId: 'u_zobayer', isOff: true, changedBy: null },
    { date: todayStr, meal: 'dinner', memberId: 'u_mahbub', isOff: true, changedBy: null },
    { date: tomorrowStr, meal: 'breakfast', memberId: 'u_zobayer', isOff: true, changedBy: null },
    { date: tomorrowStr, meal: 'lunch', memberId: 'u_kabbo', isOff: true, changedBy: null },
  ];

  const bazarTrips = [
    {
      id: 'bt_1',
      date: `${prefix}-02`,
      buyerId: 'u_omar',
      totalCost: 2480,
      note: 'Weekly staples + poultry',
      companionIds: ['u_jahid'],
      approved: true,
      approvedAt: `${prefix}-02T19:30:00Z`,
      approvedById: 'u_omar',
      items: [
        { id: 'bi_1', serialNo: 1, itemName: 'Rice', normalizedName: 'rice', category: 'staple', quantity: 25, unit: 'kg', price: 1650 },
        { id: 'bi_2', serialNo: 2, itemName: 'Soybean Oil', normalizedName: 'soybean_oil', category: 'staple', quantity: 3, unit: 'litre', price: 540 },
        { id: 'bi_3', serialNo: 3, itemName: 'Onion', normalizedName: 'onion', category: 'vegetable', quantity: 3, unit: 'kg', price: 290 },
      ],
    },
    {
      id: 'bt_2',
      date: `${prefix}-06`,
      buyerId: 'u_kabbo',
      totalCost: 1920,
      note: 'Chicken, eggs and vegetables',
      companionIds: [],
      approved: true,
      approvedAt: `${prefix}-06T18:10:00Z`,
      approvedById: 'u_omar',
      items: [
        { id: 'bi_4', serialNo: 1, itemName: 'Chicken', normalizedName: 'chicken', category: 'protein', quantity: 4.5, unit: 'kg', price: 945 },
        { id: 'bi_5', serialNo: 2, itemName: 'Egg', normalizedName: 'egg', category: 'protein', quantity: 30, unit: 'pcs', price: 390 },
        { id: 'bi_6', serialNo: 3, itemName: 'Potato', normalizedName: 'potato', category: 'vegetable', quantity: 5, unit: 'kg', price: 325 },
        { id: 'bi_7', serialNo: 4, itemName: 'Mixed Vegetables', normalizedName: 'vegetable_mixed', category: 'vegetable', quantity: 4, unit: 'kg', price: 260 },
      ],
    },
    {
      id: 'bt_3',
      date: `${prefix}-11`,
      buyerId: 'u_zobayer',
      totalCost: 2150,
      note: 'Rui fish and spices restock',
      companionIds: ['u_mahbub'],
      approved: true,
      approvedAt: `${prefix}-11T17:45:00Z`,
      approvedById: 'u_omar',
      items: [
        { id: 'bi_8', serialNo: 1, itemName: 'Rui Fish', normalizedName: 'fish_rui', category: 'protein', quantity: 3.5, unit: 'kg', price: 1260 },
        { id: 'bi_9', serialNo: 2, itemName: 'Masur Dal', normalizedName: 'dal_masur', category: 'protein', quantity: 3, unit: 'kg', price: 420 },
        { id: 'bi_10', serialNo: 3, itemName: 'Garlic', normalizedName: 'garlic', category: 'vegetable', quantity: 1, unit: 'kg', price: 240 },
        { id: 'bi_11', serialNo: 4, itemName: 'Spices (Mixed)', normalizedName: 'spice_mixed', category: 'spice', quantity: 4, unit: 'packet', price: 230 },
      ],
    },
    {
      id: 'bt_4',
      date: `${prefix}-15`,
      buyerId: 'u_mahbub',
      totalCost: 1690,
      note: 'Beef & salad essentials',
      companionIds: [],
      approved: true,
      approvedAt: `${prefix}-15T20:05:00Z`,
      approvedById: 'u_omar',
      items: [
        { id: 'bi_12', serialNo: 1, itemName: 'Beef', normalizedName: 'beef', category: 'protein', quantity: 1.5, unit: 'kg', price: 1140 },
        { id: 'bi_13', serialNo: 2, itemName: 'Tomato', normalizedName: 'tomato', category: 'vegetable', quantity: 2, unit: 'kg', price: 260 },
        { id: 'bi_14', serialNo: 3, itemName: 'Green Chili', normalizedName: 'green_chili', category: 'vegetable', quantity: 0.5, unit: 'kg', price: 110 },
        { id: 'bi_15', serialNo: 4, itemName: 'Water Jar', normalizedName: 'water', category: 'utility', quantity: 3, unit: 'pcs', price: 180 },
      ],
    },
    {
      id: 'bt_5_pending',
      date: todayStr,
      buyerId: 'u_jahid',
      totalCost: 780,
      note: 'Morning fresh bazar (awaiting manager approval)',
      companionIds: [],
      approved: false,
      approvedAt: null,
      approvedById: null,
      items: [
        { id: 'bi_16', serialNo: 1, itemName: 'Tilapia', normalizedName: 'fish_tilapia', category: 'protein', quantity: 2, unit: 'kg', price: 480 },
        { id: 'bi_17', serialNo: 2, itemName: 'Spinach', normalizedName: 'spinach', category: 'vegetable', quantity: 4, unit: 'pcs', price: 120 },
        { id: 'bi_18', serialNo: 3, itemName: 'Eggplant', normalizedName: 'eggplant', category: 'vegetable', quantity: 2, unit: 'kg', price: 180 },
      ],
    },
  ];

  const deposits = [
    { id: 'dep_1', date: `${prefix}-01`, memberId: 'u_omar', amount: 2500, note: 'Opening deposit (Cash)' },
    { id: 'dep_2', date: `${prefix}-01`, memberId: 'u_jahid', amount: 2200, note: 'Opening deposit (bKash)' },
    { id: 'dep_3', date: `${prefix}-02`, memberId: 'u_zobayer', amount: 1800, note: 'Cash handover' },
    { id: 'dep_4', date: `${prefix}-03`, memberId: 'u_kabbo', amount: 2000, note: 'Nagad transfer' },
    { id: 'dep_5', date: `${prefix}-03`, memberId: 'u_mahbub', amount: 1200, note: 'First installment' },
    { id: 'dep_6', date: `${prefix}-10`, memberId: 'u_omar', amount: 500, note: 'Mid-month top-up' },
  ];

  const auditLogs = [
    {
      id: 'aud_1',
      editedById: 'u_omar',
      editedByName: 'Omar',
      tableName: 'BazarTrip' as const,
      recordId: 'bt_4',
      fieldName: 'approved',
      oldValue: 'false',
      newValue: 'true (৳1,690 · Mahbub)',
      action: 'UPDATE' as const,
      createdAt: `${prefix}-15T20:05:00Z`,
    },
    {
      id: 'aud_2',
      editedById: 'u_omar',
      editedByName: 'Omar',
      tableName: 'MealEntry' as const,
      recordId: `me_${prefix}-14_u_jahid`,
      fieldName: `Jahid · breakfast (${prefix}-14)`,
      oldValue: '1',
      newValue: '0.5',
      action: 'UPDATE' as const,
      createdAt: `${prefix}-14T11:22:00Z`,
    },
    {
      id: 'aud_3',
      editedById: 'u_omar',
      editedByName: 'Omar',
      tableName: 'Deposit' as const,
      recordId: 'dep_6',
      fieldName: 'amount',
      oldValue: null,
      newValue: '৳500 from Omar (Mid-month top-up)',
      action: 'CREATE' as const,
      createdAt: `${prefix}-10T14:15:00Z`,
    },
    {
      id: 'aud_4',
      editedById: 'u_jahid',
      editedByName: 'Jahid',
      tableName: 'BazarTrip' as const,
      recordId: 'bt_5_pending',
      fieldName: 'all',
      oldValue: null,
      newValue: '৳780 · 3 items (pending approval)',
      action: 'CREATE' as const,
      createdAt: `${todayStr}T07:10:00Z`,
    },
  ];

  return {
    mess: {
      id: 'mess_default',
      name: '42/A Mirpur Mess',
      inviteCode: 'MESS-DEFAULT',
      washroomCount: 2,
      dueThreshold: 500,
      bazarDaysPerWeek: 3,
      mealTypes: ['breakfast', 'lunch', 'dinner'],
      mealBlackouts: [
        { meals: ['breakfast'], startHour: 6, startMinute: 0, endHour: 10, endMinute: 0 },
        { meals: ['lunch'], startHour: 10, startMinute: 30, endHour: 14, endMinute: 0 },
        { meals: ['dinner'], startHour: 16, startMinute: 30, endHour: 20, endMinute: 30 },
      ],
      autoMealEntry: true,
    },
    currentUserId: 'u_omar',
    members,
    mealEntries,
    mealStatuses,
    mealStatusRequests: [
      {
        id: 'msr_1',
        date: todayStr,
        meal: 'breakfast',
        memberId: 'u_kabbo',
        wantOff: true,
        reason: 'Morning lab exam at campus',
        status: 'PENDING',
        createdAt: `${todayStr}T07:35:00Z`,
      },
    ],
    mealPlans: [
      {
        date: todayStr,
        meals: {
          breakfast: 'Paratha, Dim Bhaji & Tea',
          lunch: 'Plain Rice, Rui Fish Curry & Masur Dal',
          dinner: 'Rice, Chicken Roast & Mixed Salad',
        },
        cancelledMeals: [],
      },
      {
        date: tomorrowStr,
        meals: {
          breakfast: 'Khichuri & Fried Egg',
          lunch: 'Rice, Tilapia Bhuna & Begun Bhorta',
          dinner: 'Rice, Chicken Curry & Dal',
        },
        cancelledMeals: [],
      },
    ],
    bazarTrips,
    deposits,
    auditLogs,
    billSetting: {
      month,
      year,
      rents: {
        u_omar: 3800,
        u_jahid: 3600,
        u_zobayer: 3600,
        u_kabbo: 3500,
        u_mahbub: 3500,
      },
      wifi: 1200,
      electricity: 2450,
      gas: 1080,
      cookSalary: 3500,
      other: 320,
    },
    billPayments: [
      { id: 'bp_1', memberId: 'u_omar', month, year, amount: 5510, confirmed: true, createdAt: `${prefix}-05` },
      { id: 'bp_2', memberId: 'u_jahid', month, year, amount: 5310, confirmed: true, createdAt: `${prefix}-05` },
      { id: 'bp_3', memberId: 'u_zobayer', month, year, amount: 3000, confirmed: true, createdAt: `${prefix}-07` },
      { id: 'bp_4', memberId: 'u_kabbo', month, year, amount: 5210, confirmed: false, createdAt: `${prefix}-08` },
    ],
    duties: [
      { id: 'du_1', type: 'BAZAR', date: todayStr, memberId: 'u_jahid', completed: true },
      { id: 'du_2', type: 'BAZAR', date: tomorrowStr, memberId: 'u_kabbo', completed: false },
      { id: 'du_3', type: 'BAZAR', date: getDateStr(3), memberId: 'u_mahbub', completed: false },
      { id: 'du_4', type: 'WASHROOM', date: todayStr, memberId: 'u_zobayer', washroomNumber: 1, completed: true },
      { id: 'du_5', type: 'WASHROOM', date: tomorrowStr, memberId: 'u_mahbub', washroomNumber: 2, completed: false },
    ],
    announcements: [
      {
        id: 'ann_1',
        authorId: 'u_omar',
        authorName: 'Omar',
        title: 'Cook Salary & Gas Utility Confirmed',
        body: 'Utility bills for this month have been finalized. Please settle rent + utility share before the 10th.',
        pinned: true,
        createdAt: `${prefix}-04T12:00:00Z`,
      },
      {
        id: 'ann_2',
        authorId: 'u_omar',
        authorName: 'Omar',
        title: 'Morning Breakfast Cutoff is 06:00',
        body: 'Toggle your meal OFF the night before if you have an early class. Post-cutoff requests need manager approval.',
        pinned: false,
        createdAt: `${prefix}-02T09:00:00Z`,
      },
    ],
    voteTopics: [
      {
        id: 'vt_1',
        title: 'Friday Special Dinner Menu',
        targetDate: getDateStr(3),
        targetMeal: 'dinner',
        options: ['Chicken Biryani', 'Beef Tehari', 'Bhuna Khichuri & Egg'],
        votes: {
          u_omar: 'Chicken Biryani',
          u_jahid: 'Beef Tehari',
          u_kabbo: 'Chicken Biryani',
        },
        active: true,
      },
    ],
  };
}
