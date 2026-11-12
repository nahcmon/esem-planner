import type {
  CustomTopic,
  Localized,
  ModuleDef,
  Occurrence,
  Priority,
  Task,
  TopicStatus,
  UserState,
} from '../types'
import {
  COMPONENT_BY_ID,
  CURRICULUM,
  EXAM_DEFS,
  MODULE_BY_ID,
  TOTAL_ECTS,
} from '../data/curriculum'
import {
  addDaysISO,
  durationMinutes,
  fromISODate,
  startOfWeekISO,
  toISODate,
  todayISO,
  weekDates,
} from './date'

export function weekdayNumber(dateISO: string): number {
  const day = fromISODate(dateISO).getDay()
  return day === 0 ? 7 : day
}

export function occurrenceKey(sessionId: string, dateISO: string): string {
  return `${sessionId}@${dateISO}`
}

export function occurrencesForDate(state: UserState, dateISO: string): Occurrence[] {
  const day = weekdayNumber(dateISO)
  const occurrences: Occurrence[] = []

  for (const session of state.sessions) {
    const change = state.sessionChanges.find(
      (item) => item.sessionId === session.id && item.originalDate === dateISO,
    )
    if (change) {
      occurrences.push({
        key: occurrenceKey(session.id, dateISO),
        session,
        date: dateISO,
        start: session.start,
        end: session.end,
        online: session.online,
        room: session.room,
        note: session.note,
        status: change.action === 'cancelled' ? 'cancelled' : 'moved',
        change,
      })
      continue
    }
    if (session.day !== day) continue
    occurrences.push({
      key: occurrenceKey(session.id, dateISO),
      session,
      date: dateISO,
      start: session.start,
      end: session.end,
      online: session.online,
      room: session.room,
      note: session.note,
      status: 'normal',
    })
  }

  for (const change of state.sessionChanges) {
    if (change.action !== 'moved' || change.newDate !== dateISO) continue
    const session = state.sessions.find((item) => item.id === change.sessionId)
    if (!session) continue
    occurrences.push({
      key: occurrenceKey(session.id, dateISO),
      session,
      date: dateISO,
      start: change.newStart ?? session.start,
      end: change.newEnd ?? session.end,
      online: session.online,
      room: session.room,
      note: session.note,
      status: 'moved',
      change,
    })
  }

  return occurrences.sort((a, b) => a.start.localeCompare(b.start))
}

export function isGhostOccurrence(occurrence: Occurrence): boolean {
  return occurrence.status === 'moved' && occurrence.change?.originalDate === occurrence.date
}

export function isCountedOccurrence(occurrence: Occurrence): boolean {
  return occurrence.status !== 'cancelled' && !isGhostOccurrence(occurrence)
}

export function occurrencesBetween(state: UserState, startISO: string, endISO: string): Occurrence[] {
  const result: Occurrence[] = []
  let cursor = startISO
  let guard = 0
  while (cursor <= endISO && guard < 400) {
    result.push(...occurrencesForDate(state, cursor))
    cursor = addDaysISO(cursor, 1)
    guard += 1
  }
  return result
}

export function weekOccurrences(state: UserState, mondayISO: string): Occurrence[] {
  return occurrencesBetween(state, mondayISO, addDaysISO(mondayISO, 6))
}

export function tasksForDate(state: UserState, dateISO: string): Task[] {
  return state.tasks
    .filter((task) => task.due === dateISO)
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1
      const aTime = a.start ?? '99:99'
      const bTime = b.start ?? '99:99'
      return aTime.localeCompare(bTime)
    })
}

export function isExamForDate(examKey: string, state: UserState, dateISO: string): boolean {
  return state.examStates[examKey]?.date === dateISO
}

export function examsForDate(state: UserState, dateISO: string) {
  return EXAM_DEFS.filter((exam) => state.examStates[exam.key]?.date === dateISO)
}

export function taskMinutes(task: Task): number {
  if (task.start && task.end) return durationMinutes(task.start, task.end)
  if (task.kind === 'study') return 45
  return 30
}

export function sessionDone(state: UserState, occurrence: Occurrence): boolean {
  return Boolean(state.sessionRecords[occurrence.key]?.done)
}

export function sessionNote(state: UserState, occurrence: Occurrence): string {
  return state.sessionRecords[occurrence.key]?.note ?? ''
}

