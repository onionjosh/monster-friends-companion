import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { usePartiesStore } from '../stores/parties'
import { monsterById, gameData } from '../data'
import { checkParty } from '../lib/validation'
import { ShareSheet } from '../components/ShareSheet'
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
        <h1 className="font-display text-2xl font-black">My Parties</h1>
        <Link
          href="/builder"
          className="rounded-xl border-2 border-zinc-900 bg-amber-300 px-3 py-1.5 font-bold dark:border-amber-300 dark:bg-amber-700"
        >
          + New
        </Link>
      </div>

      <div className="grid gap-2.5">
        {list.map((p) => {
          const check = checkParty(p.entries, p.budget, monsterById, p.dataVersion, gameData.dataVersion)
          const stale = p.dataVersion !== gameData.dataVersion
          return (
            <div key={p.id} className="rounded-xl border-2 border-zinc-900 bg-white p-3 dark:border-zinc-100 dark:bg-zinc-900">
              <Link href={`/parties/${p.id}`} className="block">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display truncate text-lg font-bold">{p.name}</span>
                  <span className={`font-bold whitespace-nowrap ${check.totalPoints > p.budget ? 'text-amber-700 dark:text-amber-400' : ''}`}>
                    {check.totalPoints}/{p.budget} PP
                  </span>
                </div>
                <div className="text-xs opacity-70">
                  {check.modelCount} monster{check.modelCount === 1 ? '' : 's'}
                  {stale && ` · built with cards v${p.dataVersion}`}
                </div>
              </Link>
              <div className="mt-2 flex flex-wrap gap-1.5 text-sm">
                <ActionBtn onClick={() => navigate(`/parties/${p.id}`)}>Edit</ActionBtn>
                <ActionBtn onClick={() => setSharing(p)}>Share</ActionBtn>
                <ActionBtn onClick={() => navigate(`/parties/${p.id}/print`)}>Print</ActionBtn>
                <ActionBtn
                  onClick={() => {
                    const copy = duplicateParty(p.id)
                    if (copy) navigate(`/parties/${copy.id}`)
                  }}
                >
                  Duplicate
                </ActionBtn>
                <ActionBtn
                  onClick={() => {
                    if (confirm(`Delete "${p.name}"? This can't be undone.`)) deleteParty(p.id)
                  }}
                >
                  Delete
                </ActionBtn>
              </div>
            </div>
          )
        })}
        {list.length === 0 && (
          <p className="py-10 text-center opacity-70">
            No parties yet.{' '}
            <Link href="/builder" className="font-medium text-amber-700 underline dark:text-amber-400">
              Build your first!
            </Link>
          </p>
        )}
      </div>

      {sharing && <ShareSheet party={sharing} open onClose={() => setSharing(null)} />}
    </div>
  )
}

function ActionBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-zinc-400 px-2.5 py-1 font-semibold active:bg-amber-200 dark:border-zinc-600 dark:active:bg-amber-800"
    >
      {children}
    </button>
  )
}
