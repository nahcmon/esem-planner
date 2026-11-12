import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  GraduationCap,
  LayoutGrid,
  List,
  Plus,
  RotateCcw,
  Video,
} from 'lucide-react'
import { usePlanner } from '../store'
import { useUI } from '../ui-store'
import { useT } from '../lib/useT'
import { cn } from '../lib/cn'
import {
  addDaysISO,
  formatDate,
  formatHours,
  formatWeekRange,
  isoWeek,
  semesterWeek,
  startOfWeekISO,
  todayISO,
  weekdayLong,
  weekdayShort,
} from '../lib/date'
import {
  sessionDone,
  weekOccurrences,
  weekStudyStats,
  weekdayNumber,
} from '../lib/planner'
import { componentFullTitle, componentTitle } from '../lib/display'
import { ACCENTS } from '../lib/accents'
import { SESSION_KIND_KEY } from '../lib/labels'
import { COMPONENTS, CURRICULUM, EXAM_DEFS } from '../data/curriculum'
import type { SessionKind, Task } from '../types'
import { TaskRow } from '../components/TaskRow'
import { WeekGrid } from '../components/WeekGrid'
import {
  Badge,
  Button,
  Checkbox,
  IconButton,
  PageHeader,
  Segmented,
  Select,
} from '../components/ui'

