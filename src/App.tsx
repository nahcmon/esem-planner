import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { Toasts } from './components/ui'
import { useUI } from './ui-store'
import { decodeShareCode } from './lib/share'

const TodayPage = lazy(() => import('./pages/Today').then((module) => ({ default: module.TodayPage })))
const WeekPage = lazy(() => import('./pages/Week').then((module) => ({ default: module.WeekPage })))
const ModulesPage = lazy(() =>
  import('./pages/Modules').then((module) => ({ default: module.ModulesPage })),
)
const ProgressPage = lazy(() =>
  import('./pages/Progress').then((module) => ({ default: module.ProgressPage })),
)
const GradesPage = lazy(() => import('./pages/Grades').then((module) => ({ default: module.GradesPage })))
const ExamsPage = lazy(() => import('./pages/Exams').then((module) => ({ default: module.ExamsPage })))
const SettingsPage = lazy(() =>
  import('./pages/Settings').then((module) => ({ default: module.SettingsPage })),
)
const DialogHost = lazy(() =>
  import('./components/dialogs').then((module) => ({ default: module.DialogHost })),
)

function ShareLinkWatcher() {
  useEffect(() => {
    const href = window.location.href
    if (!href.includes('#share=') && !href.includes('?share=')) return
    const payload = decodeShareCode(href)
    if (payload) {
      useUI.getState().openDialog({ kind: 'import', payload, source: 'link' })
    } else {
      useUI.getState().toast('share.invalid', undefined, 'error')
    }
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.search.replace(/[?&]share=[^&]*/, '')}`,
    )
  }, [])
  return null
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

function DialogLayer() {
  const dialog = useUI((state) => state.dialog)
  if (!dialog) return null
  return (
    <Suspense fallback={null}>
      <DialogHost />
    </Suspense>
  )
}

export default function App() {
  return (
    <>
      <ShareLinkWatcher />
      <ScrollToTop />
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<TodayPage />} />
          <Route path="week" element={<WeekPage />} />
          <Route path="modules" element={<ModulesPage />} />
          <Route path="modules/:moduleId" element={<ModulesPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="grades" element={<GradesPage />} />
          <Route path="exams" element={<ExamsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <DialogLayer />
      <Toasts />
    </>
  )
}
