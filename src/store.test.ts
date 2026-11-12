// @vitest-environment jsdom
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

const EXAM = 'G1:g1-math-exam'
let usePlanner: typeof import('./store').usePlanner

class MemoryStorage implements Storage {
  private values = new Map<string, string>()

  get length() {
    return this.values.size
  }

  clear() {
    this.values.clear()
  }

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null
  }

  removeItem(key: string) {
    this.values.delete(key)
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

beforeAll(async () => {
  // Node 25 ships an experimental global localStorage that lacks the Storage
  // API and shadows jsdom's implementation. Give the store a working one.
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryStorage(),
    configurable: true,
  })
  ;({ usePlanner } = await import('./store'))
})

function currentGrade() {
  return usePlanner.getState().examStates[EXAM]?.grade
}

describe('exam result actions', () => {
  beforeEach(() => {
    usePlanner.getState().resetSeed()
  })

  it('keeps a grade supplied with a result', () => {
    usePlanner.getState().setExamStatus(EXAM, 'passed', 'written', '1,3')
    expect(usePlanner.getState().examStates[EXAM].status).toBe('passed')
    expect(currentGrade()).toBe('1,3')
  })

  it('clears a stale grade when a quick action supplies none', () => {
    usePlanner.getState().setExamStatus(EXAM, 'passed', 'written', '1,3')
    usePlanner.getState().setExamStatus(EXAM, 'failed', 'written')
    expect(usePlanner.getState().examStates[EXAM].status).toBe('failed')
    expect(currentGrade()).toBeUndefined()
  })

  it('drops the grade when resetting a result to planned', () => {
    usePlanner.getState().setExamStatus(EXAM, 'passed', 'written', '2,0')
    usePlanner.getState().setExamStatus(EXAM, 'planned', 'written')
    expect(currentGrade()).toBeUndefined()
  })

  it('treats an empty grade field as no grade', () => {
    usePlanner.getState().setExamStatus(EXAM, 'passed', 'written', '2,0')
    usePlanner.getState().setExamStatus(EXAM, 'passed', 'written', '  ')
    expect(currentGrade()).toBeUndefined()
  })

  it('ignores a grade for an exam without a result', () => {
    usePlanner.getState().setExamStatus(EXAM, 'registered', 'written', '1,3')
    expect(usePlanner.getState().examStates[EXAM].status).toBe('registered')
    expect(currentGrade()).toBeUndefined()
  })
})
