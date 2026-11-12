import type { ExamKind } from '../types'
import type { MessageKey } from '../i18n'

export interface ChecklistItem {
  id: string
  labelKey: MessageKey
}

const WRITTEN: ChecklistItem[] = [
  { id: 'registration', labelKey: 'checklist.registration' },
  { id: 'withdrawal', labelKey: 'checklist.withdrawal' },
  { id: 'pastExam', labelKey: 'checklist.pastExam' },
  { id: 'notes', labelKey: 'checklist.notes' },
  { id: 'materials', labelKey: 'checklist.materials' },
  { id: 'room', labelKey: 'checklist.room' },
]

const PORTFOLIO: ChecklistItem[] = [
  { id: 'registration', labelKey: 'checklist.registration' },
  { id: 'notes', labelKey: 'checklist.notes' },
  { id: 'presentation', labelKey: 'checklist.presentation' },
  { id: 'submission', labelKey: 'checklist.submission' },
  { id: 'materials', labelKey: 'checklist.materials' },
  { id: 'room', labelKey: 'checklist.room' },
]

const LANGUAGE: ChecklistItem[] = [
  { id: 'language', labelKey: 'checklist.language' },
  { id: 'notes', labelKey: 'checklist.notes' },
  { id: 'materials', labelKey: 'checklist.materials' },
  { id: 'room', labelKey: 'checklist.room' },
]

const LAB: ChecklistItem[] = [
  { id: 'attendance', labelKey: 'checklist.attendance' },
  { id: 'report', labelKey: 'checklist.report' },
  { id: 'presentation', labelKey: 'checklist.presentation' },
  { id: 'registration', labelKey: 'checklist.registration' },
]

const PROJECT: ChecklistItem[] = [
  { id: 'project', labelKey: 'checklist.project' },
  { id: 'submission', labelKey: 'checklist.submission' },
  { id: 'presentation', labelKey: 'checklist.presentation' },
  { id: 'notes', labelKey: 'checklist.notes' },
]

const THESIS: ChecklistItem[] = [
  { id: 'thesis', labelKey: 'checklist.thesis' },
  { id: 'colloquium', labelKey: 'checklist.colloquium' },
  { id: 'notes', labelKey: 'checklist.notes' },
  { id: 'materials', labelKey: 'checklist.materials' },
]

const REPORT: ChecklistItem[] = [
  { id: 'internship', labelKey: 'checklist.internship' },
  { id: 'report', labelKey: 'checklist.report' },
  { id: 'corporate', labelKey: 'checklist.corporate' },
  { id: 'presentation', labelKey: 'checklist.presentation' },
]

const ELECTIVE: ChecklistItem[] = [
  { id: 'elective', labelKey: 'checklist.elective' },
  { id: 'registration', labelKey: 'checklist.registration' },
  { id: 'notes', labelKey: 'checklist.notes' },
  { id: 'materials', labelKey: 'checklist.materials' },
]

const BY_KIND: Record<ExamKind, ChecklistItem[]> = {
  written: WRITTEN,
  portfolio: PORTFOLIO,
  language: LANGUAGE,
  lab: LAB,
  project: PROJECT,
  thesis: THESIS,
  report: REPORT,
  elective: ELECTIVE,
}

export function checklistItems(kind: ExamKind): ChecklistItem[] {
  return BY_KIND[kind]
}

export function defaultChecklist(kind: ExamKind): Record<string, boolean> {
  return Object.fromEntries(checklistItems(kind).map((item) => [item.id, false]))
}
