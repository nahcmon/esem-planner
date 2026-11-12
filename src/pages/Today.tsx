import {
  ArrowRight,
  BookOpen,
  CalendarPlus,
  Check,
  ChevronRight,
  Clock,
  Coffee,
  Flame,
  GraduationCap,
  ListTodo,
  MapPin,
  Plus,
  Sparkles,
  Target,
  Video,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePlanner } from '../store'
import { useUI } from '../ui-store'
import { useT } from '../lib/useT'
import { useNow } from '../lib/useNow'
import { cn } from '../lib/cn'
import {
  formatDate,
  formatDuration,
  formatHours,
  formatLongDate,
  formatWeekRange,
  semesterWeek,
  startOfWeekISO,
  timeToMinutes,
  todayISO,
} from '../lib/date'
import {
  allTopicRows,
  currentStreak,
  occurrencesForDate,
  sessionDone,
  sortTopics,
  tasksDueSoon,
  tasksForDate,
  weekStudyStats,
  weekdayNumber,
} from '../lib/planner'
import { componentFullTitle, componentTitle, taskTitle } from '../lib/display'
import { ACCENTS, PRIORITY_COLORS } from '../lib/accents'
import { SESSION_KIND_KEY, TASK_KIND_KEY, TOPIC_STATUS_KEY } from '../lib/labels'
import { COMPONENTS } from '../data/curriculum'
import { TaskRow } from '../components/TaskRow'
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  ProgressBar,
  Ring,
  SectionHeading,
} from '../components/ui'

