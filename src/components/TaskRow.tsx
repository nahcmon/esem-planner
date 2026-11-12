import { CalendarClock } from 'lucide-react'
import type { Task } from '../types'
import { usePlanner } from '../store'
import { useUI } from '../ui-store'
import { useT } from '../lib/useT'
import { cn } from '../lib/cn'
import { relativeDay, todayISO } from '../lib/date'
import { componentTitle, taskTitle } from '../lib/display'
import { TASK_KIND_KEY } from '../lib/labels'
import { ACCENTS, PRIORITY_COLORS } from '../lib/accents'
import { COMPONENTS } from '../data/curriculum'
import { Checkbox } from './ui'

export function TaskRow({
  task,
  showCourse = true,
  showDue = true,
  dense = false,
}: {
  task: Task
  showCourse?: boolean
  showDue?: boolean
  dense?: boolean
}) {
  const { t, lang } = useT()
  const toggleTask = usePlanner((state) => state.toggleTask)
  const openDialog = useUI((state) => state.openDialog)
  const component = COMPONENTS.find((item) => item.id === task.componentId)
  const accent = ACCENTS[component?.accent ?? 'lime'].hex
  const overdue = Boolean(task.due && task.due < todayISO() && !task.done)

  return (
    <li className={cn('task-row group', dense && 'px-2 py-1.5')}>
      <Checkbox
        checked={task.done}
        onChange={() => toggleTask(task.id)}
        label={taskTitle(task, lang)}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={() => openDialog({ kind: 'task', id: task.id })}
            className={cn(
              'min-w-0 text-left text-[13px] font-medium leading-snug tracking-[-0.01em] text-ink transition-colors hover:text-accent',
              task.done && 'text-faint line-through decoration-faint/60',
            )}
          >
            {taskTitle(task, lang)}
          </button>
          <span
            aria-hidden
            className="priority-mark ml-auto mt-1"
            style={{ background: PRIORITY_COLORS[task.priority], opacity: task.done ? 0.3 : 0.85 }}
          />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] leading-tight text-faint">
          {showCourse && component ? (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <span
                className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: accent }}
              />
              <span className="truncate">{componentTitle(task.componentId, lang)}</span>
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <CalendarClock size={10} />
            {t(TASK_KIND_KEY[task.kind])}
          </span>
          {showDue && task.due ? (
            <span className={cn('inline-flex items-center gap-1', overdue && 'text-rose')}>
              {relativeDay(task.due, lang)}
            </span>
          ) : null}
          {task.note ? (
            <span className="hidden truncate text-faint/70 sm:inline">· {task.note}</span>
          ) : null}
        </div>
      </div>
    </li>
  )
}
