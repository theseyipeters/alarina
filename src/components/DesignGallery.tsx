import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { EMPTY_LOOK, PALETTES, TEMPLATES, type Design, type Palette, type Template } from '../invite/design.ts'
import type { useDemo } from '../lib/heroDemo.ts'
import { storyDetails } from '../lib/storyNames.ts'
import DemoCard from './DemoCard.tsx'
import './DesignGallery.css'

type PresetPalette = Exclude<Palette, 'custom'>

const design = (template: Template, palette: PresetPalette): Design => ({ template, palette, look: EMPTY_LOOK })

/**
 * "Find your look": the real invitation in all eight layouts on a 3D carousel, with the
 * visitor's names. Swipe, drag, use the arrow keys or the layout chips to move; pick a palette
 * and every card repaints in a wave, with the glow behind them taking the palette's colour.
 * "Use this design" sends it up to the hero and the scroll story. Loaded on its own, since it
 * renders eight invitations. Reduced motion moves between cards without animating.
 */
export default function DesignGallery({ demo }: { demo: ReturnType<typeof useDemo> }) {
  // Opens on a middle layout so cards fan out on both sides.
  const [active, setActive] = useState(3)
  const [palette, setPalette] = useState<PresetPalette>('emerald')
  const [on, setOn] = useState(() => !('IntersectionObserver' in window))
  const [applied, setApplied] = useState<string | null>(null)
  const ref = useRef<HTMLElement>(null)
  const drag = useRef<{ x: number; moved: boolean } | null>(null)
  const d = storyDetails(demo.values)
  const template = TEMPLATES[active]!
  const paletteLabel = PALETTES.find((p) => p.id === palette)!.label
  const current = `${template.id}-${palette}`

  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(([entry]) => entry?.isIntersecting && setOn(true), { threshold: 0.25 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // The stage is as tall as the tallest card near the front (layouts differ a lot in height),
  // so a tall card never spills over the text below. Rechecked as cards move or fonts load.
  const stageRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const fit = () => {
      const cards = Array.from(stage.querySelectorAll<HTMLElement>('.gal-card:not(.is-far)'))
      const tallest = Math.max(0, ...cards.map((c) => c.offsetHeight))
      if (tallest) stage.style.height = `${tallest + 32}px`
    }
    fit()
    const observer = new ResizeObserver(fit)
    stage.querySelectorAll('.gal-card').forEach((c) => observer.observe(c))
    return () => observer.disconnect()
  }, [active])

  const go = (i: number) => setActive(Math.max(0, Math.min(TEMPLATES.length - 1, i)))

  function onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') go(active - 1)
    else if (e.key === 'ArrowRight') go(active + 1)
    else return
    e.preventDefault()
  }

  function down(e: PointerEvent<HTMLDivElement>) {
    drag.current = { x: e.clientX, moved: false }
  }

  function up(e: PointerEvent<HTMLDivElement>) {
    const start = drag.current
    if (!start) return
    const dx = e.clientX - start.x
    if (Math.abs(dx) > 40) {
      start.moved = true
      go(active + (dx < 0 ? 1 : -1))
    }
  }

  function apply() {
    demo.set({ design: design(template.id, palette) })
    setApplied(current)
  }

  function toTop() {
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' })
  }

  return (
    <section ref={ref} className={on ? 'landing-section gal is-on' : 'landing-section gal'} aria-labelledby="gal-title">
      <div className="section-head">
        <h2 id="gal-title">Find your look</h2>
        <p className="muted">
          Eight layouts, twelve palettes, all with {d.typed ? `${d.one} & ${d.two}` : 'your names'} on them. Swipe through, pick
          your colours, and try it on.
        </p>
      </div>

      <div
        ref={stageRef}
        className="gal-stage"
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label="Invitation layouts. Use the left and right arrow keys to move."
        onKeyDown={onKey}
        onPointerDown={down}
        onPointerUp={up}
        onPointerCancel={() => (drag.current = null)}
      >
        <div key={palette} className="inv gal-glow" data-palette={palette} aria-hidden="true" />
        {TEMPLATES.map((t, i) => {
          const o = i - active
          const a = Math.abs(o)
          return (
            <button
              key={t.id}
              type="button"
              className={['gal-card', o === 0 && 'is-active', a > 2 && 'is-far'].filter(Boolean).join(' ')}
              style={{ '--o': o, '--a': a } as CSSProperties}
              tabIndex={-1}
              aria-label={o === 0 ? `${t.label} layout, shown` : `Show the ${t.label} layout`}
              onClick={() => {
                if (drag.current?.moved) return
                go(i)
              }}
            >
              <div key={palette} className="gal-repaint">
                <DemoCard values={demo.values} design={design(t.id, palette)} idPrefix={`gal-${t.id}`} />
              </div>
            </button>
          )
        })}
        <button type="button" className="gal-arrow gal-arrow--prev" onClick={() => go(active - 1)} disabled={active === 0} aria-label="Previous layout">
          ‹
        </button>
        <button type="button" className="gal-arrow gal-arrow--next" onClick={() => go(active + 1)} disabled={active === TEMPLATES.length - 1} aria-label="Next layout">
          ›
        </button>
      </div>

      <div className="gal-info" aria-live="polite">
        <span className="gal-count">{String(active + 1).padStart(2, '0')} / {String(TEMPLATES.length).padStart(2, '0')}</span>
        <span className="gal-name">{template.label} · {paletteLabel}</span>
        <span className="gal-desc">{template.description}</span>
      </div>

      <div className="gal-controls">
        <div className="gal-chips" role="group" aria-label="Layouts">
          {TEMPLATES.map((t, i) => (
            <button key={t.id} type="button" className={i === active ? 'gal-chip is-on' : 'gal-chip'} aria-pressed={i === active} onClick={() => go(i)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="gal-swatches" role="group" aria-label="Palettes">
          {PALETTES.map((p) => (
            <button
              key={p.id}
              type="button"
              className={p.id === palette ? 'gal-swatch is-on' : 'gal-swatch'}
              aria-pressed={p.id === palette}
              aria-label={p.label}
              title={p.label}
              onClick={() => setPalette(p.id)}
            >
              <span className="inv gal-swatch-paint" data-palette={p.id}><i /></span>
            </button>
          ))}
        </div>
        <div className="gal-actions">
          {applied === current ? (
            <>
              <span className="gal-applied">✓ It’s on your preview</span>
              <button type="button" className="btn btn--secondary" onClick={toTop}>See it at the top ↑</button>
            </>
          ) : (
            <button type="button" className="btn" onClick={apply}>Use this design</button>
          )}
        </div>
      </div>
    </section>
  )
}
