import React, { useMemo, useState } from 'react';
import { Check, Megaphone, Vote } from 'lucide-react';
import type {
  Announcement,
  DutySchedule,
  MealPlan,
  MealVoteTopic,
  Member,
} from '../types/mess';

interface OperationsViewProps {
  currentUser: Member;
  members: Member[];
  mealTypes: string[];
  todayStr: string;
  mealPlans: MealPlan[];
  duties: DutySchedule[];
  announcements: Announcement[];
  voteTopics: MealVoteTopic[];
  onSaveMealPlan: (date: string, meals: Record<string, string>, cancelledMeals: string[]) => void;
  onToggleDuty: (dutyId: string) => void;
  onCastVote: (topicId: string, option: string) => void;
  onPostAnnouncement: (title: string, body: string, pinned: boolean) => void;
}

export const OperationsView: React.FC<OperationsViewProps> = ({
  currentUser,
  members,
  mealTypes,
  todayStr,
  mealPlans,
  duties,
  announcements,
  voteTopics,
  onSaveMealPlan,
  onToggleDuty,
  onCastVote,
  onPostAnnouncement,
}) => {
  const isManager = currentUser.role === 'MANAGER';
  const memberMap = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m.name])),
    [members]
  );

  // Meal Plan editor state
  const [planDate, setPlanDate] = useState(todayStr);
  const existingPlan = mealPlans.find((p) => p.date === planDate);
  const [draftMeals, setDraftMeals] = useState<Record<string, string>>(
    () => existingPlan?.meals ?? {}
  );
  const [draftCancelled, setDraftCancelled] = useState<string[]>(
    () => existingPlan?.cancelledMeals ?? []
  );
  const [planSavedMsg, setPlanSavedMsg] = useState('');

  // Notice composer
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');
  const [noticePinned, setNoticePinned] = useState(false);

  const handleDateChange = (newDate: string) => {
    setPlanDate(newDate);
    const found = mealPlans.find((p) => p.date === newDate);
    setDraftMeals(found?.meals ?? {});
    setDraftCancelled(found?.cancelledMeals ?? []);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveMealPlan(planDate, draftMeals, draftCancelled);
    setPlanSavedMsg(`Saved meal plan for ${planDate}.`);
    setTimeout(() => setPlanSavedMsg(''), 3000);
  };

  const handleNoticeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeBody.trim()) return;
    onPostAnnouncement(noticeTitle, noticeBody, noticePinned);
    setNoticeTitle('');
    setNoticeBody('');
    setNoticePinned(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Meal Plan, Duties &amp; Notices
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Daily menu coordination, bazar/washroom rotation, and mess voting.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Daily Meal Plan & Cancellations */}
        <section className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
              Daily Meal Plan
            </h2>
            <div>
              <label htmlFor="plan-date" className="sr-only">
                Select menu date
              </label>
              <input
                id="plan-date"
                type="date"
                value={planDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="px-3 py-1.5 text-xs font-mono-num bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {isManager ? (
            <form onSubmit={handleSavePlan} className="space-y-3">
              {mealTypes.map((mt) => {
                const isCancelled = draftCancelled.includes(mt);
                return (
                  <div key={mt} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor={`menu-${mt}`}
                        className="text-xs font-medium capitalize text-slate-700 dark:text-slate-300"
                      >
                        {mt}
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setDraftCancelled((prev) =>
                            prev.includes(mt) ? prev.filter((x) => x !== mt) : [...prev, mt]
                          )
                        }
                        className={`text-xs font-medium cursor-pointer ${
                          isCancelled
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                      >
                        {isCancelled ? 'Meal Cancelled (Click to Restore)' : 'Cancel Meal'}
                      </button>
                    </div>
                    <input
                      id={`menu-${mt}`}
                      type="text"
                      value={draftMeals[mt] ?? ''}
                      onChange={(e) =>
                        setDraftMeals((prev) => ({ ...prev, [mt]: e.target.value }))
                      }
                      placeholder={`Enter ${mt} menu...`}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                );
              })}

              <div className="flex items-center justify-between pt-2">
                <span role="status" className="text-xs text-emerald-600 dark:text-emerald-400">
                  {planSavedMsg}
                </span>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white dark:bg-emerald-500 dark:text-[#020617] rounded-lg hover:opacity-90 cursor-pointer"
                >
                  Save Menu
                </button>
              </div>
            </form>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {mealTypes.map((mt) => (
                <div key={mt} className="py-3 first:pt-0 last:pb-0 flex justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold capitalize text-slate-500 dark:text-slate-400">
                      {mt}
                    </p>
                    <p className="text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                      {existingPlan?.meals[mt] || 'Not published yet'}
                    </p>
                  </div>
                  {existingPlan?.cancelledMeals.includes(mt) && (
                    <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                      Cancelled
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Duty Roster */}
        <section className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50 mb-4">
            Bazar &amp; Washroom Duty Roster
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
            {duties.map((d) => (
              <div key={d.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {memberMap[d.memberId] || 'Member'} ·{' '}
                    <span className="text-slate-500 dark:text-slate-400">
                      {d.type === 'BAZAR'
                        ? 'Bazar Duty'
                        : `Washroom #${d.washroomNumber ?? 1}`}
                    </span>
                  </p>
                  <p className="font-mono-num text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {d.date}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleDuty(d.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    d.completed
                      ? 'bg-emerald-600/10 text-emerald-700 border-emerald-600/30 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700'
                  }`}
                >
                  {d.completed && <Check className="w-3.5 h-3.5" />}
                  {d.completed ? 'Done' : 'Mark Done'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Meal Voting */}
        <section className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Vote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Active Meal Polls
          </h2>

          {voteTopics.map((topic) => {
            const totalVotes = Object.keys(topic.votes).length;
            const myChoice = topic.votes[currentUser.id];
            return (
              <div key={topic.id} className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {topic.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono-num">
                    {topic.targetDate} · {topic.targetMeal} · {totalVotes}/{members.length} voted
                  </p>
                </div>

                <div className="space-y-2">
                  {topic.options.map((opt) => {
                    const count = Object.values(topic.votes).filter((v) => v === opt).length;
                    const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                    const selected = myChoice === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => onCastVote(topic.id, opt)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                          selected
                            ? 'border-emerald-500/50 bg-emerald-500/10'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                          <span className="text-slate-900 dark:text-slate-100">{opt}</span>
                          <span className="font-mono-num text-slate-500 dark:text-slate-400">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>

        {/* Notice Board */}
        <section className="bg-white dark:bg-[#0E1223] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            Mess Notices
          </h2>

          {isManager && (
            <form onSubmit={handleNoticeSubmit} className="space-y-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <label htmlFor="notice-title" className="sr-only">
                Notice title
              </label>
              <input
                id="notice-title"
                type="text"
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                placeholder="Notice headline..."
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
              <label htmlFor="notice-body" className="sr-only">
                Notice body
              </label>
              <textarea
                id="notice-body"
                rows={2}
                value={noticeBody}
                onChange={(e) => setNoticeBody(e.target.value)}
                placeholder="Write announcement for all members..."
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noticePinned}
                    onChange={(e) => setNoticePinned(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Pin to top
                </label>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 text-white dark:bg-emerald-500 dark:text-[#020617] rounded-lg cursor-pointer"
                >
                  Post Notice
                </button>
              </div>
            </form>
          )}

          <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
            {announcements.map((a) => (
              <article key={a.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {a.title}
                  </h3>
                  {a.pinned && (
                    <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                      Pinned
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {a.body}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                  {a.authorName} · {new Date(a.createdAt).toLocaleDateString()}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
