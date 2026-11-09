import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { seatPositions, tableSize } from './geometry.ts'
import PerspectiveView from './PerspectiveView.tsx'
import type { Feature, GuestSeating } from './types.ts'

const HEIGHT: Record<Feature['kind'], number> = { stage: 0.8, high_table: 0.75, dance_floor: 0.03, entrance: 2.4, dj: 1, bar: 1.1 }

/** Colours from the page's own tokens, so the hall matches the light or dark theme. */
function tokens() {
  const css = getComputedStyle(document.documentElement)
  const get = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback
  return { accent: get('--accent', '#2e5a47'), surface: get('--surface', '#ffffff'), bg: get('--bg', '#fafaf7'), text: get('--text', '#18181b') }
}

const hasWebGL = () => {
  try {
    return Boolean(document.createElement('canvas').getContext('webgl2') ?? document.createElement('canvas').getContext('webgl'))
  } catch {
    return false
  }
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * The hall in 3D, built from the same plan as the floor plan: floor, stage, high table and dance
 * floor, every table with its chairs, and the guest's own seats in the accent colour. The camera
 * walks in from the entrance along their route and settles behind their seat, facing the stage.
 * Phones without WebGL get the perspective view instead.
 */
export default function Hall3D({ seating: s }: { seating: GuestSeating }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [supported] = useState(hasWebGL)
  const [replay, setReplay] = useState(0)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount || !supported) return
    const c = tokens()
    const { width: W, depth: D } = s.plan
    // Plan metres to the scene: x across, z towards the back, centred on the hall.
    const at = (x: number, y: number, h = 0) => new THREE.Vector3(x - W / 2, h, y - D / 2)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(c.bg)
    scene.fog = new THREE.Fog(c.bg, 18, Math.max(W, D) * 2.2)
    const camera = new THREE.PerspectiveCamera(55, mount.clientWidth / mount.clientHeight, 0.1, 400)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.shadowMap.enabled = true
    mount.appendChild(renderer.domElement)

    scene.add(new THREE.HemisphereLight(0xffffff, 0xb8ab98, 2.2))
    const sun = new THREE.DirectionalLight(0xffffff, 1.6)
    sun.position.set(W * 0.2, 14, -D * 0.2)
    sun.castShadow = true
    scene.add(sun)

    const material = (color: string | number, opts: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...opts })
    const disposables: { dispose: () => void }[] = []
    const add = (geometry: THREE.BufferGeometry, mat: THREE.Material, pos: THREE.Vector3, rotY = 0) => {
      const mesh = new THREE.Mesh(geometry, mat)
      mesh.position.copy(pos)
      mesh.rotation.y = rotY
      mesh.castShadow = true
      mesh.receiveShadow = true
      scene.add(mesh)
      disposables.push(geometry, mat)
      return mesh
    }

    // Floor and walls.
    add(new THREE.BoxGeometry(W, 0.1, D), material('#d9d2c5'), at(W / 2, D / 2, -0.05))
    const wall = material('#f6f1e8')
    add(new THREE.BoxGeometry(W, 4, 0.2), wall, at(W / 2, -0.1, 2))
    add(new THREE.BoxGeometry(0.2, 4, D), wall, at(-0.1, D / 2, 2))
    add(new THREE.BoxGeometry(0.2, 4, D), wall, at(W + 0.1, D / 2, 2))

    const featureColour: Record<Feature['kind'], string> = {
      stage: '#3b3a37',
      high_table: '#f4efe6',
      dance_floor: '#c8b892',
      entrance: c.accent,
      dj: '#2a2a2a',
      bar: '#6b4f3a',
    }
    for (const f of s.plan.features) {
      const h = HEIGHT[f.kind]
      if (f.kind === 'entrance') {
        // An open doorway: two posts and a lintel.
        const m = material(featureColour.entrance)
        add(new THREE.BoxGeometry(0.2, h, 0.3), m, at(f.x - f.w / 2, f.y, h / 2))
        add(new THREE.BoxGeometry(0.2, h, 0.3), m, at(f.x + f.w / 2, f.y, h / 2))
        add(new THREE.BoxGeometry(f.w + 0.2, 0.25, 0.3), m, at(f.x, f.y, h))
        continue
      }
      add(new THREE.BoxGeometry(f.w, h, f.h), material(featureColour[f.kind], { roughness: f.kind === 'dance_floor' ? 0.3 : 0.8 }), at(f.x, f.y, h / 2))
    }

    // Tables and chairs. Theirs is lit in the accent colour.
    const accent = material(c.accent, { emissive: new THREE.Color(c.accent), emissiveIntensity: 0.25 })
    const linen = material('#fbf8f2')
    const chair = material('#b9a98f')
    const mySeats = new Set(s.seats)
    for (const t of s.plan.tables) {
      const mine = t.id === s.table.id
      const { w, h } = tableSize(t)
      const top = mine ? accent : linen
      if (t.shape === 'round') add(new THREE.CylinderGeometry(w / 2, w / 2, 0.75, 32), top, at(t.x, t.y, 0.375))
      else add(new THREE.BoxGeometry(w, 0.75, h), top, at(t.x, t.y, 0.375), (-(t.rotation ?? 0) * Math.PI) / 180)
      // A chair: a seat, and a backrest on the side away from the table.
      seatPositions(t).forEach((p, i) => {
        const m = mine && mySeats.has(i + 1) ? accent : chair
        const out = new THREE.Vector2(p.x - t.x, p.y - t.y).normalize()
        const turn = Math.atan2(out.x, out.y)
        add(new THREE.BoxGeometry(0.42, 0.06, 0.42), m, at(p.x, p.y, 0.46), turn)
        add(new THREE.BoxGeometry(0.42, 0.5, 0.05), m, at(p.x + out.x * 0.2, p.y + out.y * 0.2, 0.72), turn)
        for (const [dx, dy] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]] as const) {
          add(new THREE.BoxGeometry(0.04, 0.44, 0.04), m, at(p.x + dx, p.y + dy, 0.22))
        }
      })
    }

    // The walk: from the entrance, along the route, to just behind their seat, looking at the stage.
    const stage = s.plan.features.find((f) => f.kind === 'stage' || f.kind === 'high_table')
    const lookTarget = stage ? at(stage.x, stage.y, 0.6) : at(W / 2, 0, 0.6)
    const seatsAt = seatPositions(s.table)
    // Their first seat, or (in the team's preview, with no seat) the side of the table away from the stage.
    const mine = s.seats.length ? seatsAt[s.seats[0]! - 1]! : { x: s.table.x, y: s.table.y + tableSize(s.table).h / 2 + 0.35 }
    const away = new THREE.Vector2(mine.x - s.table.x, mine.y - s.table.y).normalize()
    // End standing just behind the chair, at eye height, so the table and the stage are both in view.
    const path = [...s.route.map((p) => at(p.x, p.y, 1.7)), at(mine.x + away.x * 1.4, mine.y + away.y * 1.4, 1.65)]
    const curve = new THREE.CatmullRomCurve3(path)
    const duration = reducedMotion() ? 0 : 4200
    const started = performance.now()

    let frame = 0
    const render = (now: number) => {
      const k = duration ? Math.min(1, (now - started) / duration) : 1
      const eased = 1 - Math.pow(1 - k, 3)
      camera.position.copy(curve.getPoint(eased))
      // Look along the walk at first, then turn to face the stage.
      const ahead = curve.getPoint(Math.min(1, eased + 0.05))
      camera.lookAt(ahead.lerp(lookTarget, Math.min(1, eased * 1.4)))
      renderer.render(scene, camera)
      if (k < 1) frame = requestAnimationFrame(render)
    }
    frame = requestAnimationFrame(render)

    const resize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
      renderer.render(scene, camera)
    }
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      disposables.forEach((d) => d.dispose())
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [s, supported, replay])

  if (!supported) return <PerspectiveView seating={s} />

  return (
    <div className="hall3d">
      <div ref={mountRef} className="hall3d-canvas" role="img" aria-label={`A 3D walk from the entrance to ${s.table.name}, ending at your seat facing the stage`} />
      <button type="button" className="btn btn--secondary perspective-replay" onClick={() => setReplay((n) => n + 1)}>
        Walk in again
      </button>
    </div>
  )
}
