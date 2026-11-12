import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  Award,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Pencil,
  Plus,
  Target,
  TrendingUp,
} from 'lucide-react'
import { usePlanner } from '../store'
import { useUI } from '../ui-store'
import { useT } from '../lib/useT'
import { cn } from '../lib/cn'
import { daysUntil, formatDate } from '../lib/date'
import {
  examChecklistProgress,
  formatGrade,
  gradeStats,
  nextExam,
  recentExamResults,
  upcomingExams,
} from '../lib/planner'
import { EXAM_DATES_PUBLISHED, EXAM_PERIOD_START } from '../lib/examPeriod'
import { EXAM_KIND_KEY } from '../lib/labels'
import { ACCENTS } from '../lib/accents'
import { CURRICULUM, EXAM_DEFS, SEMESTER_ECTS, TOTAL_ECTS } from '../data/curriculum'
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  ProgressBar,
  SectionHeading,
} from '../components/ui'

const BAND_KEYS = ['grades.band1', 'grades.band2', 'grades.band3', 'grades.band4'] as const
const BAND_COLORS = [ACCENTS.lime.hex, ACCENTS.teal.hex, ACCENTS.amber.hex, ACCENTS.rose.hex]

export function GradesPage() {
  const { t, lang } = useT()
  const state = usePlanner()
  const openDialog = useUI((store) => store.openDialog)
  const semester = state.settings.currentSemester
  const overall = gradeStats(state)
  const current = gradeStats(state, semester)
  const semesters = Array.from({ length: 7 }, (_, index) => index + 1)
  const sortedExams = upcomingExams(state, 4, semester)
  const next = nextExam(state, semester)
  const nextState = next ? state.examStates[next.key] : undefined
  const nextCheck = next ? examChecklistProgress(state, next.key) : null
  const recent = recentExamResults(state, 6)
  const currentModules = CURRICULUM.filter((module) => module.semester === semester)
  const openAssessments = EXAM_DEFS.filter(
    (exam) =>
      exam.semester === semester &&
      state.examStates[exam.key]?.status !== 'passed' &&
      state.examStates[exam.key]?.status !== 'failed',
  ).slice(0, 6)
  const maxBand = Math.max(1, ...overall.distribution.map((band) => band.count))
  const examPeriodDays = Math.max(0, daysUntil(EXAM_PERIOD_START))
  const gradedExamsLabel =
    overall.gradedExams === 1
      ? t('grades.gradedExamsCountOne')
      : t('grades.gradedExamsCount', { count: overall.gradedExams })

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow={t('grades.eyebrow')}
        title={t('grades.title')}
        description={t('grades.intro')}
        actions={
          <>
            <Link
              to="/exams"
              className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-line bg-surface2 px-3.5 text-[13px] font-medium text-ink transition-colors hover:border-line-strong hover:bg-surface3"
            >
              <ClipboardCheck size={15} />
              {t('grades.allAssessments')}
            </Link>
            <Button
              variant="primary"
              onClick={() =>
                openDialog({
                  kind: 'task',
                  defaults: {
                    kind: 'exam',
                    componentId: currentModules[0]?.components[0]?.id,
                  },
                })
              }
            >
              <Plus size={15} />
              {t('grades.planPrep')}
            </Button>
          </>
        }
        meta={
          <>
            <Badge tone="accent">
              <Award size={10} />
              {t('grades.gpa')}: {formatGrade(overall.average, lang)}
            </Badge>
            <Badge>{t('misc.ectsOf', { done: overall.passedEcts, total: TOTAL_ECTS })}</Badge>
            <Badge tone={current.openExams ? 'info' : 'muted'}>
              {t('grades.openExams')}: {current.openExams}
            </Badge>
          </>
        }
      />

      <section className="panel relative mb-5 overflow-hidden p-4 sm:p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(560px_240px_at_92%_-20%,rgba(201,247,106,0.09),transparent_70%)]"
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <div className="grid h-[106px] w-[106px] shrink-0 place-items-center rounded-2xl border border-accent/20 bg-accent/[0.05]">
              <div className="text-center">
                <div className="mono text-[34px] font-semibold leading-none tracking-[-0.06em] text-ink">
                  {formatGrade(overall.average, lang)}
                </div>
                <div className="mt-1.5 text-[9px] uppercase tracking-[0.14em] text-faint">
                  {t('grades.gpaShort')}
                </div>
              </div>
            </div>
            <div className="min-w-0">
              <div className="eyebrow">{t('grades.gpa')}</div>
              <p className="mt-1 max-w-[330px] text-[12px] leading-relaxed text-muted">
                {overall.average === null ? t('grades.noGradesHint') : t('grades.gpaHint')}
              </p>
              <div className="mt-2 flex items-center gap-2 text-[10px] text-faint">
                <TrendingUp size={11} className="text-accent" />
                {gradedExamsLabel}
              </div>
            </div>
          </div>

          <div className="hidden h-[92px] w-px shrink-0 bg-line lg:block" />

          <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
            <SummaryStat
              label={t('grades.ectsPassed')}
              value={`${overall.passedEcts}`}
              sub={t('grades.ofTotal', { total: TOTAL_ECTS })}
              color={ACCENTS.lime.hex}
            />
            <SummaryStat
              label={t('grades.ectsGraded')}
              value={`${overall.gradedEcts}`}
              sub={t('grades.weightedInGpa')}
              color={ACCENTS.blue.hex}
            />
            <SummaryStat
              label={t('grades.passedExams')}
              value={`${overall.passedExams}`}
              sub={t('grades.failedCount', { count: overall.failedExams })}
              color={ACCENTS.teal.hex}
            />
            <SummaryStat
              label={t('grades.openExams')}
              value={`${current.openExams}`}
              sub={t('misc.semesterNumber', { n: semester })}
              color={ACCENTS.amber.hex}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(310px,0.85fr)]">
        <div className="min-w-0 space-y-5">
          <section className="panel p-4 sm:p-5">
            <SectionHeading
              title={t('grades.semesterResults')}
              hint={t('grades.semesterHint')}
            />
            <div className="space-y-1.5">
              {semesters.map((value) => {
                const stats = gradeStats(state, value)
                const isCurrent = value === semester
                const target = SEMESTER_ECTS[value] ?? 0
                return (
                  <div
                    key={value}
                    className={cn(
                      'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-xl border px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_90px_130px]',
                      isCurrent
                        ? 'border-accent/25 bg-accent/[0.045]'
                        : 'border-line/70 bg-bg/20',
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="mono text-[11px] font-semibold text-ink">
                          {String(value).padStart(2, '0')}
                        </span>
                        <span className="text-[12px] font-medium text-ink">
                          {t('misc.semesterNumber', { n: value })}
                        </span>
                        {isCurrent ? <Badge tone="accent">{t('grades.current')}</Badge> : null}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9.5px] text-faint">
                        <span>{t('grades.passedCount', { count: stats.passedExams })}</span>
                        {stats.failedExams ? (
                          <span className="text-rose">
                            {t('grades.failedCount', { count: stats.failedExams })}
                          </span>
                        ) : null}
                        <span>
                          {t('grades.openCount', {
                            count: stats.openExams,
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right sm:text-left">
                      <span className="mono text-[15px] font-semibold text-ink">
                        {formatGrade(stats.average, lang)}
                      </span>
                      <span className="ml-1.5 text-[9px] text-faint">{t('grades.gpaShort')}</span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <ProgressBar value={target ? stats.passedEcts / target : 0} height={4} />
                      <div className="mt-1 flex justify-between text-[9px] text-faint">
                        <span>
                          {stats.passedEcts}/{target} ECTS
                        </span>
                        <span>{stats.gradedEcts} ECTS {t('grades.gradedShort')}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="panel p-4 sm:p-5">
            <SectionHeading
              title={t('grades.distribution')}
              hint={t('grades.distributionHint')}
              action={
                <Badge>
                  {gradedExamsLabel}
                </Badge>
              }
            />
            {overall.gradedExams ? (
              <div className="space-y-3">
                {overall.distribution.map((band, index) => (
                  <div key={band.id} className="flex items-center gap-3">
                    <span className="mono w-[68px] shrink-0 text-[10px] text-faint">
                      {t(BAND_KEYS[index])}
                    </span>
                    <div className="min-w-0 flex-1">
                      <ProgressBar
                        value={band.count / maxBand}
                        color={BAND_COLORS[index]}
                        height={7}
                      />
                    </div>
                    <span className="mono w-6 shrink-0 text-right text-[10px] text-muted">
                      {band.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<TrendingUp size={20} />}
                title={t('grades.noGrades')}
                hint={t('grades.distributionEmpty')}
              />
            )}
          </section>

          <section className="panel p-4 sm:p-5">
            <SectionHeading
              title={t('grades.latestResults')}
              hint={t('grades.latestHint')}
              action={
                <Link
                  to="/exams"
                  className="inline-flex items-center gap-1 text-[11px] text-faint transition-colors hover:text-accent"
                >
                  {t('grades.allAssessments')}
                  <ArrowRight size={12} />
                </Link>
              }
            />
            {recent.length ? (
              <div className="space-y-1">
                {recent.map((result) => (
                  <button
                    key={result.exam.key}
                    type="button"
                    onClick={() =>
                      openDialog({ kind: 'examResult', examKey: result.exam.key })
                    }
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/[0.035]"
                  >
                    <span
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border"
                      style={{
                        borderColor: ACCENTS[result.exam.accent].line,
                        background: ACCENTS[result.exam.accent].soft,
                        color: ACCENTS[result.exam.accent].hex,
                      }}
                    >
                      {result.state.status === 'passed' ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <AlertCircle size={14} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-medium text-ink">
                        {result.exam.label[lang]}
                      </span>
                      <span className="mt-0.5 block truncate text-[9.5px] text-faint">
                        {result.exam.moduleTitle[lang]} ·{' '}
                        {t('misc.semesterNumber', { n: result.exam.semester })}
                        {result.state.date
                          ? ` · ${formatDate(result.state.date, lang, 'd. MMM yyyy')}`
                          : ''}
                      </span>
                    </span>
                    <Badge tone={result.state.status === 'passed' ? 'accent' : 'danger'}>
                      {result.grade !== null
                        ? formatGrade(result.grade, lang)
                        : result.state.status === 'passed'
                          ? t('exam.passed')
                          : t('exam.failed')}
                    </Badge>
                    <Pencil size={12} className="shrink-0 text-faint" />
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Award size={20} />}
                title={t('grades.noResults')}
                hint={t('grades.noResultsHint')}
              />
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-5">
          <section className="panel relative overflow-hidden p-4 sm:p-5">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(380px_180px_at_90%_-10%,rgba(99,179,237,0.12),transparent_70%)]"
            />
            <div className="relative">
              <div className="flex items-center gap-2">
                <Target size={14} className="text-accent" />
                <span className="eyebrow">{t('grades.nextExam')}</span>
              </div>
              {next && nextState ? (
                <>
                  <h2 className="mt-2 text-[15px] font-semibold leading-snug tracking-[-0.02em] text-ink">
                    {next.label[lang]}
                  </h2>
                  <p className="mt-1 text-[10.5px] text-faint">
                    {next.moduleTitle[lang]} · {next.ects} ECTS · {t(EXAM_KIND_KEY[next.kind])}
                  </p>
                  {nextState.date ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge tone="info">
                        <CalendarDays size={10} />
                        {formatDate(nextState.date, lang, 'd. MMM yyyy')}
                      </Badge>
                      <Badge tone="accent">{countdownLabel(nextState.date, lang)}</Badge>
                    </div>
                  ) : (
                    <Badge tone="warn" className="mt-3">
                      {t('exams.noDate')}
                    </Badge>
                  )}
                  {nextCheck ? (
                    <div className="mt-4 rounded-xl border border-line bg-bg/30 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-medium text-muted">
                          {t('grades.readiness')}
                        </span>
                        <span className="mono text-[9.5px] text-faint">
                          {nextCheck.done}/{nextCheck.total}
                        </span>
                      </div>
                      <ProgressBar
                        value={nextCheck.total ? nextCheck.done / nextCheck.total : 0}
                        className="mt-2"
                        height={4}
                      />
                    </div>
                  ) : null}
                  {sortedExams.length > 1 ? (
                    <div className="mt-4 space-y-1.5 border-t border-line/70 pt-3">
                      {sortedExams
                        .filter((item) => item.exam.key !== next.key)
                        .slice(0, 3)
                        .map((item) => (
                          <div
                            key={item.exam.key}
                            className="flex items-center justify-between gap-2 text-[10px]"
                          >
                            <span className="min-w-0 truncate text-muted">
                              {item.exam.label[lang]}
                            </span>
                            <span className="mono shrink-0 text-faint">
                              {item.state.date
                                ? formatDate(item.state.date, lang, 'd. MMM')
                                : '–'}
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : null}
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="soft"
                      size="sm"
                      className="flex-1"
                      onClick={() => openDialog({ kind: 'examResult', examKey: next.key })}
                    >
                      <Pencil size={13} />
                      {t('exams.setResult')}
                    </Button>
                    <Link
                      to="/exams"
                      className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-line bg-surface2 px-2.5 text-[12px] font-medium text-ink transition-colors hover:border-line-strong hover:bg-surface3"
                    >
                      {t('grades.checklist')}
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="mt-2 text-[15px] font-semibold leading-snug tracking-[-0.02em] text-ink">
                    {t('grades.noExamDate')}
                  </h2>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-faint">
                    {t('grades.noExamDateHint')}
                  </p>
                  <div className="mt-4 flex items-baseline gap-2 rounded-xl border border-line bg-bg/30 px-3 py-2.5">
                    <span className="mono text-[24px] font-semibold leading-none text-ink">
                      {examPeriodDays}
                    </span>
                    <span className="text-[10.5px] text-faint">
                      {t('grades.daysToExamPeriod')}
                    </span>
                  </div>
                  <Link
                    to="/exams"
                    className="mt-3 inline-flex h-8 w-full items-center justify-center gap-2 rounded-lg border border-accent/20 bg-accent/10 px-2.5 text-[12px] font-medium text-accent transition-colors hover:bg-accent/15"
                  >
                    <GraduationCap size={13} />
                    {t('grades.allAssessments')}
                  </Link>
                </>
              )}
            </div>
          </section>

          <section className="panel p-4">
            <SectionHeading
              title={t('grades.openAssessments')}
              hint={t('grades.openAssessmentsHint', { semester })}
              action={
                <Link
                  to="/exams"
                  className="inline-flex items-center gap-1 text-[11px] text-faint transition-colors hover:text-accent"
                >
                  {t('misc.seeAll')}
                  <ArrowRight size={12} />
                </Link>
              }
            />
            {openAssessments.length ? (
              <div className="space-y-1">
                {openAssessments.map((exam) => (
                  <button
                    key={exam.key}
                    type="button"
                    onClick={() => openDialog({ kind: 'examResult', examKey: exam.key })}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/[0.035]"
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: ACCENTS[exam.accent].hex }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11.5px] font-medium text-ink">
                        {exam.label[lang]}
                      </span>
                      <span className="mt-0.5 block truncate text-[9.5px] text-faint">
                        {t(EXAM_KIND_KEY[exam.kind])} · {exam.ects} ECTS
                      </span>
                    </span>
                    <Pencil size={11} className="shrink-0 text-faint" />
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState icon={<CheckCircle2 size={20} />} title={t('grades.allDone')} />
            )}
          </section>

          <section className="panel p-4">
            <SectionHeading
              title={t('grades.examPeriod')}
              hint={t('exams.windowValue')}
              action={<CalendarDays size={13} className="text-faint" />}
            />
            <dl className="space-y-2">
              <InfoRow label={t('exams.registration')} value={t('exams.registrationValue')} />
              <InfoRow label={t('exams.withdrawal')} value={t('exams.withdrawalValue')} />
              <InfoRow
                label={t('exams.publication')}
                value={formatDate(EXAM_DATES_PUBLISHED, lang, 'd. MMM yyyy')}
              />
            </dl>
            <p className="mt-3 border-t border-line/70 pt-3 text-[10px] leading-relaxed text-faint">
              {t('exams.registrationInfo')}
            </p>
          </section>

          <section className="panel-flat p-4">
            <div className="flex items-start gap-2.5">
              <GraduationCap size={14} className="mt-0.5 shrink-0 text-accent" />
              <p className="text-[10.5px] leading-relaxed text-faint">{t('grades.scaleHint')}</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

function SummaryStat({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string
  sub: string
  color: string
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-bg/40 px-3 py-2.5">
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-[2px]"
        style={{ background: color, opacity: 0.75 }}
      />
      <div className="text-[9px] uppercase tracking-[0.1em] text-faint">{label}</div>
      <div className="mono mt-1.5 text-[20px] font-semibold leading-none tracking-[-0.04em] text-ink">
        {value}
      </div>
      <div className="mt-1 text-[9.5px] leading-snug text-faint">{sub}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-[10.5px]">
      <dt className="text-faint">{label}</dt>
      <dd className="max-w-[65%] text-right font-medium leading-snug text-muted">{value}</dd>
    </div>
  )
}

function countdownLabel(date: string, lang: 'de' | 'en') {
  const days = Math.max(0, daysUntil(date))
  if (days === 0) return lang === 'de' ? 'heute' : 'today'
  if (days === 1) return lang === 'de' ? 'morgen' : 'tomorrow'
  return lang === 'de' ? `in ${days} Tagen` : `in ${days} days`
}
