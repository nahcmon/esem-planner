import { describe, expect, it } from 'vitest'
import type { SessionChange } from '../types'
import { createSeedState } from '../data/seed'
import { MODULE_BY_ID } from '../data/curriculum'
import { todayISO } from './date'
import {
  currentStreak,
  formatGrade,
  gradeStats,
  isCountedOccurrence,
  isGhostOccurrence,
  moduleGrade,
  occurrencesForDate,
  parseGrade,
  weekStudyStats,
} from './planner'

const MONDAY = '2026-10-05'
const TUESDAY = '2026-10-06'

function movedChange(): SessionChange {
  return {
    id: 'change-test',
    sessionId: 'ses-mech1-mon',
    originalDate: MONDAY,
    action: 'moved',
    newDate: TUESDAY,
    newStart: '16:00',
    newEnd: '17:30',
    reason: 'Room change',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

describe('occurrences', () => {
  it('returns the official seeded Monday schedule', () => {
    const state = createSeedState()
    const occurrences = occurrencesForDate(state, MONDAY)
    const mech = occurrences.find((occurrence) => occurrence.session.id === 'ses-mech1-mon')
    const thermal = occurrences.find(
      (occurrence) => occurrence.session.id === 'ses-ret-thermal-mon',
    )
    expect(mech).toMatchObject({ start: '11:30', end: '13:00', room: 'KE104' })
    expect(thermal).toMatchObject({ start: '14:00', end: '15:30', room: 'KE012' })
    expect(occurrences.every((occurrence) => occurrence.status === 'normal')).toBe(true)
  })

  it('keeps the official rooms and the online physics slot', () => {
    const state = createSeedState()
    const find = (id: string) => state.sessions.find((session) => session.id === id)
    expect(find('ses-math1-tue-1')).toMatchObject({ start: '09:45', room: 'KE104' })
    expect(find('ses-math1-tue-2')).toMatchObject({ start: '11:30', room: 'KE104' })
    expect(find('ses-et1-tue-1')).toMatchObject({ start: '14:00', room: 'KE012' })
    expect(find('ses-et1-tue-2')).toMatchObject({ start: '15:45', room: 'KE012' })
    expect(find('ses-spanish-wed')).toMatchObject({ start: '15:30', room: 'KE104' })
    expect(find('ses-physics-thu')).toMatchObject({
      start: '09:45',
      end: '13:00',
      online: true,
      room: undefined,
    })
    expect(find('ses-ret-pv-thu')).toMatchObject({ start: '14:00', room: 'KE012' })
    expect(find('ses-math1-fri')).toMatchObject({ start: '11:30', room: 'KC135' })
  })

  it('moves one occurrence to a new date without duplicating it', () => {
    const state = createSeedState()
    state.sessionChanges = [movedChange()]

    const monday = occurrencesForDate(state, MONDAY)
    const ghost = monday.find((occurrence) => occurrence.session.id === 'ses-mech1-mon')
    expect(ghost?.status).toBe('moved')
    expect(ghost && isGhostOccurrence(ghost)).toBe(true)
    expect(ghost && isCountedOccurrence(ghost)).toBe(false)

    const tuesday = occurrencesForDate(state, TUESDAY)
    const moved = tuesday.find((occurrence) => occurrence.session.id === 'ses-mech1-mon')
    expect(moved?.start).toBe('16:00')
    expect(moved?.end).toBe('17:30')
    expect(moved && isCountedOccurrence(moved)).toBe(true)
    expect(tuesday.filter((occurrence) => occurrence.session.id === 'ses-mech1-mon')).toHaveLength(1)
  })

  it('does not count cancelled occurrences in weekly study time', () => {
    const state = createSeedState()
    const before = weekStudyStats(state, MONDAY)
    state.sessionChanges = [
      {
        ...movedChange(),
        action: 'cancelled',
        newDate: undefined,
        newStart: undefined,
        newEnd: undefined,
      },
    ]
    const after = weekStudyStats(state, MONDAY)
    expect(after.plannedMinutes).toBeLessThan(before.plannedMinutes)
    expect(after.sessions).toBeLessThan(before.sessions)
  })
})

describe('grades', () => {
  it('parses German grades with comma or dot decimals', () => {
    expect(parseGrade('1,7')).toBe(1.7)
    expect(parseGrade('2.3')).toBe(2.3)
    expect(parseGrade(' 1 ')).toBe(1)
    expect(parseGrade('5,0')).toBe(5)
    expect(parseGrade('0,7')).toBeNull()
    expect(parseGrade('5,3')).toBeNull()
    expect(parseGrade('sehr gut')).toBeNull()
    expect(parseGrade('')).toBeNull()
  })

  it('formats grades for German and English', () => {
    expect(formatGrade(1.7, 'de')).toBe('1,7')
    expect(formatGrade(1.7, 'en')).toBe('1.7')
    expect(formatGrade(null, 'de')).toBe('–')
  })

  it('weights module grades by exam weight and ECTS', () => {
    const state = createSeedState()
    state.examStates['G1:g1-math-exam'] = {
      ...state.examStates['G1:g1-math-exam'],
      status: 'passed',
      grade: '1,3',
    }
    state.examStates['G1:g1-mech-exam'] = {
      ...state.examStates['G1:g1-mech-exam'],
      status: 'passed',
      grade: '2,0',
    }
    state.examStates['G2:g2-exam'] = {
      ...state.examStates['G2:g2-exam'],
      status: 'passed',
      grade: '1,7',
    }

    const g1 = moduleGrade(state, MODULE_BY_ID.get('G1')!)
    expect(g1.average).toBeCloseTo((1.3 * 4 + 2.0) / 5, 5)
    expect(g1.gradedExams).toBe(2)

    const stats = gradeStats(state, 1)
    expect(stats.average).toBeCloseTo((((1.3 * 4 + 2.0) / 5) * 10 + 1.7 * 5) / 15, 5)
    expect(stats.gradedExams).toBe(3)
    expect(stats.passedEcts).toBe(15)
    expect(stats.openExams).toBeGreaterThan(0)
  })

  it('counts failed exams but keeps them out of the average', () => {
    const state = createSeedState()
    state.examStates['G2:g2-exam'] = {
      ...state.examStates['G2:g2-exam'],
      status: 'failed',
      grade: '5,0',
    }
    const stats = gradeStats(state, 1)
    expect(stats.failedExams).toBe(1)
    expect(stats.gradedExams).toBe(0)
    expect(stats.average).toBeNull()
  })
})

describe('progress', () => {
  it('counts a completed task as today’s streak activity', () => {
    const state = createSeedState()
    state.tasks = [
      {
        ...state.tasks[0],
        id: 'task-today',
        done: true,
        completedAt: Date.now(),
        due: todayISO(),
      },
    ]
    state.sessionRecords = {}
    expect(currentStreak(state)).toBe(1)
  })

  it('returns zero when there is no recent activity', () => {
    const state = createSeedState()
    state.tasks = []
    state.sessionRecords = {}
    expect(currentStreak(state)).toBe(0)
  })
})
