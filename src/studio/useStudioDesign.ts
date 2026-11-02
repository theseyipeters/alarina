import { useCallback, useEffect, useRef, useState } from 'react'
import type { Design } from '../invite/design.ts'
import { api } from '../lib/api.ts'
import type { Wedding } from '../lib/types.ts'

type History = { past: Design[]; present: Design; future: Design[]; group: string | null; at: number }

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const SAVE_DELAY_MS = 500
// Changes in the same group this close together (dragging a colour or a slider) undo as one step.
const GROUP_MS = 1000
const HISTORY_LIMIT = 100

const designOf = (w: Wedding): Design => ({ template: w.template, palette: w.palette, look: w.look })

/**
 * The design being edited in the Studio, with undo and redo, saved shortly after each change.
 * The Studio owns the design while it's open, so saved responses never overwrite what's on screen.
 */
export function useStudioDesign(wedding: Wedding, onSaved: (wedding: Wedding) => void) {
  const [history, setHistory] = useState<History>(() => ({
    past: [],
    present: designOf(wedding),
    future: [],
    group: null,
    at: 0,
  }))
  const design = history.present

  const change = useCallback((next: Design | ((d: Design) => Design), group?: string) => {
    const now = Date.now()
    setHistory((h) => {
      const value = typeof next === 'function' ? next(h.present) : next
      const merge = group != null && group === h.group && now - h.at < GROUP_MS
      return {
        past: merge ? h.past : [...h.past, h.present].slice(-HISTORY_LIMIT),
        present: value,
        future: [],
        group: group ?? null,
        at: now,
      }
    })
  }, [])

  const undo = useCallback(
    () =>
      setHistory((h) =>
        h.past.length
          ? { past: h.past.slice(0, -1), present: h.past.at(-1)!, future: [h.present, ...h.future], group: null, at: 0 }
          : h,
      ),
    [],
  )

  const redo = useCallback(
    () =>
      setHistory((h) =>
        h.future.length
          ? { past: [...h.past, h.present], present: h.future[0]!, future: h.future.slice(1), group: null, at: 0 }
          : h,
      ),
    [],
  )

  /* ── Saving ── */

  const [save, setSave] = useState<SaveState>('idle')
  const saved = useRef(JSON.stringify(designOf(wedding)))
  const pending = useRef<Design | null>(null)
  const seq = useRef(0)
  const onSavedRef = useRef(onSaved)
  useEffect(() => {
    onSavedRef.current = onSaved
  })

  const send = useCallback(async (d: Design) => {
    const n = ++seq.current
    pending.current = null
    setSave('saving')
    try {
      const res = await api.patch<{ wedding: Wedding }>('/wedding', d)
      saved.current = JSON.stringify(d)
      if (n === seq.current) {
        setSave('saved')
        onSavedRef.current(res.wedding)
      }
    } catch {
      if (n === seq.current) setSave('error')
    }
  }, [])

  useEffect(() => {
    if (JSON.stringify(design) === saved.current) return
    pending.current = design
    const timer = setTimeout(() => void send(design), SAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [design, send])

  // Leaving the Studio straight after a change still saves it.
  useEffect(
    () => () => {
      if (pending.current) void api.patch('/wedding', pending.current).catch(() => {})
    },
    [],
  )

  return {
    design,
    change,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    save,
    retry: () => void send(design),
  }
}
