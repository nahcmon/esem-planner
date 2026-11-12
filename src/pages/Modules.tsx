import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Circle,
  Cpu,
  FlaskConical,
  GraduationCap,
  Layers,
  ListChecks,
  Plus,
  Search,
  Target,
} from 'lucide-react'
import type { ModuleDef, ModuleStatus, TopicStatus } from '../types'
import type { MessageKey } from '../i18n'
import { usePlanner } from '../store'
import { useUI } from '../ui-store'
import { useT } from '../lib/useT'
import { cn } from '../lib/cn'
import {
  examChecklistProgress,
  moduleStats,
  sortTopics,
  topicsForModule,
} from '../lib/planner'
import { formatDate, formatDuration } from '../lib/date'
import { componentTitle } from '../lib/display'
import { ACCENTS, PRIORITY_COLORS } from '../lib/accents'
import { EXAM_KIND_KEY, TOPIC_STATUS_KEY } from '../lib/labels'
import { CURRICULUM, MODULE_BY_ID, SEMESTER_ECTS, TOTAL_ECTS } from '../data/curriculum'
import { TaskRow } from '../components/TaskRow'
import {
  AccentDot,
  Badge,
  Button,
  EmptyState,
  Input,
  PageHeader,
  ProgressBar,
  Ring,
  SectionHeading,
  StatTile,
  Textarea,
} from '../components/ui'

const MODULE_STATUS_KEY: Record<ModuleStatus, MessageKey> = {
  planned: 'modules.status.planned',
  active: 'modules.status.active',
  completed: 'modules.status.completed',
}

function ModuleIcon({ module, size = 15 }: { module: ModuleDef; size?: number }) {
  const Icon =
    module.kind === 'fundamentals'
      ? FlaskConical
      : module.kind === 'internship'
        ? Briefcase
        : module.kind === 'thesis'
          ? GraduationCap
          : module.kind === 'elective'
            ? Layers
            : Cpu
  return <Icon size={size} strokeWidth={1.9} />
}

export function ModulesPage() {
  const { moduleId } = useParams<{ moduleId?: string }>()
  const module = moduleId ? MODULE_BY_ID.get(moduleId) : undefined
  if (moduleId) return <ModuleDetail module={module} />
  return <ModuleList />
}

