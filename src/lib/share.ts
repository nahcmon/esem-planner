import LZString from 'lz-string'
import type {
  ExamState,
  ExamStatus,
  ModuleState,
  ModuleStatus,
  Priority,
  SessionChange,
  SessionTemplate,
  SharePayload,
  Task,
  TaskKind,
  TopicState,
  TopicStatus,
  UserState,
} from '../types'
import { CURRICULUM } from '../data/curriculum'
import { createSeedState } from '../data/seed'

const APP_ID = 'esem-planner'
const SCHEMA = 1

function cloneState(state: UserState): UserState {
  return JSON.parse(
    JSON.stringify({
      schema: state.schema,
      settings: state.settings,
      moduleStates: state.moduleStates,
      topicStates: state.topicStates,
      customTopics: state.customTopics,
      tasks: state.tasks,
      sessions: state.sessions,
      sessionChanges: state.sessionChanges,
      sessionRecords: state.sessionRecords,
      examStates: state.examStates,
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
    }),
  ) as UserState
}

export function compactState(state: UserState): UserState {
  const compact = cloneState(state)
  compact.tasks = compact.tasks.map((task) => ({ ...task, note: '', titleEn: task.titleEn ?? '' }))
  compact.sessions = compact.sessions.map((session) => ({
    ...session,
    note: '',
    noteEn: '',
  }))
  compact.sessionChanges = compact.sessionChanges.map((change) => ({ ...change, reason: '' }))
  compact.moduleStates = Object.fromEntries(
    Object.entries(compact.moduleStates).map(([key, value]) => [key, { ...value, note: '' }]),
  )
  compact.examStates = Object.fromEntries(
    Object.entries(compact.examStates).map(([key, value]) => [key, { ...value, note: '' }]),
  )
  compact.sessionRecords = Object.fromEntries(
    Object.entries(compact.sessionRecords).map(([key, value]) => [key, { ...value, note: undefined }]),
  )
  compact.customTopics = compact.customTopics.map((topic) => ({ ...topic, note: '' }))
  return compact
}

export function createPayload(state: UserState, compact = false): SharePayload {
  return {
    app: APP_ID,
    schema: SCHEMA,
    exportedAt: new Date().toISOString(),
    compact,
    state: compact ? compactState(state) : cloneState(state),
  }
}

export function encodePayload(payload: SharePayload): string {
  return LZString.compressToEncodedURIComponent(JSON.stringify(payload))
}

/**
 * Ultra-compact QR snapshot. Progress is packed into fixed-order strings,
 * seeded tasks/sessions are referenced by id and rebuilt from the starter
 * state on import. Free-text notes are never included.
 */
interface QrSnapshot {
  v: 1
  g: UserState['settings']
  m: string
  t: string
  p: string
  ct?: Array<{
    i: string
    c: string
    t: string
    e?: string
    s: TopicStatus
    p: Priority
  }>
  k?: Array<{
    i: string
    c: string
    t: string
    e?: string
    k: TaskKind
    d?: string
    s?: string
    n?: string
    p: Priority
  }>
  d?: string[]
  s?: SessionTemplate[]
  x?: SessionChange[]
  r?: string[]
  e?: Record<string, { s: ExamStatus; d?: string; g?: string; c?: string[] }>
  ca: number
  ua: number
}

const MODULE_IDS = CURRICULUM.map((module) => module.id)
const TOPIC_IDS = CURRICULUM.flatMap((module) =>
  module.components.flatMap((component) => component.topics.map((topic) => topic.id)),
)
const MODULE_STATUS_CODE: Record<ModuleStatus, string> = {
  planned: 'p',
  active: 'a',
  completed: 'c',
}
const TOPIC_STATUS_CODE: Record<TopicStatus, string> = {
  open: 'o',
  learning: 'l',
  mastered: 'm',
}

