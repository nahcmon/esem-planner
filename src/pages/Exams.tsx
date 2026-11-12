import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock,
  GraduationCap,
  ListChecks,
  Pencil,
  Target,
} from 'lucide-react'
import type { ExamState, ExamStatus } from '../types'
import type { ExamDef } from '../data/curriculum'
import { usePlanner } from '../store'
import { useUI } from '../ui-store'
import { useT } from '../lib/useT'
import { cn } from '../lib/cn'
import { daysUntil, formatDate, formatDuration } from '../lib/date'
import { examChecklistProgress } from '../lib/planner'
import { EXAM_KIND_KEY, EXAM_STATUS_KEY } from '../lib/labels'
import { checklistItems } from '../lib/checklist'
import { ACCENTS } from '../lib/accents'
import { CURRICULUM, EXAM_DEFS } from '../data/curriculum'
import {
  Badge,
  Button,
  Checkbox,
  EmptyState,
  Field,
  Input,
  PageHeader,
  ProgressBar,
  SectionHeading,
  Segmented,
  StatTile,
  Textarea,
} from '../components/ui'

const EXAM_PERIOD_START = '2027-01-28'
const EXAM_PERIOD_END = '2027-02-18'

type Scope = 'current' | 'all'
type StatusFilter = 'all' | 'open' | 'passed'