export function TodayPage() {
  const { t, lang } = useT()
  const state = usePlanner()
  const openDialog = useUI((open) => open.openDialog)
  const now = useNow()
  const today = todayISO()
  const monday = startOfWeekISO()
  const sessions = occurrencesForDate(state, today)
  const todayTasks = tasksForDate(state, today)
  const openTodayTasks = todayTasks.filter((task) => !task.done)
  const upcoming = tasksDueSoon(state, 6)
  const weekStats = weekStudyStats(state, monday)
  const streak = currentStreak(state)
  const week = semesterWeek()
  const goal = state.settings.weeklyGoalMinutes
  const goalProgress = goal ? weekStats.doneMinutes / goal : 0
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  const nextSession =
    sessions.find(
      (occurrence) =>
        occurrence.status !== 'cancelled' &&
        !sessionDone(state, occurrence) &&
        timeToMinutes(occurrence.end) >= nowMinutes,
    ) ?? undefined

  const nextTask =
    openTodayTasks.find(
      (task) => !task.start || timeToMinutes(task.start) >= nowMinutes,
    ) ?? openTodayTasks[0]

  const focusTopics = sortTopics(
    allTopicRows(state).filter(
      (topic) =>
        topic.status !== 'mastered' && topic.semester === state.settings.currentSemester,
    ),
  ).slice(0, 4)

  const greeting =
    now.getHours() < 11
      ? t('today.goodMorning')
      : now.getHours() < 18
        ? t('today.goodAfternoon')
        : t('today.goodEvening')

  const completedToday = todayTasks.filter((task) => task.done).length
  const doneSessions = sessions.filter((occurrence) => sessionDone(state, occurrence)).length

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow={formatLongDate(today, lang)}
        title={greeting}
        description={t('today.greeting')}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() =>
                openDialog({
                  kind: 'session',
                  defaults: { day: weekdayNumber(today), start: '08:15', end: '09:45' },
                })
              }
            >
              <CalendarPlus size={15} />
              <span className="hidden sm:inline">{t('week.addSession')}</span>
              <span className="sm:hidden">{t('common.new')}</span>
            </Button>
            <Button variant="primary" onClick={() => openDialog({ kind: 'task' })}>
              <Plus size={15} />
              {t('common.addTask')}
            </Button>
          </>
        }
        meta={
          <>
            <Badge tone="accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {t('today.semesterWeek', { week, total: 17 })}
            </Badge>
            <Badge>
              <Clock size={10} />
              {t('today.lecturePeriod')}
            </Badge>
            <Badge tone="muted">
              <span className="h-1 w-1 rounded-full bg-faint" />
              {t('common.savedLocally')}
            </Badge>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.58fr)_minmax(310px,0.82fr)]">
        <div className="min-w-0 space-y-5">
          <NextUpCard
            nextSession={nextSession}
            nextTask={nextTask}
            nowMinutes={nowMinutes}
            onAddSession={() =>
              openDialog({
                kind: 'session',
                defaults: { day: weekdayNumber(today), start: '08:15', end: '09:45' },
              })
            }
          />

          <section className="panel overflow-hidden">
            <div className="flex items-start justify-between gap-3 px-4 pb-2 pt-4 sm:px-5">
              <div>
                <div className="flex items-center gap-2">
                  <ListTodo size={14} className="text-accent" />
                  <h2 className="text-[13.5px] font-semibold tracking-[-0.015em] text-ink">
                    {t('today.timeline')}
                  </h2>
                </div>
                <p className="mt-1 text-[11px] text-faint">
                  {doneSessions} / {sessions.length} {t('common.done').toLowerCase()} ·{' '}
                  {formatDate(today, lang, 'EEEE, d. MMMM')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  openDialog({
                    kind: 'session',
                    defaults: { day: weekdayNumber(today), start: '08:15', end: '09:45' },
                  })
                }
              >
                <Plus size={13} />
                {t('common.add')}
              </Button>
            </div>
            <div className="px-3 pb-4 pt-2 sm:px-4">
              {sessions.length ? (
                <div className="space-y-1.5">
                  {sessions.map((occurrence) => {
                    const component = COMPONENTS.find(
                      (item) => item.id === occurrence.session.componentId,
                    )
                    const accent = ACCENTS[component?.accent ?? 'lime'].hex
                    const done = sessionDone(state, occurrence)
                    const cancelled = occurrence.status === 'cancelled'
                    return (
                      <div key={occurrence.key} className="timeline-row">
                        <div className="timeline-time">
                          <div className={cn(cancelled && 'line-through opacity-50')}>
                            {occurrence.start}
                          </div>
                          <div className="mt-0.5 text-[9px] text-faint/70">{occurrence.end}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            openDialog({
                              kind: 'sessionDetails',
                              sessionId: occurrence.session.id,
                              date: occurrence.date,
                            })
                          }
                          className="timeline-card group text-left"
                          data-done={done}
                          style={{ borderLeftColor: accent }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div
                                className={cn(
                                  'truncate text-[12.5px] font-medium leading-tight text-ink',
                                  cancelled && 'line-through decoration-rose/50',
                                  done && 'text-muted',
                                )}
                              >
                                {componentFullTitle(occurrence.session.componentId, lang)}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-faint">
                                <span>{t(SESSION_KIND_KEY[occurrence.session.kind])}</span>
                                {occurrence.online ? (
                                  <span className="inline-flex items-center gap-1 text-blue">
                                    <Video size={9} />
                                    {t('common.online')}
                                  </span>
                                ) : occurrence.room ? (
                                  <span className="inline-flex min-w-0 items-center gap-1">
                                    <MapPin size={9} />
                                    <span className="max-w-[150px] truncate">{occurrence.room}</span>
                                  </span>
                                ) : null}
                                {occurrence.status === 'moved' ? (
                                  <span className="text-amber">{t('week.moved')}</span>
                                ) : null}
                                {cancelled ? (
                                  <span className="text-rose">{t('week.cancelled')}</span>
                                ) : null}
                              </div>
                              {occurrence.online && occurrence.note ? (
                                <p className="mt-1.5 line-clamp-1 text-[10.5px] leading-relaxed text-blue/80">
                                  {lang === 'en'
                                    ? occurrence.session.noteEn || occurrence.note
                                    : occurrence.note}
                                </p>
                              ) : null}
                            </div>
                            <span
                              role="checkbox"
                              aria-checked={done}
                              aria-label={occurrence.session.componentId}
                              tabIndex={0}
                              onClick={(event) => {
                                event.stopPropagation()
                                usePlanner.getState().toggleSessionDone(
                                  occurrence.session.id,
                                  occurrence.date,
                                )
                              }}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  usePlanner.getState().toggleSessionDone(
                                    occurrence.session.id,
                                    occurrence.date,
                                  )
                                }
                              }}
                              className="check-button shrink-0"
                              data-done={done}
                            >
                              <Check size={12} strokeWidth={3.4} />
                            </span>
                          </div>
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={<Coffee size={22} />}
                  title={t('today.noSessions')}
                  hint={t('empty.sessions')}
                />
              )}
            </div>
          </section>

          <section className="panel p-4 sm:p-5">
            <SectionHeading
              title={t('today.dueToday')}
              hint={`${openTodayTasks.length} ${t('common.open').toLowerCase()}${
                completedToday ? ` · ${completedToday} ${t('common.done').toLowerCase()}` : ''
              }`}
              action={
                <Button variant="ghost" size="sm" onClick={() => openDialog({ kind: 'task' })}>
                  <Plus size={13} />
                  {t('common.add')}
                </Button>
              }
            />
            {todayTasks.length ? (
              <ul className="divide-y divide-line/60">
                {todayTasks.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<Check size={20} />}
                title={t('today.noTasks')}
                hint={t('empty.tasksHint')}
              />
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-5">
          <section className="panel p-4">
            <SectionHeading
              title={t('today.weekProgress')}
              hint={formatWeekRange(monday, lang)}
              action={
                <Link
                  to="/week"
                  className="inline-flex items-center gap-1 text-[11px] text-faint transition-colors hover:text-accent"
                >
                  {t('common.week')}
                  <ChevronRight size={12} />
                </Link>
              }
            />
            <div className="mt-3 flex items-center gap-4">
              <Ring value={goalProgress} size={66} stroke={5}>
                <span className="mono text-[11px] font-semibold text-ink">
                  {Math.min(999, Math.round(goalProgress * 100))}%
                </span>
              </Ring>
              <div className="min-w-0 flex-1">
                <div className="mono text-[19px] font-semibold leading-none tracking-[-0.04em] text-ink">
                  {formatHours(weekStats.doneMinutes, lang)}
                </div>
                <p className="mt-1 text-[10.5px] text-faint">
                  {t('progress.goalWeek', {
                    hours: Math.round((goal / 60) * 10) / 10,
                  })}
                </p>
                <ProgressBar
                  value={weekStats.plannedMinutes ? goalProgress : 0}
                  className="mt-2"
                  height={4}
                />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3">
              <div>
                <div className="mono text-[13px] font-semibold text-ink">
                  {weekStats.sessionsDone}/{weekStats.sessions}
                </div>
                <div className="mt-0.5 text-[9.5px] leading-tight text-faint">
                  {t('common.sessions')}
                </div>
              </div>
              <div>
                <div className="mono text-[13px] font-semibold text-ink">
                  {weekStats.tasksDone}/{weekStats.tasks}
                </div>
                <div className="mt-0.5 text-[9.5px] leading-tight text-faint">
                  {t('common.tasks')}
                </div>
              </div>
              <div>
                <div className="mono flex items-center gap-1 text-[13px] font-semibold text-ink">
                  {streak}
                  <Flame size={11} className={streak ? 'text-amber' : 'text-faint'} />
                </div>
                <div className="mt-0.5 text-[9.5px] leading-tight text-faint">
                  {t('progress.streak')}
                </div>
              </div>
            </div>
          </section>

          <section className="panel p-4">
            <SectionHeading
              title={t('today.upcoming')}
              hint={t('common.nextWeek')}
              action={
                <Link
                  to="/week"
                  className="inline-flex items-center gap-1 text-[11px] text-faint transition-colors hover:text-accent"
                >
                  {t('misc.seeAll')}
                  <ArrowRight size={12} />
                </Link>
              }
            />
            {upcoming.length ? (
              <ul className="divide-y divide-line/60">
                {upcoming.map((task) => (
                  <TaskRow key={task.id} task={task} showDue dense />
                ))}
              </ul>
            ) : (
              <EmptyState icon={<Check size={20} />} title={t('misc.allDone')} />
            )}
          </section>

          <section className="panel p-4">
            <SectionHeading
              title={t('today.focus')}
              hint={t('progress.openTopicsHint')}
              action={
                <Link
                  to="/progress"
                  className="inline-flex items-center gap-1 text-[11px] text-faint transition-colors hover:text-accent"
                >
                  {t('misc.seeAll')}
                  <ChevronRight size={12} />
                </Link>
              }
            />
            {focusTopics.length ? (
              <div className="space-y-0.5">
                {focusTopics.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() =>
                      openDialog({
                        kind: 'topic',
                        componentId: topic.componentId,
                        topicId: topic.id,
                      })
                    }
                    className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/[0.035]"
                  >
                    <span
                      className="priority-mark mt-0.5"
                      style={{ background: PRIORITY_COLORS[topic.priority] }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-medium leading-snug text-ink">
                        {topic.title[lang]}
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] text-faint">
                        {topic.componentTitle[lang]} · {t(TOPIC_STATUS_KEY[topic.status])}
                      </span>
                    </span>
                    <ChevronRight size={12} className="mt-1 shrink-0 text-faint" />
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Target size={20} />}
                title={t('empty.topics')}
                hint={t('progress.noTopicsHint')}
              />
            )}
          </section>

          <section className="panel-flat grid grid-cols-3 gap-2 p-3">
            <button
              type="button"
              onClick={() => openDialog({ kind: 'task' })}
              className="flex flex-col items-center gap-1.5 rounded-lg px-2 py-2.5 text-[10px] font-medium text-muted transition-colors hover:bg-white/5 hover:text-ink"
            >
              <Plus size={16} className="text-accent" />
              {t('today.quickTask')}
            </button>
            <button
              type="button"
              onClick={() =>
                openDialog({
                  kind: 'task',
                  defaults: { kind: 'study', due: today },
                })
              }
              className="flex flex-col items-center gap-1.5 rounded-lg px-2 py-2.5 text-[10px] font-medium text-muted transition-colors hover:bg-white/5 hover:text-ink"
            >
              <BookOpen size={16} className="text-accent" />
              {t('today.quickStudy')}
            </button>
            <Link
              to="/exams"
              className="flex flex-col items-center gap-1.5 rounded-lg px-2 py-2.5 text-[10px] font-medium text-muted transition-colors hover:bg-white/5 hover:text-ink"
            >
              <GraduationCap size={16} className="text-accent" />
              {t('common.exams')}
            </Link>
          </section>
        </aside>
      </div>
    </div>
  )
}

