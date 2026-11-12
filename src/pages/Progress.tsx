import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Flame,
  GraduationCap,
  Layers,
  Plus,
  Target,
  Timer,
  TrendingUp,
} from 'lucide-react'
import type { TopicStatus } from '../types'
import { usePlanner } from '../store'
import { useUI } from '../ui-store'
import { useT } from '../lib/useT'
import { cn } from '../lib/cn'
import {
  addDaysISO,
  formatHours,
  formatWeekRange,
  isoWeek,
  startOfWeekISO,
  todayISO,
} from '../lib/date'
import {
  activityDates,
  allTopicRows,
  currentStreak,
  lastWeeks,
  moduleStats,
  overallStats,
  semesterStats,
  sortTopics,
  weekStudyStats,
} from '../lib/planner'
import { ACCENTS, PRIORITY_COLORS } from '../lib/accents'
import { TOPIC_STATUS_KEY } from '../lib/labels'
import { CURRICULUM, SEMESTER_ECTS } from '../data/curriculum'
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  ProgressBar,
  Ring,
  SectionHeading,
  Select,
  StatTile,
} from '../components/ui'

type StatusFilter = 'all' | TopicStatus

export function ProgressPage() {
  const { t, lang } = useT()
  const state = usePlanner()
  const openDialog = useUI((store) => store.openDialog)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [courseFilter, setCourseFilter] = useState('')

  const overall = overallStats(state)
  const semester = state.settings.currentSemester
  const semStats = semesterStats(state, semester)
  const monday = startOfWeekISO()
  const week = weekStudyStats(state, monday)
  const streak = currentStreak(state)
  const weeks = lastWeeks(state, 8)
  const maxWeek = Math.max(1, ...weeks.map((entry) => Math.max(entry.minutes, entry.planned)))
  const goal = state.settings.weeklyGoalMinutes
  const goalProgress = goal ? week.doneMinutes / goal : 0
  const activeDays = activityDates(state)
  const today = todayISO()

  const semesterModules = CURRICULUM.filter((module) => module.semester === semester)
  const semesterComponents = semesterModules.flatMap((module) => module.components)

  const allRows = useMemo(
    () => allTopicRows(state),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.topicStates, state.customTopics],
  )
  const allTopics = allRows.filter((topic) => topic.semester === semester)
  const filteredTopics = sortTopics(
    allTopics.filter(
      (topic) =>
        (statusFilter === 'all' || topic.status === statusFilter) &&
        (!courseFilter || topic.componentId === courseFilter),
    ),
  )
  const openTopics = allTopics.filter((topic) => topic.status !== 'mastered')

  const tasksDone = state.tasks.filter((task) => task.done).length
  const sessionRecords = Object.values(state.sessionRecords).filter((record) => record.done).length
  const topicsMastered = allRows.filter((topic) => topic.status === 'mastered').length

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow={t('progress.eyebrow')}
        title={t('progress.title')}
        description={t('progress.intro')}
        actions={
          <>
            <Link
              to="/modules"
              className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-line bg-surface2 px-3.5 text-[13px] font-medium text-ink transition-colors hover:border-line-strong hover:bg-surface3"
            >
              <BookOpen size={15} />
              {t('progress.ctaOpenModules')}
            </Link>
            <Button
              variant="primary"
              onClick={() =>
                openDialog({
                  kind: 'task',
                  defaults: {
                    kind: 'study',
                    componentId: semesterComponents[0]?.id,
                    due: today,
                  },
                })
              }
            >
              <Plus size={15} />
              {t('progress.ctaAddTask')}
            </Button>
          </>
        }
        meta={
          <>
            <Badge tone="accent">
              {overall.earned} / {overall.total} ECTS
            </Badge>
            <Badge>
              <Flame size={10} className="text-amber" />
              {t('progress.streakDays', { count: streak })}
            </Badge>
            <Badge>
              {t('common.semester')} {semester} · {SEMESTER_ECTS[semester] ?? 0} ECTS
            </Badge>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(310px,0.85fr)]">
        <div className="min-w-0 space-y-5">
          <section className="panel relative overflow-hidden p-4 sm:p-5">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(520px_220px_at_88%_-10%,rgba(201,247,106,0.07),transparent_70%)]"
            />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
              <Ring value={overall.percent} size={116} stroke={7}>
                <span className="mono text-[23px] font-semibold leading-none tracking-[-0.05em] text-ink">
                  {Math.round(overall.percent * 100)}%
                </span>
                <span className="mt-1 text-[9px] uppercase tracking-[0.12em] text-faint">
                  ECTS
                </span>
              </Ring>
              <div className="min-w-0 flex-1">
                <div className="eyebrow">{t('progress.overall')}</div>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="mono text-[30px] font-semibold leading-none tracking-[-0.05em] text-ink">
                    {overall.earned}
                  </span>
                  <span className="text-[13px] text-faint">
                    / {overall.total} {t('progress.ectsEarned')}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <div className="mono text-[12.5px] font-medium text-ink">
                      {overall.inProgressEcts} ECTS
                    </div>
                    <div className="mt-0.5 text-[10px] text-faint">
                      {t('progress.ectsInProgress')}
                    </div>
                  </div>
                  <div>
                    <div className="mono text-[12.5px] font-medium text-ink">
                      {Math.round(semStats.progress * 100)} %
                    </div>
                    <div className="mt-0.5 text-[10px] text-faint">
                      {t('progress.semesterProgress')}
                    </div>
                  </div>
                </div>
                <ProgressBar value={overall.percent} className="mt-4" height={5} />
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <StatTile
              label={t('progress.topicsMastered')}
              value={topicsMastered}
              sub={t('progress.masteredOf', {
                mastered: topicsMastered,
                total: allRows.length,
              })}
              color={ACCENTS.lime.hex}
              icon={<Layers size={14} />}
            />
            <StatTile
              label={t('progress.completedTasks')}
              value={tasksDone}
              sub={t('misc.taskCount', { count: state.tasks.length })}
              color={ACCENTS.teal.hex}
              icon={<CheckCircle2 size={14} />}
            />
            <StatTile
              label={t('progress.completedSessions')}
              value={sessionRecords}
              sub={t('misc.sessionCount', { count: state.sessions.length })}
              color={ACCENTS.blue.hex}
              icon={<Timer size={14} />}
            />
            <StatTile
              label={t('progress.streak')}
              value={t('progress.streakDays', { count: streak })}
              sub={t('progress.streakHint')}
              color={ACCENTS.amber.hex}
              icon={<Flame size={14} />}
            />
          </div>

          <section className="panel p-4 sm:p-5">
            <SectionHeading
              title={t('progress.last8Weeks')}
              hint={`${formatWeekRange(monday, lang)} · ${t('progress.thisWeek')}`}
              action={
                <Link
                  to="/week"
                  className="inline-flex items-center gap-1 text-[11px] text-faint transition-colors hover:text-accent"
                >
                  {t('common.week')}
                  <ArrowRight size={12} />
                </Link>
              }
            />
            <div className="mt-5 flex h-[152px] items-end gap-2 sm:gap-3">
              {weeks.map((entry, index) => {
                const doneHeight = Math.round((entry.minutes / maxWeek) * 118)
                const plannedHeight = Math.round((entry.planned / maxWeek) * 118)
                const isCurrent = index === weeks.length - 1
                return (
                  <div key={entry.monday} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                    <div className="relative flex h-[120px] w-full items-end justify-center">
                      <div
                        className="absolute bottom-0 w-full max-w-[34px] rounded-t-[4px] border border-line/70 bg-surface3/40"
                        style={{ height: Math.max(3, plannedHeight) }}
                        title={t('progress.plannedWeek', {
                          hours: Math.round((entry.planned / 60) * 10) / 10,
                        })}
                      />
                      <div
                        className={cn(
                          'absolute bottom-0 w-full max-w-[34px] rounded-t-[4px] transition-[height] duration-500',
                          isCurrent ? 'bg-accent' : 'bg-accent/55',
                        )}
                        style={{ height: Math.max(entry.minutes ? 3 : 0, doneHeight) }}
                        title={t('progress.doneWeek', {
                          hours: Math.round((entry.minutes / 60) * 10) / 10,
                        })}
                      />
                    </div>
                    <span
                      className={cn(
                        'mono text-[9px] leading-none',
                        isCurrent ? 'text-accent' : 'text-faint',
                      )}
                    >
                      {t('progress.weekLabel', { kw: isoWeek(entry.monday) })}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line/70 pt-3 text-[10px] text-faint">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-[2px] bg-accent" />
                {t('progress.doneWeek', {
                  hours: Math.round((week.doneMinutes / 60) * 10) / 10,
                })}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-[2px] border border-line-strong bg-surface3" />
                {t('progress.plannedWeek', {
                  hours: Math.round((week.plannedMinutes / 60) * 10) / 10,
                })}
              </span>
              <span className="ml-auto mono">
                {t('progress.goalWeek', { hours: Math.round((goal / 60) * 10) / 10 })}
              </span>
            </div>
          </section>

          <section className="panel p-4 sm:p-5">
            <SectionHeading
              title={t('progress.byCourse')}
              hint={`${t('common.semester')} ${semester} · ${SEMESTER_ECTS[semester] ?? 0} ECTS`}
              action={
                <Link
                  to="/modules"
                  className="inline-flex items-center gap-1 text-[11px] text-faint transition-colors hover:text-accent"
                >
                  {t('misc.showAll')}
                  <ArrowRight size={12} />
                </Link>
              }
            />
            <div className="space-y-3">
              {semesterModules.map((module) => {
                const stats = moduleStats(state, module)
                const accent = ACCENTS[module.accent]
                return (
                  <Link
                    key={module.id}
                    to={`/modules/${module.id}`}
                    className="group block rounded-xl border border-line bg-bg/30 px-3.5 py-3 transition-colors hover:border-line-strong hover:bg-surface2/50"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: accent.hex }}
                      />
                      <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink">
                        {module.shortTitle[lang]}
                      </span>
                      <span className="mono text-[9.5px] text-faint">
                        {Math.round(stats.progress * 100)} %
                      </span>
                      <span className="mono hidden text-[9.5px] text-faint/70 sm:inline">
                        {stats.mastered}/{stats.topicsTotal}
                      </span>
                    </div>
                    <ProgressBar value={stats.progress} color={accent.hex} className="mt-2.5" height={4} />
                  </Link>
                )
              })}
            </div>
          </section>

          <section className="panel p-4 sm:p-5">
            <SectionHeading
              title={t('progress.openTopics')}
              hint={`${openTopics.length} ${t('common.open').toLowerCase()} · ${filteredTopics.length} ${t('common.topics').toLowerCase()}`}
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    openDialog({ kind: 'topic', componentId: semesterComponents[0]?.id ?? '' })
                  }
                >
                  <Plus size={13} />
                  {t('modules.addTopic')}
                </Button>
              }
            />
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              {(
                [
                  ['all', t('common.all')],
                  ['open', t('progress.onlyOpen')],
                  ['learning', t('progress.onlyLearning')],
                  ['mastered', t('progress.onlyMastered')],
                ] as Array<[StatusFilter, string]>
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[10.5px] font-medium transition-colors',
                    statusFilter === value
                      ? 'bg-accent/10 text-accent'
                      : 'text-faint hover:bg-white/[0.04] hover:text-muted',
                  )}
                >
                  {label}
                </button>
              ))}
              <Select
                value={courseFilter}
                onChange={(event) => setCourseFilter(event.target.value)}
                className="ml-auto h-7 min-h-0 w-[130px] py-0.5 text-[10.5px]"
                aria-label={t('common.course')}
              >
                <option value="">{t('week.allCourses')}</option>
                {semesterComponents.map((component) => (
                  <option key={component.id} value={component.id}>
                    {component.shortTitle[lang]}
                  </option>
                ))}
              </Select>
            </div>

            {filteredTopics.length ? (
              <ul className="divide-y divide-line/55">
                {filteredTopics.map((topic) => (
                  <li key={topic.id} className="flex items-start gap-2.5 py-2">
                    <span
                      className="priority-mark mt-1.5"
                      style={{ background: PRIORITY_COLORS[topic.priority] }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        openDialog({
                          kind: 'topic',
                          componentId: topic.componentId,
                          topicId: topic.id,
                        })
                      }
                      className="min-w-0 flex-1 text-left"
                    >
                      <span
                        className={cn(
                          'block text-[12px] font-medium leading-snug text-ink transition-colors hover:text-accent',
                          topic.status === 'mastered' && 'text-faint line-through',
                        )}
                      >
                        {topic.title[lang]}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] text-faint">
                        <span className="truncate">{topic.componentTitle[lang]}</span>
                        {topic.note ? (
                          <span className="truncate text-faint/70">· {topic.note}</span>
                        ) : null}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next: TopicStatus =
                          topic.status === 'open'
                            ? 'learning'
                            : topic.status === 'learning'
                              ? 'mastered'
                              : 'open'
                        if (topic.custom) {
                          usePlanner.getState().updateCustomTopic(topic.id, { status: next })
                        } else {
                          usePlanner.getState().setTopicState(topic.id, { status: next })
                        }
                      }}
                      className="topic-status shrink-0"
                      data-status={topic.status}
                      title={t(TOPIC_STATUS_KEY[topic.status])}
                    >
                      {topic.status === 'mastered' ? (
                        <CheckCircle2 size={9} />
                      ) : topic.status === 'learning' ? (
                        <Target size={9} />
                      ) : (
                        <Circle size={9} />
                      )}
                      <span className="hidden sm:inline">{t(TOPIC_STATUS_KEY[topic.status])}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<Target size={22} />}
                title={t('progress.noTopics')}
                hint={t('progress.noTopicsHint')}
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      openDialog({ kind: 'topic', componentId: semesterComponents[0]?.id ?? '' })
                    }
                  >
                    <Plus size={13} />
                    {t('modules.addTopic')}
                  </Button>
                }
              />
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-4">
          <section className="panel p-4">
            <SectionHeading
              title={t('progress.studyTime')}
              hint={formatWeekRange(monday, lang)}
              action={
                <Link
                  to="/settings"
                  className="inline-flex items-center gap-1 text-[11px] text-faint transition-colors hover:text-accent"
                >
                  {t('progress.editGoals')}
                </Link>
              }
            />
            <div className="flex items-center gap-4">
              <Ring value={goalProgress} size={84} stroke={6}>
                <span className="mono text-[14px] font-semibold text-ink">
                  {Math.min(999, Math.round(goalProgress * 100))}%
                </span>
              </Ring>
              <div className="min-w-0 flex-1">
                <div className="mono text-[24px] font-semibold leading-none tracking-[-0.05em] text-ink">
                  {formatHours(week.doneMinutes, lang)}
                </div>
                <p className="mt-1 text-[10.5px] text-faint">
                  {t('progress.goalWeek', { hours: Math.round((goal / 60) * 10) / 10 })}
                </p>
                <p className="mt-1 text-[10px] text-faint/80">
                  {t('progress.plannedWeek', {
                    hours: Math.round((week.plannedMinutes / 60) * 10) / 10,
                  })}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3">
              <div>
                <div className="mono text-[13px] font-semibold text-ink">
                  {week.sessionsDone}/{week.sessions}
                </div>
                <div className="mt-0.5 text-[9.5px] leading-tight text-faint">
                  {t('common.sessions')}
                </div>
              </div>
              <div>
                <div className="mono text-[13px] font-semibold text-ink">
                  {week.tasksDone}/{week.tasks}
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
            <SectionHeading title={t('progress.thisWeek')} hint={t('progress.streakHint')} />
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 14 }, (_, index) => {
                const date = addDaysISO(today, index - 13)
                const active = activeDays.has(date)
                const isToday = date === today
                return (
                  <span
                    key={date}
                    title={date}
                    className={cn(
                      'grid h-6 w-6 place-items-center rounded-[5px] border text-[8px] font-medium',
                      active
                        ? 'border-accent/35 bg-accent/15 text-accent'
                        : 'border-line bg-surface2/60 text-faint/50',
                      isToday && 'ring-1 ring-accent/60',
                    )}
                  >
                    {Number(date.slice(8, 10))}
                  </span>
                )
              })}
            </div>
            <div className="mt-3 flex items-center gap-2 text-[10px] text-faint">
              <TrendingUp size={12} className="text-accent" />
              {t('progress.totalStudyTime')}:{' '}
              <span className="mono text-ink">
                {formatHours(
                  weeks.reduce((sum, entry) => sum + entry.minutes, 0),
                  lang,
                )}
              </span>
            </div>
          </section>

          <section className="panel p-4">
            <SectionHeading title={t('progress.semesterProgress')} hint={`${t('common.semester')} ${semester}`} />
            <div className="space-y-3">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-[10.5px]">
                  <span className="text-muted">{t('progress.mastery')}</span>
                  <span className="mono text-ink">{Math.round(semStats.progress * 100)} %</span>
                </div>
                <ProgressBar value={semStats.progress} height={5} />
              </div>
              <div className="grid grid-cols-2 gap-2 border-t border-line pt-3 text-[10.5px]">
                <div>
                  <div className="mono text-[13px] font-semibold text-ink">
                    {semStats.mastered}/{semStats.topicsTotal}
                  </div>
                  <div className="text-faint">{t('common.topics')}</div>
                </div>
                <div>
                  <div className="mono text-[13px] font-semibold text-ink">
                    {semStats.tasksDone}/{semStats.tasksTotal}
                  </div>
                  <div className="text-faint">{t('common.tasks')}</div>
                </div>
              </div>
            </div>
          </section>

          <section className="panel-flat p-4">
            <div className="flex items-center gap-2">
              <GraduationCap size={14} className="text-accent" />
              <span className="eyebrow">{t('common.exams')}</span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-faint">{t('exams.progressSummary', {
              done: Object.values(state.examStates).filter((exam) => exam.status === 'passed').length,
              total: Object.keys(state.examStates).length,
            })}</p>
            <Link
              to="/exams"
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-accent transition-opacity hover:opacity-80"
            >
              {t('nav.exams')}
              <ArrowRight size={12} />
            </Link>
          </section>
        </aside>
      </div>
    </div>
  )
}
