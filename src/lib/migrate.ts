import type { SessionChange, SessionRecord, SessionTemplate } from '../types'
import { createSeedSessions } from '../data/seed'

export const STORE_VERSION = 2

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Version 2 corrects the seeded weekly timetable to the official ESEM schedule.
 * Custom sessions survive untouched; moves, cancellations and completion marks
 * attached to the old seeded ids are discarded because those ids no longer
 * describe the same slot.
 */
export function migratePersistedState(persisted: unknown, version: number): unknown {
  if (version >= STORE_VERSION || !isRecord(persisted)) return persisted

  const sessions = Array.isArray(persisted.sessions)
    ? (persisted.sessions.filter(isRecord) as unknown as SessionTemplate[])
    : []
  const seededSessions = sessions.filter((session) => session.seeded)
  if (!seededSessions.length) return persisted

  const customSessions = sessions.filter((session) => !session.seeded)
  const customIds = new Set(customSessions.map((session) => session.id))

  const sessionChanges = Array.isArray(persisted.sessionChanges)
    ? (persisted.sessionChanges.filter(isRecord) as unknown as SessionChange[]).filter((change) =>
        customIds.has(change.sessionId),
      )
    : []

  const sessionRecords = isRecord(persisted.sessionRecords)
    ? (Object.fromEntries(
        Object.entries(persisted.sessionRecords).filter(([key]) =>
          customIds.has(key.split('@')[0]),
        ),
      ) as Record<string, SessionRecord>)
    : {}

  return {
    ...persisted,
    sessions: [...createSeedSessions(), ...customSessions],
    sessionChanges,
    sessionRecords,
  }
}