export function createQrSnapshot(state: UserState): QrSnapshot {
  const doneSeededTasks = state.tasks
    .filter((task) => task.seeded && task.done)
    .map((task) => task.id)
  const customTasks = state.tasks
    .filter((task) => !task.seeded)
    .map((task) => ({
      i: task.id,
      c: task.componentId,
      t: task.title,
      ...(task.titleEn ? { e: task.titleEn } : {}),
      k: task.kind,
      ...(task.due ? { d: task.due } : {}),
      ...(task.start ? { s: task.start } : {}),
      ...(task.end ? { n: task.end } : {}),
      p: task.priority,
    }))
  const customTopics = state.customTopics.map((topic) => ({
    i: topic.id,
    c: topic.componentId,
    t: topic.title,
    ...(topic.titleEn ? { e: topic.titleEn } : {}),
    s: topic.status,
    p: topic.priority,
  }))
  const customSessions = state.sessions
    .filter((session) => !session.seeded)
    .map((session) => ({
      ...session,
      note: '',
      noteEn: '',
      createdAt: 0,
      updatedAt: 0,
    }))
  const changes = state.sessionChanges.map((change) => ({
    ...change,
    reason: '',
    createdAt: 0,
    updatedAt: 0,
  }))
  const records = Object.entries(state.sessionRecords)
    .filter(([, record]) => record.done)
    .map(([key]) => key)
  const exams = Object.fromEntries(
    Object.entries(state.examStates)
      .filter(
        ([, value]) =>
          value.status !== 'planned' ||
          Boolean(value.date) ||
          Boolean(value.grade) ||
          Object.values(value.checklist ?? {}).some(Boolean),
      )
      .map(([key, value]) => [
        key,
        {
          s: value.status,
          ...(value.date ? { d: value.date } : {}),
          ...(value.grade ? { g: value.grade } : {}),
          ...(Object.values(value.checklist ?? {}).some(Boolean)
            ? {
                c: Object.entries(value.checklist ?? {})
                  .filter(([, checked]) => checked)
                  .map(([item]) => item),
              }
            : {}),
        },
      ]),
  )

  return {
    v: 1,
    g: state.settings,
    m: MODULE_IDS.map(
      (id) => MODULE_STATUS_CODE[state.moduleStates[id]?.status ?? 'planned'],
    ).join(''),
    t: TOPIC_IDS.map((id) => TOPIC_STATUS_CODE[state.topicStates[id]?.status ?? 'open']).join(''),
    p: TOPIC_IDS.map((id) => String(state.topicStates[id]?.priority ?? 2)).join(''),
    ...(customTopics.length ? { ct: customTopics } : {}),
    ...(customTasks.length ? { k: customTasks } : {}),
    ...(doneSeededTasks.length ? { d: doneSeededTasks } : {}),
    ...(customSessions.length ? { s: customSessions } : {}),
    ...(changes.length ? { x: changes } : {}),
    ...(records.length ? { r: records } : {}),
    ...(Object.keys(exams).length ? { e: exams } : {}),
    ca: state.createdAt,
    ua: state.updatedAt,
  }
}

export function createQrPayload(state: UserState): SharePayload {
  return {
    app: APP_ID,
    schema: SCHEMA,
    exportedAt: new Date().toISOString(),
    compact: true,
    qr: true,
    state: createQrSnapshot(state) as unknown as UserState,
  }
}

export function encodeQrShare(state: UserState): string {
  return encodePayload(createQrPayload(state))
}

function parseSettings(value: unknown): UserState['settings'] | null {
  if (!isRecord(value)) return null
  const semester = Number(value.currentSemester)
  const weeklyGoalMinutes = Number(value.weeklyGoalMinutes)
  const dailyGoalMinutes = Number(value.dailyGoalMinutes)
  return {
    lang: value.lang === 'en' ? 'en' : 'de',
    currentSemester: (semester >= 1 && semester <= 7 ? semester : 1) as UserState['settings']['currentSemester'],
    weeklyGoalMinutes: Number.isFinite(weeklyGoalMinutes) && weeklyGoalMinutes > 0 ? weeklyGoalMinutes : 600,
    dailyGoalMinutes: Number.isFinite(dailyGoalMinutes) && dailyGoalMinutes > 0 ? dailyGoalMinutes : 120,
  }
}

