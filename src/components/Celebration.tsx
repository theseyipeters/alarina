import { useEffect, useRef, type CSSProperties } from 'react'
import { useMediaQuery } from '../lib/useMediaQuery.ts'
import './Celebration.css'

// As far across and down their area as a petal goes, in %, so it never reaches the text.
const PETAL_MAX_X = 95
const PETAL_MAX_Y = 80

// Deterministic "random" spread so the petals start scattered and render the same every time.
const PETALS = Array.from({ length: 22 }, (_, i) => ({
  x: (i * 37) % PETAL_MAX_X,
  y: (i * 61) % PETAL_MAX_Y,
  angle: (i * 47) % 360,
  size: 8 + ((i * 17) % 9),
  tone: i % 3,
}))

const between = (min: number, max: number) => min + Math.random() * (max - min)
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

/** Keeps a petal drifting in small random hops until the returned function stops it. */
function wander(petal: Element, { x, y, angle }: (typeof PETALS)[number]) {
  const transform = (s: { x: number; y: number; angle: number }) =>
    `translate(${s.x - x}cqw, ${s.y - y}cqh) rotate(${s.angle}deg)`
  let from = { x, y, angle }
  let animation: Animation

  function hop() {
    const to = {
      x: clamp(from.x + between(-14, 14), 0, PETAL_MAX_X),
      y: clamp(from.y + between(-22, 22), 0, PETAL_MAX_Y),
      angle: from.angle + between(-120, 120),
    }
    animation = petal.animate([{ transform: transform(from) }, { transform: transform(to) }], {
      duration: between(3000, 7000),
      easing: 'ease-in-out',
      fill: 'forwards',
    })
    animation.onfinish = hop
    from = to
  }

  hop()
  return () => {
    animation.onfinish = null
    animation.cancel()
  }
}

/** Petals drifting at random for as long as they're on screen; still for anyone who prefers less motion. */
export function Petals() {
  const ref = useRef<HTMLDivElement>(null)
  const still = useMediaQuery('(prefers-reduced-motion: reduce)')

  useEffect(() => {
    if (still || !ref.current) return
    const stops = Array.from(ref.current.children, (petal, i) => wander(petal, PETALS[i]))
    return () => stops.forEach((stop) => stop())
  }, [still])

  return (
    <div className="petals" aria-hidden="true" ref={ref}>
      {PETALS.map((p, i) => (
        <span
          key={i}
          className={`petal petal--${p.tone}`}
          style={
            {
              '--x': `${p.x}%`,
              '--y': `${p.y}%`,
              '--angle': `${p.angle}deg`,
              '--size': `${p.size}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