function NextUpCard({
  nextSession,
  nextTask,
  nowMinutes,
  onAddSession,
}: {
  nextSession: ReturnType<typeof occurrencesForDate>[number] | undefined
  nextTask: ReturnType<typeof tasksForDate>[number] | undefined
  nowMinutes: number
  onAddSession: () => void
}) {
  const { t, lang } = useT()
  const openDialog = useUI((state) => state.openDialog)
  const toggleTask = usePlanner((store) => store.toggleTask)

  if (!nextSession && !nextTask) {
    return (
      <section className="panel relative overflow-hidden p-5 sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(420px_200px_at_88%_0%,rgba(201,247,106,0.08),transparent_70%)]"
        />
        <div className="relative flex items-center gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-accent/20 bg-accent/[0.07]">
            <Coffee size={19} className="text-accent" />
          </div>
          <div className="min-w-0">
            <div className="eyebrow mb-1">{t('today.nextUp')}</div>
            <p className="text-[14px] font-medium text-ink">{t('today.noNext')}</p>
            <p className="mt-0.5 text-[11.5px] text-faint">{t('today.allDone')}</p>
          </div>
          <Button variant="secondary" size="sm" className="ml-auto" onClick={onAddSession}>
            <CalendarPlus size={14} />
            {t('common.addEvent')}
          </Button>
        </div>
      </section>
    )
  }

  const sessionComponent = nextSession
    ? COMPONENTS.find((item) => item.id === nextSession.session.componentId)
    : undefined
  const accent = ACCENTS[sessionComponent?.accent ?? 'lime'].hex
  const minsUntil = nextSession ? timeToMinutes(nextSession.start) - nowMinutes : 0

  return (
    <section className="panel relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          background: `radial-gradient(520px 260px at 92% -20%, ${accent}20, transparent 70%)`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(240,244,238,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(240,244,238,0.12)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_left,black,transparent_60%)]"
      />
      <div className="relative p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="eyebrow flex items-center gap-1.5">
            <Sparkles size={11} className="text-accent" />
            {t('today.nextUp')}
          </div>
          {nextSession ? (
            <Badge tone="accent">
              {minsUntil > 0 ? `in ${formatDuration(minsUntil, lang)}` : t('common.today')}
            </Badge>
          ) : (
            <Badge tone="warn">{t('common.due')}</Badge>
          )}
        </div>

        {nextSession ? (
          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="mono text-[34px] font-semibold leading-none tracking-[-0.055em] text-ink sm:text-[40px]">
                {nextSession.start}
                <span className="ml-2 text-[15px] font-normal text-faint">
                  – {nextSession.end}
                </span>
              </div>
              <h2 className="mt-2 text-[17px] font-semibold leading-tight tracking-[-0.025em] text-ink sm:text-[20px]">
                {componentFullTitle(nextSession.session.componentId, lang)}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                <Badge>{t(SESSION_KIND_KEY[nextSession.session.kind])}</Badge>
                {nextSession.online ? (
                  <Badge tone="info">
                    <Video size={10} />
                    {t('common.online')}
                  </Badge>
                ) : nextSession.room ? (
                  <span className="inline-flex items-center gap-1 text-faint">
                    <MapPin size={10} />
                    {nextSession.room}
                  </span>
                ) : null}
                {nextSession.status === 'moved' ? (
                  <Badge tone="warn">{t('week.moved')}</Badge>
                ) : null}
              </div>
              {nextSession.online && nextSession.note ? (
                <p className="mt-2 max-w-[480px] text-[11px] leading-relaxed text-blue/80">
                  {lang === 'en'
                    ? nextSession.session.noteEn || nextSession.note
                    : nextSession.note}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="secondary"
                onClick={() =>
                  openDialog({
                    kind: 'sessionDetails',
                    sessionId: nextSession.session.id,
                    date: nextSession.date,
                  })
                }
              >
                {t('common.details')}
                <ArrowRight size={14} />
              </Button>
              <Button
                variant="primary"
                onClick={() =>
                  usePlanner
                    .getState()
                    .toggleSessionDone(nextSession.session.id, nextSession.date)
                }
              >
                <Check size={15} />
                {t('common.done')}
              </Button>
            </div>
          </div>
        ) : nextTask ? (
          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="eyebrow mb-2">Task · {t(TASK_KIND_KEY[nextTask.kind])}</div>
              <h2 className="text-[19px] font-semibold leading-tight tracking-[-0.025em] text-ink sm:text-[22px]">
                {taskTitle(nextTask, lang)}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                <span>{componentTitle(nextTask.componentId, lang)}</span>
                {nextTask.due ? <span className="text-faint">· {formatDate(nextTask.due, lang)}</span> : null}
                {nextTask.note ? (
                  <span className="max-w-[320px] truncate text-faint">· {nextTask.note}</span>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="secondary"
                onClick={() => openDialog({ kind: 'task', id: nextTask.id })}
              >
                {t('common.details')}
                <ArrowRight size={14} />
              </Button>
              <Button variant="primary" onClick={() => toggleTask(nextTask.id)}>
                <Check size={15} />
                {t('common.done')}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
