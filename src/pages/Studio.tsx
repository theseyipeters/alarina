import { useEffect, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router'
import Logo from '../components/Logo.tsx'
import { EMPTY_LOOK, PAIRINGS, PALETTES, TEMPLATES, TEXTURES, type Design, type Texture } from '../invite/design.ts'
import '../invite/styles.ts'
import { STUDIO_QUERY } from '../lib/studio.ts'
import type { Wedding } from '../lib/types.ts'
import { useMediaQuery } from '../lib/useMediaQuery.ts'
import { useTitle } from '../lib/useTitle.ts'
import { useWedding } from '../lib/useWedding.ts'
import Canvas from '../studio/Canvas.tsx'
import ColoursPanel from '../studio/ColoursPanel.tsx'
import DesignsPanel from '../studio/DesignsPanel.tsx'
import FinishPanel from '../studio/FinishPanel.tsx'
import { ColoursIcon, FinishIcon, LayoutsIcon, RedoIcon, ShuffleIcon, TypeIcon, UndoIcon } from '../studio/icons.tsx'
import TypePanel from '../studio/TypePanel.tsx'
import type { PanelProps } from '../studio/types.ts'
import { useStudioDesign } from '../studio/useStudioDesign.ts'
import './Studio.css'

const TOOLS = [
  { id: 'designs', label: 'Designs', title: 'Designs', Icon: LayoutsIcon, Panel: DesignsPanel },
  { id: 'colours', label: 'Colours', title: 'Colours', Icon: ColoursIcon, Panel: ColoursPanel },
  { id: 'type', label: 'Type', title: 'Typography', Icon: TypeIcon, Panel: TypePanel },
  { id: 'finish', label: 'Finish', title: 'Finish', Icon: FinishIcon, Panel: FinishPanel },
] as const

type ToolId = (typeof TOOLS)[number]['id']

/**
 * The Studio: every layout, palette, font and finish, with a live preview at any screen size.
 * Large screens only; smaller ones get the simpler Design page.
 */
export default function Studio() {
  useTitle('Studio')
  const large = useMediaQuery(STUDIO_QUERY)
  const [state, setWedding] = useWedding()

  if (!large) return <NeedsLargeScreen />
  if (state.status === 'loading') return <p className="page muted">Loading…</p>
  if (state.status === 'error' || !state.wedding) {
    return (
      <main id="main" className="page">
        <div className="card">
          <h1>Set up your wedding first</h1>
          <p className="muted">Your invitation needs your names, date and venue before you can design it.</p>
          <Link to="/app/setup" className="btn">Go to setup</Link>
        </div>
      </main>
    )
  }
  return <StudioEditor wedding={state.wedding} onSaved={setWedding} />
}

function NeedsLargeScreen() {
  return (
    <main id="main" className="page">
      <div className="row">
        <Link to="/app" className="brand"><Logo /></Link>
      </div>
      <div className="card">
        <h1>Studio needs a bigger screen</h1>
        <p className="muted">
          Open Alárinà on a laptop or desktop to use every layout, font and colour. On this screen you can still choose a
          layout and palette.
        </p>
        <Link to="/app/design" className="btn">Design on this screen</Link>
      </div>
    </main>
  )
}

const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)]!

/** A random layout, palette, pairing and texture that still fit together. */
function surprise(current: Design): Design {
  const pairing = pick(PAIRINGS)
  return {
    template: pick(TEMPLATES.filter((t) => t.id !== current.template)).id,
    palette: pick(PALETTES.filter((p) => p.id !== current.palette)).id,
    look: { ...EMPTY_LOOK, ...pairing.fonts, texture: pick(Object.keys(TEXTURES) as Texture[]), colors: current.look.colors },
  }
}

