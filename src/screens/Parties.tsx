import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { usePartiesStore } from '../stores/parties'
import { monsterById, gameData } from '../data'
import { checkParty } from '../lib/validation'
import { ShareSheet } from '../components/ShareSheet'
import { Icon } from '../components/Icon'
import type { Party } from '../lib/types'

export function Parties() {
  const parties = usePartiesStore((s) => s.parties)
  const duplicateParty = usePartiesStore((s) => s.duplicateParty)
  const deleteParty = usePartiesStore((s) => s.deleteParty)
  const [, navigate] = useLocation()
  const [sharing, setSharing] = useState<Party | null>(null)

  const list = Object.values(parties).sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <div className="mx-auto max-w-lg p-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 style={{ fontSize: 'var(--text-2xl)' }}>My Parties</h1>
        <Link
          href="/builder"
          className="mf-torn-card flex items-center gap-1 px-3 py-1.5 font-bold"
          style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
        >
          <Icon name="plus" size={18} /> New
        </Link>
      </div>

      <div className="grid gap-2.5">
        {list.map((p) => {
          const check = checkParty(p.entries, p.budget, monsterById, p.dataVersion, gameData.dataVersion)
          const stale = p.dataVersion !== gameData.dataVersion
          const over = check.totalPoints > p.budget
          return (
            <div key={p.id} className="mf-torn-card p-3">
              <Link href={`/parties/${p.id}`} className="block">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className="truncate"
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)', color: p.name ? undefined : 'var(--text-muted)' }}
                  >
                    {p.name || 'Untitled Party'}
                  </span>
                  <span
                    className="mf-nums whitespace-nowrap font-bold"
                    style={{ color: over ? 'var(--warning-text)' : 'var(--accent-text)' }}
                  >
                    {check.totalPoints}/{p.budget} PP
                  </span>
                </div>
                <div className="mt-0.5" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                  {check.modelCount} monster{check.modelCount === 1 ? '' : 's'}
                  {stale && ` · built with cards v${p.dataVersion}`}
                </div>
              </Link>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <ActionBtn icon="roster" onClick={() => navigate(`/parties/${p.id}`)}>Edit</ActionBtn>
                <ActionBtn icon="share" onClick={() => setSharing(p)}>Share</ActionBtn>
                <ActionBtn icon="printer" onClick={() => navigate(`/parties/${p.id}/print`)}>Print</ActionBtn>
                <ActionBtn
                  icon="plus"
                  onClick={() => {
                    const copy = duplicateParty(p.id)
                    if (copy) navigate(`/parties/${copy.id}`)
                  }}
                >
                  Duplicate
                </ActionBtn>
                <ActionBtn
                  icon="skull"
                  danger
                  onClick={() => {
                    if (confirm(`Delete "${p.name || 'Untitled Party'}"? This can't be undone.`)) deleteParty(p.id)
                  }}
                >
                  Delete
                </ActionBtn>
              </div>
            </div>
          )
        })}
        {list.length === 0 && (
          <p className="py-10 text-center" style={{ color: 'var(--text-muted)' }}>
            No parties yet.{' '}
            <Link href="/builder" className="font-semibold underline" style={{ color: 'var(--accent-text)' }}>
              Build your first!
            </Link>
          </p>
        )}
      </div>

      {sharing && <ShareSheet party={sharing} open onClose={() => setSharing(null)} />}
    </div>
  )
}

function ActionBtn({
  children,
  icon,
  danger,
  onClick,
}: {
  children: React.ReactNode
  icon: 'roster' | 'share' | 'printer' | 'plus' | 'skull'
  danger?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mf-btn px-2.5 py-1"
      style={{ fontSize: 'var(--text-xs)', color: danger ? 'var(--warning-text)' : 'var(--text)' }}
    >
      <Icon name={icon} size={13} />
      {children}
    </button>
  )
}