export function WeekPage() {
  const { t, lang } = useT()
  const state = usePlanner()
  const openDialog = useUI((store) => store.openDialog)
  const [searchParams, setSearchParams] = useSearchParams()
  const weekParam = searchParams.get('week')
  const monday = weekParam ? startOfWeekISO(weekParam) : startOfWeekISO()
  const dates = Array.from({ length: 7 }, (_, index) => addDaysISO(monday, index))
  const today = todayISO()
  const isCurrentWeek = monday === startOfWeekISO()

  const [courseFilter, setCourseFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | SessionKind>('all')
  const [view, setView] = useState<'grid' | 'agenda'>('grid')

  const allOccurrences = weekOccurrences(state, monday)
  const occurrences = allOccurrences.filter(
    (occurrence) =>
      (!courseFilter || occurrence.session.componentId === courseFilter) &&
      (typeFilter === 'all' || occurrence.session.kind === typeFilter),
  )
  const counts = weekStudyStats(state, monday)
  const weekTasks = state.tasks
    .filter(
      (task) =>
        task.due &&
        task.due >= monday &&
        task.due <= addDaysISO(monday, 6) &&
        (!courseFilter || task.componentId === courseFilter),
    )
    .sort((a, b) => (a.due ?? '').localeCompare(b.due ?? ''))
  const weekExams = EXAM_DEFS.filter(
    (exam) =>
      state.examStates[exam.key]?.date &&
      state.examStates[exam.key]!.date! >= monday &&
      state.examStates[exam.key]!.date! <= addDaysISO(monday, 6) &&
      (!courseFilter || exam.componentId === courseFilter),
  )

  const studyDue = today >= monday && today <= addDaysISO(monday, 6) ? today : monday

  const goWeek = (value: string) => {
    const normalized = startOfWeekISO(value)
    if (normalized === startOfWeekISO()) {
      setSearchParams({})
    } else {
      setSearchParams({ week: normalized })
    }
  }

  const activeFilters = Boolean(courseFilter) || typeFilter !== 'all'

  const semesterComponents = CURRICULUM.filter(
    (module) => module.semester === state.settings.currentSemester,
  ).flatMap((module) => module.components)

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow={`${t('week.eyebrow')} · KW ${isoWeek(monday)}`}
        title={t('week.title')}
        description={t('week.dragHint')}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() =>
                openDialog({ kind: 'task', defaults: { kind: 'study', due: studyDue } })
              }
            >
              <Plus size={15} />
              <span className="hidden sm:inline">{t('week.addStudy')}</span>
              <span className="sm:hidden">{t('today.quickStudy')}</span>
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                openDialog({
                  kind: 'session',
                  defaults: { day: weekdayNumber(studyDue), start: '08:15', end: '09:45' },
                })
              }
            >
              <Plus size={15} />
              {t('week.addSession')}
            </Button>
          </>
        }
        meta={
          <>
            <Badge tone="accent">
              {formatWeekRange(monday, lang)} · {t('today.semesterWeek', {
                week: semesterWeek(monday),
                total: 17,
              })}
            </Badge>
            <Badge>
              <CalendarDays size={10} />
              {formatHours(counts.plannedMinutes, lang)} {t('week.planned').toLowerCase()}
            </Badge>
            <Badge>
              {counts.sessionsDone} / {counts.sessions} {t('week.completed').toLowerCase()}
            </Badge>
            <Badge tone={weekTasks.length ? 'warn' : 'muted'}>
              {weekTasks.length} {t('week.deadlines')}
            </Badge>
          </>
        }
      />

      <div className="panel mb-5 p-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <IconButton label={t('week.prev')} onClick={() => goWeek(addDaysISO(monday, -7))}>
              <ChevronLeft size={16} />
            </IconButton>
            <Button
              variant={isCurrentWeek ? 'soft' : 'secondary'}
              size="sm"
              onClick={() => goWeek(today)}
            >
              {t('week.thisWeek')}
            </Button>
            <IconButton label={t('week.next')} onClick={() => goWeek(addDaysISO(monday, 7))}>
              <ChevronRight size={16} />
            </IconButton>
          </div>
          <span className="mono hidden text-[10.5px] text-faint sm:inline">
            {t('week.weekOf', {
              kw: isoWeek(monday),
              range: formatWeekRange(monday, lang),
            })}
          </span>

          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <div className="relative">
              <Filter
                size={12}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint"
              />
              <Select
                value={courseFilter}
                onChange={(event) => setCourseFilter(event.target.value)}
                className="h-8 min-h-0 w-[154px] py-1 pl-7 text-[11px]"
                aria-label={t('week.filterCourse')}
              >
                <option value="">{t('week.allCourses')}</option>
                {COMPONENTS.map((component) => (
                  <option key={component.id} value={component.id}>
                    {component.semester} · {component.shortTitle[lang]}
                  </option>
                ))}
              </Select>
            </div>
            <Select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as 'all' | SessionKind)}
              className="h-8 min-h-0 w-[140px] py-1 text-[11px]"
              aria-label={t('week.filterType')}
            >
              <option value="all">{t('week.allTypes')}</option>
              {(Object.keys(SESSION_KIND_KEY) as SessionKind[]).map((kind) => (
                <option key={kind} value={kind}>
                  {t(SESSION_KIND_KEY[kind])}
                </option>
              ))}
            </Select>
            {activeFilters ? (
              <IconButton
                label={t('week.resetFilter')}
                onClick={() => {
                  setCourseFilter('')
                  setTypeFilter('all')
                }}
                className="h-8 w-8 border-line"
              >
                <RotateCcw size={12} />
              </IconButton>
            ) : null}
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: 'grid', label: <LayoutGrid size={13} />, title: t('week.viewGrid') },
                { value: 'agenda', label: <List size={13} />, title: t('week.viewAgenda') },
              ]}
              ariaLabel={t('week.title')}
              className="hidden md:inline-flex"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-line/70 px-1 pb-0.5 pt-2.5">
          <span className="eyebrow">{t('common.course')}</span>
          {semesterComponents.map((component) => (
            <button
              key={component.id}
              type="button"
              onClick={() =>
                setCourseFilter((current) => (current === component.id ? '' : component.id))
              }
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] transition-colors',
                courseFilter === component.id
                  ? 'bg-white/[0.07] text-ink'
                  : 'text-faint hover:bg-white/[0.04] hover:text-muted',
              )}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: ACCENTS[
                    CURRICULUM.find((module) =>
                      module.components.some((item) => item.id === component.id),
                    )?.accent ?? 'lime'
                  ].hex,
                }}
              />
              {component.shortTitle[lang]}
            </button>
          ))}
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className={cn('hidden md:block', view === 'grid' ? '' : 'md:hidden')}>
          <WeekGrid
            monday={monday}
            dates={dates}
            occurrences={occurrences}
            tasks={weekTasks}
            exams={weekExams}
            examStates={state.examStates}
          />
        </div>
        <div className={cn(view === 'agenda' ? 'block' : 'md:hidden')}>
          <WeekAgenda
            dates={dates}
            occurrences={occurrences}
            tasks={weekTasks}
            exams={weekExams}
            todaysDate={today}
            onAddSession={(date) =>
              openDialog({
                kind: 'session',
                defaults: { day: weekdayNumber(date), start: '08:15', end: '09:45' },
              })
            }
          />
        </div>
      </div>
    </div>
  )
}

