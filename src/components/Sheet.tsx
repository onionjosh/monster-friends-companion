import { type ReactNode, useEffect } from 'react'

/** Bottom sheet used for keyword popups, share options, and pickers. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    // lock the page behind the sheet so closing it doesn't lose your place
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-2xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-xl sm:rounded-2xl dark:bg-zinc-900">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-zinc-300 sm:hidden dark:bg-zinc-700" />
        {title && <h2 className="font-display mb-2 text-lg font-bold">{title}</h2>}
        {children}
      </div>
    </div>
  )
}
