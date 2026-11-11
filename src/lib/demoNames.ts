import { useEffect } from 'react'
import type { DemoValues } from './heroDemo.ts'

// The names a visitor typed in the landing demo, kept for this browser tab only, so the
// sign-up page can show their own envelope. Never sent anywhere.
const KEY = 'alarina-demo-names'

export type DemoNames = { one: string; two: string; date: string }

/** Remembers the landing demo's names for the rest of this tab's visit. */
export function useRememberDemoNames(values: DemoValues) {
  useEffect(() => {
    const one = values.one.trim()
    const two = values.two.trim()
    try {
      if (one || two) sessionStorage.setItem(KEY, JSON.stringify({ one, two, date: values.date }))
    } catch {
      // Storage is blocked: the sign-up page just shows the sample couple.
    }
  }, [values.one, values.two, values.date])
}

export function readDemoNames(): DemoNames | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as Partial<DemoNames>
    if (typeof v.one !== 'string' || typeof v.two !== 'string') return null
    return { one: v.one, two: v.two, date: typeof v.date === 'string' ? v.date : '' }
  } catch {
    return null
  }
}
