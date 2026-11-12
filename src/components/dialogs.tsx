import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronRight,
  Copy,
  Download,
  Link2,
  Pencil,
  QrCode,
  RotateCcw,
  Share2,
  Trash2,
  Upload,
  Video,
} from 'lucide-react'
import * as QRCode from 'qrcode'
import { CURRICULUM, COMPONENTS, EXAM_DEFS } from '../data/curriculum'
import type {
  ExamStatus,
  Priority,
  SessionKind,
  SessionTemplate,
  TaskKind,
  TopicStatus,
} from '../types'
import type { MessageKey as I18nKey } from '../i18n'
import { usePlanner, makeId } from '../store'
import { useUI, type Dialog, type TaskDefaults } from '../ui-store'
import { useT } from '../lib/useT'
import {
  formatDate,
  formatDuration,
  formatLongDate,
  todayISO,
  weekdayLong,
} from '../lib/date'
import { allTopicRows, occurrenceKey } from '../lib/planner'
import {
  createPayload,
  decodeShareCode,
  encodePayload,
  encodeQrShare,
  hydrateQrState,
  normalizeState,
  qrSnapshotToState,
  shareSummary,
} from '../lib/share'
import { copyText, downloadFile } from '../lib/clipboard'
import { componentFullTitle, componentTitle, taskTitle } from '../lib/display'
import { ACCENTS } from '../lib/accents'
import {
  Badge,
  Button,
  Field,
  Input,
  Modal,
  ModalFooter,
  ModalHeader,
  Segmented,
  Select,
  Switch,
  Textarea,
} from './ui'

const TASK_KIND_KEY: Record<TaskKind, I18nKey> = {
  exercise: 'task.exercise',
  assignment: 'task.assignment',
  study: 'task.study',
  reading: 'task.reading',
  exam: 'task.exam',
  meeting: 'task.meeting',
  other: 'task.other',
}

const SESSION_KIND_KEY: Record<SessionKind, I18nKey> = {
  lecture: 'type.lecture',
  exercise: 'type.exercise',
  lab: 'type.lab',
  language: 'type.language',
  tutorial: 'type.tutorial',
  study: 'type.study',
  other: 'type.other',
}

function CourseSelect({
  value,
  onChange,
  id,
}: {
  value: string
  onChange: (value: string) => void
  id?: string
}) {
  const { lang } = useT()
  return (
    <Select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
      {CURRICULUM.map((module) => (
        <optgroup
          key={module.id}
          label={`${lang === 'de' ? 'Semester' : 'Semester'} ${module.semester} · ${
            module.shortTitle[lang]
          }`}
        >
          {module.components.map((component) => (
            <option key={component.id} value={component.id}>
              {component.title[lang]}
            </option>
          ))}
        </optgroup>
      ))}
    </Select>
  )
}

/* ------------------------------------------------------------------ TaskDialog */

