import { useState } from 'react'
import { track } from '../lib/analytics.ts'

/** A read-only link with a Copy button. Falls back to asking the visitor to copy by hand. */
export default function CopyLink({ link, label, event }: { link: string; label: string; event?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setState('copied')
      if (event) track(event)
    } catch {
      setState('failed')
    }
  }

  return (
    <>
      <div className="link-box">
        <input type="text" readOnly value={link} aria-label={label} onFocus={(e) => e.currentTarget.select()} />
        <button type="button" className="btn btn--secondary" onClick={copy}>
          {state === 'copied' ? 'Copied' : 'Copy'}
        </button>
      </div>
      {state === 'failed' && (
        <p role="alert" className="field-error">Couldn’t copy automatically. Select the link and copy it.</p>
      )}
    </>
  )
}
