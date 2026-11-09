import { useId, useRef, useState, type ChangeEvent } from 'react'
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

/** A photo for an item: choose one, it's shrunk and uploaded straight away, and its id is handed back. */
export default function ImageField({ value, onChange, label = 'Photo', optional = true, uploadPath = '/wedding/gifts/images' }: Props) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function pick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      let photo: Blob
      try {
        photo = await resizeImage(file)
      } catch {
        setError('We couldn’t read that photo. Try a JPG or PNG.')
        return
      }
      const { id } = await api.post<{ id: string }>(uploadPath, photo)
      onChange(id)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="field image-field">
      <label htmlFor={inputId}>
        {label} {optional && <span className="muted">(optional)</span>}
      </label>
      <div className="image-field-row">
        {value ? <img className="thumb thumb--lg" src={imageSrc(value)} alt="Photo of the item" /> : <span className="thumb thumb--lg thumb--empty" aria-hidden="true" />}
        <div className="actions">
          <button type="button" className="btn btn--secondary" onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? 'Uploading…' : value ? 'Change photo' : 'Add a photo'}
          </button>
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
        accept="image/jpeg,image/png,image/webp"
        onChange={pick}
      />
      {error && <span className="field-error" role="alert">{error}</span>}
    </div>
  )
}
