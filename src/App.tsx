import { useState } from 'react';
import { AppShell } from './components/AppShell';
import { AuditLogView } from './components/AuditLogView';
import { BazarView } from './components/BazarView';
import { BillingView } from './components/BillingView';
import { DashboardView } from './components/DashboardView';
import { ManagerView } from './components/ManagerView';
import { OperationsView } from './components/OperationsView';
import { TransparencyView } from './components/TransparencyView';
import { useMessStore } from './hooks/useMessStore';
import type { NavSection } from './types/mess';

export default function App() {
  const store = useMessStore();
  const [section, setSection] = useState<NavSection>('dashboard');

  const pendingBazarCount = store.state.bazarTrips.filter((t) => !t.approved).length;
  const blackoutToday = store.getBlackoutMapForDate(store.todayStr);
  const managerMember = store.state.members.find((m) => m.role === 'MANAGER');

  return (
    <AppShell
      activeSection={section}
      onNavigate={setSection}
      messName={store.state.mess.name}
      inviteCode={store.state.mess.inviteCode}
      currentUser={store.currentUser}
      members={store.state.members}
      onSwitchUser={store.switchCurrentUser}
      onResetDemo={store.resetDemoData}
      theme={store.theme}
      onToggleTheme={store.toggleTheme}
      pendingCount={pendingBazarCount}
    >
      {section === 'dashboard' && (
        <DashboardView
          mess={store.state.mess}
          currentUser={store.currentUser}
          members={store.state.members}
          bill={store.currentMonthBill}
          todayStr={store.todayStr}
          tomorrowStr={store.tomorrowStr}
          mealEntries={store.state.mealEntries}
          mealStatuses={store.state.mealStatuses}
          mealStatusRequests={store.state.mealStatusRequests}
          mealPlans={store.state.mealPlans}
          auditLogs={store.state.auditLogs}
          announcements={store.state.announcements}
          blackoutToday={blackoutToday}
          onToggleMeal={store.toggleMealStatus}
          onSubmitBlackoutRequest={store.submitBlackoutRequest}
          onNavigate={setSection}
        />
      )}

      {section === 'bazar' && (
        <BazarView
          currentUser={store.currentUser}
          members={store.state.members}
          trips={store.state.bazarTrips}
          todayStr={store.todayStr}
          onSubmitTrip={store.submitBazarTrip}
          onApproveTrip={store.approveBazarTrip}
          onRejectTrip={store.rejectBazarTrip}
        />
      )}

      {section === 'billing' && (
        <BillingView
          bill={store.currentMonthBill}
          billSetting={store.state.billSetting}
        />
      )}

      {section === 'transparency' && (
        <TransparencyView
          bill={store.currentMonthBill}
          members={store.state.members}
          mealEntries={store.state.mealEntries}
          bazarTrips={store.state.bazarTrips}
          duties={store.state.duties}
        />
      )}

      {section === 'audit-log' && <AuditLogView logs={store.state.auditLogs} />}

      {section === 'operations' && (
        <OperationsView
          currentUser={store.currentUser}
          members={store.state.members}
          mealTypes={store.state.mess.mealTypes}
          todayStr={store.todayStr}
          mealPlans={store.state.mealPlans}
          duties={store.state.duties}
          announcements={store.state.announcements}
          voteTopics={store.state.voteTopics}
          onSaveMealPlan={store.saveMealPlan}
          onToggleDuty={store.toggleDutyComplete}
          onCastVote={store.castVote}
          onPostAnnouncement={store.postAnnouncement}
        />
      )}

      {section === 'manager' && (
        <ManagerView
          currentUser={store.currentUser}
          members={store.state.members}
          mess={store.state.mess}
          todayStr={store.todayStr}
          mealEntries={store.state.mealEntries}
          deposits={store.state.deposits}
          mealStatusRequests={store.state.mealStatusRequests}
          onSwitchToManager={() =>
            managerMember && store.switchCurrentUser(managerMember.id)
          }
          onSaveMealEntries={store.saveMealEntries}
          onRecordDeposit={store.recordDeposit}
          onDeleteDeposit={store.deleteDeposit}
          onReviewRequest={store.reviewBlackoutRequest}
          onHandoverManager={store.handoverManager}
          onUpdateSettings={store.updateMessSettings}
        />
      )}
    </AppShell>
  );
}