function ModuleList() {
  const { t, lang } = useT()
  const state = usePlanner()
  const [semester, setSemester] = useState<number | 'all'>(state.settings.currentSemester)
  const [search, setSearch] = useState('')

  const query = search.trim().toLowerCase()
  const modules = CURRICULUM.filter((module) => {
    if (semester !== 'all' && module.semester !== semester) return false
    if (!query) return true
    const haystack = [
      module.title.de,
      module.title.en,
      module.shortTitle.de,
      module.shortTitle.en,
      ...module.components.flatMap((component) => [
        component.title.de,
        component.title.en,
      ]),
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(query)
  })

  const semesterOptions: Array<number | 'all'> = ['all', 1, 2, 3, 4, 5, 6, 7]
  const earned = CURRICULUM.filter((module) => {
    const stats = moduleStats(state, module)
    return stats.progress >= 1
  }).reduce((sum, module) => sum + module.ects, 0)

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow={t('modules.eyebrow')}
        title={t('modules.title')}
        description={t('modules.summary')}
        meta={
          <>
            <Badge tone="accent">{TOTAL_ECTS} ECTS</Badge>
            <Badge>
              {t('misc.ectsOf', { done: earned, total: TOTAL_ECTS })}
            </Badge>
            <Badge tone="muted">
              {CURRICULUM.length} {t('common.modules')}
            </Badge>
          </>
        }
      />

      <div className="panel mb-5 p-2.5">
        <div className="flex flex-wrap items-center gap-1">
          {semesterOptions.map((option) => {
            const active = semester === option
            const label =
              option === 'all'
                ? t('modules.allSemesters')
                : `${t('modules.semesterN', { n: option })} · ${SEMESTER_ECTS[option] ?? 0}`
            return (
              <button
                key={String(option)}
                type="button"
                onClick={() => setSemester(option)}
                className={cn(
                  'rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors',
                  active
                    ? 'bg-accent/10 text-accent'
                    : 'text-faint hover:bg-white/[0.04] hover:text-muted',
                )}
              >
                {label}
              </button>
            )
          })}
          <div className="relative ml-auto min-w-[180px] flex-1 sm:max-w-[240px]">
            <Search
              size={13}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('modules.filterPlaceholder')}
              className="h-8 min-h-0 pl-7 text-[11.5px]"
            />
          </div>
        </div>
      </div>

      {modules.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((module, index) => {
            const stats = moduleStats(state, module)
            const accent = ACCENTS[module.accent]
            const status = state.moduleStates[module.id]?.status ?? 'planned'
            const statusTone =
              status === 'completed' ? 'accent' : status === 'active' ? 'info' : 'default'
            return (
              <Link
                key={module.id}
                to={`/modules/${module.id}`}
                className="panel group relative flex min-h-[190px] flex-col overflow-hidden p-4 transition-colors hover:border-line-strong"
                style={{ animationDelay: `${index * 28}ms` }}
              >
                <span
                  aria-hidden
                  className="absolute left-0 top-0 h-full w-[2px]"
                  style={{ background: accent.hex, opacity: 0.7 }}
                />
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="grid h-7 w-7 place-items-center rounded-lg border"
                      style={{
                        borderColor: accent.line,
                        background: accent.soft,
                        color: accent.hex,
                      }}
                    >
                      <ModuleIcon module={module} size={14} />
                    </span>
                    <span className="mono text-[9.5px] text-faint">
                      {t('modules.semesterN', { n: module.semester })} · {module.edv}
                    </span>
                  </div>
                  <Badge tone={statusTone}>{t(MODULE_STATUS_KEY[status])}</Badge>
                </div>

                <h3 className="mt-3 text-[15px] font-semibold leading-tight tracking-[-0.02em] text-ink transition-colors group-hover:text-accent">
                  {module.title[lang]}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-faint">
                  {module.summary[lang]}
                </p>

                <div className="mt-auto pt-4">
                  <div className="mb-1.5 flex items-center justify-between text-[10px] text-faint">
                    <span>
                      {stats.mastered} / {stats.topicsTotal} {t('common.topics')}
                    </span>
                    <span className="mono text-ink">{Math.round(stats.progress * 100)} %</span>
                  </div>
                  <ProgressBar value={stats.progress} color={accent.hex} height={4} />
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="mono flex items-center gap-1 text-[10px] text-muted">
                      {module.ects} ECTS · {module.sws} SWS
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-faint transition-colors group-hover:text-accent">
                      {t('common.details')}
                      <ArrowRight size={11} />
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="panel">
          <EmptyState
            icon={<Search size={22} />}
            title={t('modules.empty')}
            hint={t('modules.filterPlaceholder')}
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setSemester('all')
                }}
              >
                {t('common.reset')}
              </Button>
            }
          />
        </div>
      )}
    </div>
  )
}

