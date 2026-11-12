import { Suspense, useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Award,
  BookOpen,
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  Languages,
  Settings as SettingsIcon,
  Share2,
  TrendingUp,
} from 'lucide-react'
import { usePlanner } from '../store'
import { useUI } from '../ui-store'
import { useT } from '../lib/useT'
import { cn } from '../lib/cn'
import { semesterStats, tasksForDate } from '../lib/planner'
import { isoWeek, semesterWeek, todayISO } from '../lib/date'
import { EXAM_DEFS } from '../data/curriculum'
import { ProgressBar, GithubMark } from './ui'

const REPO_URL = 'https://github.com/nahcmon/esem-planner'

const NAV = [
  { to: '/', key: 'nav.today', icon: LayoutDashboard, end: true, group: 'plan', mobile: true },
  { to: '/week', key: 'nav.week', icon: CalendarDays, end: false, group: 'plan', mobile: false },
  { to: '/grades', key: 'nav.grades', icon: Award, end: false, group: 'study', mobile: true },
  { to: '/exams', key: 'nav.exams', icon: GraduationCap, end: false, group: 'study', mobile: true },
  { to: '/modules', key: 'nav.modules', icon: BookOpen, end: false, group: 'study', mobile: true },
  { to: '/progress', key: 'nav.progress', icon: TrendingUp, end: false, group: 'study', mobile: true },
] as const

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="ESEM Planner">
      <span className="relative grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-[9px] border border-accent/30 bg-accent/10">
        <span className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(201,247,106,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(201,247,106,0.18)_1px,transparent_1px)] [background-size:6px_6px]" />
        <span className="mono relative text-[15px] font-bold leading-none text-accent">E</span>
      </span>
      {compact ? null : (
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] font-semibold leading-tight tracking-[-0.02em] text-ink">
            ESEM Planner
          </span>
          <span className="eyebrow block text-[8.5px] leading-tight">HHN · Künzelsau</span>
        </span>
      )}
    </Link>
  )
}

function isActive(pathname: string, to: string, end: boolean): boolean {
  if (end) return pathname === to
  return pathname === to || pathname.startsWith(`${to}/`)
}

function SidebarNav() {
  const { t } = useT()
  const pathname = useLocation().pathname
  const todayCount = useTodayCount()
  const examCount = useExamCount()
  const countFor = (to: string) => (to === '/' ? todayCount : to === '/exams' ? examCount : 0)
  return (
    <>
      <div className="eyebrow px-3 pb-1.5">{t('nav.groupPlan')}</div>
      {NAV.filter((item) => item.group === 'plan').map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="nav-item"
          data-active={isActive(pathname, item.to, item.end)}
        >
          <item.icon size={15} strokeWidth={1.9} />
          {t(item.key)}
          {countFor(item.to) > 0 ? (
            <span className="mono ml-auto rounded-full border border-line bg-surface2 px-1.5 py-0.5 text-[9px] text-faint">
              {countFor(item.to)}
            </span>
          ) : null}
        </Link>
      ))}
      <div className="eyebrow px-3 pb-1.5 pt-5">{t('nav.groupStudy')}</div>
      {NAV.filter((item) => item.group === 'study').map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="nav-item"
          data-active={isActive(pathname, item.to, item.end)}
        >
          <item.icon size={15} strokeWidth={1.9} />
          {t(item.key)}
          {countFor(item.to) > 0 ? (
            <span className="mono ml-auto rounded-full border border-line bg-surface2 px-1.5 py-0.5 text-[9px] text-faint">
              {countFor(item.to)}
            </span>
          ) : null}
        </Link>
      ))}
      <div className="mt-5 border-t border-line pt-3">
        <Link
          to="/settings"
          className="nav-item"
          data-active={isActive(pathname, '/settings', false)}
        >
          <SettingsIcon size={15} strokeWidth={1.9} />
          {t('nav.settings')}
        </Link>
      </div>
    </>
  )
}

function SemesterCard() {
  const { t, lang } = useT()
  const state = usePlanner()
  const semester = state.settings.currentSemester
  const stats = semesterStats(state, semester)
  return (
    <Link
      to="/settings"
      className="mt-5 block rounded-xl border border-line bg-surface/70 px-3 py-3 transition-colors hover:border-line-strong"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="eyebrow">{t('common.currentSemester')}</span>
        <span className="mono text-[10px] text-faint">
          {semester.toString().padStart(2, '0')} / 07
        </span>
      </div>
      <div className="mt-1 flex items-center gap-1.5">
        <span className="text-[12.5px] font-medium text-ink">
          {lang === 'de' ? 'Semester' : 'Semester'} {semester}
        </span>
        <span className="text-[11px] text-faint">· {lang === 'de' ? 'WS 26/27' : 'WS 26/27'}</span>
      </div>
      <ProgressBar value={stats.progress} className="mt-2.5" height={4} />
      <div className="mt-1.5 flex items-center justify-between text-[10px] text-faint">
        <span className="mono">{stats.ects} ECTS</span>
        <span className="mono">{Math.round(stats.progress * 100)} %</span>
      </div>
    </Link>
  )
}