export interface TopicRow {
  id: string
  componentId: string
  moduleId: string
  semester: number
  componentTitle: Localized
  moduleTitle: Localized
  title: Localized
  status: TopicStatus
  priority: Priority
  note: string
  custom: boolean
}

export function allTopicRows(state: UserState, moduleFilter?: ModuleDef): TopicRow[] {
  const modules = moduleFilter ? [moduleFilter] : CURRICULUM
  const rows: TopicRow[] = []
  for (const module of modules) {
    for (const component of module.components) {
      for (const topic of component.topics) {
        const topicState = state.topicStates[topic.id]
        rows.push({
          id: topic.id,
          componentId: component.id,
          moduleId: module.id,
          semester: module.semester,
          componentTitle: component.title,
          moduleTitle: module.title,
          title: topic.title,
          status: topicState?.status ?? 'open',
          priority: topicState?.priority ?? 2,
          note: topicState?.note ?? '',
          custom: false,
        })
      }
    }
  }
  for (const topic of state.customTopics) {
    if (moduleFilter && !moduleFilter.components.some((component) => component.id === topic.componentId)) {
      continue
    }
    const componentInfo = COMPONENT_BY_ID.get(topic.componentId)
    if (!componentInfo) continue
    rows.push({
      id: topic.id,
      componentId: topic.componentId,
      moduleId: componentInfo.module.id,
      semester: componentInfo.module.semester,
      componentTitle: componentInfo.component.title,
      moduleTitle: componentInfo.module.title,
      title: { de: topic.title, en: topic.titleEn ?? topic.title },
      status: topic.status,
      priority: topic.priority,
      note: topic.note ?? '',
      custom: true,
    })
  }
  return rows
}

export function topicsForModule(state: UserState, module: ModuleDef): TopicRow[] {
  return allTopicRows(state, module)
}

export function topicsForComponent(state: UserState, componentId: string): TopicRow[] {
  return allTopicRows(state).filter((topic) => topic.componentId === componentId)
}

export function priorityWeight(priority: Priority): number {
  return priority === 1 ? 0 : priority === 2 ? 1 : 2
}

export function sortTopics(rows: TopicRow[]): TopicRow[] {
  return [...rows].sort((a, b) => {
    if (a.status === 'mastered' && b.status !== 'mastered') return 1
    if (b.status === 'mastered' && a.status !== 'mastered') return -1
    if (a.priority !== b.priority) return a.priority - b.priority
    if (a.status !== b.status) {
      const order: Record<TopicStatus, number> = { learning: 0, open: 1, mastered: 2 }
      return order[a.status] - order[b.status]
    }
    return a.title.de.localeCompare(b.title.de)
  })
}

export interface ProgressStats {
  progress: number
  topicsTotal: number
  mastered: number
  learning: number
  open: number
  tasksTotal: number
  tasksDone: number
  ects: number
}

function emptyStats(ects = 0): ProgressStats {
  return { progress: 0, topicsTotal: 0, mastered: 0, learning: 0, open: 0, tasksTotal: 0, tasksDone: 0, ects }
}

function statsFromCounts(
  topics: TopicRow[],
  tasks: Task[],
  moduleStatus: 'planned' | 'active' | 'completed',
  ects: number,
): ProgressStats {
  if (moduleStatus === 'completed') {
    return {
      progress: 1,
      topicsTotal: topics.length,
      mastered: topics.length,
      learning: 0,
      open: 0,
      tasksTotal: tasks.length,
      tasksDone: tasks.filter((task) => task.done).length,
      ects,
    }
  }
  const mastered = topics.filter((topic) => topic.status === 'mastered').length
  const learning = topics.filter((topic) => topic.status === 'learning').length
  const open = topics.length - mastered - learning
  const topicScore = topics.length ? (mastered + learning * 0.5) / topics.length : 0
  const taskScore = tasks.length ? tasks.filter((task) => task.done).length / tasks.length : 0
  let progress = 0
  if (topics.length && tasks.length) progress = topicScore * 0.7 + taskScore * 0.3
  else if (topics.length) progress = topicScore
  else if (tasks.length) progress = taskScore
  return {
    progress,
    topicsTotal: topics.length,
    mastered,
    learning,
    open,
    tasksTotal: tasks.length,
    tasksDone: tasks.filter((task) => task.done).length,
    ects,
  }
}

