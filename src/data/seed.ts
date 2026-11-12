import type {
  CustomTopic,
  ExamState,
  ModuleState,
  SessionChange,
  SessionRecord,
  SessionTemplate,
  Task,
  TopicState,
  UserState,
} from '../types'
import { CURRICULUM, EXAM_DEFS } from './curriculum'
import { defaultChecklist } from '../lib/checklist'
import { addDaysISO, startOfWeekISO, todayISO } from '../lib/date'

const now = () => Date.now()

function seedModuleStates(): Record<string, ModuleState> {
  return Object.fromEntries(
    CURRICULUM.map((module) => [
      module.id,
      {
        status: module.semester === 1 ? 'active' : 'planned',
        note:
          module.id === 'G2'
            ? 'Online-Physik über Teams – Termine werden häufig kurzfristig verschoben.'
            : module.id === 'G5'
              ? 'Fester Mittwochstermin: 15:30–17:00 Uhr.'
              : '',
        updatedAt: now(),
      } satisfies ModuleState,
    ]),
  )
}

function seedTopicStates(): Record<string, TopicState> {
  const values: [string, TopicState['status'], TopicState['priority'], string?][] = [
    ['math1-t1', 'mastered', 2],
    ['math1-t2', 'learning', 2],
    ['math1-t3', 'mastered', 2],
    ['math1-t4', 'learning', 1, 'Gauß-Verfahren und Sonderfälle sicher beherrschen.'],
    ['math1-t5', 'open', 2],
    ['math1-t6', 'open', 3],
    ['math1-t7', 'open', 1],
    ['math1-t8', 'open', 2],
    ['mech1-t1', 'mastered', 3],
    ['mech1-t2', 'learning', 1],
    ['mech1-t3', 'open', 2],
    ['mech1-t4', 'open', 2],
    ['mech1-t5', 'open', 3],
    ['mech1-t6', 'learning', 2],
    ['physics-t1', 'mastered', 3],
    ['physics-t2', 'learning', 1],
    ['physics-t3', 'learning', 2],
    ['physics-t4', 'open', 2],
    ['physics-t5', 'open', 3],
    ['physics-t6', 'open', 1],
    ['et1-t1', 'mastered', 3],
    ['et1-t2', 'learning', 2],
    ['et1-t3', 'learning', 1],
    ['et1-t4', 'open', 2],
    ['et1-t5', 'open', 2],
    ['et1-t6', 'open', 3],
    ['ret-thermal-t1', 'learning', 2],
    ['ret-thermal-t2', 'open', 2],
    ['ret-thermal-t3', 'open', 3],
    ['ret-thermal-t4', 'open', 2],
    ['ret-thermal-t5', 'open', 3],
    ['ret-pv-t1', 'learning', 2],
    ['ret-pv-t2', 'open', 2],
    ['ret-pv-t3', 'open', 3],
    ['ret-pv-t4', 'open', 3],
    ['spanish1-t1', 'mastered', 3],
    ['spanish1-t2', 'mastered', 2],
    ['spanish1-t3', 'learning', 1],
    ['spanish1-t4', 'open', 2],
    ['spanish1-t5', 'learning', 2],
    ['spanish1-t6', 'open', 2],
    ['spanish1-t7', 'open', 1],
  ]
  return Object.fromEntries(
    values.map(([id, status, priority, note]) => [
      id,
      { status, priority, note, updatedAt: now() } satisfies TopicState,
    ]),
  )
}

export function createSeedSessions(): SessionTemplate[] {
  const base = now()
  const session = (
    id: string,
    componentId: string,
    day: number,
    start: string,
    end: string,
    room?: string,
    note?: string,
    noteEn?: string,
    kind: SessionTemplate['kind'] = 'lecture',
  ): SessionTemplate => ({
    id,
    componentId,
    kind,
    day,
    start,
    end,
    online: !room,
    room,
    note,
    noteEn,
    createdAt: base,
    updatedAt: base,
    seeded: true,
  })

  return [
    session('ses-mech1-mon', 'mech1', 1, '11:30', '13:00', 'KE104'),
    session('ses-ret-thermal-mon', 'ret-thermal', 1, '14:00', '15:30', 'KE012'),
    session('ses-math1-tue-1', 'math1', 2, '09:45', '11:15', 'KE104'),
    session('ses-math1-tue-2', 'math1', 2, '11:30', '13:00', 'KE104'),
    session('ses-et1-tue-1', 'et1', 2, '14:00', '15:30', 'KE012'),
    session('ses-et1-tue-2', 'et1', 2, '15:45', '17:15', 'KE012'),
    session(
      'ses-spanish-wed',
      'spanish1',
      3,
      '15:30',
      '17:00',
      'KE104',
      'Fester Termin: Mittwoch 15:30–17:00 Uhr.',
      'Fixed session: Wednesday 15:30–17:00.',
      'language',
    ),
    session(
      'ses-physics-thu',
      'physics',
      4,
      '09:45',
      '13:00',
      undefined,
      'Online über Microsoft Teams – Termine werden häufig kurzfristig verschoben.',
      'Online via Microsoft Teams – sessions are frequently rescheduled.',
    ),
    session('ses-ret-pv-thu', 'ret-pv', 4, '14:00', '15:30', 'KE012'),
    session('ses-math1-fri', 'math1', 5, '11:30', '13:00', 'KC135'),
  ]
}

