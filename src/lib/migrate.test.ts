import { describe, expect, it } from 'vitest'
import type { SessionChange, SessionTemplate, UserState } from '../types'
import { createSeedState } from '../data/seed'
import { migratePersistedState, STORE_VERSION } from './migrate'

function customSession(): SessionTemplate {
  return {
    id: 'ses-custom',
    componentId: 'math1',
    kind: 'study',
    day: 6,
    start: '10:00',
    end: '11:30',
    online: false,
    room: 'Library',
    note: '',
    noteEn: '',
    createdAt: 1,
    updatedAt: 1,
  }
}

function legacyState(): UserState {
  const state = createSeedState()
  const oldSeeded: SessionTemplate = {
    ...state.sessions[0],
    id: 'ses-math1-mon',
    componentId: 'math1',
    day: 1,
    start: '08:15',
    end: '09:45',
    room: 'Campus Künzelsau',
    online: false,
    seeded: true,
  }
  const changes: SessionChange[] = [
    {
      id: 'change-seeded',
      sessionId: 'ses-math1-mon',
      originalDate: '2026-10-05',
      action: 'cancelled',
      createdAt: 1,
      updatedAt: 1,
    },
    {
      id: 'change-custom',
      sessionId: 'ses-custom',
      originalDate: '2026-10-10',
      action: 'cancelled',
      createdAt: 1,
      updatedAt: 1,
    },
  ]
  state.sessions = [oldSeeded, customSession()]
  state.sessionChanges = changes
  state.sessionRecords = {
    'ses-math1-mon@2026-10-05': { done: true },
    'ses-custom@2026-10-10': { done: true },
  }
  return state
}

describe('persist migration', () => {
  it('replaces the legacy seeded timetable and keeps custom sessions', () => {
    const migrated = migratePersistedState(legacyState(), 1) as UserState
    expect(migrated.sessions.map((session) => session.id)).not.toContain('ses-math1-mon')
    expect(migrated.sessions.find((session) => session.id === 'ses-mech1-mon')).toMatchObject({
      start: '11:30',
      end: '13:00',
      room: 'KE104',
    })
    expect(migrated.sessions.find((session) => session.id === 'ses-custom')).toMatchObject({
      room: 'Library',
      day: 6,
    })
    expect(migrated.sessionChanges.map((change) => change.id)).toEqual(['change-custom'])
    expect(migrated.sessionRecords).toEqual({ 'ses-custom@2026-10-10': { done: true } })
  })

  it('does nothing for current data or when all seeded sessions were removed', () => {
    const current = legacyState()
    expect(migratePersistedState(current, STORE_VERSION)).toBe(current)

    const cleared = legacyState()
    cleared.sessions = [customSession()]
    expect(migratePersistedState(cleared, 1)).toBe(cleared)
  })
})
