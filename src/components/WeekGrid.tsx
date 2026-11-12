import type { CSSProperties } from 'react'
import { Check, GraduationCap, MapPin, Video } from 'lucide-react'
import type { ExamState, Occurrence, Task } from '../types'
import type { ExamDef } from '../data/curriculum'
import { usePlanner } from '../store'
import { useUI } from '../ui-store'
import { useT } from '../lib/useT'
import { cn } from '../lib/cn'
import {
  formatDate,
  timeToMinutes,
  todayISO,
  weekdayShort,
} from '../lib/date'
import { sessionDone, weekdayNumber } from '../lib/planner'
import { componentTitle, taskTitle } from '../lib/display'
import { SESSION_KIND_KEY } from '../lib/labels'
import { ACCENTS, PRIORITY_COLORS } from '../lib/accents'
import { COMPONENTS } from '../data/curriculum'

const START_MINUTES = 8 * 60
const END_MINUTES = 20 * 60
const HOUR_HEIGHT = 62

interface GridSession {
  type: 'session'
  key: string
  start: string
  end: string
  occurrence: Occurrence
}

interface GridTask {
  type: 'task'
  key: string
  start: string
  end: string
  task: Task
}

type GridItem = GridSession | GridTask

interface Position {
  lane: number
  lanes: number
}

function layoutItems(items: GridItem[]): Map<string, Position> {
  const sorted = [...items].sort(
    (a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end),
  )
  const positions = new Map<string, Position>()
  let cluster: GridItem[] = []
  let clusterEnd = -1

  const flush = () => {
    if (!cluster.length) return
    const laneEnds: number[] = []
    const assigned = new Map<string, number>()
    for (const item of cluster) {
      const start = timeToMinutes(item.start)
      let lane = laneEnds.findIndex((end) => end <= start)
      if (lane === -1) {
        lane = laneEnds.length
        laneEnds.push(timeToMinutes(item.end))
      } else {
        laneEnds[lane] = timeToMinutes(item.end)
      }
      assigned.set(item.key, lane)
    }
    for (const item of cluster) {
      positions.set(item.key, { lane: assigned.get(item.key) ?? 0, lanes: laneEnds.length })
    }
    cluster = []
    clusterEnd = -1
  }

  for (const item of sorted) {
    const start = timeToMinutes(item.start)
    const end = timeToMinutes(item.end)
    if (cluster.length && start >= clusterEnd) flush()
    cluster.push(item)
    clusterEnd = Math.max(clusterEnd, end)
  }
  flush()
  return positions
}