function StudioEditor({ wedding, onSaved }: { wedding: Wedding; onSaved: (w: Wedding) => void }) {
  const { design, change, undo, redo, canUndo, canRedo, save, retry } = useStudioDesign(wedding, onSaved)
  const [tool, setTool] = useState<ToolId>('designs')
  const invitation = { ...wedding, ...design }
  const published = wedding.status === 'published'
  const mac = /Mac|iPhone|iPad/.test(navigator.platform)
  const mod = mac ? '⌘' : 'Ctrl+'

  // Undo and redo from the keyboard, except while typing, where the field keeps its own undo.
  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if (!(mac ? e.metaKey : e.ctrlKey) || e.key.toLowerCase() !== 'z' && e.key.toLowerCase() !== 'y') return
      const t = e.target as HTMLElement
      if (t.matches('input:not([type=radio]):not([type=range]):not([type=color]), textarea')) return
      e.preventDefault()
      if (e.key.toLowerCase() === 'y' || e.shiftKey) redo()
      else undo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mac, undo, redo])

  // Arrow keys move between tools, as in any vertical tab list.
  function onRailKey(e: KeyboardEvent<HTMLDivElement>) {
    const i = TOOLS.findIndex((t) => t.id === tool)
    const next = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: TOOLS.length - 1 }[e.key]
    if (next === undefined) return
    e.preventDefault()
    const id = TOOLS[(next + TOOLS.length) % TOOLS.length]!.id
    setTool(id)
    document.getElementById(`tool-${id}`)?.focus()
  }

  const active = TOOLS.find((t) => t.id === tool)!
  const panelProps: PanelProps = { design, change, invitation }

  return (
    <div className="studio">
      <header className="studio-bar">
        <Link to="/app" className="brand"><Logo /></Link>
        <span className="studio-divider" aria-hidden="true" />
        <h1 className="studio-title">Studio</h1>
        <span className={published ? 'badge badge--live' : 'badge'}>{published ? 'Live' : 'Private draft'}</span>

        <div className="studio-history" role="group" aria-label="History">
          <button type="button" className="studio-icon-button" onClick={undo} disabled={!canUndo} title={`Undo (${mod}Z)`}>
            <UndoIcon />
            <span className="visually-hidden">Undo</span>
          </button>
          <button type="button" className="studio-icon-button" onClick={redo} disabled={!canRedo} title={`Redo (${mod}${mac ? '⇧Z' : 'Y'})`}>
            <RedoIcon />
            <span className="visually-hidden">Redo</span>
          </button>
        </div>
        <button type="button" className="btn btn--secondary studio-surprise" onClick={() => change(surprise(design))}>
          <ShuffleIcon />
          Surprise me
        </button>

        <p className="studio-save" aria-live="polite">
          {save === 'saving' && 'Saving…'}
          {save === 'saved' && (published ? 'Saved. Guests see it now' : 'All changes saved')}
          {save === 'error' && (
            <>
              Not saved.{' '}
              <button type="button" className="link-button" onClick={retry}>Try again</button>
            </>
          )}
        </p>

        {published && wedding.slug && (
          <a href={`/invite/${wedding.slug}`} target="_blank" rel="noopener" className="btn btn--secondary">
            View live<span className="visually-hidden"> (opens in a new tab)</span>
          </a>
        )}
        <Link to="/app" className="btn">Done</Link>
      </header>

      <main id="main" className="studio-body">
        <div className="studio-rail" role="tablist" aria-label="Tools" aria-orientation="vertical" onKeyDown={onRailKey}>
          {TOOLS.map(({ id, label, Icon }) => (
            <button
              key={id}
              id={`tool-${id}`}
              type="button"
              role="tab"
              className="studio-tool"
              aria-selected={tool === id}
              aria-controls="studio-panel"
              tabIndex={tool === id ? 0 : -1}
              onClick={() => setTool(id)}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Keyed so each tool opens scrolled to its top. */}
        <section key={tool} className="studio-panel" id="studio-panel" role="tabpanel" aria-labelledby={`tool-${tool}`}>
          <h2 className="studio-panel-title">{active.title}</h2>
          <active.Panel {...panelProps} />
        </section>

        <Canvas invitation={invitation} />
      </main>
    </div>
  )
}
