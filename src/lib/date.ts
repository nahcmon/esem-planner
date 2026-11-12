import {
  addDays,
  differenceInCalendarDays,
  format,
  getISOWeek,
  isSameDay,
  parseISO,
  startOfWeek,
} from 'date-fns'
import { de as deLocale, enGB as enLocale } from 'date-fns/locale'
import type { Lang } from '../types'

export const SEMESTER_START = '2026-09-28'
export const LECTURE_END = '2027-01-22'
export const EXAM_START = '2027-01-28'
export const EXAM_END = '2027-02-18'
export const REGISTRATION_START = '2026-10-26'
export const REGISTRATION_END = '2026-11-06'
export const WITHDRAWAL_START = '2026-11-30'

export function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function fromISODate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function addDaysISO(value: string, amount: number): string {
  return toISODate(addDays(fromISODate(value), amount))
}

export function startOfWeekISO(value: string | Date = new Date()): string {
  const date = typeof value === 'string' ? fromISODate(value) : value
  return toISODate(startOfWeek(date, { weekStartsOn: 1 }))
}

export function weekDates(mondayISO: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDaysISO(mondayISO, index))
}

export function isToday(value: string): boolean {
  return isSameDay(fromISODate(value), new Date())
}

export function formatDate(
  value: string | Date,
  lang: Lang,
  pattern = 'EEE, d. MMM',
): string {
  const date = typeof value === 'string' ? fromISODate(value) : value
  return format(date, pattern, { locale: lang === 'de' ? deLocale : enLocale })
}

export function formatLongDate(value: string | Date, lang: Lang): string {
  return formatDate(value, lang, lang === 'de' ? 'EEEE, d. MMMM yyyy' : 'EEEE, d MMMM yyyy')
}

export function formatMonth(value: string | Date, lang: Lang): string {
  return formatDate(value, lang, lang === 'de' ? 'MMMM yyyy' : 'MMMM yyyy')
}

export function formatWeekRange(mondayISO: string, lang: Lang): string {
  const end = addDaysISO(mondayISO, 6)
  const sameMonth = fromISODate(mondayISO).getMonth() === fromISODate(end).getMonth()
  if (lang === 'de') {
    return sameMonth
      ? `${formatDate(mondayISO, lang, 'd.')}–${formatDate(end, lang, 'd. MMM')}`
      : `${formatDate(mondayISO, lang, 'd. MMM')} – ${formatDate(end, lang, 'd. MMM')}`
  }
  return sameMonth
    ? `${formatDate(mondayISO, lang, 'd')}–${formatDate(end, lang, 'd MMM')}`
    : `${formatDate(mondayISO, lang, 'd MMM')} – ${formatDate(end, lang, 'd MMM')}`
}

export function weekdayShort(day: number, lang: Lang): string {
  const labels = lang === 'de' ? ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return labels[Math.max(0, Math.min(6, day - 1))]
}

export function weekdayLong(day: number, lang: Lang): string {
  const labels =
    lang === 'de'
      ? ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
      : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  return labels[Math.max(0, Math.min(6, day - 1))]
}

export function isoWeek(value: string | Date = new Date()): number {
  const date = typeof value === 'string' ? fromISODate(value) : value
  return getISOWeek(date)
}

export function semesterWeek(value: string | Date = new Date()): number {
  const date = typeof value === 'string' ? fromISODate(value) : value
  const start = fromISODate(SEMESTER_START)
  const diff = differenceInCalendarDays(date, start)
  return Math.max(1, Math.min(17, Math.floor(diff / 7) + 1))
}

export function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

export function minutesToTime(value: number): string {
  const hours = Math.floor(value / 60)
  const minutes = value % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function durationMinutes(start: string, end: string): number {
  return Math.max(0, timeToMinutes(end) - timeToMinutes(start))
}

export function formatDuration(minutes: number, lang: Lang): string {
  if (minutes < 60) return `${minutes} ${lang === 'de' ? 'Min.' : 'min'}`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (rest === 0) return `${hours} ${lang === 'de' ? 'Std.' : 'h'}`
  return `${hours} ${lang === 'de' ? 'Std.' : 'h'} ${rest} ${lang === 'de' ? 'Min.' : 'min'}`
}

export function formatHours(minutes: number, lang: Lang): string {
  const hours = Math.round((minutes / 60) * 10) / 10
  return `${hours.toLocaleString(lang === 'de' ? 'de-DE' : 'en-GB')} ${lang === 'de' ? 'Std.' : 'h'}`
}

export function daysUntil(value: string, from = new Date()): number {
  return differenceInCalendarDays(fromISODate(value), from)
}

export function relativeDay(value: string, lang: Lang): string {
  const diff = daysUntil(value)
  if (diff === 0) return lang === 'de' ? 'Heute' : 'Today'
  if (diff === 1) return lang === 'de' ? 'Morgen' : 'Tomorrow'
  if (diff === -1) return lang === 'de' ? 'Gestern' : 'Yesterday'
  if (diff > 1 && diff <= 6) {
    return lang === 'de' ? `in ${diff} Tagen` : `in ${diff} days`
  }
  if (diff < -1) {
    return lang === 'de' ? `${Math.abs(diff)} Tage überfällig` : `${Math.abs(diff)} days overdue`
  }
  return formatDate(value, lang, 'd. MMM')
}

export function sortISODates(values: string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b))
}

export function parseISODateSafe(value: string): Date | null {
  try {
    const parsed = parseISO(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  } catch {
    return null
  }
}
