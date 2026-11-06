import { useEffect, useRef } from 'react'
import { coupleNames } from '../lib/format.ts'
import { namesInOrder } from '../invite/order.ts'
import { parentSides } from '../invite/parents.ts'
import type { ParentField, WeddingFields } from '../lib/types.ts'

type Names = Pick<WeddingFields, 'partnerOneName' | 'partnerTwoName' | 'partnerOneRole' | 'partnerTwoRole' | ParentField | 'lateParents'>

type Props = {
  open: boolean
  names: Names
  onPublish: () => void
  onEdit: () => void
  onClose: () => void
}

/**
 * The last look before guests see the invitation. Every way of publishing goes through this, because
 * a name can't be taken back once the link is out in family groups.
 */
export default function ConfirmNames({ open, names, onPublish, onEdit, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog?.open) dialog?.showModal()
    if (!open && dialog?.open) dialog.close()
  }, [open])

  const parents = parentSides(names).flatMap((side) => side.parents)

  return (
    <dialog ref={ref} className="dialog dialog--names" aria-labelledby="confirm-names-title" onClose={onClose}>
      <h2 id="confirm-names-title">Check your names</h2>
      <p className="muted">Guests will see them exactly like this.</p>
      <p className="confirm-names">{coupleNames(...namesInOrder(names))}</p>
      {parents.length > 0 && (
        <ul className="confirm-parents">
          {parents.map((p) => (
            <li key={p.field}>{p.late ? `Late ${p.name}` : p.name}</li>
          ))}
        </ul>
      )}
      <p className="hint">Missing an accent or under-dot? Edit your names and add it first.</p>
      <div className="actions actions--end">
        <button type="button" className="btn btn--secondary" onClick={onEdit} autoFocus>Edit names</button>
        <button type="button" className="btn" onClick={onPublish}>Publish invitation</button>
      </div>
    </dialog>
  )
}
