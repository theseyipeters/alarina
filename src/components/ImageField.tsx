import { useId, useRef, useState, type DragEvent } from 'react'
import { api, imageSrc } from '../lib/api.ts'
import { errorMessage } from '../lib/errors.ts'
import { resizeImage } from '../lib/resizeImage.ts'

type Props = {
  /** The uploaded photo's id, or null for none. */
  value: string | null
  onChange: (imageId: string | null) => void
  label?: string
  optional?: boolean
  /** Where photos are uploaded: a couple's gift photos by default, or a vendor's listing photos. */
  uploadPath?: string
}

type Busy = 'uploading' | 'fetching' | null

/** A problem this field found itself, shown as written (not as a failure to reach the server). */
class PhotoError extends Error {}

const looksLikeLink = (text: string) => /^https?:\/\/\S+$/i.test(text.trim())

/**
 * A photo for an item or a listing. Click the box (or drop a photo on it) to choose one, or paste a
 * link to a photo online. Either way it's shrunk in the browser and uploaded straight away, and its
 * id is handed back.
 */
export default function ImageField({ value, onChange, label = 'Photo', optional = true, uploadPath = '/wedding/gifts/images' }: Props) {
  const inputId = useId()
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<Busy>(null)
  const [over, setOver] = useState(false)
  const [link, setLink] = useState('')
  const [error, setError] = useState<string | null>(null)

  /** Shrinks a photo and uploads it. */
  async function upload(photo: Blob) {
    let small: Blob
    try {
      small = await resizeImage(photo)
    } catch {
      throw new PhotoError('We couldn’t read that photo. Try a JPG, PNG or WebP.')
    }
    const { id } = await api.post<{ id: string }>(uploadPath, small)
    onChange(id)
  }

  async function run(kind: Exclude<Busy, null>, work: () => Promise<void>) {
    setBusy(kind)
    setError(null)
    try {
      await work()
    } catch (err) {
      setError(err instanceof PhotoError ? err.message : errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const fromFile = (file: File | undefined) => file && run('uploading', () => upload(file))

  const fromLink = (url: string) =>
    run('fetching', async () => {
      if (!looksLikeLink(url)) throw new PhotoError('Paste the whole link, starting with https://')
      await upload(await api.postForBlob('/images/from-link', { url: url.trim() }))
      setLink('')
    })

  function drop(e: DragEvent<HTMLButtonElement>) {
    e.preventDefault()
    setOver(false)
    if (busy) return
    const file = e.dataTransfer.files[0]
    if (file) return fromFile(file)
    // A photo dragged from another tab arrives as its address.
    const url = e.dataTransfer.getData('text/uri-list').split('\n').find((l) => l && !l.startsWith('#')) ?? e.dataTransfer.getData('text/plain')
    if (url && looksLikeLink(url)) return fromLink(url)
    setError('Drop a photo from your computer, or paste its link below.')
  }

  const describedBy = [hintId, error && errorId].filter(Boolean).join(' ')

  return (
    <div className="field image-field">
      <label htmlFor={inputId}>
        {label} {optional && <span className="muted">(optional)</span>}
      </label>
      <div className="photo-picker">
        <button
          type="button"
          className={['photo-drop', value && 'has-photo', over && 'is-over'].filter(Boolean).join(' ')}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            if (!busy) setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={drop}
          disabled={Boolean(busy)}
          aria-describedby={describedBy}
        >
          {value && <img src={imageSrc(value)} alt="" />}
          {value ? (
            <span className="photo-drop-change">Change photo</span>
          ) : (
            <span className="photo-drop-empty">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
                <circle cx="9" cy="10" r="1.75" />
                <path d="m20.5 16-5-5-8.5 8.5" />
              </svg>
              {over ? 'Drop it here' : 'Add a photo'}
            </span>
          )}
          {busy && (
            <span className="photo-drop-busy" role="status">
              {busy === 'fetching' ? 'Getting photo…' : 'Uploading…'}
            </span>
          )}
        </button>

        <div className="photo-side">
          <span id={hintId} className="hint">
            Click the box or drop a photo on it. JPG, PNG or WebP.
          </span>
          <div className="photo-link">
            <input
              type="url"
              inputMode="url"
              autoComplete="off"
              aria-label={`${label}: link to a photo online`}
              placeholder="Or paste a photo link"
              value={link}
              disabled={Boolean(busy)}
              onChange={(e) => setLink(e.target.value)}
              onKeyDown={(e) => {
                // This sits inside other forms: Enter fetches the photo instead of sending them.
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (link.trim()) void fromLink(link)
                }
              }}
            />
            <button type="button" className="btn btn--secondary" disabled={Boolean(busy) || !link.trim()} onClick={() => fromLink(link)}>
              {busy === 'fetching' ? 'Getting…' : 'Use link'}
            </button>
          </div>
          {value && !busy && (
            <button type="button" className="link-button" onClick={() => onChange(null)}>
              Remove photo
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        id={inputId}
        className="visually-hidden"
        type="file"
        tabIndex={-1}
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          void fromFile(file)
        }}
      />
      {error && (
        <span id={errorId} className="field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
