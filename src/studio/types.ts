import type { Design } from '../invite/design.ts'
import type { InvitationContent } from '../lib/types.ts'

export type PanelProps = {
  design: Design
  /** Applies a change. Changes sharing a group a moment apart (a drag) undo as one step. */
  change: (next: Design | ((d: Design) => Design), group?: string) => void
  /** The couple's invitation in the current design, for previews and samples. */
  invitation: InvitationContent
}