/** Expands a QR snapshot into a sparse state that can be merged locally. */
export function qrSnapshotToState(raw: unknown): UserState | null {
  if (!isRecord(raw) || raw.v !== 1) return null
  const settings = parseSettings(raw.g)
  if (!settings) return null

  const moduleCodes = typeof raw.m === 'string' ? raw.m : ''
  const topicCodes = typeof raw.t === 'string' ? raw.t : ''
  const priorityCodes = typeof raw.p === 'string' ? raw.p : ''

  const moduleStates: Record<string, ModuleState> = {}
  MODULE_IDS.forEach((id, index) => {
    const code = moduleCodes[index]
    if (code === 'a' || code === 'c') {
      moduleStates[id] = {
        status: code === 'a' ? 'active' : 'completed',
        note: '',
        updatedAt: 0,
      }
    }
  })

  const topicStates: Record<string, TopicState> = {}
  TOPIC_IDS.forEach((id, index) => {
    const code = topicCodes[index]
    const parsedPriority = Number(priorityCodes[index])
    const priority: Priority =
      parsedPriority === 1 || parsedPriority === 3 ? parsedPriority : 2
    const status: TopicStatus = code === 'l' ? 'learning' : code === 'm' ? 'mastered' : 'open'
    if (status !== 'open' || priority !== 2) {
      topicStates[id] = { status, priority, note: '', updatedAt: 0 }
    }
  })

  const customTopics = (Array.isArray(raw.ct) ? raw.ct : []).flatMap((value) => {
    if (!isRecord(value) || typeof value.i !== 'string' || typeof value.c !== 'string') return []
    if (typeof value.t !== 'string') return []
    return [
      {
        id: value.i,
        componentId: value.c,
        title: value.t,
        ...(typeof value.e === 'string' ? { titleEn: value.e } : {}),
        status: (value.s === 'learning' || value.s === 'mastered' ? value.s : 'open') as TopicStatus,
        priority: (value.p === 1 || value.p === 3 ? value.p : 2) as Priority,
        createdAt: 0,
        updatedAt: 0,
      },
    ]
  })

  const doneIds = new Set(Array.isArray(raw.d) ? raw.d.filter((id): id is string => typeof id === 'string') : [])
  const tasks: Task[] = Array.from(doneIds).map(
    (id) => ({ id, done: true, priority: 2, note: '', createdAt: 0, updatedAt: 0 }) as Task,
  )
  const customTasks = (Array.isArray(raw.k) ? raw.k : []).flatMap((value) => {
    if (!isRecord(value) || typeof value.i !== 'string' || typeof value.c !== 'string') return []
    if (typeof value.t !== 'string' || typeof value.k !== 'string') return []
    return [
      {
        id: value.i,
        componentId: value.c,
        title: value.t,
        ...(typeof value.e === 'string' ? { titleEn: value.e } : {}),
        kind: value.k,
        ...(typeof value.d === 'string' ? { due: value.d } : {}),
        ...(typeof value.s === 'string' ? { start: value.s } : {}),
        ...(typeof value.n === 'string' ? { end: value.n } : {}),
        done: false,
        priority: (value.p === 1 || value.p === 3 ? value.p : 2) as Priority,
        note: '',
        createdAt: 0,
        updatedAt: 0,
      } as Task,
    ]
  })

  const sessionChanges = (Array.isArray(raw.x) ? raw.x : []).flatMap((value) => {
    if (!isRecord(value) || typeof value.id !== 'string' || typeof value.sessionId !== 'string') {
      return []
    }
    if (typeof value.originalDate !== 'string') return []
    if (value.action !== 'moved' && value.action !== 'cancelled') return []
    return [
      {
        id: value.id,
        sessionId: value.sessionId,
        originalDate: value.originalDate,
        action: value.action,
        ...(typeof value.newDate === 'string' ? { newDate: value.newDate } : {}),
        ...(typeof value.newStart === 'string' ? { newStart: value.newStart } : {}),
        ...(typeof value.newEnd === 'string' ? { newEnd: value.newEnd } : {}),
        createdAt: 0,
        updatedAt: 0,
      } as SessionChange,
    ]
  })

  const sessionRecords: UserState['sessionRecords'] = Object.fromEntries(
    (Array.isArray(raw.r) ? raw.r : [])
      .filter((key): key is string => typeof key === 'string')
      .map((key) => [key, { done: true }]),
  )

  const examStates: Record<string, ExamState> = {}
  if (isRecord(raw.e)) {
    for (const [key, value] of Object.entries(raw.e)) {
      if (!isRecord(value)) continue
      examStates[key] = {
        status: (
          value.s === 'registered' || value.s === 'passed' || value.s === 'failed'
            ? value.s
            : 'planned'
        ) as ExamStatus,
        ...(typeof value.d === 'string' ? { date: value.d } : {}),
        ...(typeof value.g === 'string' ? { grade: value.g } : {}),
        checklist: Object.fromEntries(
          (Array.isArray(value.c) ? value.c : [])
            .filter((item): item is string => typeof item === 'string')
            .map((item) => [item, true]),
        ),
        note: '',
        updatedAt: 0,
      }
    }
  }

  return {
    schema: 1,
    settings,
    moduleStates,
    topicStates,
    customTopics,
    tasks: [...tasks, ...customTasks],
    sessions: (Array.isArray(raw.s) ? raw.s : []).filter(isRecord) as unknown as SessionTemplate[],
    sessionChanges,
    sessionRecords,
    examStates,
    createdAt: typeof raw.ca === 'number' ? raw.ca : Date.now(),
    updatedAt: typeof raw.ua === 'number' ? raw.ua : Date.now(),
  }
}

