import { create } from 'zustand'
import { translate, type MessageKey } from './i18n'
import { usePlanner } from './store'
import type { SessionTemplate, SharePayload, TaskKind } from './types'

export interface TaskDefaults {
  componentId?: string
  kind?: TaskKind
  due?: string
  start?: string
  end?: string
}

export type Dialog =
  | { kind: 'task'; id?: string; defaults?: TaskDefaults }
  | { kind: 'session'; id?: string; defaults?: Partial<SessionTemplate> }
  | { kind: 'sessionDetails'; sessionId: string; date: string }
  | { kind: 'topic'; componentId: string; topicId?: string }
  | { kind: 'share' }
  | { kind: 'import'; payload: SharePayload; source: 'link' | 'code' | 'file' }
  | { kind: 'examResult'; examKey: string }
  | {
      kind: 'confirm'
      title: string
      body: string
      confirmLabel?: string
      tone?: 'danger' | 'default'
      onConfirm: () => void
    }

export interface Toast {
  id: string
  message: string
  tone: 'default' | 'success' | 'error'
}

interface UIStore {
  dialog: Dialog | null
  openDialog: (dialog: Dialog) => void
  closeDialog: () => void
  toasts: Toast[]
  toast: (message: MessageKey, vars?: Record<string, string | number>, tone?: Toast['tone']) => void
  dismissToast: (id: string) => void
}

function toastId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export const useUI = create<UIStore>((set, get) => ({
  dialog: null,
  openDialog: (dialog) => set({ dialog }),
  closeDialog: () => set({ dialog: null }),
  toasts: [],
  toast: (message, vars, tone = 'default') => {
    const lang = usePlanner.getState().settings.lang
    const id = toastId()
    set((state) => ({
      toasts: [...state.toasts, { id, message: translate(lang, message, vars), tone }],
    }))
    window.setTimeout(() => {
      if (get().toasts.some((item) => item.id === id)) {
        set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) }))
      }
    }, 3400)
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })),
}))
