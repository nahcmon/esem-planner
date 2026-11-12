import { describe, expect, it } from 'vitest'
import { CURRICULUM, EXAM_DEFS, SEMESTER_ECTS, TOTAL_ECTS } from '../data/curriculum'
import { MESSAGES } from '../i18n'

describe('curriculum', () => {
  it('covers seven semesters and 210 ECTS', () => {
    expect(CURRICULUM).toHaveLength(32)
    expect([...new Set(CURRICULUM.map((module) => module.semester))]).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(TOTAL_ECTS).toBe(210)
    expect(Object.values(SEMESTER_ECTS).reduce((sum, value) => sum + value, 0)).toBe(210)
    expect(CURRICULUM.reduce((sum, module) => sum + module.ects, 0)).toBe(210)
  })

  it('keeps every semester at 30 ECTS', () => {
    for (const semester of [1, 2, 3, 4, 5, 6, 7]) {
      expect(SEMESTER_ECTS[semester]).toBe(30)
    }
  })

  it('gives components and exam parts unique ids', () => {
    const componentIds = CURRICULUM.flatMap((module) =>
      module.components.map((component) => component.id),
    )
    expect(new Set(componentIds).size).toBe(componentIds.length)
    const examKeys = EXAM_DEFS.map((exam) => exam.key)
    expect(new Set(examKeys).size).toBe(examKeys.length)
  })

  it('includes the six semester 1 teaching components', () => {
    const first = CURRICULUM.filter((module) => module.semester === 1)
    const components = first.flatMap((module) => module.components.map((item) => item.id))
    expect(components).toEqual([
      'math1',
      'mech1',
      'physics',
      'et1',
      'ret-thermal',
      'ret-pv',
      'spanish1',
    ])
    expect(components).toContain('spanish1')
  })
})

describe('i18n', () => {
  it('has the same keys in German and English', () => {
    expect(Object.keys(MESSAGES.de).sort()).toEqual(Object.keys(MESSAGES.en).sort())
  })
})
