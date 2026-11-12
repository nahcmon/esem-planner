import { COMPONENT_BY_ID } from '../data/curriculum'
import type { Lang, Localized, ModuleDef, Occurrence, SessionTemplate, Task } from '../types'

export function loc(value: Localized, lang: Lang): string {
  return value[lang]
}

export function taskTitle(task: Task, lang: Lang): string {
  return lang === 'en' ? task.titleEn || task.title : task.title
}

export function sessionNote(session: SessionTemplate, lang: Lang): string {
  return lang === 'en' ? session.noteEn || session.note || '' : session.note || ''
}

export function occurrenceNote(occurrence: Occurrence, lang: Lang): string {
  return sessionNote(occurrence.session, lang)
}

export function componentTitle(componentId: string, lang: Lang): string {
  const info = COMPONENT_BY_ID.get(componentId)
  return info ? info.component.shortTitle[lang] : componentId
}

export function componentFullTitle(componentId: string, lang: Lang): string {
  const info = COMPONENT_BY_ID.get(componentId)
  return info ? info.component.title[lang] : componentId
}

export function componentAccent(componentId: string) {
  const info = COMPONENT_BY_ID.get(componentId)
  return info?.module.accent ?? 'lime'
}

export function moduleTitle(module: ModuleDef, lang: Lang): string {
  return lang === 'en' ? module.shortTitle.en : module.shortTitle.de
}

export function percent(value: number): string {
  return `${Math.round(value * 100)} %`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
