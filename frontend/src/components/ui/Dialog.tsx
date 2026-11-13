import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] max-w-[min(620px,calc(100vw-2rem))] overflow-auto rounded-panel border border-stroke-strong bg-panel p-[clamp(1.5rem,4vw,2.5rem)] text-paper shadow-panel backdrop:bg-black/80"
      aria-labelledby={titleId}
      onClose={onClose}
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="eyebrow">Data / transparency</p>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close data and method">
          <X size={20} aria-hidden="true" />
        </Button>
      </div>
      <h2 id={titleId} className="text-[clamp(1.8rem,5vw,2.5rem)]">
        {title}
      </h2>
      <div className="my-8 grid gap-6 text-secondary [&_a]:text-focus [&_strong]:text-paper">
        {children}
      </div>
      <Button variant="secondary" onClick={onClose}>
        Back to preview
      </Button>
    </dialog>
  )
}
