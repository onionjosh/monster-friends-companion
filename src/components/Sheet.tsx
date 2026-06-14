import { type ReactNode, useEffect } from 'react'

/** Bottom sheet for keyword popups, share options, and pickers. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  bg,
  scrim,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  bg?: string
  scrim?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="mf-sheet-backdrop no-print" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="mf-sheet-scrim" style={scrim ? { background: scrim } : undefined} />
      <div className="mf-sheet" onClick={(e) => e.stopPropagation()} style={bg ? { background: bg } : undefined}>
        <div
          className="mx-auto mb-3 h-1.5 w-10 rounded-full sm:hidden"
          style={{ background: 'var(--text-muted)', opacity: 0.5 }}
        />
        {title && (
          <h2 className="mb-3" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-xl)' }}>
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  )
}