export function ExamsPage() {
  const { t, lang } = useT()
  const state = usePlanner()
  const [scope, setScope] = useState<Scope>('current')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const semester = state.settings.currentSemester
  const exams = EXAM_DEFS.filter((exam) => scope === 'all' || exam.semester === semester)
  const filtered = exams.filter((exam) => {
    const status = state.examStates[exam.key]?.status ?? 'planned'
    if (statusFilter === 'open') return status !== 'passed'
    if (statusFilter === 'passed') return status === 'passed'
    return true
  })
  const sorted = [...filtered].sort((a, b) => {
    const dateA = state.examStates[a.key]?.date
    const dateB = state.examStates[b.key]?.date
    if (dateA && dateB) return dateA.localeCompare(dateB)
    if (dateA) return -1
    if (dateB) return 1
    return a.semester - b.semester || a.label.de.localeCompare(b.label.de)
  })

  const passed = exams.filter((exam) => state.examStates[exam.key]?.status === 'passed').length
  const registered = exams.filter(
    (exam) => state.examStates[exam.key]?.status === 'registered',
  ).length
  const countdown = Math.max(0, daysUntil(EXAM_PERIOD_START))
  const semesterEcts = CURRICULUM.filter((module) => module.semester === semester).reduce(
    (sum, module) => sum + module.ects,
    0,
  )

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow={t('exams.eyebrow')}
        title={t('exams.title')}
        description={t('exams.registrationInfo')}
        actions={
          <>
            <Link
              to="/week"
              className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-line bg-surface2 px-3.5 text-[13px] font-medium text-ink transition-colors hover:border-line-strong hover:bg-surface3"
            >
              <CalendarDays size={15} />
              {t('nav.week')}
            </Link>
            <Button
              variant="primary"
              onClick={() =>
                useUI.getState().openDialog({
                  kind: 'task',
                  defaults: {
                    kind: 'exam',
                    componentId:
                      CURRICULUM.find((module) => module.semester === semester)?.components[0]?.id,
                  },
                })
              }
            >
              <CalendarPlus size={15} />
              {t('progress.ctaAddTask')}
            </Button>
          </>
        }
        meta={
          <>
            <Badge tone="accent">
              <GraduationCap size={10} />
              {t('exams.windowValue')}
            </Badge>
            <Badge>
              <ClipboardCheck size={10} />
              {t('exams.progressSummary', { done: passed, total: exams.length })}
            </Badge>
            <Badge tone={registered ? 'info' : 'muted'}>
              {t('exam.registered')}: {registered}
            </Badge>
          </>
        }
      />

      <section className="panel relative mb-5 overflow-hidden p-4 sm:p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(520px_220px_at_92%_-20%,rgba(201,247,106,0.08),transparent_70%)]"
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <div className="eyebrow mb-1">{t('exams.countdownLabel')}</div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="mono text-[42px] font-semibold leading-none tracking-[-0.06em] text-ink">
                {countdown}
              </span>
              <span className="text-[13px] text-faint">{t('exams.days')}</span>
              <Badge tone="accent">
                {formatDate(EXAM_PERIOD_START, lang, 'd. MMM')} –{' '}
                {formatDate(EXAM_PERIOD_END, lang, 'd. MMM yyyy')}
              </Badge>
            </div>
            <p className="mt-2 max-w-[560px] text-[11.5px] leading-relaxed text-faint">
              {t('exams.registrationInfo')}
            </p>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:w-[430px]">
            <div className="rounded-xl border border-line bg-bg/40 px-3 py-2.5">
              <div className="eyebrow text-[8.5px]">{t('exams.registration')}</div>
              <div className="mt-1 text-[11px] font-medium leading-snug text-ink">
                {t('exams.registrationValue')}
              </div>
            </div>
            <div className="rounded-xl border border-line bg-bg/40 px-3 py-2.5">
              <div className="eyebrow text-[8.5px]">{t('exams.withdrawal')}</div>
              <div className="mt-1 text-[11px] font-medium leading-snug text-ink">
                {t('exams.withdrawalValue')}
              </div>
            </div>
            <div className="col-span-2 rounded-xl border border-amber/20 bg-amber/[0.05] px-3 py-2.5 sm:col-span-1">
              <div className="eyebrow text-[8.5px] text-amber/80">{t('exams.publication')}</div>
              <div className="mt-1 text-[11px] font-medium leading-snug text-amber">
                22.12.2026
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatTile
          label={t('exams.thisSemester')}
          value={`${passed}/${exams.length}`}
          sub={t('exams.passedCount', { count: passed })}
          color={ACCENTS.lime.hex}
          icon={<CheckCircle2 size={14} />}
        />
        <StatTile
          label={t('exam.registered')}
          value={registered}
          sub={t('exams.openCount', { count: exams.length - passed })}
          color={ACCENTS.blue.hex}
          icon={<ClipboardCheck size={14} />}
        />
        <StatTile
          label={t('common.exams')}
          value={exams.length}
          sub={`${semesterEcts} ECTS · ${t('common.semester')} ${semester}`}
          color={ACCENTS.teal.hex}
          icon={<GraduationCap size={14} />}
        />
        <StatTile
          label={t('exams.countdownLabel')}
          value={countdown}
          sub={t('exams.days')}
          color={ACCENTS.amber.hex}
          icon={<Clock size={14} />}
        />
      </div>

      <div className="panel mb-4 flex flex-wrap items-center gap-2 p-2.5">
        <Segmented
          value={scope}
          onChange={setScope}
          options={[
            { value: 'current', label: t('exams.onlyCurrent') },
            { value: 'all', label: t('exams.all') },
          ]}
          ariaLabel={t('exams.title')}
        />
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          {(
            [
              ['all', t('exams.filterAll')],
              ['open', t('exams.filterOpen')],
              ['passed', t('exams.filterPassed')],
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
        </div>
      </div>

      {sorted.length ? (
        <div className="space-y-3">
          {sorted.map((exam) => (
            <ExamCard
              key={exam.key}
              exam={exam}
              examState={state.examStates[exam.key]}
              defaultOpen={Boolean(
                state.examStates[exam.key]?.date &&
                  daysUntil(state.examStates[exam.key]!.date!) >= 0 &&
                  daysUntil(state.examStates[exam.key]!.date!) <= 21,
              )}
            />
          ))}
        </div>
      ) : (
        <div className="panel">
          <EmptyState
            icon={<GraduationCap size={22} />}
            title={t('exams.noExamsForFilter')}
            action={
              <Button variant="secondary" size="sm" onClick={() => setStatusFilter('all')}>
                {t('common.reset')}
              </Button>
            }
          />
        </div>
      )}

      <section className="panel mt-5 p-4 sm:p-5">
        <SectionHeading title={t('exams.infoTitle')} hint={t('exams.infoBody')} />
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="flex items-start gap-2 rounded-xl border border-line bg-bg/30 px-3 py-2.5">
            <Target size={13} className="mt-0.5 shrink-0 text-accent" />
            <p className="text-[10.5px] leading-relaxed text-faint">{t('exams.registrationInfo')}</p>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-line bg-bg/30 px-3 py-2.5">
            <ListChecks size={13} className="mt-0.5 shrink-0 text-accent" />
            <p className="text-[10.5px] leading-relaxed text-faint">{t('exams.infoBody')}</p>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-line bg-bg/30 px-3 py-2.5">
            <CalendarDays size={13} className="mt-0.5 shrink-0 text-accent" />
            <p className="text-[10.5px] leading-relaxed text-faint">
              {t('settings.privacyText')}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

const STATUS_TONE: Record<ExamStatus, 'default' | 'accent' | 'info' | 'danger'> = {
  planned: 'default',
  registered: 'info',
  passed: 'accent',
  failed: 'danger',
}

function ExamCard({
  exam,
  examState,
  defaultOpen,
}: {
  exam: ExamDef
  examState: ExamState | undefined
  defaultOpen: boolean
}) {
  const { t, lang } = useT()
  const updateExam = usePlanner((store) => store.updateExam)
  const setExamStatus = usePlanner((store) => store.setExamStatus)
  const toggleExamChecklist = usePlanner((store) => store.toggleExamChecklist)
  const openDialog = useUI((store) => store.openDialog)
  const [open, setOpen] = useState(defaultOpen)
  const [note, setNote] = useState(examState?.note ?? '')

  const status = examState?.status ?? 'planned'
  const check = examChecklistProgress(
    usePlanner.getState(),
    exam.key,
  )
  const items = checklistItems(exam.kind)
  const date = examState?.date
  const dateInDays = date ? daysUntil(date) : null
  const dateTone =
    dateInDays === null
      ? 'default'
      : dateInDays < 0
        ? 'muted'
        : dateInDays <= 7
          ? 'warn'
          : 'accent'

  const setAllChecks = (value: boolean) => {
    for (const item of items) {
      const current = examState?.checklist?.[item.id] ?? false
      if (current !== value) toggleExamChecklist(exam.key, item.id, exam.kind)
    }
  }

  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span
            className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border"
            style={{
              borderColor: ACCENTS[exam.accent].line,
              background: ACCENTS[exam.accent].soft,
              color: ACCENTS[exam.accent].hex,
            }}
          >
            <GraduationCap size={16} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="mono text-[9px] uppercase tracking-[0.08em] text-faint">
                {exam.semester}. Semester · {exam.moduleTitle[lang]}
              </span>
              {examState?.date ? (
                <Badge tone={dateTone}>
                  {formatDate(examState.date, lang, 'd. MMM yyyy')}
                  {dateInDays !== null && dateInDays >= 0
                    ? ` · ${
                        dateInDays === 0
                          ? t('exams.today')
                          : dateInDays === 1
                            ? t('exams.tomorrow')
                            : t('exams.inDays', { days: dateInDays })
                      }`
                    : dateInDays !== null
                      ? ` · ${t('exams.examPast')}`
                      : ''}
                </Badge>
              ) : (
                <Badge tone="warn">{t('exams.noDate')}</Badge>
              )}
            </div>
            <h2 className="mt-1 text-[14px] font-semibold leading-snug tracking-[-0.015em] text-ink">
              {exam.label[lang]}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-faint">
              <span>{t(EXAM_KIND_KEY[exam.kind])}</span>
              {exam.durationMin ? <span>· {formatDuration(exam.durationMin, lang)}</span> : null}
              {exam.weight ? (
                <span>
                  · {t('exam.weight')} {exam.weight}
                </span>
              ) : null}
              {exam.graded === false ? <span>· {t('exam.ungraded')}</span> : null}
              <span>
                · {exam.ects} ECTS
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          <Badge tone={STATUS_TONE[status]}>{t(EXAM_STATUS_KEY[status])}</Badge>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => openDialog({ kind: 'examResult', examKey: exam.key })}
          >
            <Pencil size={13} />
            {t('exams.setResult')}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setOpen((value) => !value)}>
            <ChevronDown
              size={14}
              className={cn('transition-transform', open && 'rotate-180')}
            />
            {t('common.details')}
          </Button>
        </div>
      </div>

      <div className="border-t border-line/70 px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label={t('exams.dateHint')} htmlFor={`exam-date-${exam.key}`} className="w-full sm:w-[190px]">
            <Input
              id={`exam-date-${exam.key}`}
              type="date"
              value={date ?? ''}
              onChange={(event) =>
                updateExam(exam.key, exam.kind, {
                  date: event.target.value || undefined,
                })
              }
              className="h-8 min-h-0 text-[11.5px]"
            />
          </Field>
          <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
            <span className="mono text-[10px] text-faint">
              {t('exams.checksDone', { done: check.done, total: items.length })}
            </span>
            <div className="w-[110px]">
              <ProgressBar value={items.length ? check.done / items.length : 0} height={4} />
            </div>
            {status === 'planned' ? (
              <Button
                variant="soft"
                size="sm"
                onClick={() => setExamStatus(exam.key, 'registered', exam.kind)}
              >
                <Check size={13} />
                {t('exams.markRegistered')}
              </Button>
            ) : status === 'registered' ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExamStatus(exam.key, 'planned', exam.kind)}
              >
                {t('exams.unmarkRegistered')}
              </Button>
            ) : null}
            {status === 'failed' ? (
              <Button
                variant="soft"
                size="sm"
                onClick={() => setExamStatus(exam.key, 'planned', exam.kind)}
              >
                {t('common.reset')}
              </Button>
            ) : null}
          </div>
        </div>

        {open ? (
          <div className="mt-4 grid gap-4 border-t border-line/70 pt-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.9fr)]">
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="eyebrow">{t('exams.checklistTitle', { title: exam.label[lang] })}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setAllChecks(true)}
                    className="rounded px-1.5 py-1 text-[9.5px] text-faint transition-colors hover:bg-white/5 hover:text-accent"
                  >
                    {t('exams.checkAll')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllChecks(false)}
                    className="rounded px-1.5 py-1 text-[9.5px] text-faint transition-colors hover:bg-white/5 hover:text-muted"
                  >
                    {t('exams.uncheckAll')}
                  </button>
                </div>
              </div>
              <ul className="grid gap-1 sm:grid-cols-2">
                {items.map((item) => {
                  const checked = Boolean(examState?.checklist?.[item.id])
                  return (
                    <li key={item.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/[0.025]">
                      <Checkbox
                        checked={checked}
                        onChange={() => toggleExamChecklist(exam.key, item.id, exam.kind)}
                        label={t(item.labelKey)}
                        className="h-[16px] w-[16px]"
                      />
                      <span className={cn('text-[11px] leading-snug', checked ? 'text-faint line-through' : 'text-muted')}>
                        {t(item.labelKey)}
                      </span>
                    </li>
                  )
                })}
              </ul>
              {check.complete ? (
                <p className="mt-2 inline-flex items-center gap-1.5 text-[10.5px] text-accent">
                  <CheckCircle2 size={12} />
                  {t('exams.allDone')}
                </p>
              ) : null}
            </div>

            <div className="space-y-3">
              <Field label={t('exams.addNote')}>
                <Textarea
                  value={note}
                  placeholder={t('exams.notePlaceholder')}
                  onChange={(event) => setNote(event.target.value)}
                  onBlur={() => {
                    if ((examState?.note ?? '') !== note) {
                      updateExam(exam.key, exam.kind, { note })
                    }
                  }}
                  className="min-h-[92px] text-[11.5px]"
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={status === 'passed' ? 'secondary' : 'soft'}
                  size="sm"
                  onClick={() =>
                    setExamStatus(
                      exam.key,
                      status === 'passed' ? 'planned' : 'passed',
                      exam.kind,
                      status === 'passed' ? undefined : examState?.grade,
                    )
                  }
                >
                  <CheckCircle2 size={13} />
                  {status === 'passed' ? t('common.reset') : t('exams.markPassed')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-rose"
                  onClick={() => setExamStatus(exam.key, 'failed', exam.kind, examState?.grade)}
                >
                  <AlertCircle size={13} />
                  {t('exams.markFailed')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => openDialog({ kind: 'examResult', examKey: exam.key })}
                >
                  {t('exams.setResult')}
                  <ArrowRight size={12} />
                </Button>
              </div>
              {exam.note ? (
                <p className="text-[10.5px] leading-relaxed text-faint">{exam.note[lang]}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
