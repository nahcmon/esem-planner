import { describe, expect, it } from 'vitest'
import type { SessionChange } from '../types'
import { createSeedState } from '../data/seed'
import { todayISO } from './date'
import {
  currentStreak,
  isCountedOccurrence,
  isGhostOccurrence,
  occurrencesForDate,
  weekStudyStats,
} from './planner'

const MONDAY = '2026-10-05'
const TUESDAY = '2026-10-06'

function movedChange(): SessionChange {
  return {
    id: 'change-test',
    sessionId: 'ses-math1-mon',
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
  it('returns the seeded Monday schedule', () => {
    const state = createSeedState()
    const occurrences = occurrencesForDate(state, MONDAY)
    expect(occurrences.map((occurrence) => occurrence.session.id)).toContain('ses-math1-mon')
    expect(occurrences.map((occurrence) => occurrence.session.id)).toContain('ses-physics-mon')
    expect(occurrences.every((occurrence) => occurrence.status === 'normal')).toBe(true)
  })

  it('moves one occurrence to a new date without duplicating it', () => {
    const state = createSeedState()
    state.sessionChanges = [movedChange()]

    const monday = occurrencesForDate(state, MONDAY)
    const ghost = monday.find((occurrence) => occurrence.session.id === 'ses-math1-mon')
    expect(ghost?.status).toBe('moved')
    expect(ghost && isGhostOccurrence(ghost)).toBe(true)
    expect(ghost && isCountedOccurrence(ghost)).toBe(false)

    const tuesday = occurrencesForDate(state, TUESDAY)
    const moved = tuesday.find((occurrence) => occurrence.session.id === 'ses-math1-mon')
    expect(moved?.start).toBe('16:00')
    expect(moved?.end).toBe('17:30')
    expect(moved && isCountedOccurrence(moved)).toBe(true)
    expect(tuesday.filter((occurrence) => occurrence.session.id === 'ses-math1-mon')).toHaveLength(1)
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