function seedTasks(): Task[] {
  const base = now()
  const today = todayISO()
  const day = (offset: number) => addDaysISO(today, offset)
  const task = (
    id: string,
    componentId: string,
    title: string,
    titleEn: string,
    kind: Task['kind'],
    due: string,
    priority: Task['priority'],
    options: Partial<Task> = {},
  ): Task => ({
    id,
    componentId,
    title,
    titleEn,
    kind,
    due,
    done: false,
    priority,
    note: '',
    createdAt: base,
    updatedAt: base,
    seeded: true,
    ...options,
  })

  return [
    task(
      'task-math-4',
      'math1',
      'Übungsblatt 4 – Vektoralgebra',
      'Problem set 4 – vector algebra',
      'exercise',
      day(-4),
      2,
      { done: true, completedAt: base - 3 * 86400000, note: 'Fertig, Aufgabe 5 war knifflig.' },
    ),
    task(
      'task-math-5',
      'math1',
      'Übungsblatt 5 – Lineare Gleichungssysteme',
      'Problem set 5 – systems of linear equations',
      'exercise',
      day(2),
      1,
      { note: 'Aufgaben 3 und 5 zuerst rechnen.' },
    ),
    task(
      'task-math-past',
      'math1',
      'Altklausur 2024 – Aufgabe 1–3',
      'Past exam 2024 – tasks 1–3',
      'exam',
      day(6),
      1,
      { start: '14:00', end: '15:30', note: 'Ohne Formelsammlung probieren.' },
    ),
    task(
      'task-mech-5',
      'mech1',
      'Übungsblatt 5 – Schwerpunkt und Fachwerke',
      'Problem set 5 – centroids and trusses',
      'exercise',
      day(4),
      2,
    ),
    task(
      'task-physics-quiz',
      'physics',
      'Online-Übung: Schwingungen',
      'Online exercise: oscillations',
      'exercise',
      day(1),
      1,
      { note: 'Link im Moodle-Kurs prüfen.' },
    ),
    task(
      'task-physics-catchup',
      'physics',
      'Verschobenen Physik-Termin nacharbeiten',
      'Catch up on rescheduled physics session',
      'study',
      day(-1),
      1,
      { note: 'Aufzeichnung ansehen und Mitschrift ergänzen.' },
    ),
    task(
      'task-physics-formula',
      'physics',
      'Formelsammlung Thermodynamik ergänzen',
      'Complete thermodynamics formula sheet',
      'study',
      day(5),
      2,
    ),
    task(
      'task-et-5',
      'et1',
      'Übungsblatt 5 – Netzwerkanalyse',
      'Problem set 5 – network analysis',
      'exercise',
      day(3),
      1,
    ),
    task(
      'task-et-lab',
      'et1',
      'Laborvorbereitung: Spule und Transformator',
      'Lab preparation: inductor and transformer',
      'reading',
      day(7),
      2,
    ),
    task(
      'task-ret-outline',
      'ret-thermal',
      'Portfolio: Solarthermie – Gliederung',
      'Portfolio: solar thermal – outline',
      'assignment',
      day(5),
      2,
      { note: 'Quellen im ILIAS-Ordner nutzen.' },
    ),
    task(
      'task-ret-presentation',
      'ret-pv',
      'Gruppenpräsentation PV/Wind vorbereiten',
      'Prepare PV/wind group presentation',
      'assignment',
      day(9),
      3,
    ),
    task(
      'task-spanish-vocab',
      'spanish1',
      'Vokabeln Unidad 3 wiederholen',
      'Review Unidad 3 vocabulary',
      'study',
      day(2),
      2,
    ),
    task(
      'task-spanish-tarea',
      'spanish1',
      'Tarea: presentación personal',
      'Tarea: personal presentation',
      'assignment',
      day(6),
      1,
      { note: '5 Minuten frei sprechen üben.' },
    ),
    task(
      'task-spanish-2',
      'spanish1',
      'Vokabeln Unidad 2 wiederholen',
      'Review Unidad 2 vocabulary',
      'study',
      day(-3),
      3,
      { done: true, completedAt: base - 2 * 86400000 },
    ),
    task(
      'task-study-gauss',
      'math1',
      'Lernblock: Gauß-Verfahren',
      'Study block: Gaussian elimination',
      'study',
      day(1),
      2,
      { start: '18:00', end: '19:30', note: 'Zwei Beispiele selbst rechnen, dann Altklausur.' },
    ),
    task(
      'task-study-oscillations',
      'physics',
      'Lernblock: Schwingungen',
      'Study block: oscillations',
      'study',
      day(1),
      1,
      { start: '16:00', end: '17:30' },
    ),
  ]
}

function seedSessionRecords(): Record<string, SessionRecord> {
  const monday = startOfWeekISO()
  const lastMonday = addDaysISO(monday, -7)
  const lastThursday = addDaysISO(lastMonday, 3)
  return {
    [`ses-mech1-mon@${lastMonday}`]: { done: true },
    [`ses-physics-thu@${lastThursday}`]: { done: true },
  }
}

function seedExamStates(): Record<string, ExamState> {
  const states: Record<string, ExamState> = {}
  for (const exam of EXAM_DEFS.filter((item) => item.semester === 1)) {
    states[exam.key] = {
      status: 'planned',
      checklist: defaultChecklist(exam.kind),
      note: '',
      updatedAt: now(),
    }
  }
  return states
}

export function createSeedState(): UserState {
  const timestamp = now()
  return {
    schema: 1,
    settings: {
      lang: 'de',
      currentSemester: 1,
      weeklyGoalMinutes: 600,
      dailyGoalMinutes: 120,
    },
    moduleStates: seedModuleStates(),
    topicStates: seedTopicStates(),
    customTopics: [] as CustomTopic[],
    tasks: seedTasks(),
    sessions: createSeedSessions(),
    sessionChanges: [] as SessionChange[],
    sessionRecords: seedSessionRecords(),
    examStates: seedExamStates(),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}