export function moduleStats(state: UserState, module: ModuleDef): ProgressStats {
  const componentIds = new Set(module.components.map((component) => component.id))
  return statsFromCounts(
    topicsForModule(state, module),
    state.tasks.filter((task) => componentIds.has(task.componentId)),
    state.moduleStates[module.id]?.status ?? 'planned',
    module.ects,
  )
}

export function componentStats(state: UserState, componentId: string): ProgressStats {
  const info = COMPONENT_BY_ID.get(componentId)
  if (!info) return emptyStats()
  return statsFromCounts(
    allTopicRows(state).filter((topic) => topic.componentId === componentId),
    state.tasks.filter((task) => task.componentId === componentId),
    state.moduleStates[info.module.id]?.status ?? 'planned',
    info.component.ects,
  )
}

export function semesterStats(state: UserState, semester: number): ProgressStats {
  const modules = CURRICULUM.filter((module) => module.semester === semester)
  if (!modules.length) return emptyStats()
  const stats = modules.map((module) => moduleStats(state, module))
  const topicsTotal = stats.reduce((sum, item) => sum + item.topicsTotal, 0)
  const mastered = stats.reduce((sum, item) => sum + item.mastered, 0)
  const learning = stats.reduce((sum, item) => sum + item.learning, 0)
  const open = stats.reduce((sum, item) => sum + item.open, 0)
  const tasksTotal = stats.reduce((sum, item) => sum + item.tasksTotal, 0)
  const tasksDone = stats.reduce((sum, item) => sum + item.tasksDone, 0)
  const ects = stats.reduce((sum, item) => sum + item.ects, 0)
  const progress = ects
    ? stats.reduce((sum, item) => sum + item.progress * item.ects, 0) / ects
    : 0
  return { progress, topicsTotal, mastered, learning, open, tasksTotal, tasksDone, ects }
}

export function modulePassed(state: UserState, module: ModuleDef): boolean {
  if (state.moduleStates[module.id]?.status === 'completed') return true
  const graded = module.examParts.filter((part) => part.graded !== false)
  if (!graded.length) return false
  return graded.every((part) => state.examStates[`${module.id}:${part.id}`]?.status === 'passed')
}

export function overallStats(state: UserState) {
  const earned = CURRICULUM.filter((module) => modulePassed(state, module)).reduce(
    (sum, module) => sum + module.ects,
    0,
  )
  const active = CURRICULUM.filter(
    (module) => !modulePassed(state, module) && state.moduleStates[module.id]?.status === 'active',
  )
  const inProgressEcts = active.reduce((sum, module) => sum + module.ects, 0)
  const inProgressWeighted = active.reduce(
    (sum, module) => sum + module.ects * moduleStats(state, module).progress,
    0,
  )
  const activeCredits = inProgressEcts
    ? inProgressWeighted / inProgressEcts
    : 0
  return {
    earned,
    inProgressEcts,
    activeCredits,
    total: TOTAL_ECTS,
    percent: TOTAL_ECTS ? earned / TOTAL_ECTS : 0,
    inProgressProgress: activeCredits,
  }
}

export interface WeekStudyStats {
  plannedMinutes: number
  doneMinutes: number
  sessions: number
  sessionsDone: number
  tasks: number
  tasksDone: number
}

export function weekStudyStats(state: UserState, mondayISO: string): WeekStudyStats {
  const occurrences = weekOccurrences(state, mondayISO).filter(isCountedOccurrence)
  const tasks = state.tasks.filter(
    (task) => task.due && task.due >= mondayISO && task.due <= addDaysISO(mondayISO, 6),
  )
  const plannedMinutes =
    occurrences.reduce((sum, occurrence) => sum + durationMinutes(occurrence.start, occurrence.end), 0) +
    tasks.reduce((sum, task) => sum + taskMinutes(task), 0)
  const doneMinutes =
    occurrences
      .filter((occurrence) => sessionDone(state, occurrence))
      .reduce((sum, occurrence) => sum + durationMinutes(occurrence.start, occurrence.end), 0) +
    tasks.filter((task) => task.done).reduce((sum, task) => sum + taskMinutes(task), 0)
  return {
    plannedMinutes,
    doneMinutes,
    sessions: occurrences.length,
    sessionsDone: occurrences.filter((occurrence) => sessionDone(state, occurrence)).length,
    tasks: tasks.length,
    tasksDone: tasks.filter((task) => task.done).length,
  }
}

