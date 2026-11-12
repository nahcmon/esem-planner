import type { MessageKey } from '../i18n'
import type { ExamKind, ExamStatus, SessionKind, TaskKind, TopicStatus } from '../types'

export const TASK_KIND_KEY: Record<TaskKind, MessageKey> = {
  exercise: 'task.exercise',
  assignment: 'task.assignment',
  study: 'task.study',
  reading: 'task.reading',
  exam: 'task.exam',
  meeting: 'task.meeting',
  other: 'task.other',
}

export const SESSION_KIND_KEY: Record<SessionKind, MessageKey> = {
  lecture: 'type.lecture',
  exercise: 'type.exercise',
  lab: 'type.lab',
  language: 'type.language',
  tutorial: 'type.tutorial',
  study: 'type.study',
  other: 'type.other',
}

export const EXAM_KIND_KEY: Record<ExamKind, MessageKey> = {
  written: 'exam.written',
  portfolio: 'exam.portfolio',
  language: 'exam.language',
  lab: 'exam.lab',
  project: 'exam.project',
  thesis: 'exam.thesis',
  report: 'exam.report',
  elective: 'exam.elective',
}

export const EXAM_STATUS_KEY: Record<ExamStatus, MessageKey> = {
  planned: 'exam.planned',
  registered: 'exam.registered',
  passed: 'exam.passed',
  failed: 'exam.failed',
}

export const TOPIC_STATUS_KEY: Record<TopicStatus, MessageKey> = {
  open: 'modules.topicStatus.open',
  learning: 'modules.topicStatus.learning',
  mastered: 'modules.topicStatus.mastered',
}