export function WeekGrid({
  monday,
  dates,
  occurrences,
  tasks,
  exams,
  examStates,
}: {
  monday: string
  dates: string[]
  occurrences: Occurrence[]
  tasks: Task[]
  exams: ExamDef[]
  examStates: Record<string, ExamState>
}) {
  const { t, lang } = useT()
  const state = usePlanner()
  const openDialog = useUI((store) => store.openDialog)
  const today = todayISO()
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const hours = Array.from({ length: 12 }, (_, index) => 8 + index)
  const gridStyle = {
    '--week-hours': 12,
    '--hour-height': `${HOUR_HEIGHT}px`,
  } as CSSProperties

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[760px]">
        <div className="week-header-row grid grid-cols-[54px_repeat(7,minmax(0,1fr))] border-b border-line">
          <div className="border-r border-line/60 px-2 pb-2 pt-2 text-right">
            <span className="mono text-[9px] text-faint">{formatDate(monday, lang, 'MMM')}</span>
          </div>
          {dates.map((date) => {
            const dayTasks = tasks.filter((task) => task.due === date)
            const dayExams = exams.filter((exam) => examStates[exam.key]?.date === date)
            const isToday = date === today
            return (
              <div
                key={date}
                className={cn(
                  'min-w-0 border-l border-line/60 px-2 pb-2 pt-2',
                  isToday && 'bg-accent/[0.025]',
                )}
              >
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={cn(
                      'font-mono text-[9.5px] uppercase tracking-[0.08em]',
                      isToday ? 'text-accent' : 'text-faint',
                    )}
                  >
                    {weekdayShort(weekdayNumber(date), lang)}
                  </span>
                  <span
                    className={cn(
                      'mono text-[14px] font-semibold leading-none tracking-[-0.04em]',
                      isToday ? 'text-accent' : 'text-ink',
                    )}
                  >
                    {Number(date.slice(8, 10))}
                  </span>
                </div>
                <div className="mt-1.5 space-y-1">
                  {dayExams.slice(0, 1).map((exam) => (
                    <button
                      key={exam.key}
                      type="button"
                      onClick={() =>
                        openDialog({ kind: 'examResult', examKey: exam.key })
                      }
                      className="flex w-full items-center gap-1 truncate rounded border border-amber/20 bg-amber/[0.06] px-1.5 py-1 text-left text-[9px] font-medium text-amber"
                    >
                      <GraduationCap size={9} className="shrink-0" />
                      <span className="truncate">{exam.label[lang]}</span>
                    </button>
                  ))}
                  {dayTasks.slice(0, 2).map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => openDialog({ kind: 'task', id: task.id })}
                      className={cn(
                        'flex w-full items-center gap-1.5 rounded border border-line bg-surface2/80 px-1.5 py-1 text-left text-[9px] leading-tight text-muted transition-colors hover:border-line-strong hover:text-ink',
                        task.done && 'opacity-45',
                      )}
                    >
                      <span
                        className="h-1 w-1 shrink-0 rounded-full"
                        style={{ background: PRIORITY_COLORS[task.priority] }}
                      />
                      <span className={cn('truncate', task.done && 'line-through')}>
                        {taskTitle(task, lang)}
                      </span>
                    </button>
                  ))}
                  {dayTasks.length > 2 ? (
                    <div className="px-1 text-[8.5px] text-faint">
                      {t('week.more', { count: dayTasks.length - 2 })}
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>

        <div className="week-grid" style={gridStyle}>
          <div className="week-time-col border-r border-line/60">
            {hours.map((hour) => (
              <div
                key={hour}
                className="week-time-label"
                style={{ top: (hour - 8) * HOUR_HEIGHT }}
              >
                {`${hour}:00`}
              </div>
            ))}
          </div>

          {dates.map((date) => {
            const dayOccurrences = occurrences
              .filter((occurrence) => occurrence.date === date)
              .map<GridSession>((occurrence) => ({
                type: 'session',
                key: occurrence.key,
                start: occurrence.start,
                end: occurrence.end,
                occurrence,
              }))
            const dayTasks = tasks
              .filter((task) => task.due === date && task.start && task.end)
              .map<GridTask>((task) => ({
                type: 'task',
                key: `task-${task.id}`,
                start: task.start ?? '08:00',
                end: task.end ?? '09:00',
                task,
              }))
            const items = [...dayOccurrences, ...dayTasks]
            const positions = layoutItems(items)
            const isToday = date === today
            return (
              <div
                key={date}
                className={cn('week-day-col', isToday && 'week-day-col-today')}
              >
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="week-slot-line"
                    style={{ top: (hour - 8) * HOUR_HEIGHT }}
                  />
                ))}
                {isToday && nowMinutes >= START_MINUTES && nowMinutes <= END_MINUTES ? (
                  <div
                    className="now-line"
                    style={{ top: ((nowMinutes - START_MINUTES) / 60) * HOUR_HEIGHT }}
                  />
                ) : null}
                {items.length === 0 ? (
                  <div className="absolute inset-x-0 top-3 text-center text-[9.5px] text-faint/50">
                    {t('week.emptyDay')}
                  </div>
                ) : null}
                {items.map((item) => {
                  const position = positions.get(item.key) ?? { lane: 0, lanes: 1 }
                  const start = Math.max(START_MINUTES, timeToMinutes(item.start))
                  const end = Math.min(END_MINUTES, timeToMinutes(item.end))
                  const top = ((start - START_MINUTES) / 60) * HOUR_HEIGHT
                  const height = Math.max(24, ((end - start) / 60) * HOUR_HEIGHT - 2)
                  const width = 100 / position.lanes
                  const style: CSSProperties = {
                    top,
                    height,
                    left: `calc(${position.lane * width}% + 4px)`,
                    width: `calc(${width}% - 8px)`,
                  }

                  if (item.type === 'task') {
                    const task = item.task
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => openDialog({ kind: 'task', id: task.id })}
                        className="week-event"
                        data-done={task.done}
                        style={{
                          ...style,
                          background: 'rgba(244, 192, 106, 0.10)',
                          borderColor: 'rgba(244, 192, 106, 0.25)',
                          borderLeftColor: '#f4c06a',
                        }}
                      >
                        <span className="week-event-time">{item.start}–{item.end}</span>
                        <span className="week-event-title">{taskTitle(task, lang)}</span>
                        <span className="week-event-meta">
                          {t('common.task')} · {componentTitle(task.componentId, lang)}
                        </span>
                      </button>
                    )
                  }

                  const occurrence = item.occurrence
                  const component = COMPONENTS.find(
                    (entry) => entry.id === occurrence.session.componentId,
                  )
                  const accent = ACCENTS[component?.accent ?? 'lime']
                  const done = sessionDone(state, occurrence)
                  const cancelled = occurrence.status === 'cancelled'
                  const ghost =
                    occurrence.status === 'moved' &&
                    occurrence.change?.originalDate === occurrence.date
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() =>
                        openDialog({
                          kind: 'sessionDetails',
                          sessionId: occurrence.session.id,
                          date: occurrence.date,
                        })
                      }
                      className="week-event"
                      data-done={done}
                      data-ghost={ghost || cancelled}
                      style={{
                        ...style,
                        background: accent.soft,
                        borderColor: accent.line,
                        borderLeftColor: accent.hex,
                        opacity: cancelled ? 0.45 : undefined,
                      }}
                    >
                      <span className="week-event-time flex items-center justify-between gap-1">
                        <span>
                          {item.start}–{item.end}
                        </span>
                        {done ? <Check size={9} className="text-accent" /> : null}
                        {occurrence.online ? <Video size={9} className="text-blue" /> : null}
                      </span>
                      <span
                        className={cn(
                          'week-event-title',
                          cancelled && 'line-through decoration-rose/60',
                        )}
                      >
                        {componentTitle(occurrence.session.componentId, lang)}
                      </span>
                      <span className="week-event-meta flex items-center gap-1">
                        {cancelled ? (
                          <span className="text-rose">{t('week.cancelled')}</span>
                        ) : ghost ? (
                          <span className="text-amber">{t('week.moved')}</span>
                        ) : (
                          <>
                            <span>{t(SESSION_KIND_KEY[occurrence.session.kind])}</span>
                            {occurrence.status === 'moved' ? (
                              <span className="text-amber">· ↔</span>
                            ) : null}
                            {!occurrence.online && occurrence.room ? (
                              <span className="inline-flex min-w-0 items-center gap-0.5">
                                <MapPin size={8} />
                                <span className="truncate">{occurrence.room}</span>
                              </span>
                            ) : null}
                          </>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
