import { describe, expect, it } from 'vitest'
import { createSeedState } from '../data/seed'
import {
  compactState,
  createPayload,
  createQrPayload,
  decodeShareCode,
  encodePayload,
  hydrateQrState,
  mergeStates,
  normalizeState,
  qrSnapshotToState,
  shareSummary,
} from './share'

describe('share payload', () => {
  it('round-trips a full state through a share code', () => {
    const state = createSeedState()
    const payload = createPayload(state, false)
    const decoded = decodeShareCode(encodePayload(payload))
    expect(decoded).not.toBeNull()
    expect(decoded?.state.tasks.length).toBe(state.tasks.length)
    expect(decoded?.state.sessions.length).toBe(state.sessions.length)
    expect(decoded?.state.settings.currentSemester).toBe(state.settings.currentSemester)

    const normalized = normalizeState(decoded?.state)
    expect(normalized).not.toBeNull()
    expect(shareSummary(normalized!).tasks).toBe(state.tasks.length)
  })

  it('keeps QR snapshots small enough to scan', () => {
    const state = createSeedState()
    const encoded = encodePayload(createQrPayload(state))
    expect(encoded.length).toBeLessThan(1600)

    const decoded = decodeShareCode(encoded)
    expect(decoded?.qr).toBe(true)
    const sparse = qrSnapshotToState(decoded?.state)
    expect(sparse).not.toBeNull()
    const hydrated = hydrateQrState(sparse!)
    expect(hydrated.tasks.length).toBe(state.tasks.length)
    expect(hydrated.sessions.length).toBe(state.sessions.length)
    expect(hydrated.topicStates['math1-t1']?.status).toBe('mastered')
    expect(hydrated.settings.currentSemester).toBe(1)
  })

  it('merges a QR snapshot without erasing local task details', () => {
    const local = createSeedState()
    local.tasks[0] = { ...local.tasks[0], title: 'Lokaler Titel' }
    const incoming = createSeedState()
    incoming.tasks[1] = { ...incoming.tasks[1], done: true }

    const decoded = decodeShareCode(encodePayload(createQrPayload(incoming)))
    const sparse = qrSnapshotToState(decoded?.state)
    expect(sparse).not.toBeNull()
    const merged = mergeStates(local, sparse!)
    expect(merged.tasks.find((task) => task.id === local.tasks[0].id)?.title).toBe('Lokaler Titel')
  })

  it('keeps custom task completion in a QR snapshot', () => {
    const state = createSeedState()
    state.tasks.push({
      id: 'task-custom-qr',
      componentId: 'math1',
      title: 'Custom QR task',
      kind: 'study',
      done: true,
      priority: 1,
      note: 'secret note',
      createdAt: 0,
      updatedAt: 0,
    })
    const decoded = decodeShareCode(encodePayload(createQrPayload(state)))
    const sparse = qrSnapshotToState(decoded?.state)
    const task = sparse?.tasks.find((item) => item.id === 'task-custom-qr')
    expect(task?.done).toBe(true)
    expect(task?.note).toBe('')
  })

  it('removes free-text notes in the compact variant', () => {
    const state = createSeedState()
    const compact = compactState(state)
    const payload = createPayload(compact, false)
    expect(payload.state.tasks.every((task) => task.note === '')).toBe(true)
    expect(payload.state.sessions.every((session) => !session.note)).toBe(true)
    expect(payload.state.examStates['G1:g1-math-exam']?.note).toBe('')
  })

  it('rejects foreign payloads', () => {
    expect(decodeShareCode('not-a-share-code')).toBeNull()
    expect(decodeShareCode('')).toBeNull()
  })

  it('merges imported tasks without duplicating ids', () => {
    const local = createSeedState()
    const incoming = createSeedState()
    incoming.tasks = [
      ...incoming.tasks,
      {
        ...incoming.tasks[0],
        id: 'task-imported',
        title: 'Imported task',
        titleEn: 'Imported task',
        updatedAt: Date.now() + 5_000,
      },
    ]
    const merged = mergeStates(local, incoming)
    expect(merged.tasks.some((task) => task.id === 'task-imported')).toBe(true)
    expect(new Set(merged.tasks.map((task) => task.id)).size).toBe(merged.tasks.length)
  })
})
