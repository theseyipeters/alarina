import { useState } from 'react'

/** A read-only link with a Copy button. Falls back to asking the visitor to copy by hand. */
export default function CopyLink({ link, label }: { link: string; label: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setState('copied')
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
