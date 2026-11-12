import type { Accent } from '../types'

export const ACCENTS: Record<Accent, { hex: string; soft: string; line: string; glow: string }> = {
  lime: {
    hex: '#c9f76a',
    soft: 'rgba(201, 247, 106, 0.12)',
    line: 'rgba(201, 247, 106, 0.34)',
    glow: 'rgba(201, 247, 106, 0.22)',
  },
  blue: {
    hex: '#7db9ff',
    soft: 'rgba(125, 185, 255, 0.12)',
    line: 'rgba(125, 185, 255, 0.34)',
    glow: 'rgba(125, 185, 255, 0.22)',
  },
  amber: {
    hex: '#f4c06a',
    soft: 'rgba(244, 192, 106, 0.12)',
    line: 'rgba(244, 192, 106, 0.34)',
    glow: 'rgba(244, 192, 106, 0.22)',
  },
  teal: {
    hex: '#72e0c4',
    soft: 'rgba(114, 224, 196, 0.12)',
    line: 'rgba(114, 224, 196, 0.34)',
    glow: 'rgba(114, 224, 196, 0.22)',
  },
  rose: {
    hex: '#ff9b8e',
    soft: 'rgba(255, 155, 142, 0.12)',
    line: 'rgba(255, 155, 142, 0.34)',
    glow: 'rgba(255, 155, 142, 0.22)',
  },
  violet: {
    hex: '#b9a4ff',
    soft: 'rgba(185, 164, 255, 0.12)',
    line: 'rgba(185, 164, 255, 0.34)',
    glow: 'rgba(185, 164, 255, 0.22)',
  },
  sage: {
    hex: '#b7d39b',
    soft: 'rgba(183, 211, 155, 0.12)',
    line: 'rgba(183, 211, 155, 0.34)',
    glow: 'rgba(183, 211, 155, 0.22)',
  },
}

export const PRIORITY_COLORS = {
  1: '#ff9b8e',
  2: '#f4c06a',
  3: '#91a096',
} as const
