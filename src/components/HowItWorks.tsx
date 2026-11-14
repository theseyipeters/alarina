import { useEffect, useRef, useState } from 'react'
import type { DemoValues } from '../lib/heroDemo.ts'
import { storyDetails } from '../lib/storyNames.ts'
import './HowItWorks.css'

type Details = ReturnType<typeof storyDetails>

const TASKS = ['Your names', 'Wedding date', 'Venue', 'Parents’ names']

function SetupScene({ d }: { d: Details }) {
  return (
    <div className="hw-scene hw-setup">
      <div className="hw-pair">
        <span className="hw-person hw-person--one">{d.one[0]}</span>
        <svg className="hw-link" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
          <path d="M2 5 H98" />
        </svg>
        <span className="hw-person hw-person--two">{d.two[0]}</span>
        <span className="hw-joined">{d.two} joined</span>
      </div>
      <ul className="hw-tasks">
        {TASKS.map((task) => (
          <li key={task}>
            <span className="hw-tick" />
            {task}
          </li>
        ))}
      </ul>
      <div className="hw-progress"><i /></div>
      <span className="hw-saved"><i />Saved</span>
    </div>
  )
}

function DesignScene({ d }: { d: Details }) {
  return (
    <div className="hw-scene hw-design">
      <div className="hw-card">
        <span className="hw-card-eyebrow">Together with their families</span>
        <span className="hw-card-names">{d.one}<em>&amp;</em>{d.two}</span>
        <span className="hw-card-rule" />
        <span className="hw-card-date">{d.shortDate}</span>
      </div>
      <div className="hw-swatches">
        <span /><span /><span /><span /><span />
        <i className="hw-swatch-ring" />
      </div>
      <div className="hw-publish">
        <span className="hw-publish-label">Publish</span>
        <span className="hw-live"><i />Live</span>
        <span className="hw-cursor" />
      </div>
    </div>
  )
}

function ShareScene({ d }: { d: Details }) {
  return (
    <div className="hw-scene hw-share">
      <div className="hw-linkbox">
        <span className="hw-url">…/invite/{d.slug}</span>
        <span className="hw-copy"><span>Copy</span><span>Copied ✓</span></span>
      </div>
      <svg className="hw-paths" viewBox="0 0 300 120" preserveAspectRatio="none" aria-hidden="true">
        <path d="M150 0 C 150 50, 50 50, 50 110" />
        <path d="M150 0 V 110" />
        <path d="M150 0 C 150 50, 250 50, 250 110" />
      </svg>
      <div className="hw-targets">
        <span>Family group <b>✓✓</b></span>
        <span>Church <b>✓✓</b></span>
        <span>Office <b>✓✓</b></span>
      </div>
    </div>
  )
}

const STEPS = [
  {
    title: 'Set up together',
    body: 'Create your space and invite your partner. Answer one question at a time, and everything saves as you go.',
    Scene: SetupScene,
  },
  {
    title: 'Design and publish',
    body: 'Choose from eight layouts, twelve palettes or your own colours, and fonts that suit your names. Publish when it feels right.',
    Scene: DesignScene,
  },
  {
    title: 'Share one link',
    body: 'Send it on WhatsApp, by text or in your family groups. Guests reply in under a minute and can change their answer later.',
    Scene: ShareScene,
  },
]

/**
 * "How it works": three cards, each with a small scene that plays when the card scrolls into
 * view and again each time it comes back. Uses the names typed in the hero. Reduced motion shows
 * each finished scene.
 */
export default function HowItWorks({ values }: { values: DemoValues }) {
  const d = storyDetails(values)
  const refs = useRef<(HTMLLIElement | null)[]>([])
  // Without IntersectionObserver every scene simply plays on load.
  const [on, setOn] = useState<boolean[]>(() => STEPS.map(() => !('IntersectionObserver' in window)))

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(
      (entries) =>
        setOn((prev) => {
          const nextOn = [...prev]
          for (const entry of entries) nextOn[refs.current.indexOf(entry.target as HTMLLIElement)] = entry.isIntersecting
          return nextOn
        }),
      { threshold: 0.45 },
    )
    refs.current.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section id="how" className="landing-section" aria-labelledby="how-title">
      <div className="section-head">
        <h2 id="how-title">How it works</h2>
        <p className="muted">From sign-up to a published invitation in one sitting.</p>
      </div>
      <ol className="hw-steps">
        {STEPS.map(({ title, body, Scene }, i) => (
          <li key={title} ref={(el) => { refs.current[i] = el }} className={on[i] ? 'hw-step is-on' : 'hw-step'}>
            <div className="hw-stage" aria-hidden="true">
              <Scene d={d} />
            </div>
            <span className="hw-number" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
            <h3>{title}</h3>
            <p className="muted">{body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
