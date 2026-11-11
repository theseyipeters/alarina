import { useState } from 'react'
import { LOOKS } from '../invite/design.ts'

// Example names and date, shown until a visitor types their own. Made up, never a real couple.
export const SAMPLE = { one: 'Ọláolúwa', two: 'Ẹniọlá', date: '2027-12-11' }

export type DemoValues = { one: string; two: string; date: string; look: number }

export function useDemo() {
  const [values, setValues] = useState<DemoValues>({ one: '', two: '', date: '', look: 1 })
  return {
    values,
    set: (patch: Partial<DemoValues>) => setValues((v) => ({ ...v, ...patch })),
    shuffle: () => setValues((v) => ({ ...v, look: (v.look + 1) % LOOKS.length })),
  }
}