function ModuleDetail({ module }: { module: ModuleDef | undefined }) {
  const { t, lang } = useT()
  const state = usePlanner()
  const openDialog = useUI((store) => store.openDialog)

  if (!module) {
    return (
      <div className="page-enter">
        <PageHeader eyebrow={t('modules.eyebrow')} title={t('modules.title')} />
        <div className="panel">
          <EmptyState
            icon={<BookOpen size={22} />}
            title={t('empty.modules')}
            action={
              <Link to="/modules" className="text-[12px] text-accent link-underline">
                {t('modules.allModules')}
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  const stats = moduleStats(state, module)
  const accent = ACCENTS[module.accent]
  const status = state.moduleStates[module.id]?.status ?? 'planned'
  const moduleTopics = sortTopics(topicsForModule(state, module))
  const componentIds = new Set(module.components.map((component) => component.id))
  const moduleTasks = state.tasks
    .filter((task) => componentIds.has(task.componentId) && !task.done)
    .sort((a, b) => a.priority - b.priority)
  const setModuleStatus = usePlanner((store) => store.setModuleStatus)
  const setTopicState = usePlanner((store) => store.setTopicState)
  const updateCustomTopic = usePlanner((store) => store.updateCustomTopic)

  const cycleStatus = (topicId: string, current: TopicStatus, custom: boolean) => {
    const next: TopicStatus =
      current === 'open' ? 'learning' : current === 'learning' ? 'mastered' : 'open'
    if (custom) updateCustomTopic(topicId, { status: next })
    else setTopicState(topicId, { status: next })
  }

  return (
    <div className="page-enter">
      <Link
        to="/modules"
        className="mb-4 inline-flex items-center gap-1.5 text-[11.5px] text-faint transition-colors hover:text-accent"
      >
        <ArrowLeft size={13} />
        {t('modules.allModules')}
      </Link>

      <PageHeader
        eyebrow={`${t('modules.semesterN', { n: module.semester })} · ${module.edv}`}
        title={
          <span className="inline-flex items-center gap-3">
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border"
              style={{ borderColor: accent.line, background: accent.soft, color: accent.hex }}
            >
              <ModuleIcon module={module} size={17} />
            </span>
            {module.title[lang]}
          </span>
        }
        description={module.summary[lang]}
        actions={
          <>
            <Button
              variant={status === 'completed' ? 'secondary' : 'soft'}
              onClick={() => setModuleStatus(module.id, status === 'completed' ? 'active' : 'completed')}
            >
              <CheckCircle2 size={15} />
              {status === 'completed' ? t('modules.reopen') : t('modules.markCompleted')}
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                openDialog({ kind: 'task', defaults: { componentId: module.components[0]?.id } })
              }
            >
              <Plus size={15} />
              {t('common.addTask')}
            </Button>
          </>
        }
        meta={
          <>
            <Badge tone={status === 'completed' ? 'accent' : status === 'active' ? 'info' : 'default'}>
              {t(MODULE_STATUS_KEY[status])}
            </Badge>
            <Badge>{t('modules.ectsInfo', { ects: module.ects, sws: module.sws })}</Badge>
            <Badge>{t('exam.parts', { count: module.examParts.length })}</Badge>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
        <div className="min-w-0 space-y-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatTile
              label={t('common.progress')}
              value={`${Math.round(stats.progress * 100)} %`}
              sub={t('modules.ectsDone', { done: Math.round(stats.progress * module.ects), total: module.ects })}
              color={accent.hex}
            />
            <StatTile
              label={t('common.topics')}
              value={`${stats.mastered}/${stats.topicsTotal}`}
              sub={t('modules.topicsMastered', { count: stats.mastered })}
            />
            <StatTile
              label={t('common.tasks')}
              value={`${stats.tasksDone}/${stats.tasksTotal}`}
              sub={t('modules.taskDone', { done: stats.tasksDone, total: stats.tasksTotal })}
            />
            <StatTile
              label={t('common.exams')}
              value={String(module.examParts.length)}
              sub={t('misc.ectsShort') + ' ' + module.ects}
            />
          </div>

          <section className="panel p-4 sm:p-5">
            <SectionHeading
              title={t('modules.components')}
              hint={t('modules.topics')}
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    openDialog({ kind: 'topic', componentId: module.components[0]?.id ?? '' })
                  }
                >
                  <Plus size={13} />
                  {t('modules.addTopic')}
                </Button>
              }
            />
            <div className="space-y-3">
              {module.components.map((component) => {
                const topics = moduleTopics.filter((topic) => topic.componentId === component.id)
                const mastered = topics.filter((topic) => topic.status === 'mastered').length
                return (
                  <div key={component.id} className="rounded-xl border border-line bg-bg/35">
                    <div className="flex items-start justify-between gap-3 border-b border-line/70 px-3.5 py-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[12.5px] font-semibold text-ink">
                            {component.title[lang]}
                          </h3>
                          <span className="mono text-[9px] text-faint">
                            {component.ects} ECTS · {component.sws} SWS
                          </span>
                        </div>
                        <div className="mt-1 text-[10px] text-faint">
                          {mastered} / {topics.length} {t('common.topics')}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openDialog({ kind: 'topic', componentId: component.id })}
                        className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] text-faint transition-colors hover:bg-white/5 hover:text-accent"
                      >
                        <Plus size={11} />
                        {t('modules.addTopic')}
                      </button>
                    </div>
                    <div className="p-1.5">
                      {topics.length ? (
                        topics.map((topic) => (
                          <div
                            key={topic.id}
                            className="flex items-start gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.025]"
                          >
                            <span
                              className="priority-mark mt-1"
                              style={{ background: PRIORITY_COLORS[topic.priority], opacity: 0.8 }}
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
                              <div
                                className={cn(
                                  'text-[11.5px] leading-snug text-ink',
                                  topic.status === 'mastered' && 'text-faint line-through',
                                )}
                              >
                                {topic.title[lang]}
                              </div>
                              {topic.note ? (
                                <div className="mt-0.5 truncate text-[10px] text-faint">
                                  {topic.note}
                                </div>
                              ) : null}
                            </button>
                            <button
                              type="button"
                              onClick={() => cycleStatus(topic.id, topic.status, topic.custom)}
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
                              {t(TOPIC_STATUS_KEY[topic.status])}
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="px-2 py-2 text-[10.5px] text-faint">
                          {t('modules.noTopics')}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="panel p-4 sm:p-5">
            <SectionHeading
              title={t('modules.exam')}
              hint={t('exams.infoBody')}
              action={
                <Link
                  to="/exams"
                  className="inline-flex items-center gap-1 text-[11px] text-faint transition-colors hover:text-accent"
                >
                  {t('nav.exams')}
                  <ChevronRight size={12} />
                </Link>
              }
            />
            <div className="space-y-2">
              {module.examParts.map((part) => {
                const key = `${module.id}:${part.id}`
                const examState = state.examStates[key]
                const check = examChecklistProgress(state, key)
                const status = examState?.status ?? 'planned'
                return (
                  <button
                    key={part.id}
                    type="button"
                    onClick={() => openDialog({ kind: 'examResult', examKey: key })}
                    className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-line bg-bg/35 px-3.5 py-3 text-left transition-colors hover:border-line-strong hover:bg-surface2/60"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-surface2 text-muted">
                      <GraduationCap size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-medium text-ink">
                        {part.label[lang]}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] text-faint">
                        <span>{t(EXAM_KIND_KEY[part.kind])}</span>
                        {part.durationMin ? (
                          <span>· {formatDuration(part.durationMin, lang)}</span>
                        ) : null}
                        {part.weight ? <span>· {t('exam.weight')} {part.weight}</span> : null}
                        {part.graded === false ? <span>· {t('exam.ungraded')}</span> : null}
                        {examState?.date ? (
                          <span>· {formatDate(examState.date, lang, 'd. MMM yyyy')}</span>
                        ) : (
                          <span>· {t('exam.dateUnknown')}</span>
                        )}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Badge
                        tone={
                          status === 'passed'
                            ? 'accent'
                            : status === 'failed'
                              ? 'danger'
                              : status === 'registered'
                                ? 'info'
                                : 'default'
                        }
                      >
                        {t(
                          status === 'passed'
                            ? 'exam.passed'
                            : status === 'failed'
                              ? 'exam.failed'
                              : status === 'registered'
                                ? 'exam.registered'
                                : 'exam.planned',
                        )}
                      </Badge>
                      <span className="mono hidden text-[9px] text-faint sm:inline">
                        {check.done}/{check.total}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {moduleTasks.length ? (
            <section className="panel p-4 sm:p-5">
              <SectionHeading
                title={t('common.tasks')}
                hint={`${moduleTasks.length} ${t('common.open').toLowerCase()}`}
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      openDialog({
                        kind: 'task',
                        defaults: { componentId: module.components[0]?.id },
                      })
                    }
                  >
                    <Plus size={13} />
                    {t('common.add')}
                  </Button>
                }
              />
              <ul className="divide-y divide-line/60">
                {moduleTasks.slice(0, 6).map((task) => (
                  <TaskRow key={task.id} task={task} showCourse={false} />
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="min-w-0 space-y-4">
          <section className="panel p-4">
            <div className="flex items-center gap-4">
              <Ring value={stats.progress} size={82} stroke={6} color={accent.hex}>
                <span className="mono text-[14px] font-semibold text-ink">
                  {Math.round(stats.progress * 100)}%
                </span>
              </Ring>
              <div className="min-w-0">
                <div className="eyebrow">{t('modules.moduleFocus')}</div>
                <div className="mt-1 text-[12.5px] font-medium leading-snug text-ink">
                  {t('modules.ectsDone', {
                    done: Math.round(stats.progress * module.ects),
                    total: module.ects,
                  })}
                </div>
                <div className="mt-1 text-[10.5px] text-faint">
                  {stats.mastered} {t('common.done').toLowerCase()} · {stats.learning}{' '}
                  {t('modules.topicStatus.learning').toLowerCase()}
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-3">
              <Button
                variant={status === 'completed' ? 'secondary' : 'soft'}
                size="sm"
                onClick={() =>
                  setModuleStatus(module.id, status === 'completed' ? 'active' : 'completed')
                }
              >
                <CheckCircle2 size={13} />
                {status === 'completed' ? t('modules.reopen') : t('common.done')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => openDialog({ kind: 'topic', componentId: module.components[0]?.id ?? '' })}
              >
                <Plus size={13} />
                {t('common.topic')}
              </Button>
            </div>
          </section>

          <section className="panel p-4">
            <SectionHeading title={t('modules.notes')} hint={t('modules.notesPlaceholder')} />
            <ModuleNotes key={module.id} moduleId={module.id} initial={state.moduleStates[module.id]?.note ?? ''} />
          </section>

          <section className="panel p-4">
            <SectionHeading title={t('modules.lectures')} />
            <div className="space-y-2">
              {module.components.map((component) => {
                const componentTopicRows = moduleTopics.filter(
                  (topic) => topic.componentId === component.id,
                )
                const mastered = componentTopicRows.filter(
                  (topic) => topic.status === 'mastered',
                ).length
                return (
                  <div key={component.id} className="flex items-center gap-2">
                    <AccentDot color={accent.hex} size={6} />
                    <span className="min-w-0 flex-1 truncate text-[11px] text-muted">
                      {componentTitle(component.id, lang)}
                    </span>
                    <span className="mono text-[9.5px] text-faint">
                      {mastered}/{componentTopicRows.length}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>

          {module.literature?.length ? (
            <section className="panel p-4">
              <SectionHeading title={t('misc.literature')} />
              <ul className="space-y-2">
                {module.literature.map((item) => (
                  <li key={item} className="flex gap-2 text-[10.5px] leading-relaxed text-faint">
                    <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-line-strong" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="flex items-center justify-between rounded-xl border border-line bg-surface/40 px-3.5 py-2.5">
            <span className="inline-flex items-center gap-1.5 text-[10px] text-faint">
              <ListChecks size={12} />
              {t('modules.topicsOpen', { count: stats.open })}
            </span>
            <Link
              to="/progress"
              className="inline-flex items-center gap-1 text-[10px] text-faint transition-colors hover:text-accent"
            >
              {t('nav.progress')}
              <ChevronRight size={11} />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}

function ModuleNotes({
  moduleId,
  initial,
}: {
  moduleId: string
  initial: string
}) {
  const { t } = useT()
  const [note, setNote] = useState(initial)
  const setModuleNote = usePlanner((state) => state.setModuleNote)
  const [saved, setSaved] = useState(true)
  return (
    <div>
      <Textarea
        value={note}
        placeholder={t('modules.notesPlaceholder')}
        onChange={(event) => {
          setNote(event.target.value)
          setSaved(false)
        }}
        onBlur={() => {
          setModuleNote(moduleId, note)
          setSaved(true)
        }}
        className="min-h-[120px] text-[12px]"
      />
      <div className="mt-1.5 flex items-center justify-between text-[9.5px] text-faint">
        <span>{t('common.savedLocally')}</span>
        <span className={saved ? 'text-faint' : 'text-amber'}>
          {saved ? t('common.saved') : t('dialog.unsaved')}
        </span>
      </div>
    </div>
  )
}