export function encodeShareCode(state: UserState, compact = false): string {
  return encodePayload(createPayload(state, compact))
}

export function createShareLink(state: UserState, compact = false): string {
  const base = `${window.location.origin}${import.meta.env.BASE_URL}`
  return `${base}#share=${encodeShareCode(state, compact)}`
}

function parseRawPayload(raw: string): SharePayload | null {
  try {
    const parsed = JSON.parse(raw) as SharePayload
    if (parsed?.app !== APP_ID || !parsed.state) return null
    if (parsed.schema > SCHEMA) return null
    return parsed
  } catch {
    return null
  }
}

export function decodeShareCode(input: string): SharePayload | null {
  let value = input.trim()
  if (!value) return null
  const hashIndex = value.indexOf('#share=')
  if (hashIndex >= 0) value = value.slice(hashIndex + '#share='.length)
  else {
    const queryIndex = value.indexOf('?share=')
    if (queryIndex >= 0) {
      value = value.slice(queryIndex + '?share='.length)
      value = value.split('&')[0]
    }
  }
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(value)
    if (decompressed) return parseRawPayload(decompressed)
  } catch {
    // Try the raw form below.
  }
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(decodeURIComponent(value))
    if (decompressed) return parseRawPayload(decompressed)
  } catch {
    // Ignore and try direct JSON.
  }
  return parseRawPayload(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function normalizeState(raw: unknown): UserState | null {
  if (!isRecord(raw)) return null
  if (!isRecord(raw.settings)) return null
  if (!Array.isArray(raw.tasks) || !Array.isArray(raw.sessions)) return null

  const semester = Number(raw.settings.currentSemester)
  const lang = raw.settings.lang === 'en' ? 'en' : 'de'
  const weeklyGoalMinutes = Number(raw.settings.weeklyGoalMinutes)
  const dailyGoalMinutes = Number(raw.settings.dailyGoalMinutes)
  return {
    schema: SCHEMA,
    settings: {
      lang,
      currentSemester: (semester >= 1 && semester <= 7 ? semester : 1) as UserState['settings']['currentSemester'],
      weeklyGoalMinutes: Number.isFinite(weeklyGoalMinutes) && weeklyGoalMinutes > 0 ? weeklyGoalMinutes : 600,
      dailyGoalMinutes: Number.isFinite(dailyGoalMinutes) && dailyGoalMinutes > 0 ? dailyGoalMinutes : 120,
    },
    moduleStates: (isRecord(raw.moduleStates) ? raw.moduleStates : {}) as Record<string, ModuleState>,
    topicStates: (isRecord(raw.topicStates) ? raw.topicStates : {}) as Record<string, TopicState>,
    customTopics: Array.isArray(raw.customTopics) ? raw.customTopics : [],
    tasks: raw.tasks as Task[],
    sessions: raw.sessions,
    sessionChanges: Array.isArray(raw.sessionChanges) ? raw.sessionChanges : [],
    sessionRecords: isRecord(raw.sessionRecords)
      ? (raw.sessionRecords as UserState['sessionRecords'])
      : {},
    examStates: (isRecord(raw.examStates) ? raw.examStates : {}) as Record<string, ExamState>,
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now(),
  }
}

function mergeArrays<T extends { id: string }>(local: T[], incoming: T[]): T[] {
  const map = new Map<string, T>()
  for (const item of local) map.set(item.id, item)
  for (const item of incoming) {
    const existing = map.get(item.id)
    map.set(item.id, existing ? ({ ...existing, ...item } as T) : item)
  }
  return Array.from(map.values())
}

function mergeRecord<T extends object>(
  local: Record<string, T>,
  incoming: Record<string, T>,
): Record<string, T> {
  const merged = { ...local }
  for (const [key, value] of Object.entries(incoming)) {
    const existing = merged[key]
    merged[key] = existing ? ({ ...existing, ...value } as T) : value
  }
  return merged
}

/**
 * Rebuilds a full state from a sparse QR state. Used when the recipient
 * chooses to replace their local data, so no seeded task or session is lost.
 */
export function hydrateQrState(state: UserState): UserState {
  const base = createSeedState()
  return {
    schema: SCHEMA,
    settings: state.settings,
    moduleStates: mergeRecord(base.moduleStates, state.moduleStates),
    topicStates: mergeRecord(base.topicStates, state.topicStates),
    customTopics: state.customTopics,
    tasks: mergeArrays(base.tasks, state.tasks),
    sessions: mergeArrays(base.sessions, state.sessions),
    sessionChanges: state.sessionChanges,
    sessionRecords: { ...base.sessionRecords, ...state.sessionRecords },
    examStates: mergeRecord(base.examStates, state.examStates),
    createdAt: Math.min(base.createdAt, state.createdAt || base.createdAt),
    updatedAt: Date.now(),
  }
}

export function mergeStates(local: UserState, incoming: UserState): UserState {
  return {
    schema: SCHEMA,
    settings: {
      ...incoming.settings,
      lang: local.settings.lang,
    },
    moduleStates: mergeRecord(local.moduleStates, incoming.moduleStates),
    topicStates: mergeRecord(local.topicStates, incoming.topicStates),
    customTopics: mergeArrays(local.customTopics, incoming.customTopics),
    tasks: mergeArrays(local.tasks, incoming.tasks),
    sessions: mergeArrays(local.sessions, incoming.sessions),
    sessionChanges: mergeArrays(local.sessionChanges, incoming.sessionChanges),
    sessionRecords: { ...local.sessionRecords, ...incoming.sessionRecords },
    examStates: mergeRecord(local.examStates, incoming.examStates),
    createdAt: Math.min(local.createdAt, incoming.createdAt),
    updatedAt: Date.now(),
  }
}

export function shareSummary(state: UserState) {
  return {
    tasks: state.tasks.length,
    sessions: state.sessions.length,
    modules: new Set(Object.keys(state.moduleStates)).size,
    topics: Object.keys(state.topicStates).length + state.customTopics.length,
  }
}
