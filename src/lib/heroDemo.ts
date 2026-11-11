import { useState } from 'react'
import { LOOKS } from '../invite/design.ts'

// Example names and date, shown until a visitor types their own. Made up, never a real couple.
export const SAMPLE = { one: 'Ọláolúwa', two: 'Ẹniọlá', date: '2027-12-11' }

export type DemoValues = { one: string; two: string; date: string; look: number }

const next = (v: DemoValues) => ({ ...v, look: (v.look + 1) % LOOKS.length })

/**
 * The hero demo's state. Until the visitor touches anything, the card cycles through designs
 * by itself (autoShuffle); typing or pressing "Try another design" stops that for good.
 */
export function useDemo() {
  const [values, setValues] = useState<DemoValues>({ one: '', two: '', date: '', look: 1 })
  const [touched, setTouched] = useState(false)
  return {
    values,
    touched,
    set: (patch: Partial<DemoValues>) => {
      setTouched(true)
      setValues((v) => ({ ...v, ...patch }))
    },
    shuffle: () => {
      setTouched(true)
      setValues(next)
    },
    autoShuffle: () => setValues(next),
  }
}