function Sidebar() {
  const { t, lang } = useT()
  const openShare = useUI((state) => state.openDialog)
  const setLang = usePlanner((state) => state.setLang)
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col border-r border-line bg-[#0a0d0b]/85 backdrop-blur-xl md:flex">
      <div className="px-5 pb-2 pt-6">
        <Logo />
      </div>
      <div className="px-4">
        <SemesterCard />
      </div>
      <nav className="mt-5 flex-1 overflow-y-auto px-3 pb-4">
        <SidebarNav />
      </nav>
      <div className="space-y-1.5 border-t border-line p-3">
        <button
          type="button"
          onClick={() => openShare({ kind: 'share' })}
          className="flex w-full items-center justify-between rounded-lg border border-accent/20 bg-accent/[0.07] px-3 py-2 text-[12px] font-medium text-accent transition-colors hover:bg-accent/[0.12]"
        >
          <span className="flex items-center gap-2">
            <Share2 size={13} />
            {t('share.title')}
          </span>
          <span className="mono text-[9px] opacity-60">QR</span>
        </button>
        <button
          type="button"
          onClick={() => setLang(lang === 'de' ? 'en' : 'de')}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[11.5px] text-muted transition-colors hover:bg-white/5 hover:text-ink"
        >
          <span className="flex items-center gap-2">
            <Languages size={13} />
            {t('settings.language')}
          </span>
          <span className="mono rounded border border-line bg-surface2 px-1.5 py-0.5 text-[9px] text-faint">
            {lang === 'de' ? 'DE' : 'EN'}
          </span>
        </button>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-lg px-3 py-2 text-[11px] text-faint transition-colors hover:bg-white/5 hover:text-muted"
        >
          <span className="flex items-center gap-2">
            <GithubMark size={13} />
            {t('settings.openSource')}
          </span>
          <span className="mono text-[9px] opacity-60">MIT</span>
        </a>
        <div className="flex items-center justify-between px-3 pt-1.5 text-[9px] text-faint/70">
          <span>{t('misc.localOnly')}</span>
          <span className="mono">v1.0.0</span>
        </div>
      </div>
    </aside>
  )
}

function MobileHeader() {
  const { t } = useT()
  const openShare = useUI((state) => state.openDialog)
  const pathname = useLocation().pathname
  const week = semesterWeek()
  return (
    <header className="sticky top-0 z-30 flex h-[54px] items-center justify-between gap-3 border-b border-line bg-[#080a09]/88 px-4 backdrop-blur-xl md:hidden">
      <Logo compact />
      <div className="flex items-center gap-2">
        <span className="mono hidden text-[9.5px] text-faint min-[380px]:inline">
          KW {isoWeek()} · {t('today.semesterWeek', { week, total: 17 })}
        </span>
        <NavLink
          to="/week"
          aria-label={t('nav.week')}
          className={cn('icon-button', pathname.startsWith('/week') && 'text-accent')}
        >
          <CalendarDays size={15} />
        </NavLink>
        <button
          type="button"
          aria-label={t('share.title')}
          onClick={() => openShare({ kind: 'share' })}
          className="icon-button"
        >
          <Share2 size={15} />
        </button>
        <NavLink
          to="/settings"
          aria-label={t('nav.settings')}
          className={cn('icon-button', pathname === '/settings' && 'text-accent')}
        >
          <SettingsIcon size={15} />
        </NavLink>
      </div>
    </header>
  )
}

function MobileNav() {
  const { t } = useT()
  const pathname = useLocation().pathname
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[#080a09]/94 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-5">
        {NAV.filter((item) => item.mobile).map((item) => {
          const active = isActive(pathname, item.to, item.end)
          return (
            <NavLink key={item.to} to={item.to} className="bottom-nav-item" data-active={active}>
              <item.icon size={19} strokeWidth={active ? 2.15 : 1.8} />
              <span>{t(item.key)}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

function PageFallback() {
  return (
    <div className="page-enter space-y-5" aria-busy="true" aria-label="Loading">
      <div className="space-y-2.5">
        <div className="h-2.5 w-28 animate-pulse rounded bg-surface3" />
        <div className="h-8 w-56 animate-pulse rounded-lg bg-surface3" />
        <div className="h-3 w-80 max-w-full animate-pulse rounded bg-surface2" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)]">
        <div className="h-[280px] animate-pulse rounded-2xl border border-line bg-surface/60" />
        <div className="h-[280px] animate-pulse rounded-2xl border border-line bg-surface/40" />
      </div>
      <div className="h-[220px] animate-pulse rounded-2xl border border-line bg-surface/30" />
    </div>
  )
}

function OfflineWatcher() {
  const toast = useUI((state) => state.toast)
  useEffect(() => {
    const offline = () => toast('toast.offline', undefined, 'error')
    const online = () => toast('toast.online', undefined, 'success')
    window.addEventListener('offline', offline)
    window.addEventListener('online', online)
    return () => {
      window.removeEventListener('offline', offline)
      window.removeEventListener('online', online)
    }
  }, [toast])
  return null
}

export function AppShell() {
  return (
    <div className="min-h-dvh">
      <OfflineWatcher />
      <Sidebar />
      <MobileHeader />
      <main className="mx-auto w-full max-w-[1240px] px-4 pb-[calc(82px+env(safe-area-inset-bottom))] pt-6 sm:px-6 md:ml-[252px] md:w-[calc(100%-252px)] md:max-w-none md:px-8 md:pb-14 md:pt-9 lg:px-11">
        <div className="mx-auto w-full max-w-[1180px]">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <MobileNav />
    </div>
  )
}

export function useTodayCount() {
  return usePlanner(
    (state) => tasksForDate(state, todayISO()).filter((task) => !task.done).length,
  )
}

export function useExamCount() {
  const exams = usePlanner((state) => state.examStates)
  const semester = usePlanner((state) => state.settings.currentSemester)
  return EXAM_DEFS.filter(
    (exam) => exam.semester === semester && exams[exam.key]?.status !== 'passed',
  ).length
}
