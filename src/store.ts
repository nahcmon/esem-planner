import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  CustomTopic,
  ExamKind,
  ExamState,
  ExamStatus,
  ModuleStatus,
  SessionChange,
  SessionTemplate,
  Task,
  TopicState,
  UserState,
} from './types'
import { createSeedState } from './data/seed'
import { defaultChecklist } from './lib/checklist'
import { mergeStates } from './lib/share'

const STORAGE_KEY = 'esem-planner:v1'

export const makeId = (prefix: string): string => {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  return `${prefix}-${random}`
}

type TaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>
type SessionInput = Omit<SessionTemplate, 'id' | 'createdAt' | 'updatedAt'>

interface PlannerStore extends UserState {
  hydrated: boolean
  setHydrated: (value: boolean) => void
  setLang: (lang: UserState['settings']['lang']) => void
  setCurrentSemester: (semester: UserState['settings']['currentSemester']) => void
  setGoals: (weeklyGoalMinutes: number, dailyGoalMinutes: number) => void
  setModuleStatus: (moduleId: string, status: ModuleStatus) => void
  setModuleNote: (moduleId: string, note: string) => void
  setTopicState: (topicId: string, patch: Partial<TopicState>) => void
  addCustomTopic: (topic: CustomTopic) => void
  updateCustomTopic: (id: string, patch: Partial<CustomTopic>) => void
  deleteCustomTopic: (id: string) => void
  addTask: (input: TaskInput) => string
  updateTask: (id: string, patch: Partial<Task>) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  addSession: (input: SessionInput) => string
  updateSession: (id: string, patch: Partial<SessionTemplate>) => void
  deleteSession: (id: string) => void
  moveOccurrence: (
    sessionId: string,
    originalDate: string,
    newDate: string,
    newStart: string,
    newEnd: string,
    reason?: string,
  ) => void
  cancelOccurrence: (sessionId: string, originalDate: string, reason?: string) => void
  restoreOccurrence: (sessionId: string, originalDate: string) => void
  toggleSessionDone: (sessionId: string, date: string) => void
  setSessionNote: (sessionId: string, date: string, note: string) => void
  updateExam: (examKey: string, kind: ExamKind, patch: Partial<ExamState>) => void
  toggleExamChecklist: (examKey: string, itemId: string, kind: ExamKind) => void
  setExamStatus: (examKey: string, status: ExamStatus, kind: ExamKind, grade?: string) => void
  replaceImported: (state: UserState) => void
  mergeImported: (state: UserState) => void
  resetSeed: () => void
  clearAll: () => void
}

function touch(): number {
  return Date.now()
}

function emptyExamState(kind: ExamKind): ExamState {
  return {
    status: 'planned',
    checklist: defaultChecklist(kind),
    note: '',
    updatedAt: touch(),
  }
}

