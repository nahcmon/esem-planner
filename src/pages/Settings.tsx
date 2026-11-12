import { useEffect, useState } from 'react'
import {
  BookOpen,
  Database,
  Download,
  ExternalLink,
  FileJson,
  HardDrive,
  Info,
  Languages,
  Link2,
  MonitorSmartphone,
  Moon,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
} from 'lucide-react'
import { usePlanner } from '../store'
import { useUI } from '../ui-store'
import { useT } from '../lib/useT'
import { formatDate, todayISO } from '../lib/date'
import { createPayload, normalizeState, shareSummary } from '../lib/share'
import { downloadFile } from '../lib/clipboard'
import { GithubMark } from '../components/ui'
import { CURRICULUM, TOTAL_ECTS } from '../data/curriculum'
import {
  Badge,
  Button,
  Field,
  Input,
  PageHeader,
  SectionHeading,
  Segmented,
  Select,
  StatTile,
} from '../components/ui'

const STORAGE_KEY = 'esem-planner:v1'
const REPO_URL = 'https://github.com/nahcmon/esem-planner'
const APP_VERSION = '1.0.0'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

export function SettingsPage() {
  const { t, lang } = useT()
  const state = usePlanner()
  const toast = useUI((store) => store.toast)
  const openDialog = useUI((store) => store.openDialog)
  const setLang = usePlanner((store) => store.setLang)
  const setCurrentSemester = usePlanner((store) => store.setCurrentSemester)
  const setGoals = usePlanner((store) => store.setGoals)
  const resetSeed = usePlanner((store) => store.resetSeed)
  const clearAll = usePlanner((store) => store.clearAll)

  const [weeklyHours, setWeeklyHours] = useState(String(state.settings.weeklyGoalMinutes / 60))
  const [dailyHours, setDailyHours] = useState(String(state.settings.dailyGoalMinutes / 60))
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)
  const [standalone, setStandalone] = useState(
    typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches,
  )
  const [storageBytes, setStorageBytes] = useState(0)

  useEffect(() => {
    setWeeklyHours(String(state.settings.weeklyGoalMinutes / 60))
    setDailyHours(String(state.settings.dailyGoalMinutes / 60))
  }, [state.settings.weeklyGoalMinutes, state.settings.dailyGoalMinutes])

  useEffect(() => {
    const update = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY) ?? ''
        setStorageBytes(new Blob([raw]).size)
      } catch {
        setStorageBytes(0)
      }
    }
    update()
    const id = window.setInterval(update, 4000)
    return () => window.clearInterval(id)
  }, [state.updatedAt])

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as InstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    const media = window.matchMedia('(display-mode: standalone)')
    const onChange = () => setStandalone(media.matches)
    media.addEventListener?.('change', onChange)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      media.removeEventListener?.('change', onChange)
    }
  }, [])

  const summary = shareSummary(state)
  const currentModules = CURRICULUM.filter(
    (module) => module.semester === state.settings.currentSemester,
  )

  const saveGoals = () => {
    const weekly = Math.max(0, Math.min(80, Number(weeklyHours) || 0)) * 60
    const daily = Math.max(0, Math.min(16, Number(dailyHours) || 0)) * 60
    setGoals(Math.round(weekly), Math.round(daily))
    toast('settings.saved', undefined, 'success')
  }

  const exportJson = () => {
    const payload = createPayload(state, false)
    downloadFile(
      `esem-planner-${todayISO()}.json`,
      JSON.stringify(payload, null, 2),
    )
    toast('settings.exported', undefined, 'success')
  }

  const importFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as unknown
      const raw =
        typeof parsed === 'object' && parsed !== null && 'state' in parsed
          ? (parsed as { state: unknown }).state
          : parsed
      const normalized = normalizeState(raw)
      if (!normalized) throw new Error('invalid')
      openDialog({
        kind: 'import',
        payload: {
          app: 'esem-planner',
          schema: 1,
          exportedAt: new Date().toISOString(),
          compact: false,
          state: normalized,
        },
        source: 'file',
      })
    } catch {
      toast('share.invalid', undefined, 'error')
    }
  }

  const reset = () => {
    openDialog({
      kind: 'confirm',
      title: t('settings.reset'),
      body: t('settings.resetConfirm'),
      confirmLabel: t('common.reset'),
      tone: 'danger',
      onConfirm: () => {
        resetSeed()
        toast('settings.resetDone', undefined, 'success')
      },
    })
  }

  const wipe = () => {
    openDialog({
      kind: 'confirm',
      title: t('settings.deleteAll'),
      body: t('settings.deleteAllConfirm'),
      confirmLabel: t('common.delete'),
      tone: 'danger',
      onConfirm: () => {
        clearAll()
        toast('settings.resetDone', undefined, 'success')
      },
    })
  }

  const install = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const result = await installPrompt.userChoice
    if (result.outcome === 'accepted') {
      toast('settings.installed', undefined, 'success')
      setInstallPrompt(null)
      setStandalone(true)
    }
  }

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow={t('settings.eyebrow')}
        title={t('settings.title')}
        description={t('settings.aboutText')}
        meta={
          <>
            <Badge tone="accent">
              {t('settings.version', { version: APP_VERSION })}
            </Badge>
            <Badge>
              <ShieldCheck size={10} />
              {t('common.savedLocally')}
            </Badge>
            <Badge tone="muted">
              <Moon size={10} />
              {t('settings.darkOnly')}
            </Badge>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(310px,0.85fr)]">
        <div className="min-w-0 space-y-4">
          <section className="panel p-4 sm:p-5">
            <SectionHeading title={t('settings.language')} hint={t('settings.languageHint')} />
            <div className="flex flex-wrap items-center gap-3">
              <Segmented
                value={state.settings.lang}
                onChange={(value) => {
                  setLang(value)
                  toast('settings.languageChanged', undefined, 'success')
                }}
                options={[
                  { value: 'de', label: t('settings.german') },
                  { value: 'en', label: t('settings.english') },
                ]}
                ariaLabel={t('settings.language')}
              />
              <span className="inline-flex items-center gap-1.5 text-[10.5px] text-faint">
                <Languages size={12} />
                {lang === 'de' ? 'Deutsch' : 'English'}
              </span>
            </div>
          </section>

          <section className="panel p-4 sm:p-5">
            <SectionHeading
              title={t('settings.semester')}
              hint={t('settings.semesterHint')}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('settings.semester')}>
                <Select
                  value={state.settings.currentSemester}
                  onChange={(event) =>
                    setCurrentSemester(Number(event.target.value) as 1 | 2 | 3 | 4 | 5 | 6 | 7)
                  }
                >
                  {([1, 2, 3, 4, 5, 6, 7] as const).map((semester) => (
                    <option key={semester} value={semester}>
                      {t('modules.semesterN', { n: semester })}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="rounded-xl border border-line bg-bg/30 px-3.5 py-3">
                <div className="eyebrow">{t('common.currentSemester')}</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="mono text-[22px] font-semibold leading-none text-ink">
                    {state.settings.currentSemester}
                  </span>
                  <span className="text-[10.5px] text-faint">
                    {currentModules.length} {t('common.modules')} ·{' '}
                    {currentModules.reduce((sum, module) => sum + module.ects, 0)} ECTS
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="panel p-4 sm:p-5">
            <SectionHeading title={t('settings.goals')} hint={t('progress.goalWeek', { hours: Number(weeklyHours) || 0 })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('settings.weeklyGoal')} hint={t('settings.hoursPerWeek')}>
                <Input
                  type="number"
                  min={0}
                  max={80}
                  step={0.5}
                  value={weeklyHours}
                  onChange={(event) => setWeeklyHours(event.target.value)}
                  onBlur={saveGoals}
                />
              </Field>
              <Field label={t('settings.dailyGoal')} hint={t('settings.hoursPerDay')}>
                <Input
                  type="number"
                  min={0}
                  max={16}
                  step={0.5}
                  value={dailyHours}
                  onChange={(event) => setDailyHours(event.target.value)}
                  onBlur={saveGoals}
                />
              </Field>
            </div>
          </section>

          <section className="panel p-4 sm:p-5">
            <SectionHeading title={t('settings.data')} hint={t('settings.dataHint')} />
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="primary" onClick={() => openDialog({ kind: 'share' })}>
                <Link2 size={15} />
                {t('settings.share')}
              </Button>
              <Button variant="secondary" onClick={exportJson}>
                <Download size={15} />
                {t('settings.export')}
              </Button>
              <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-line bg-surface2 px-3.5 text-[13px] font-medium text-ink transition-colors hover:border-line-strong hover:bg-surface3">
                <Upload size={15} />
                {t('settings.import')}
                <input
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(event) => void importFile(event.target.files?.[0])}
                />
              </label>
              <Button variant="secondary" onClick={reset}>
                <RotateCcw size={15} />
                {t('settings.reset')}
              </Button>
            </div>
            <div className="mt-3 rounded-xl border border-line bg-bg/30 px-3.5 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[10.5px] text-faint">
                  <FileJson size={12} />
                  {t('settings.dataSummary', {
                    tasks: summary.tasks,
                    sessions: summary.sessions,
                    topics: summary.topics,
                  })}
                </span>
                <span className="mono text-[9.5px] text-faint/70">
                  {t('settings.dataSince', {
                    date: formatDate(new Date(state.createdAt), lang, 'd. MMM yyyy'),
                  })}
                </span>
              </div>
              <div className="mt-1 text-[10px] leading-relaxed text-faint/70">
                {t('settings.exportHint')} {t('settings.importHint')}
              </div>
            </div>
            <div className="mt-3">
              <Button variant="ghost" size="sm" className="text-rose hover:text-rose" onClick={wipe}>
                <Trash2 size={13} />
                {t('settings.deleteAll')}
              </Button>
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-4">
          <section className="panel p-4">
            <SectionHeading title={t('settings.storage')} hint={t('settings.dataHint')} />
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface2 text-muted">
                <HardDrive size={16} />
              </span>
              <div className="min-w-0">
                <div className="mono text-[16px] font-semibold leading-none text-ink">
                  {formatBytes(storageBytes)}
                </div>
                <div className="mt-1 text-[10px] text-faint">
                  {t('settings.storageUsed', { size: formatBytes(storageBytes) })}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5">
              <span className="mono truncate text-[9.5px] text-faint">
                {t('settings.storageKey', { key: STORAGE_KEY })}
              </span>
              <Badge tone="muted">localStorage</Badge>
            </div>
            {storageBytes > 4_200_000 ? (
              <p className="mt-2 text-[10.5px] leading-relaxed text-amber">
                {t('settings.storageWarning')}
              </p>
            ) : null}
          </section>

          <section className="panel p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-accent/20 bg-accent/[0.07] text-accent">
                <MonitorSmartphone size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold text-ink">{t('settings.install')}</div>
                <p className="mt-1 text-[10.5px] leading-relaxed text-faint">
                  {t('settings.installHint')}
                </p>
              </div>
            </div>
            <div className="mt-3">
              {standalone ? (
                <Badge tone="accent">
                  <Smartphone size={10} />
                  {t('settings.installed')}
                </Badge>
              ) : installPrompt ? (
                <Button variant="soft" size="sm" className="w-full" onClick={() => void install()}>
                  <MonitorSmartphone size={13} />
                  {t('settings.install')}
                </Button>
              ) : (
                <p className="text-[10px] leading-relaxed text-faint">
                  {t('settings.installManual')}
                </p>
              )}
            </div>
          </section>

          <section className="panel p-4">
            <div className="flex items-center gap-2">
              <Info size={14} className="text-accent" />
              <span className="eyebrow">{t('settings.about')}</span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">{t('settings.aboutText')}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <StatTile
                label={t('common.semester')}
                value={state.settings.currentSemester}
                sub={`${TOTAL_ECTS} ECTS`}
              />
              <StatTile
                label={t('common.modules')}
                value={CURRICULUM.length}
                sub={`${TOTAL_ECTS} ECTS`}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-accent transition-opacity hover:opacity-80"
              >
                <GithubMark size={13} />
                {t('settings.openSource')}
                <ExternalLink size={10} />
              </a>
              <span className="ml-auto text-[9.5px] text-faint">v{APP_VERSION} · MIT</span>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-faint">{t('settings.githubHint')}</p>
          </section>

          <section className="panel p-4">
            <SectionHeading title={t('settings.privacy')} hint={t('settings.noAccount')} />
            <p className="text-[10.5px] leading-relaxed text-faint">{t('settings.privacyText')}</p>
            <div className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-[10px] text-faint">
              <ShieldCheck size={12} className="text-accent" />
              {t('settings.madeFor')}
            </div>
          </section>

          <section className="panel p-4">
            <SectionHeading title={t('settings.sources')} hint={t('settings.demoNotice')} />
            <ul className="space-y-1.5 text-[10px] leading-relaxed text-faint">
              <li className="flex gap-2">
                <BookOpen size={11} className="mt-0.5 shrink-0" />
                {t('settings.sourceSpo')}
              </li>
              <li className="flex gap-2">
                <BookOpen size={11} className="mt-0.5 shrink-0" />
                {t('settings.sourceHandbook')}
              </li>
              <li className="flex gap-2">
                <Database size={11} className="mt-0.5 shrink-0" />
                {t('settings.sourceCalendar')}
              </li>
              <li className="flex gap-2">
                <RotateCcw size={11} className="mt-0.5 shrink-0" />
                {t('settings.sourceSchedule')}
              </li>
            </ul>
            <div className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-[9.5px] text-faint/70">
              <GithubMark size={11} />
              github.com/nahcmon/esem-planner
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
