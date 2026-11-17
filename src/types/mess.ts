export type Role = 'MANAGER' | 'MEMBER';

export type NavSection =
  | 'dashboard'
  | 'bazar'
  | 'billing'
  | 'transparency'
  | 'audit-log'
  | 'operations'
  | 'manager';

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  isActive: boolean;
  joinDate: string;
}

export interface BlackoutWindow {
  meals: string[];
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export interface MessConfig {
  id: string;
  name: string;
  inviteCode: string;
  washroomCount: number;
  dueThreshold: number;
  bazarDaysPerWeek: number;
  mealTypes: string[];
  mealBlackouts: BlackoutWindow[];
  autoMealEntry: boolean;
}

export interface MealEntry {
  id: string;
  date: string; // YYYY-MM-DD
  memberId: string;
  meals: Record<string, number>;
  total: number;
}

export interface MealStatusItem {
  date: string; // YYYY-MM-DD
  meal: string;
  memberId: string;
  isOff: boolean;
  changedBy: string | null;
}

export interface MealStatusRequest {
  id: string;
  date: string;
  meal: string;
  memberId: string;
  wantOff: boolean;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface MealPlan {
  date: string;
  meals: Record<string, string>;
  cancelledMeals: string[];
}

export interface BazarItem {
  id: string;
  serialNo: number;
  itemName: string;
  normalizedName: string | null;
  category: string | null;
  quantity: number;
  unit: string;
  price: number;
}

export interface BazarTrip {
  id: string;
  date: string;
  buyerId: string;
  totalCost: number;
  note: string;
  companionIds: string[];
  approved: boolean;
  approvedAt: string | null;
  approvedById: string | null;
  items: BazarItem[];
}

export interface Deposit {
  id: string;
  date: string;
  memberId: string;
  amount: number;
  note: string;
}

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'CANCEL' | 'RESTORE';

export interface AuditLogEntry {
  id: string;
  editedById: string;
  editedByName: string;
  tableName: 'MealEntry' | 'Deposit' | 'BazarTrip' | 'MealStatus' | 'MealStatusRequest' | 'ManagerRotation' | 'MealPlan' | 'Mess';
  recordId: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  action: AuditAction;
  createdAt: string;
}

export interface BillSetting {
  month: number;
  year: number;
  rents: Record<string, number>;
  wifi: number;
  electricity: number;
  gas: number;
  cookSalary: number;
  other: number;
}

export interface BillPayment {
  id: string;
  memberId: string;
  month: number;
  year: number;
  amount: number;
  confirmed: boolean;
  createdAt: string;
}

export interface DutySchedule {
  id: string;
  type: 'BAZAR' | 'WASHROOM';
  date: string;
  memberId: string;
  washroomNumber?: number;
  completed: boolean;
}

export interface Announcement {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
}

export interface MealVoteTopic {
  id: string;
  title: string;
  targetDate: string;
  targetMeal: string;
  options: string[];
  votes: Record<string, string>; // memberId -> option
  active: boolean;
}

export interface MessState {
  mess: MessConfig;
  currentUserId: string;
  members: Member[];
  mealEntries: MealEntry[];
  mealStatuses: MealStatusItem[];
  mealStatusRequests: MealStatusRequest[];
  mealPlans: MealPlan[];
  bazarTrips: BazarTrip[];
  deposits: Deposit[];
  auditLogs: AuditLogEntry[];
  billSetting: BillSetting;
  billPayments: BillPayment[];
  duties: DutySchedule[];
  announcements: Announcement[];
  voteTopics: MealVoteTopic[];
}