export const usePlanner = create<PlannerStore>()(
  persist(
    (set, get) => ({
      ...createSeedState(),
      hydrated: false,

      setHydrated: (value) => set({ hydrated: value }),

      setLang: (lang) => {
        set((state) => ({
          settings: { ...state.settings, lang },
          updatedAt: touch(),
        }))
      },

      setCurrentSemester: (currentSemester) => {
        set((state) => ({
          settings: { ...state.settings, currentSemester },
          updatedAt: touch(),
        }))
      },

      setGoals: (weeklyGoalMinutes, dailyGoalMinutes) => {
        set((state) => ({
          settings: { ...state.settings, weeklyGoalMinutes, dailyGoalMinutes },
          updatedAt: touch(),
        }))
      },

      setModuleStatus: (moduleId, status) => {
        set((state) => ({
          moduleStates: {
            ...state.moduleStates,
            [moduleId]: {
              status,
              note: state.moduleStates[moduleId]?.note ?? '',
              updatedAt: touch(),
            },
          },
          updatedAt: touch(),
        }))
      },

      setModuleNote: (moduleId, note) => {
        set((state) => ({
          moduleStates: {
            ...state.moduleStates,
            [moduleId]: {
              status: state.moduleStates[moduleId]?.status ?? 'planned',
              note,
              updatedAt: touch(),
            },
          },
          updatedAt: touch(),
        }))
      },

      setTopicState: (topicId, patch) => {
        set((state) => {
          const current = state.topicStates[topicId] ?? {
            status: 'open' as const,
            priority: 2 as const,
            note: '',
            updatedAt: touch(),
          }
          return {
            topicStates: {
              ...state.topicStates,
              [topicId]: { ...current, ...patch, updatedAt: touch() },
            },
            updatedAt: touch(),
          }
        })
      },

      addCustomTopic: (topic) => {
        set((state) => ({ customTopics: [...state.customTopics, topic], updatedAt: touch() }))
      },

      updateCustomTopic: (id, patch) => {
        set((state) => ({
          customTopics: state.customTopics.map((topic) =>
            topic.id === id ? { ...topic, ...patch, updatedAt: touch() } : topic,
          ),
          updatedAt: touch(),
        }))
      },

      deleteCustomTopic: (id) => {
        set((state) => ({
          customTopics: state.customTopics.filter((topic) => topic.id !== id),
          updatedAt: touch(),
        }))
      },

      addTask: (input) => {
        const id = makeId('task')
        const timestamp = touch()
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              ...input,
              id,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          ],
          updatedAt: timestamp,
        }))
        return id
      },

      updateTask: (id, patch) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...patch, updatedAt: touch() } : task,
          ),
          updatedAt: touch(),
        }))
      },

      toggleTask: (id) => {
        set((state) => {
          const timestamp = touch()
          return {
            tasks: state.tasks.map((task) => {
              if (task.id !== id) return task
              const done = !task.done
              return {
                ...task,
                done,
                completedAt: done ? timestamp : undefined,
                updatedAt: timestamp,
              }
            }),
            updatedAt: timestamp,
          }
        })
      },

      deleteTask: (id) => {
        set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id), updatedAt: touch() }))
      },

      addSession: (input) => {
        const id = makeId('ses')
        const timestamp = touch()
        set((state) => ({
          sessions: [
            ...state.sessions,
            {
              ...input,
              id,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          ],
          updatedAt: timestamp,
        }))
        return id
      },

      updateSession: (id, patch) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === id ? { ...session, ...patch, updatedAt: touch() } : session,
          ),
          updatedAt: touch(),
        }))
      },

      deleteSession: (id) => {
        set((state) => ({
          sessions: state.sessions.filter((session) => session.id !== id),
          sessionChanges: state.sessionChanges.filter((change) => change.sessionId !== id),
          sessionRecords: Object.fromEntries(
            Object.entries(state.sessionRecords).filter(([key]) => !key.startsWith(`${id}@`)),
          ),
          updatedAt: touch(),
        }))
      },

      moveOccurrence: (sessionId, originalDate, newDate, newStart, newEnd, reason) => {
        set((state) => {
          const timestamp = touch()
          const existing = state.sessionChanges.find(
            (change) => change.sessionId === sessionId && change.originalDate === originalDate,
          )
          const next: SessionChange = existing
            ? {
                ...existing,
                action: 'moved',
                newDate,
                newStart,
                newEnd,
                reason: reason || undefined,
                updatedAt: timestamp,
              }
            : {
                id: makeId('chg'),
                sessionId,
                originalDate,
                action: 'moved',
                newDate,
                newStart,
                newEnd,
                reason: reason || undefined,
                createdAt: timestamp,
                updatedAt: timestamp,
              }
          return {
            sessionChanges: existing
              ? state.sessionChanges.map((change) => (change.id === existing.id ? next : change))
              : [...state.sessionChanges, next],
            updatedAt: timestamp,
          }
        })
      },

      cancelOccurrence: (sessionId, originalDate, reason) => {
        set((state) => {
          const timestamp = touch()
          const existing = state.sessionChanges.find(
            (change) => change.sessionId === sessionId && change.originalDate === originalDate,
          )
          const next: SessionChange = existing
            ? {
                ...existing,
                action: 'cancelled',
                newDate: undefined,
                newStart: undefined,
                newEnd: undefined,
                reason: reason || undefined,
                updatedAt: timestamp,
              }
            : {
                id: makeId('chg'),
                sessionId,
                originalDate,
                action: 'cancelled',
                reason: reason || undefined,
                createdAt: timestamp,
                updatedAt: timestamp,
              }
          return {
            sessionChanges: existing
              ? state.sessionChanges.map((change) => (change.id === existing.id ? next : change))
              : [...state.sessionChanges, next],
            updatedAt: timestamp,
          }
        })
      },

      restoreOccurrence: (sessionId, originalDate) => {
        set((state) => ({
          sessionChanges: state.sessionChanges.filter(
            (change) => !(change.sessionId === sessionId && change.originalDate === originalDate),
          ),
          updatedAt: touch(),
        }))
      },

      toggleSessionDone: (sessionId, date) => {
        set((state) => {
          const key = `${sessionId}@${date}`
          const current = state.sessionRecords[key]
          return {
            sessionRecords: {
              ...state.sessionRecords,
              [key]: { ...current, done: !current?.done },
            },
            updatedAt: touch(),
          }
        })
      },

      setSessionNote: (sessionId, date, note) => {
        set((state) => {
          const key = `${sessionId}@${date}`
          return {
            sessionRecords: {
              ...state.sessionRecords,
              [key]: { ...state.sessionRecords[key], note },
            },
            updatedAt: touch(),
          }
        })
      },

      updateExam: (examKey, kind, patch) => {
        set((state) => {
          const current = state.examStates[examKey] ?? emptyExamState(kind)
          return {
            examStates: {
              ...state.examStates,
              [examKey]: { ...current, ...patch, updatedAt: touch() },
            },
            updatedAt: touch(),
          }
        })
      },

      toggleExamChecklist: (examKey, itemId, kind) => {
        const state = get()
        const current = state.examStates[examKey] ?? emptyExamState(kind)
        state.updateExam(examKey, kind, {
          checklist: { ...current.checklist, [itemId]: !current.checklist[itemId] },
        })
      },

      setExamStatus: (examKey, status, kind, grade) => {
        const state = get()
        const current = state.examStates[examKey] ?? emptyExamState(kind)
        state.updateExam(examKey, kind, {
          status,
          grade: status === 'passed' || status === 'failed' ? grade ?? current.grade : undefined,
        })
      },

      replaceImported: (incoming) => {
        set({
          ...incoming,
          schema: 1,
          updatedAt: touch(),
        })
      },

      mergeImported: (incoming) => {
        set(mergeStates(get(), incoming))
      },

      resetSeed: () => {
        set({ ...createSeedState(), hydrated: true })
      },

      clearAll: () => {
        set((state) => ({
          schema: 1,
          settings: state.settings,
          moduleStates: {},
          topicStates: {},
          customTopics: [],
          tasks: [],
          sessions: [],
          sessionChanges: [],
          sessionRecords: {},
          examStates: {},
          createdAt: state.createdAt,
          updatedAt: touch(),
        }))
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    },
  ),
)

export { STORAGE_KEY }
