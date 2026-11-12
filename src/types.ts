export type Lang = 'de' | 'en'
export type Localized = { de: string; en: string }
export type Priority = 1 | 2 | 3
export type Semester = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type Accent = 'lime' | 'blue' | 'amber' | 'teal' | 'rose' | 'violet' | 'sage'
export type ModuleKind = 'fundamentals' | 'main' | 'internship' | 'thesis' | 'elective'
export type ExamKind =
  | 'written'
  | 'portfolio'
  | 'language'
  | 'lab'
  | 'project'
  | 'thesis'
  | 'report'
  | 'elective'
export type TaskKind =
  | 'exercise'
  | 'assignment'
  | 'study'
  | 'reading'
  | 'exam'
  | 'meeting'
  | 'other'
export type SessionKind =
  | 'lecture'
  | 'exercise'
  | 'lab'
  | 'language'
  | 'tutorial'
  | 'study'
  | 'other'
export type ModuleStatus = 'planned' | 'active' | 'completed'
export type TopicStatus = 'open' | 'learning' | 'mastered'
export type ExamStatus = 'planned' | 'registered' | 'passed' | 'failed'

export interface TopicDef {
  id: string
  title: Localized
}

export interface ComponentDef {
  id: string
  edv: string
  title: Localized
  shortTitle: Localized
  sws: number
  ects: number
  topics: TopicDef[]
}

export interface ExamPartDef {
  id: string
  componentId: string
  label: Localized
  kind: ExamKind
  durationMin?: number
  weight?: number
  graded?: boolean
  note?: Localized
}

export interface ModuleDef {
  id: string
  edv: string
  semester: Semester
  title: Localized
  shortTitle: Localized
  ects: number
  sws: number
  kind: ModuleKind
  accent: Accent
  summary: Localized
  components: ComponentDef[]
  examParts: ExamPartDef[]
  literature?: string[]
}

export interface ModuleState {
  status: ModuleStatus
  note: string
  updatedAt: number
}

export interface TopicState {
  status: TopicStatus
  priority: Priority
  note?: string
  updatedAt: number
}

export interface CustomTopic {
  id: string
  componentId: string
  title: string
  titleEn?: string
  status: TopicStatus
  priority: Priority
  note?: string
  createdAt: number
  updatedAt: number
}

export interface Task {
  id: string
  componentId: string
  title: string
  titleEn?: string
  kind: TaskKind
  due?: string
  start?: string
  end?: string
  done: boolean
  priority: Priority
  note: string
  createdAt: number
  updatedAt: number
  completedAt?: number
  seeded?: boolean
}

export interface SessionTemplate {
  id: string
  componentId: string
  kind: SessionKind
  day: number
  start: string
  end: string
  online: boolean
  room?: string
  note?: string
  noteEn?: string
  createdAt: number
  updatedAt: number
  seeded?: boolean
}

export interface SessionChange {
  id: string
  sessionId: string
  originalDate: string
  action: 'moved' | 'cancelled'
  newDate?: string
  newStart?: string
  newEnd?: string
  reason?: string
  createdAt: number
  updatedAt: number
}

export interface SessionRecord {
  done?: boolean
  note?: string
}

export interface ExamState {
  date?: string
  status: ExamStatus
  grade?: string
  checklist: Record<string, boolean>
  note: string
  updatedAt: number
}

export interface Settings {
  lang: Lang
  currentSemester: Semester
  weeklyGoalMinutes: number
  dailyGoalMinutes: number
}

export interface UserState {
  schema: number
  settings: Settings
  moduleStates: Record<string, ModuleState>
  topicStates: Record<string, TopicState>
  customTopics: CustomTopic[]
  tasks: Task[]
  sessions: SessionTemplate[]
  sessionChanges: SessionChange[]
  sessionRecords: Record<string, SessionRecord>
  examStates: Record<string, ExamState>
  createdAt: number
  updatedAt: number
}

export interface Occurrence {
  key: string
  session: SessionTemplate
  date: string
  start: string
  end: string
  online: boolean
  room?: string
  note?: string
  status: 'normal' | 'moved' | 'cancelled'
  change?: SessionChange
}

export interface SharePayload {
  app: 'esem-planner'
  schema: number
  exportedAt: string
  compact: boolean
  /** Sparse QR progress snapshot; rebuild with hydrateQrState before replacing. */
  qr?: boolean
  state: UserState
}