function TaskDialog({ id, defaults }: { id?: string; defaults?: TaskDefaults }) {
  const { t, lang } = useT()
  const closeDialog = useUI((state) => state.closeDialog)
  const toast = useUI((state) => state.toast)
  const task = usePlanner((state) => (id ? state.tasks.find((item) => item.id === id) : undefined))
  const addTask = usePlanner((state) => state.addTask)
  const updateTask = usePlanner((state) => state.updateTask)
  const deleteTask = usePlanner((state) => state.deleteTask)

  const initialCourse =
    task?.componentId ??
    defaults?.componentId ??
    COMPONENTS.find((component) => component.semester === 1)?.id ??
    COMPONENTS[0].id

  const [title, setTitle] = useState(task ? taskTitle(task, lang) : '')
  const [componentId, setComponentId] = useState(initialCourse)
  const [kind, setKind] = useState<TaskKind>(task?.kind ?? defaults?.kind ?? 'exercise')
  const [due, setDue] = useState(task ? (task.due ?? '') : (defaults?.due ?? todayISO()))
  const [start, setStart] = useState(task?.start ?? defaults?.start ?? '')
  const [end, setEnd] = useState(task?.end ?? defaults?.end ?? '')
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 2)
  const [note, setNote] = useState(task?.note ?? '')
  const [done, setDone] = useState(task?.done ?? false)
  const [error, setError] = useState('')

  const submit = () => {
    if (!title.trim()) {
      setError(t('validation.title'))
      return
    }
    if (start && !end) {
      setError(t('dialog.requiredTime'))
      return
    }
    if (end && !start) {
      setError(t('dialog.requiredTime'))
      return
    }
    if (start && end && end <= start) {
      setError(t('dialog.timeInvalid'))
      return
    }
    const payload = {
      componentId,
      title: title.trim(),
      titleEn: title.trim(),
      kind,
      due: due || undefined,
      start: start || undefined,
      end: end || undefined,
      done,
      priority,
      note: note.trim(),
      seeded: task?.seeded,
      completedAt: done ? (task?.completedAt ?? Date.now()) : undefined,
    }
    if (task) {
      updateTask(task.id, payload)
      toast('toast.taskUpdated', undefined, 'success')
    } else {
      addTask(payload)
      toast('toast.taskAdded', undefined, 'success')
    }
    closeDialog()
  }

  const remove = () => {
    if (!task) return
    useUI.getState().openDialog({
      kind: 'confirm',
      title: t('dialog.deleteTaskConfirm'),
      body: t('dialog.taskDelete'),
      confirmLabel: t('common.delete'),
      tone: 'danger',
      onConfirm: () => {
        deleteTask(task.id)
        toast('toast.taskDeleted', undefined, 'success')
        closeDialog()
      },
    })
  }

  return (
    <Modal open onClose={closeDialog} label={task ? t('dialog.editTask') : t('dialog.newTask')}>
      <ModalHeader
        eyebrow={t('common.task')}
        title={task ? t('dialog.editTask') : t('dialog.newTask')}
        onClose={closeDialog}
      />
      <div className="modal-body space-y-4">
        <Field label={t('dialog.taskTitle')} htmlFor="task-title" error={error}>
          <Input
            id="task-title"
            value={title}
            autoFocus
            placeholder={t('dialog.taskTitlePlaceholder')}
            onChange={(event) => {
              setTitle(event.target.value)
              if (error) setError('')
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) submit()
            }}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('dialog.taskCourse')}>
            <CourseSelect value={componentId} onChange={setComponentId} />
          </Field>
          <Field label={t('dialog.taskKind')}>
            <Select value={kind} onChange={(event) => setKind(event.target.value as TaskKind)}>
              {(Object.keys(TASK_KIND_KEY) as TaskKind[]).map((item) => (
                <option key={item} value={item}>
                  {t(TASK_KIND_KEY[item])}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t('dialog.taskDue')} hint={t('dialog.dueOptional')}>
            <Input type="date" value={due} onChange={(event) => setDue(event.target.value)} />
          </Field>
          <Field label={t('dialog.taskStart')}>
            <Input type="time" value={start} onChange={(event) => setStart(event.target.value)} />
          </Field>
          <Field label={t('dialog.taskEnd')}>
            <Input type="time" value={end} onChange={(event) => setEnd(event.target.value)} />
          </Field>
        </div>

        <Field label={t('dialog.taskPriority')}>
          <Segmented
            value={priority}
            onChange={setPriority}
            options={[
              { value: 1, label: t('dialog.priority1') },
              { value: 2, label: t('dialog.priority2') },
              { value: 3, label: t('dialog.priority3') },
            ]}
            ariaLabel={t('dialog.taskPriority')}
          />
        </Field>

        <Field label={t('dialog.taskNotes')} hint={t('dialog.studyHint')}>
          <Textarea
            value={note}
            placeholder={t('dialog.taskNotesPlaceholder')}
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>

        {task ? <Switch checked={done} onChange={setDone} label={t('dialog.taskDone')} /> : null}
      </div>
      <ModalFooter>
        {task ? (
          <Button variant="ghost" className="mr-auto text-rose hover:text-rose" onClick={remove}>
            <Trash2 size={14} />
            {t('common.delete')}
          </Button>
        ) : null}
        <Button variant="ghost" onClick={closeDialog}>
          {t('common.cancel')}
        </Button>
        <Button variant="primary" onClick={submit}>
          {task ? t('common.save') : t('common.add')}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

/* --------------------------------------------------------------- SessionDialog */

function SessionDialog({ id, defaults }: { id?: string; defaults?: Partial<SessionTemplate> }) {
  const { t } = useT()
  const closeDialog = useUI((state) => state.closeDialog)
  const toast = useUI((state) => state.toast)
  const session = usePlanner((state) => (id ? state.sessions.find((item) => item.id === id) : undefined))
  const addSession = usePlanner((state) => state.addSession)
  const updateSession = usePlanner((state) => state.updateSession)
  const deleteSession = usePlanner((state) => state.deleteSession)

  const [componentId, setComponentId] = useState(
    session?.componentId ?? defaults?.componentId ?? COMPONENTS[0].id,
  )
  const [kind, setKind] = useState<SessionKind>(session?.kind ?? defaults?.kind ?? 'lecture')
  const [day, setDay] = useState(session?.day ?? defaults?.day ?? 1)
  const [start, setStart] = useState(session?.start ?? defaults?.start ?? '08:15')
  const [end, setEnd] = useState(session?.end ?? defaults?.end ?? '09:45')
  const [online, setOnline] = useState(session?.online ?? defaults?.online ?? false)
  const [room, setRoom] = useState(session?.room ?? defaults?.room ?? '')
  const [note, setNote] = useState(session?.note ?? defaults?.note ?? '')
  const [error, setError] = useState('')

  const submit = () => {
    if (!start || !end) {
      setError(t('dialog.requiredTime'))
      return
    }
    if (end <= start) {
      setError(t('dialog.timeInvalid'))
      return
    }
    const payload = {
      componentId,
      kind,
      day,
      start,
      end,
      online,
      room: room.trim() || undefined,
      note: note.trim() || undefined,
      noteEn: undefined,
      seeded: session?.seeded,
    }
    if (session) {
      updateSession(session.id, payload)
      toast('toast.sessionUpdated', undefined, 'success')
    } else {
      addSession(payload)
      toast('toast.sessionAdded', undefined, 'success')
    }
    closeDialog()
  }

  const remove = () => {
    if (!session) return
    useUI.getState().openDialog({
      kind: 'confirm',
      title: t('dialog.deleteSessionConfirm'),
      body: `${componentTitle(session.componentId, usePlanner.getState().settings.lang)} · ${
        t('dialog.recurring')
      }`,
      confirmLabel: t('common.delete'),
      tone: 'danger',
      onConfirm: () => {
        deleteSession(session.id)
        toast('toast.sessionDeleted', undefined, 'success')
        closeDialog()
      },
    })
  }

  return (
    <Modal open onClose={closeDialog} label={session ? t('dialog.editSession') : t('dialog.newSession')}>
      <ModalHeader
        eyebrow={t('common.sessions')}
        title={session ? t('dialog.editSession') : t('dialog.newSession')}
        description={t('dialog.recurring')}
        onClose={closeDialog}
      />
      <div className="modal-body space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('dialog.sessionCourse')}>
            <CourseSelect value={componentId} onChange={setComponentId} />
          </Field>
          <Field label={t('dialog.sessionKind')}>
            <Select
              value={kind}
              onChange={(event) => setKind(event.target.value as SessionKind)}
            >
              {(Object.keys(SESSION_KIND_KEY) as SessionKind[]).map((item) => (
                <option key={item} value={item}>
                  {t(SESSION_KIND_KEY[item])}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label={t('dialog.sessionDay')}>
            <Select value={day} onChange={(event) => setDay(Number(event.target.value))}>
              {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                <option key={value} value={value}>
                  {weekdayLong(value, usePlanner.getState().settings.lang)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('dialog.sessionStart')}>
            <Input type="time" value={start} onChange={(event) => setStart(event.target.value)} />
          </Field>
          <Field label={t('dialog.sessionEnd')} error={error}>
            <Input type="time" value={end} onChange={(event) => setEnd(event.target.value)} />
          </Field>
        </div>

        <Field label={t('dialog.sessionRoom')}>
          <Input
            value={room}
            placeholder={t('dialog.sessionRoomPlaceholder')}
            onChange={(event) => setRoom(event.target.value)}
          />
        </Field>

        <Switch
          checked={online}
          onChange={setOnline}
          label={t('dialog.sessionOnline')}
          hint={t('week.onlineHint')}
        />

        <Field label={t('dialog.sessionNote')} hint={t('dialog.sessionNotePlaceholder')}>
          <Textarea value={note} onChange={(event) => setNote(event.target.value)} />
        </Field>
      </div>
      <ModalFooter>
        {session ? (
          <Button variant="ghost" className="mr-auto text-rose hover:text-rose" onClick={remove}>
            <Trash2 size={14} />
            {t('common.delete')}
          </Button>
        ) : null}
        <Button variant="ghost" onClick={closeDialog}>
          {t('common.cancel')}
        </Button>
        <Button variant="primary" onClick={submit}>
          {session ? t('common.save') : t('common.add')}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

/* ---------------------------------------------------------- SessionDetailsDialog */

function SessionDetailsDialog({ sessionId, date }: { sessionId: string; date: string }) {
  const { t, lang } = useT()
  const closeDialog = useUI((state) => state.closeDialog)
  const toast = useUI((state) => state.toast)
  const session = usePlanner((state) => state.sessions.find((item) => item.id === sessionId))
  const changes = usePlanner((state) => state.sessionChanges)
  const record = usePlanner((state) => state.sessionRecords[occurrenceKey(sessionId, date)])
  const toggleSessionDone = usePlanner((state) => state.toggleSessionDone)
  const setSessionNote = usePlanner((state) => state.setSessionNote)
  const moveOccurrence = usePlanner((state) => state.moveOccurrence)
  const cancelOccurrence = usePlanner((state) => state.cancelOccurrence)
  const restoreOccurrence = usePlanner((state) => state.restoreOccurrence)

  const change = changes.find(
    (item) => item.sessionId === sessionId && (item.originalDate === date || item.newDate === date),
  )
  const originalDate = change?.originalDate ?? date
  const shownStart = change?.action === 'moved' ? change.newStart ?? session?.start ?? '' : session?.start ?? ''
  const shownEnd = change?.action === 'moved' ? change.newEnd ?? session?.end ?? '' : session?.end ?? ''
  const [note, setNote] = useState(record?.note ?? '')
  const [moving, setMoving] = useState(false)
  const [newDate, setNewDate] = useState(date)
  const [newStart, setNewStart] = useState(change?.newStart ?? session?.start ?? '08:15')
  const [newEnd, setNewEnd] = useState(change?.newEnd ?? session?.end ?? '09:45')
  const [reason, setReason] = useState(change?.reason ?? '')
  const [error, setError] = useState('')

  if (!session) {
    return (
      <Modal open onClose={closeDialog} label={t('week.details')}>
        <ModalHeader title={t('week.details')} onClose={closeDialog} />
        <div className="modal-body">
          <p className="text-[13px] text-muted">{t('empty.sessions')}</p>
        </div>
        <ModalFooter>
          <Button onClick={closeDialog}>{t('common.close')}</Button>
        </ModalFooter>
      </Modal>
    )
  }

  const status = change ? (change.action === 'cancelled' ? 'cancelled' : 'moved') : 'normal'
  const info = COMPONENTS.find((component) => component.id === session.componentId)
  const accentColor = ACCENTS[info?.accent ?? 'lime'].hex
  const done = Boolean(record?.done)

  const saveNote = () => {
    if ((record?.note ?? '') !== note) setSessionNote(sessionId, date, note)
  }

  const submitMove = () => {
    if (!newStart || !newEnd) {
      setError(t('dialog.requiredTime'))
      return
    }
    if (newEnd <= newStart) {
      setError(t('dialog.timeInvalid'))
      return
    }
    if (newDate === originalDate && newStart === session.start && newEnd === session.end) {
      restoreOccurrence(sessionId, originalDate)
      toast('toast.sessionRestored', undefined, 'success')
      closeDialog()
      return
    }
    moveOccurrence(sessionId, originalDate, newDate, newStart, newEnd, reason.trim() || undefined)
    toast('toast.sessionMoved', undefined, 'success')
    closeDialog()
  }

  const cancelOne = () => {
    cancelOccurrence(sessionId, originalDate, reason.trim() || undefined)
    toast('toast.sessionMoved', undefined, 'success')
    closeDialog()
  }

  const restore = () => {
    restoreOccurrence(sessionId, originalDate)
    toast('toast.sessionRestored', undefined, 'success')
    closeDialog()
  }

  return (
    <Modal open onClose={closeDialog} label={t('week.details')}>
      <ModalHeader
        eyebrow={`${formatLongDate(date, lang)} · ${shownStart}–${shownEnd}`}
        title={componentFullTitle(session.componentId, lang)}
        description={`${t(SESSION_KIND_KEY[session.kind])}${
          session.room ? ` · ${session.room}` : ''
        }`}
        onClose={closeDialog}
      />
      <div className="modal-body space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: accentColor }}
            />
            {t(SESSION_KIND_KEY[session.kind])}
          </Badge>
          <Badge>{formatDuration(parseTime(shownEnd) - parseTime(shownStart), lang)}</Badge>
          {session.online ? (
            <Badge tone="info">
              <Video size={10} />
              {t('common.online')}
            </Badge>
          ) : null}
          {status === 'moved' ? <Badge tone="warn">{t('week.moved')}</Badge> : null}
          {status === 'cancelled' ? <Badge tone="danger">{t('week.cancelled')}</Badge> : null}
          {done ? <Badge tone="accent">{t('week.sessionDone')}</Badge> : null}
        </div>

        {status === 'moved' && change?.newDate ? (
          <div className="rounded-xl border border-amber/20 bg-amber/[0.05] px-3.5 py-2.5 text-[12px] text-amber">
            {t('week.movedTo', { date: formatDate(change.newDate, lang, 'EEE, d. MMM') })}
            {change.reason ? ` · ${change.reason}` : ''}
          </div>
        ) : null}
        {status === 'cancelled' ? (
          <div className="rounded-xl border border-rose/20 bg-rose/[0.05] px-3.5 py-2.5 text-[12px] text-rose">
            {t('week.cancelled')}
            {change?.reason ? ` · ${change.reason}` : ''}
          </div>
        ) : null}
        {session.note ? (
          <p className="text-[12px] leading-relaxed text-muted">
            {lang === 'en' ? session.noteEn || session.note : session.note}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            variant={done ? 'soft' : 'secondary'}
            size="sm"
            onClick={() => {
              toggleSessionDone(sessionId, date)
              toast(done ? 'toast.sessionReopened' : 'toast.sessionDone', undefined, 'success')
            }}
          >
            <Check size={14} />
            {done ? t('week.markOpen') : t('week.markDone')}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setMoving((value) => !value)}>
            <CalendarDays size={14} />
            {t('common.move')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => useUI.getState().openDialog({ kind: 'session', id: sessionId })}
          >
            <Pencil size={14} />
            {t('common.edit')}
          </Button>
          {status === 'normal' ? (
            <Button variant="ghost" size="sm" className="text-rose" onClick={cancelOne}>
              <AlertCircle size={14} />
              {t('week.cancelOccurrence')}
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={restore}>
              <RotateCcw size={14} />
              {t('week.restoreOccurrence')}
            </Button>
          )}
        </div>

        {moving ? (
          <div className="rounded-xl border border-line bg-bg/40 p-4">
            <div className="eyebrow mb-3">{t('week.moveTitle')}</div>
            <p className="mb-3 text-[11.5px] leading-relaxed text-faint">{t('week.moveHint')}</p>
            <div className="grid grid-cols-3 gap-3">
              <Field label={t('week.moveNewDate')}>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(event) => setNewDate(event.target.value)}
                />
              </Field>
              <Field label={t('week.moveNewStart')}>
                <Input
                  type="time"
                  value={newStart}
                  onChange={(event) => setNewStart(event.target.value)}
                />
              </Field>
              <Field label={t('week.moveNewEnd')}>
                <Input
                  type="time"
                  value={newEnd}
                  onChange={(event) => setNewEnd(event.target.value)}
                />
              </Field>
            </div>
            <Field label={t('week.moveReason')} className="mt-3">
              <Input value={reason} onChange={(event) => setReason(event.target.value)} />
            </Field>
            {error ? <p className="mt-2 text-[11.5px] text-rose">{error}</p> : null}
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setMoving(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="primary" size="sm" onClick={submitMove}>
                {t('week.moveSubmit')}
              </Button>
            </div>
          </div>
        ) : null}

        <Field label={t('week.sessionNote')} hint={t('week.notePlaceholder')}>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            onBlur={saveNote}
            placeholder={t('week.notePlaceholder')}
          />
        </Field>
      </div>
      <ModalFooter>
        <Button variant="ghost" onClick={closeDialog}>
          {t('common.close')}
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            saveNote()
            closeDialog()
          }}
        >
          {t('common.save')}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

function parseTime(value: string): number {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

/* ----------------------------------------------------------------- TopicDialog */

function TopicDialog({ componentId, topicId }: { componentId: string; topicId?: string }) {
  const { t, lang } = useT()
  const closeDialog = useUI((state) => state.closeDialog)
  const toast = useUI((state) => state.toast)
  const topicStates = usePlanner((state) => state.topicStates)
  const customTopics = usePlanner((state) => state.customTopics)
  const rows = useMemo(() => allTopicRows(usePlanner.getState()), [topicStates, customTopics])
  const setTopicState = usePlanner((state) => state.setTopicState)
  const addCustomTopic = usePlanner((state) => state.addCustomTopic)
  const updateCustomTopic = usePlanner((state) => state.updateCustomTopic)
  const deleteCustomTopic = usePlanner((state) => state.deleteCustomTopic)

  const existingRow = topicId ? rows.find((row) => row.id === topicId) : undefined
  const existingCustom = topicId ? customTopics.find((topic) => topic.id === topicId) : undefined
  const isBuiltIn = Boolean(existingRow && !existingRow.custom)

  const [title, setTitle] = useState(existingRow ? existingRow.title[lang] : '')
  const [status, setStatus] = useState<TopicStatus>(existingRow?.status ?? 'open')
  const [priority, setPriority] = useState<Priority>(existingRow?.priority ?? 2)
  const [note, setNote] = useState(existingRow?.note ?? '')
  const [course, setCourse] = useState(existingRow?.componentId ?? componentId)
  const [error, setError] = useState('')

  const submit = () => {
    if (!isBuiltIn && !title.trim()) {
      setError(t('validation.title'))
      return
    }
    if (isBuiltIn && topicId) {
      setTopicState(topicId, { status, priority, note: note.trim() })
    } else if (existingCustom) {
      updateCustomTopic(existingCustom.id, {
        title: title.trim(),
        titleEn: title.trim(),
        status,
        priority,
        note: note.trim(),
      })
    } else {
      addCustomTopic({
        id: makeId('ct'),
        componentId: course,
        title: title.trim(),
        titleEn: title.trim(),
        status,
        priority,
        note: note.trim(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    }
    toast('toast.topicAdded', undefined, 'success')
    closeDialog()
  }

  const remove = () => {
    if (!existingCustom) return
    useUI.getState().openDialog({
      kind: 'confirm',
      title: t('dialog.deleteTopicConfirm'),
      body: existingCustom.title,
      confirmLabel: t('common.delete'),
      tone: 'danger',
      onConfirm: () => {
        deleteCustomTopic(existingCustom.id)
        toast('toast.topicDeleted', undefined, 'success')
        closeDialog()
      },
    })
  }

  return (
    <Modal open onClose={closeDialog} label={existingRow ? t('dialog.editTopic') : t('dialog.newTopic')}>
      <ModalHeader
        eyebrow={t('common.topic')}
        title={existingRow ? t('dialog.editTopic') : t('dialog.newTopic')}
        onClose={closeDialog}
      />
      <div className="modal-body space-y-4">
        <Field label={t('modules.topicTitle')} error={error}>
          <Input
            value={title}
            autoFocus={!isBuiltIn}
            readOnly={isBuiltIn}
            placeholder={t('modules.topicTitlePlaceholder')}
            onChange={(event) => {
              setTitle(event.target.value)
              if (error) setError('')
            }}
            className={isBuiltIn ? 'opacity-70' : undefined}
          />
        </Field>

        {!existingRow ? (
          <Field label={t('modules.topicCourse')}>
            <CourseSelect value={course} onChange={setCourse} />
          </Field>
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-faint">
            <span>{existingRow.moduleTitle[lang]}</span>
            <ChevronRight size={11} />
            <span>{existingRow.componentTitle[lang]}</span>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('dialog.topicStatus')}>
            <Segmented
              value={status}
              onChange={setStatus}
              options={[
                { value: 'open', label: t('dialog.statusOpen') },
                { value: 'learning', label: t('dialog.statusLearning') },
                { value: 'mastered', label: t('dialog.statusMastered') },
              ]}
              ariaLabel={t('dialog.topicStatus')}
            />
          </Field>
          <Field label={t('modules.priority')}>
            <Segmented
              value={priority}
              onChange={setPriority}
              options={[
                { value: 1, label: t('dialog.priority1') },
                { value: 2, label: t('dialog.priority2') },
                { value: 3, label: t('dialog.priority3') },
              ]}
              ariaLabel={t('modules.priority')}
            />
          </Field>
        </div>

        <Field label={t('modules.topicNote')}>
          <Textarea
            value={note}
            placeholder={t('modules.topicNotePlaceholder')}
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>
      </div>
      <ModalFooter>
        {existingCustom ? (
          <Button variant="ghost" className="mr-auto text-rose hover:text-rose" onClick={remove}>
            <Trash2 size={14} />
            {t('common.delete')}
          </Button>
        ) : null}
        <Button variant="ghost" onClick={closeDialog}>
          {t('common.cancel')}
        </Button>
        <Button variant="primary" onClick={submit}>
          {t('common.save')}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

/* ----------------------------------------------------------------- ShareDialog */

function ShareDialog() {
  const { t } = useT()
  const closeDialog = useUI((state) => state.closeDialog)
  const toast = useUI((state) => state.toast)
  const store = usePlanner()
  const [mode, setMode] = useState<'full' | 'compact'>('full')
  const [qr, setQr] = useState<string | null>(null)
  const [qrError, setQrError] = useState(false)
  const [code, setCode] = useState('')

  const link = useMemo(() => {
    const base = `${window.location.origin}${import.meta.env.BASE_URL}`
    return `${base}#share=${encodePayload(createPayload(store, mode === 'compact'))}`
  }, [store, mode])

  const qrLink = useMemo(() => {
    const base = `${window.location.origin}${import.meta.env.BASE_URL}`
    return `${base}#share=${encodeQrShare(store)}`
  }, [store])

  /**
   * QR modules plus the 4-module quiet zone. The preview is sized to an exact
   * integer multiple of the module count, so every module maps to whole CSS
   * pixels and phone cameras get a crisp, regular grid.
   */
  const qrSpec = useMemo(() => {
    try {
      const modules = QRCode.create(qrLink, { errorCorrectionLevel: 'L' }).modules.size
      const total = modules + 8
      const scale = Math.max(1, Math.floor(296 / total))
      return { total, size: scale * total }
    } catch {
      return null
    }
  }, [qrLink])

  useEffect(() => {
    let cancelled = false
    setQr(null)
    setQrError(false)
    if (!qrSpec) {
      setQrError(true)
      return
    }
    QRCode.toDataURL(qrLink, {
      margin: 4,
      scale: 8,
      errorCorrectionLevel: 'L',
      color: { dark: '#0b0f0c', light: '#f1f5ec' },
    })
      .then((url) => {
        if (!cancelled) setQr(url)
      })
      .catch(() => {
        if (!cancelled) setQrError(true)
      })
    return () => {
      cancelled = true
    }
  }, [qrLink, qrSpec])

  const copyLink = async () => {
    const ok = await copyText(link)
    toast(ok ? 'share.copied' : 'share.copyError', undefined, ok ? 'success' : 'error')
  }

  const download = () => {
    const payload = createPayload(store, mode === 'compact')
    downloadFile(
      `esem-planner-${todayISO()}.json`,
      JSON.stringify(payload, null, 2),
    )
    toast('toast.exported', undefined, 'success')
  }

  const importCode = () => {
    const payload = decodeShareCode(code)
    if (!payload) {
      toast('share.invalid', undefined, 'error')
      return
    }
    useUI.getState().openDialog({ kind: 'import', payload, source: 'code' })
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
      useUI.getState().openDialog({
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

  const summary = shareSummary(store)

  return (
    <Modal open onClose={closeDialog} label={t('share.title')} wide>
      <ModalHeader
        eyebrow={t('share.eyebrow')}
        title={t('share.title')}
        description={t('share.intro')}
        onClose={closeDialog}
      />
      <div className="modal-body grid gap-6 md:grid-cols-[1fr_330px]">
        <div className="order-2 space-y-5 md:order-1">
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              value={mode}
              onChange={(value) => setMode(value)}
              options={[
                { value: 'full', label: t('share.full') },
                { value: 'compact', label: t('share.compact') },
              ]}
              ariaLabel={t('share.title')}
            />
            <Badge tone="muted">{t('share.noAccount')}</Badge>
          </div>

          <Field label={t('share.linkLabel')} hint={t('share.privacyNote')}>
            <Textarea
              readOnly
              value={link}
              className="min-h-[86px] font-mono text-[10px] leading-relaxed"
              onFocus={(event) => event.target.select()}
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={copyLink}>
              <Copy size={14} />
              {t('share.copyLink')}
            </Button>
            <Button variant="secondary" onClick={download}>
              <Download size={14} />
              {t('share.download')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => window.open(link, '_blank', 'noopener')}
            >
              <Link2 size={14} />
              {t('share.sameBrowser')}
            </Button>
          </div>

          {link.length > 1800 ? (
            <p className="text-[11px] leading-relaxed text-amber">
              {t('share.linkTooLong', { count: link.length })}
            </p>
          ) : null}

          <div className="hairline pt-5">
            <div className="eyebrow mb-2">{t('share.importCode')}</div>
            <div className="flex gap-2">
              <Input
                value={code}
                placeholder={t('share.importCodePlaceholder')}
                onChange={(event) => setCode(event.target.value)}
              />
              <Button variant="secondary" onClick={importCode} disabled={!code.trim()}>
                {t('share.importButton')}
              </Button>
            </div>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-[12px] text-muted transition-colors hover:text-ink">
              <Upload size={14} />
              {t('share.importFile')}
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => void importFile(event.target.files?.[0])}
              />
            </label>
          </div>

          <p className="text-[11px] leading-relaxed text-faint">
            {summary.tasks} {t('common.tasks')} · {summary.sessions} {t('common.sessions')} ·{' '}
            {summary.topics} {t('common.topics')} · {t('share.fileNote')}
          </p>
        </div>

        <div className="order-1 flex flex-col items-center gap-3 rounded-xl border border-line bg-surface/60 p-3 md:order-2 sm:p-4">
          <div className="flex items-center gap-2 self-start">
            <QrCode size={14} className="text-accent" />
            <span className="eyebrow">{t('share.qrTitle')}</span>
          </div>
          {qr && qrSpec ? (
            <img
              src={qr}
              alt={t('share.qrTitle')}
              width={qrSpec.size}
              height={qrSpec.size}
              style={{ width: qrSpec.size, height: qrSpec.size, imageRendering: 'pixelated' }}
              className="max-w-full rounded-lg border border-line bg-[#f1f5ec]"
            />
          ) : qrError ? (
            <div className="flex aspect-square w-full max-w-[196px] flex-col items-center justify-center gap-2 rounded-lg border border-amber/20 bg-amber/[0.04] p-4 text-center">
              <AlertCircle size={20} className="text-amber" />
              <p className="text-[10.5px] leading-relaxed text-amber">{t('share.qrTooLarge')}</p>
            </div>
          ) : (
            <div className="grid aspect-square w-full max-w-[196px] place-items-center rounded-lg border border-line bg-surface2">
              <span className="text-[11px] text-faint">{t('common.loading')}</span>
            </div>
          )}
          <p className="text-center text-[10.5px] leading-relaxed text-faint">{t('share.qrHint')}</p>
          <Badge>{t('share.qrNote')}</Badge>
        </div>
      </div>
      <ModalFooter>
        <Button variant="ghost" onClick={closeDialog}>
          {t('common.close')}
        </Button>
        <Button variant="primary" onClick={copyLink}>
          <Copy size={14} />
          {t('common.copy')}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

/* ---------------------------------------------------------------- ImportDialog */

function ImportDialog({ dialog }: { dialog: Extract<Dialog, { kind: 'import' }> }) {
  const { t, lang } = useT()
  const closeDialog = useUI((state) => state.closeDialog)
  const toast = useUI((state) => state.toast)
  const mergeImported = usePlanner((state) => state.mergeImported)
  const replaceImported = usePlanner((state) => state.replaceImported)
  const incoming = dialog.payload.qr
    ? qrSnapshotToState(dialog.payload.state)
    : normalizeState(dialog.payload.state)
  const preview = incoming && dialog.payload.qr ? hydrateQrState(incoming) : incoming
  const summary = shareSummary(preview ?? dialog.payload.state)

  const apply = (mode: 'merge' | 'replace') => {
    if (!incoming) {
      toast('share.invalid', undefined, 'error')
      return
    }
    if (mode === 'merge') {
      mergeImported(incoming)
      toast('share.mergeDone', undefined, 'success')
    } else {
      replaceImported(dialog.payload.qr ? hydrateQrState(incoming) : incoming)
      toast('share.replaceDone', undefined, 'success')
    }
    closeDialog()
  }

  return (
    <Modal open onClose={closeDialog} label={t('share.importTitle')}>
      <ModalHeader
        eyebrow={t('share.eyebrow')}
        title={t('share.importTitle')}
        description={t('share.importIntro')}
        onClose={closeDialog}
      />
      <div className="modal-body space-y-4">
        <div className="rounded-xl border border-line bg-surface/60 p-4">
          <div className="mono text-[11px] leading-relaxed text-muted">
            {t('share.importSummary', {
              tasks: summary.tasks,
              sessions: summary.sessions,
              modules: summary.modules,
              date: formatDate(dialog.payload.exportedAt.slice(0, 10), lang, 'd. MMM yyyy'),
            })}
          </div>
          <div className="mt-2 text-[11px] text-faint">
            {dialog.source === 'link'
              ? t('share.importedFromLink')
              : dialog.source === 'file'
                ? t('share.importFile')
                : t('share.importCode')}
          </div>
        </div>

        <div className="space-y-2">
          <Button variant="primary" className="w-full" onClick={() => apply('merge')}>
            <Share2 size={14} />
            {t('common.merge')}
          </Button>
          <p className="text-center text-[11px] text-faint">{t('share.mergeHint')}</p>
        </div>
        <div className="space-y-2">
          <Button variant="secondary" className="w-full" onClick={() => apply('replace')}>
            <Download size={14} />
            {t('common.replace')}
          </Button>
          <p className="text-center text-[11px] text-faint">{t('share.replaceHint')}</p>
        </div>
      </div>
      <ModalFooter>
        <Button variant="ghost" onClick={closeDialog}>
          {t('share.dismiss')}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

/* --------------------------------------------------------------- ExamResultDialog */

const EXAM_STATUS_KEY: Record<ExamStatus, I18nKey> = {
  planned: 'exam.planned',
  registered: 'exam.registered',
  passed: 'exam.passed',
  failed: 'exam.failed',
}

function ExamResultDialog({ examKey }: { examKey: string }) {
  const { t, lang } = useT()
  const closeDialog = useUI((state) => state.closeDialog)
  const toast = useUI((state) => state.toast)
  const exam = EXAM_DEFS.find((item) => item.key === examKey)
  const examState = usePlanner((state) => state.examStates[examKey])
  const setExamStatus = usePlanner((state) => state.setExamStatus)
  const [status, setStatus] = useState<ExamStatus>(examState?.status ?? 'planned')
  const [grade, setGrade] = useState(examState?.grade ?? '')

  if (!exam) return null

  const save = () => {
    setExamStatus(examKey, status, exam.kind, grade.trim() || undefined)
    toast('toast.saved', undefined, 'success')
    closeDialog()
  }

  return (
    <Modal open onClose={closeDialog} label={t('exams.resultTitle')}>
      <ModalHeader
        eyebrow={t('exam.result')}
        title={t('exams.resultTitle')}
        description={exam.label[lang]}
        onClose={closeDialog}
      />
      <div className="modal-body space-y-4">
        <Field label={t('exams.resultStatus')}>
          <Select value={status} onChange={(event) => setStatus(event.target.value as ExamStatus)}>
            {(Object.keys(EXAM_STATUS_KEY) as ExamStatus[]).map((value) => (
              <option key={value} value={value}>
                {t(EXAM_STATUS_KEY[value])}
              </option>
            ))}
          </Select>
        </Field>
        {status === 'passed' || status === 'failed' ? (
          <Field label={t('exams.resultGrade')} hint={t('exam.grade')}>
            <Input
              value={grade}
              inputMode="decimal"
              placeholder={t('exams.gradePlaceholder')}
              onChange={(event) => setGrade(event.target.value)}
            />
          </Field>
        ) : null}
      </div>
      <ModalFooter>
        <Button variant="ghost" onClick={closeDialog}>
          {t('common.cancel')}
        </Button>
        <Button variant="primary" onClick={save}>
          {t('common.save')}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

/* ------------------------------------------------------------------- Confirm */

function ConfirmDialog({ dialog }: { dialog: Extract<Dialog, { kind: 'confirm' }> }) {
  const { t } = useT()
  const closeDialog = useUI((state) => state.closeDialog)
  return (
    <Modal open onClose={closeDialog} label={dialog.title}>
      <ModalHeader title={dialog.title} onClose={closeDialog} />
      <div className="modal-body">
        <p className="text-[13px] leading-relaxed text-muted">{dialog.body}</p>
      </div>
      <ModalFooter>
        <Button variant="ghost" onClick={closeDialog}>
          {t('common.cancel')}
        </Button>
        <Button
          variant={dialog.tone === 'danger' ? 'danger' : 'primary'}
          onClick={() => {
            dialog.onConfirm()
            closeDialog()
          }}
        >
          {dialog.confirmLabel ?? t('common.confirm')}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

/* ------------------------------------------------------------------ DialogHost */

export function DialogHost() {
  const dialog = useUI((state) => state.dialog)
  if (!dialog) return null

  switch (dialog.kind) {
    case 'task':
      return <TaskDialog key={dialog.id ?? 'new-task'} id={dialog.id} defaults={dialog.defaults} />
    case 'session':
      return (
        <SessionDialog key={dialog.id ?? 'new-session'} id={dialog.id} defaults={dialog.defaults} />
      )
    case 'sessionDetails':
      return (
        <SessionDetailsDialog
          key={`${dialog.sessionId}-${dialog.date}`}
          sessionId={dialog.sessionId}
          date={dialog.date}
        />
      )
    case 'topic':
      return (
        <TopicDialog
          key={dialog.topicId ?? `new-${dialog.componentId}`}
          componentId={dialog.componentId}
          topicId={dialog.topicId}
        />
      )
    case 'share':
      return <ShareDialog />
    case 'import':
      return <ImportDialog dialog={dialog} />
    case 'examResult':
      return <ExamResultDialog examKey={dialog.examKey} />
    case 'confirm':
      return <ConfirmDialog dialog={dialog} />
    default:
      return null
  }
}
