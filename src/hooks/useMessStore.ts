import { useCallback, useEffect, useMemo, useState } from 'react';
import { createInitialMessState, getMonthYearNow } from '../data/seedMessData';
import type {
  AuditLogEntry,
  BazarItem,
  BlackoutWindow,
  MessState,
} from '../types/mess';
import { normalizeItemName } from '../utils/bazarCatalog';
import {
  buildMealEntryAuditDiffs,
  calculateMonthlyBill,
  isMealBlackoutLocked,
} from '../utils/messLogic';

const STORAGE_KEY = 'messmate_v2_state_v1';
const THEME_KEY = 'messmate_v2_theme';

function loadInitialState(): MessState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MessState;
      if (parsed && parsed.mess && Array.isArray(parsed.members)) {
        return parsed;
      }
    }
  } catch {
    // Fallback to seed data
  }
  return createInitialMessState();
}

export function useMessStore() {
  const [state, setState] = useState<MessState>(loadInitialState);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return 'dark';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage quota errors
    }
  }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const currentUser = useMemo(
    () => state.members.find((m) => m.id === state.currentUserId) ?? state.members[0],
    [state.members, state.currentUserId]
  );

  const isManager = currentUser?.role === 'MANAGER';

  const { month, year, todayStr, tomorrowStr } = getMonthYearNow();

  const currentMonthBill = useMemo(
    () =>
      calculateMonthlyBill({
        month,
        year,
        members: state.members,
        mealEntries: state.mealEntries,
        bazarTrips: state.bazarTrips,
        deposits: state.deposits,
        billSetting: state.billSetting,
        billPayments: state.billPayments,
      }),
    [
      month,
      year,
      state.members,
      state.mealEntries,
      state.bazarTrips,
      state.deposits,
      state.billSetting,
      state.billPayments,
    ]
  );

  const switchCurrentUser = useCallback((userId: string) => {
    setState((prev) => ({ ...prev, currentUserId: userId }));
  }, []);

  const resetDemoData = useCallback(() => {
    const fresh = createInitialMessState();
    setState(fresh);
  }, []);

  const getBlackoutMapForDate = useCallback(
    (dateStr: string): Record<string, boolean> => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const isToday = dateStr === todayStr;

      const map: Record<string, boolean> = {};
      for (const meal of state.mess.mealTypes) {
        map[meal] = isToday
          ? isMealBlackoutLocked(meal, state.mess.mealBlackouts, currentHour, currentMinute)
          : false;
      }
      return map;
    },
    [state.mess.mealBlackouts, state.mess.mealTypes, todayStr]
  );

  const toggleMealStatus = useCallback(
    (dateStr: string, meal: string, targetMemberId?: string) => {
      setState((prev) => {
        const actor = prev.members.find((m) => m.id === prev.currentUserId)!;
        const memberId = targetMemberId && actor.role === 'MANAGER' ? targetMemberId : actor.id;
        const isSelf = memberId === actor.id;
        const now = new Date();
        const isToday = dateStr === todayStr;
        const locked =
          isToday &&
          isMealBlackoutLocked(meal, prev.mess.mealBlackouts, now.getHours(), now.getMinutes());

        if (locked && actor.role !== 'MANAGER') {
          return prev;
        }

        const existingIdx = prev.mealStatuses.findIndex(
          (s) => s.date === dateStr && s.meal === meal && s.memberId === memberId
        );
        const currentIsOff = existingIdx >= 0 ? prev.mealStatuses[existingIdx].isOff : false;
        const nextIsOff = !currentIsOff;

        const nextStatuses = [...prev.mealStatuses];
        const updatedItem = {
          date: dateStr,
          meal,
          memberId,
          isOff: nextIsOff,
          changedBy: actor.role === 'MANAGER' && !isSelf ? actor.id : null,
        };
        if (existingIdx >= 0) nextStatuses[existingIdx] = updatedItem;
        else nextStatuses.push(updatedItem);

        // Sync MealEntry for today
        const nextEntries = [...prev.mealEntries];
        const entryIdx = nextEntries.findIndex(
          (e) => e.date === dateStr && e.memberId === memberId
        );
        if (entryIdx >= 0) {
          const entry = nextEntries[entryIdx];
          const updatedMeals = { ...entry.meals, [meal]: nextIsOff ? 0 : 1 };
          const total = Object.values(updatedMeals).reduce((s, v) => s + v, 0);
          nextEntries[entryIdx] = { ...entry, meals: updatedMeals, total };
        }

        const nextLogs = [...prev.auditLogs];
        if (actor.role === 'MANAGER' && !isSelf) {
          const targetName = prev.members.find((m) => m.id === memberId)?.name || 'Member';
          nextLogs.unshift({
            id: `aud_${Date.now()}`,
            editedById: actor.id,
            editedByName: actor.name,
            tableName: 'MealStatus',
            recordId: `${dateStr}_${meal}_${memberId}`,
            fieldName: `${targetName} · ${meal} (${dateStr})`,
            oldValue: currentIsOff ? 'OFF' : 'ON',
            newValue: nextIsOff ? 'OFF' : 'ON',
            action: 'UPDATE',
            createdAt: new Date().toISOString(),
          });
        }

        return {
          ...prev,
          mealStatuses: nextStatuses,
          mealEntries: nextEntries,
          auditLogs: nextLogs,
        };
      });
    },
    [todayStr]
  );

  const submitBlackoutRequest = useCallback(
    (dateStr: string, meal: string, wantOff: boolean, reason: string) => {
      setState((prev) => {
        const alreadyPending = prev.mealStatusRequests.some(
          (r) =>
            r.date === dateStr &&
            r.meal === meal &&
            r.memberId === prev.currentUserId &&
            r.status === 'PENDING'
        );
        if (alreadyPending) return prev;

        const newReq = {
          id: `msr_${Date.now()}`,
          date: dateStr,
          meal,
          memberId: prev.currentUserId,
          wantOff,
          reason: reason.trim() || 'Schedule change after cutoff',
          status: 'PENDING' as const,
          createdAt: new Date().toISOString(),
        };

        return {
          ...prev,
          mealStatusRequests: [newReq, ...prev.mealStatusRequests],
        };
      });
    },
    []
  );

  const reviewBlackoutRequest = useCallback((requestId: string, decision: 'APPROVED' | 'REJECTED') => {
    setState((prev) => {
      const actor = prev.members.find((m) => m.id === prev.currentUserId)!;
      if (actor.role !== 'MANAGER') return prev;
      const req = prev.mealStatusRequests.find((r) => r.id === requestId);
      if (!req || req.status !== 'PENDING') return prev;

      const nextRequests = prev.mealStatusRequests.map((r) =>
        r.id === requestId ? { ...r, status: decision } : r
      );

      const nextStatuses = [...prev.mealStatuses];
      const nextEntries = [...prev.mealEntries];

      if (decision === 'APPROVED') {
        const sIdx = nextStatuses.findIndex(
          (s) => s.date === req.date && s.meal === req.meal && s.memberId === req.memberId
        );
        const updatedStatus = {
          date: req.date,
          meal: req.meal,
          memberId: req.memberId,
          isOff: req.wantOff,
          changedBy: actor.id,
        };
        if (sIdx >= 0) nextStatuses[sIdx] = updatedStatus;
        else nextStatuses.push(updatedStatus);

        const eIdx = nextEntries.findIndex(
          (e) => e.date === req.date && e.memberId === req.memberId
        );
        if (eIdx >= 0) {
          const entry = nextEntries[eIdx];
          const updatedMeals = { ...entry.meals, [req.meal]: req.wantOff ? 0 : 1 };
          const total = Object.values(updatedMeals).reduce((s, v) => s + v, 0);
          nextEntries[eIdx] = { ...entry, meals: updatedMeals, total };
        }
      }

      const memberName = prev.members.find((m) => m.id === req.memberId)?.name || 'Member';
      const auditEntry: AuditLogEntry = {
        id: `aud_${Date.now()}`,
        editedById: actor.id,
        editedByName: actor.name,
        tableName: 'MealStatusRequest',
        recordId: requestId,
        fieldName: `${memberName} · ${req.meal} (${req.date})`,
        oldValue: 'PENDING',
        newValue: decision,
        action: 'UPDATE',
        createdAt: new Date().toISOString(),
      };

      return {
        ...prev,
        mealStatusRequests: nextRequests,
        mealStatuses: nextStatuses,
        mealEntries: nextEntries,
        auditLogs: [auditEntry, ...prev.auditLogs],
      };
    });
  }, []);

  const submitBazarTrip = useCallback(
    (payload: {
      date: string;
      note: string;
      companionIds: string[];
      items: { itemName: string; quantity: number; unit: string; price: number }[];
    }) => {
      setState((prev) => {
        const actor = prev.members.find((m) => m.id === prev.currentUserId)!;
        const formattedItems: BazarItem[] = payload.items.map((it, idx) => {
          const norm = normalizeItemName(it.itemName);
          return {
            id: `bi_${Date.now()}_${idx}`,
            serialNo: idx + 1,
            itemName: it.itemName.trim(),
            normalizedName: norm?.normalizedName ?? null,
            category: norm?.category ?? null,
            quantity: it.quantity,
            unit: it.unit,
            price: it.price,
          };
        });
        const totalCost = formattedItems.reduce((s, i) => s + i.price, 0);
        const tripId = `bt_${Date.now()}`;
        const newTrip = {
          id: tripId,
          date: payload.date,
          buyerId: actor.id,
          totalCost,
          note: payload.note.trim(),
          companionIds: payload.companionIds,
          approved: false,
          approvedAt: null,
          approvedById: null,
          items: formattedItems,
        };

        const auditEntry: AuditLogEntry = {
          id: `aud_${Date.now()}`,
          editedById: actor.id,
          editedByName: actor.name,
          tableName: 'BazarTrip',
          recordId: tripId,
          fieldName: 'all',
          oldValue: null,
          newValue: `৳${totalCost.toLocaleString('en-US')} · ${formattedItems.length} items (pending approval)`,
          action: 'CREATE',
          createdAt: new Date().toISOString(),
        };

        return {
          ...prev,
          bazarTrips: [newTrip, ...prev.bazarTrips],
          auditLogs: [auditEntry, ...prev.auditLogs],
        };
      });
    },
    []
  );

  const approveBazarTrip = useCallback((tripId: string) => {
    setState((prev) => {
      const actor = prev.members.find((m) => m.id === prev.currentUserId)!;
      if (actor.role !== 'MANAGER') return prev;
      const trip = prev.bazarTrips.find((t) => t.id === tripId);
      if (!trip || trip.approved) return prev;
      const buyerName = prev.members.find((m) => m.id === trip.buyerId)?.name || 'Member';

      const auditEntry: AuditLogEntry = {
        id: `aud_${Date.now()}`,
        editedById: actor.id,
        editedByName: actor.name,
        tableName: 'BazarTrip',
        recordId: tripId,
        fieldName: 'approved',
        oldValue: 'false',
        newValue: `true (৳${trip.totalCost.toLocaleString('en-US')} · ${buyerName})`,
        action: 'UPDATE',
        createdAt: new Date().toISOString(),
      };

      return {
        ...prev,
        bazarTrips: prev.bazarTrips.map((t) =>
          t.id === tripId
            ? {
                ...t,
                approved: true,
                approvedAt: new Date().toISOString(),
                approvedById: actor.id,
              }
            : t
        ),
        auditLogs: [auditEntry, ...prev.auditLogs],
      };
    });
  }, []);

  const rejectBazarTrip = useCallback((tripId: string) => {
    setState((prev) => {
      const actor = prev.members.find((m) => m.id === prev.currentUserId)!;
      const trip = prev.bazarTrips.find((t) => t.id === tripId);
      if (!trip) return prev;
      if (actor.role !== 'MANAGER' && (trip.buyerId !== actor.id || trip.approved)) return prev;
      const buyerName = prev.members.find((m) => m.id === trip.buyerId)?.name || 'Member';

      const auditEntry: AuditLogEntry = {
        id: `aud_${Date.now()}`,
        editedById: actor.id,
        editedByName: actor.name,
        tableName: 'BazarTrip',
        recordId: tripId,
        fieldName: 'all',
        oldValue: `৳${trip.totalCost.toLocaleString('en-US')} by ${buyerName}`,
        newValue: null,
        action: 'DELETE',
        createdAt: new Date().toISOString(),
      };

      return {
        ...prev,
        bazarTrips: prev.bazarTrips.filter((t) => t.id !== tripId),
        auditLogs: [auditEntry, ...prev.auditLogs],
      };
    });
  }, []);

  const saveMealEntries = useCallback(
    (date: string, draftByMember: Record<string, Record<string, number>>) => {
      setState((prev) => {
        const actor = prev.members.find((m) => m.id === prev.currentUserId)!;
        if (actor.role !== 'MANAGER') return prev;

        const nowIso = new Date().toISOString();
        const nextEntries = [...prev.mealEntries];
        const newLogs: AuditLogEntry[] = [];

        for (const member of prev.members) {
          const draftMeals = draftByMember[member.id];
          if (!draftMeals) continue;

          const existingIdx = nextEntries.findIndex(
            (e) => e.date === date && e.memberId === member.id
          );
          const total = Object.values(draftMeals).reduce((s, v) => s + Number(v || 0), 0);

          if (existingIdx >= 0) {
            const existing = nextEntries[existingIdx];
            const diffs = buildMealEntryAuditDiffs({
              editedById: actor.id,
              editedByName: actor.name,
              memberName: member.name,
              recordId: existing.id,
              date,
              mealTypes: prev.mess.mealTypes,
              oldMeals: existing.meals,
              newMeals: draftMeals,
              timestamp: nowIso,
            });
            newLogs.push(...diffs);
            nextEntries[existingIdx] = { ...existing, meals: draftMeals, total };
          } else {
            const id = `me_${date}_${member.id}`;
            const diffs = buildMealEntryAuditDiffs({
              editedById: actor.id,
              editedByName: actor.name,
              memberName: member.name,
              recordId: id,
              date,
              mealTypes: prev.mess.mealTypes,
              oldMeals: null,
              newMeals: draftMeals,
              timestamp: nowIso,
            });
            newLogs.push(...diffs);
            nextEntries.push({ id, date, memberId: member.id, meals: draftMeals, total });
          }
        }

        return {
          ...prev,
          mealEntries: nextEntries,
          auditLogs: [...newLogs, ...prev.auditLogs],
        };
      });
    },
    []
  );

  const recordDeposit = useCallback(
    (payload: { date: string; memberId: string; amount: number; note: string }) => {
      setState((prev) => {
        const actor = prev.members.find((m) => m.id === prev.currentUserId)!;
        if (actor.role !== 'MANAGER') return prev;
        const memberName = prev.members.find((m) => m.id === payload.memberId)?.name || 'Member';
        const depId = `dep_${Date.now()}`;
        const newDeposit = {
          id: depId,
          date: payload.date,
          memberId: payload.memberId,
          amount: payload.amount,
          note: payload.note.trim(),
        };
        const auditEntry: AuditLogEntry = {
          id: `aud_${Date.now()}`,
          editedById: actor.id,
          editedByName: actor.name,
          tableName: 'Deposit',
          recordId: depId,
          fieldName: 'amount',
          oldValue: null,
          newValue: `৳${payload.amount.toLocaleString('en-US')} from ${memberName}${payload.note ? ` (${payload.note.trim()})` : ''}`,
          action: 'CREATE',
          createdAt: new Date().toISOString(),
        };
        return {
          ...prev,
          deposits: [newDeposit, ...prev.deposits],
          auditLogs: [auditEntry, ...prev.auditLogs],
        };
      });
    },
    []
  );

  const deleteDeposit = useCallback((depositId: string) => {
    setState((prev) => {
      const actor = prev.members.find((m) => m.id === prev.currentUserId)!;
      if (actor.role !== 'MANAGER') return prev;
      const existing = prev.deposits.find((d) => d.id === depositId);
      if (!existing) return prev;
      const memberName = prev.members.find((m) => m.id === existing.memberId)?.name || 'Member';
      const auditEntry: AuditLogEntry = {
        id: `aud_${Date.now()}`,
        editedById: actor.id,
        editedByName: actor.name,
        tableName: 'Deposit',
        recordId: depositId,
        fieldName: 'all',
        oldValue: `৳${existing.amount.toLocaleString('en-US')} from ${memberName}`,
        newValue: null,
        action: 'DELETE',
        createdAt: new Date().toISOString(),
      };
      return {
        ...prev,
        deposits: prev.deposits.filter((d) => d.id !== depositId),
        auditLogs: [auditEntry, ...prev.auditLogs],
      };
    });
  }, []);

  const saveMealPlan = useCallback(
    (date: string, meals: Record<string, string>, cancelledMeals: string[]) => {
      setState((prev) => {
        const actor = prev.members.find((m) => m.id === prev.currentUserId)!;
        if (actor.role !== 'MANAGER') return prev;

        const existingIdx = prev.mealPlans.findIndex((p) => p.date === date);
        const oldCancelled = existingIdx >= 0 ? prev.mealPlans[existingIdx].cancelledMeals : [];
        const newlyCancelled = cancelledMeals.filter((m) => !oldCancelled.includes(m));
        const newlyRestored = oldCancelled.filter((m) => !cancelledMeals.includes(m));

        const nextPlans = [...prev.mealPlans];
        const plan = { date, meals, cancelledMeals };
        if (existingIdx >= 0) nextPlans[existingIdx] = plan;
        else nextPlans.push(plan);

        // Zero out cancelled meals in MealEntries for that date
        const nextEntries = prev.mealEntries.map((entry) => {
          if (entry.date !== date) return entry;
          const updatedMeals = { ...entry.meals };
          for (const cm of newlyCancelled) updatedMeals[cm] = 0;
          for (const rm of newlyRestored) {
            if ((updatedMeals[rm] ?? 0) === 0) updatedMeals[rm] = 1;
          }
          const total = Object.values(updatedMeals).reduce((s, v) => s + v, 0);
          return { ...entry, meals: updatedMeals, total };
        });

        const logs: AuditLogEntry[] = [];
        if (newlyCancelled.length > 0) {
          logs.push({
            id: `aud_${Date.now()}_cancel`,
            editedById: actor.id,
            editedByName: actor.name,
            tableName: 'MealPlan',
            recordId: date,
            fieldName: `cancel (${date})`,
            oldValue: oldCancelled.join(', ') || 'none',
            newValue: newlyCancelled.join(', '),
            action: 'CANCEL',
            createdAt: new Date().toISOString(),
          });
        }
        if (newlyRestored.length > 0) {
          logs.push({
            id: `aud_${Date.now()}_restore`,
            editedById: actor.id,
            editedByName: actor.name,
            tableName: 'MealPlan',
            recordId: date,
            fieldName: `restore (${date})`,
            oldValue: newlyRestored.join(', '),
            newValue: 'restored',
            action: 'RESTORE',
            createdAt: new Date().toISOString(),
          });
        }
        logs.push({
          id: `aud_${Date.now()}_plan`,
          editedById: actor.id,
          editedByName: actor.name,
          tableName: 'MealPlan',
          recordId: date,
          fieldName: `menu (${date})`,
          oldValue: existingIdx >= 0 ? 'Previous menu' : null,
          newValue: Object.entries(meals)
            .map(([k, v]) => `${k}: ${v || '-'}`)
            .join(' · '),
          action: existingIdx >= 0 ? 'UPDATE' : 'CREATE',
          createdAt: new Date().toISOString(),
        });

        return {
          ...prev,
          mealPlans: nextPlans,
          mealEntries: nextEntries,
          auditLogs: [...logs, ...prev.auditLogs],
        };
      });
    },
    []
  );

  const toggleDutyComplete = useCallback((dutyId: string) => {
    setState((prev) => ({
      ...prev,
      duties: prev.duties.map((d) =>
        d.id === dutyId ? { ...d, completed: !d.completed } : d
      ),
    }));
  }, []);

  const castVote = useCallback((topicId: string, option: string) => {
    setState((prev) => ({
      ...prev,
      voteTopics: prev.voteTopics.map((topic) =>
        topic.id === topicId
          ? { ...topic, votes: { ...topic.votes, [prev.currentUserId]: option } }
          : topic
      ),
    }));
  }, []);

  const postAnnouncement = useCallback((title: string, body: string, pinned: boolean) => {
    setState((prev) => {
      const actor = prev.members.find((m) => m.id === prev.currentUserId)!;
      if (actor.role !== 'MANAGER') return prev;
      return {
        ...prev,
        announcements: [
          {
            id: `ann_${Date.now()}`,
            authorId: actor.id,
            authorName: actor.name,
            title: title.trim(),
            body: body.trim(),
            pinned,
            createdAt: new Date().toISOString(),
          },
          ...prev.announcements,
        ],
      };
    });
  }, []);

  const handoverManager = useCallback((nextManagerId: string) => {
    setState((prev) => {
      const actor = prev.members.find((m) => m.id === prev.currentUserId)!;
      if (actor.role !== 'MANAGER' || nextManagerId === actor.id) return prev;
      const target = prev.members.find((m) => m.id === nextManagerId);
      if (!target) return prev;

      const auditEntry: AuditLogEntry = {
        id: `aud_${Date.now()}`,
        editedById: actor.id,
        editedByName: actor.name,
        tableName: 'ManagerRotation',
        recordId: `rot_${Date.now()}`,
        fieldName: 'manager',
        oldValue: actor.name,
        newValue: target.name,
        action: 'UPDATE',
        createdAt: new Date().toISOString(),
      };

      return {
        ...prev,
        members: prev.members.map((m) => ({
          ...m,
          role: m.id === nextManagerId ? 'MANAGER' : 'MEMBER',
        })),
        auditLogs: [auditEntry, ...prev.auditLogs],
      };
    });
  }, []);

  const updateMessSettings = useCallback(
    (patch: { dueThreshold?: number; mealBlackouts?: BlackoutWindow[] }) => {
      setState((prev) => {
        const actor = prev.members.find((m) => m.id === prev.currentUserId)!;
        if (actor.role !== 'MANAGER') return prev;
        const auditEntry: AuditLogEntry = {
          id: `aud_${Date.now()}`,
          editedById: actor.id,
          editedByName: actor.name,
          tableName: 'Mess',
          recordId: prev.mess.id,
          fieldName: 'settings',
          oldValue: `dueThreshold: ৳${prev.mess.dueThreshold}`,
          newValue: `dueThreshold: ৳${patch.dueThreshold ?? prev.mess.dueThreshold}`,
          action: 'UPDATE',
          createdAt: new Date().toISOString(),
        };
        return {
          ...prev,
          mess: {
            ...prev.mess,
            ...patch,
          },
          auditLogs: [auditEntry, ...prev.auditLogs],
        };
      });
    },
    []
  );

  return {
    state,
    theme,
    toggleTheme,
    currentUser,
    isManager,
    month,
    year,
    todayStr,
    tomorrowStr,
    currentMonthBill,
    switchCurrentUser,
    resetDemoData,
    getBlackoutMapForDate,
    toggleMealStatus,
    submitBlackoutRequest,
    reviewBlackoutRequest,
    submitBazarTrip,
    approveBazarTrip,
    rejectBazarTrip,
    saveMealEntries,
    recordDeposit,
    deleteDeposit,
    saveMealPlan,
    toggleDutyComplete,
    castVote,
    postAnnouncement,
    handoverManager,
    updateMessSettings,
  };
}