export function minutesForWeek(state: UserState, mondayISO: string): number {
  return weekStudyStats(state, mondayISO).doneMinutes
}

export function lastWeeks(state: UserState, count = 8): { monday: string; minutes: number; planned: number }[] {
  const current = startOfWeekISO()
  const result: { monday: string; minutes: number; planned: number }[] = []
  for (let index = count - 1; index >= 0; index -= 1) {
    const monday = addDaysISO(current, -7 * index)
    const stats = weekStudyStats(state, monday)
    result.push({ monday, minutes: stats.doneMinutes, planned: stats.plannedMinutes })
  }
  return result
}

export function activityDates(state: UserState): Set<string> {
  const dates = new Set<string>()
  for (const [key, record] of Object.entries(state.sessionRecords)) {
    if (!record.done) continue
    const date = key.split('@')[1]
    if (date) dates.add(date)
  }
  for (const task of state.tasks) {
    if (task.done && task.completedAt) dates.add(toISODate(new Date(task.completedAt)))
  }
  return dates
}

export function currentStreak(state: UserState): number {
  const dates = activityDates(state)
  const today = todayISO()
  const yesterday = addDaysISO(today, -1)
  let cursor = dates.has(today) ? today : dates.has(yesterday) ? yesterday : null
  if (!cursor) return 0
  let streak = 0
  while (dates.has(cursor)) {
    streak += 1
    cursor = addDaysISO(cursor, -1)
  }
  return streak
}

export function tasksDueSoon(state: UserState, limit = 5): Task[] {
  const today = todayISO()
  return state.tasks
    .filter((task) => !task.done && task.due)
    .sort((a, b) => {
      const aLate = a.due! < today
      const bLate = b.due! < today
      if (aLate !== bLate) return aLate ? -1 : 1
      const dateCompare = (a.due ?? '').localeCompare(b.due ?? '')
      if (dateCompare !== 0) return dateCompare
      return a.priority - b.priority
    })
    .slice(0, limit)
}

export function nextExam(state: UserState, semester?: number) {
  const today = todayISO()
  return EXAM_DEFS.filter(
    (exam) =>
      (!semester || exam.semester === semester) &&
      state.examStates[exam.key]?.date &&
      state.examStates[exam.key]!.date! >= today &&
      state.examStates[exam.key]?.status !== 'passed',
  ).sort((a, b) =>
    (state.examStates[a.key]?.date ?? '').localeCompare(state.examStates[b.key]?.date ?? ''),
  )[0]
}

export function examChecklistProgress(state: UserState, examKey: string) {
  const stateForExam = state.examStates[examKey]
  const items = Object.keys(stateForExam?.checklist ?? {})
  const done = Object.values(stateForExam?.checklist ?? {}).filter(Boolean).length
  return {
    done,
    total: items.length,
    complete: items.length > 0 && done === items.length,
  }
}

export function moduleExamStates(state: UserState, module: ModuleDef) {
  return module.examParts.map((part) => ({
    part,
    state: state.examStates[`${module.id}:${part.id}`],
  }))
}

export function isModuleActive(state: UserState, module: ModuleDef): boolean {
  return (state.moduleStates[module.id]?.status ?? 'planned') === 'active'
}

export function moduleDisplayName(module: ModuleDef, lang: 'de' | 'en'): string {
  return module.title[lang]
}

export function findComponent(componentId: string) {
  return COMPONENT_BY_ID.get(componentId)
}

export function findModule(moduleId: string) {
  return MODULE_BY_ID.get(moduleId)
}

export function weekTaskGroups(state: UserState, mondayISO: string) {
  const dates = weekDates(mondayISO)
  return dates.map((date) => ({
    date,
    tasks: tasksForDate(state, date),
    exams: examsForDate(state, date),
  }))
}

export function emptyCustomTopic(componentId: string): CustomTopic {
  return {
    id: `ct-${crypto.randomUUID()}`,
    componentId,
    title: '',
    status: 'open',
    priority: 2,
    note: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}