function WeekAgenda({
  dates,
  occurrences,
  tasks,
  exams,
  todaysDate,
  onAddSession,
}: {
  dates: string[]
  occurrences: ReturnType<typeof weekOccurrences>
  tasks: Task[]
  exams: typeof EXAM_DEFS
  todaysDate: string
  onAddSession: (date: string) => void
}) {
  const { t, lang } = useT()
  const state = usePlanner()
  const openDialog = useUI((store) => store.openDialog)

  return (
    <div className="space-y-3 p-2.5 sm:p-3">
      {dates.map((date) => {
        const isToday = date === todaysDate
        const dayOccurrences = occurrences.filter((occurrence) => occurrence.date === date)
        const dayTasks = tasks.filter((task) => task.due === date)
        const dayExams = exams.filter((exam) => state.examStates[exam.key]?.date === date)
        const empty = !dayOccurrences.length && !dayTasks.length && !dayExams.length
        return (
          <section
            key={date}
            className={cn(
              'overflow-hidden rounded-xl border border-line bg-surface/45',
              isToday && 'border-accent/25 bg-accent/[0.02]',
            )}
          >
            <header className="flex items-center gap-3 border-b border-line/70 px-3 py-2.5">
              <div className="w-9 shrink-0 text-center">
                <div className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-faint">
                  {weekdayShort(weekdayNumber(date), lang)}
                </div>
                <div
                  className={cn(
                    'mono text-[19px] font-semibold leading-tight tracking-[-0.05em]',
                    isToday ? 'text-accent' : 'text-ink',
                  )}
                >
                  {Number(date.slice(8, 10))}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-medium text-ink">
                  {weekdayLong(weekdayNumber(date), lang)}
                </div>
                <div className="text-[10px] text-faint">
                  {formatDate(date, lang, 'd. MMMM')} ·{' '}
                  {dayOccurrences.length + dayTasks.length + dayExams.length}{' '}
                  {t('common.sessions')}
                </div>
              </div>
              <IconButton
                label={t('week.addSession')}
                onClick={() => onAddSession(date)}
                className="h-8 w-8"
              >
                <Plus size={14} />
              </IconButton>
            </header>
            <div className="space-y-1.5 p-2">
              {dayExams.map((exam) => (
                <Link
                  key={exam.key}
                  to="/exams"
                  className="flex items-center gap-2 rounded-lg border border-amber/20 bg-amber/[0.06] px-2.5 py-2 text-[11px] font-medium text-amber"
                >
                  <GraduationCap size={13} />
                  <span className="min-w-0 flex-1 truncate">{exam.label[lang]}</span>
                  <span className="mono text-[9px] text-amber/70">{t('week.examChip')}</span>
                </Link>
              ))}
              {dayOccurrences.map((occurrence) => {
                const component = COMPONENTS.find(
                  (item) => item.id === occurrence.session.componentId,
                )
                const accent = ACCENTS[component?.accent ?? 'lime'].hex
                const done = sessionDone(state, occurrence)
                const cancelled = occurrence.status === 'cancelled'
                return (
                  <div
                    key={occurrence.key}
                    className={cn(
                      'flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-white/[0.025]',
                      cancelled && 'opacity-55',
                    )}
                  >
                    <Checkbox
                      checked={done}
                      onChange={() =>
                        usePlanner
                          .getState()
                          .toggleSessionDone(occurrence.session.id, occurrence.date)
                      }
                      label={componentFullTitle(occurrence.session.componentId, lang)}
                      className="mt-0.5"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        openDialog({
                          kind: 'sessionDetails',
                          sessionId: occurrence.session.id,
                          date: occurrence.date,
                        })
                      }
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="mono text-[10.5px] font-medium text-muted">
                          {occurrence.start}–{occurrence.end}
                        </span>
                        <span
                          className={cn(
                            'truncate text-[12.5px] font-medium leading-tight',
                            done ? 'text-faint line-through' : 'text-ink',
                            cancelled && 'line-through decoration-rose/50',
                          )}
                        >
                          {componentTitle(occurrence.session.componentId, lang)}
                        </span>
                        {occurrence.status === 'moved' ? (
                          <Badge tone="warn">{t('week.moved')}</Badge>
                        ) : null}
                        {cancelled ? <Badge tone="danger">{t('week.cancelled')}</Badge> : null}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-faint">
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{ background: accent }}
                        />
                        <span>{t(SESSION_KIND_KEY[occurrence.session.kind])}</span>
                        {occurrence.online ? (
                          <span className="inline-flex items-center gap-1 text-blue">
                            <Video size={9} />
                            {t('common.online')}
                          </span>
                        ) : occurrence.room ? (
                          <span className="truncate">{occurrence.room}</span>
                        ) : null}
                      </div>
                    </button>
                  </div>
                )
              })}
              {dayTasks.length ? (
                <ul className="divide-y divide-line/50 border-t border-line/50 pt-1">
                  {dayTasks.map((task) => (
                    <TaskRow key={task.id} task={task} showDue={false} />
                  ))}
                </ul>
              ) : null}
              {empty ? (
                <div className="flex items-center justify-between px-2 py-2 text-[11px] text-faint/70">
                  <span>{t('week.emptyDay')}</span>
                  <button
                    type="button"
                    onClick={() => onAddSession(date)}
                    className="text-[10.5px] text-faint transition-colors hover:text-accent"
                  >
                    + {t('common.addEvent')}
                  </button>
                </div>
              ) : null}
            </div>
          </section>
        )
      })}
    </div>
  )
}
