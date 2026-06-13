import { useState } from 'react'
import { Link, useLocation, useRoute } from 'wouter'
import { monsters, monsterById, gameData } from '../data'
import { usePartiesStore } from '../stores/parties'
import { checkParty } from '../lib/validation'
import { Sheet } from '../components/Sheet'
import { ShareSheet } from '../components/ShareSheet'
import { SizeBadge } from '../components/StatBlock'
import { Stepper } from '../components/Stepper'

export function PartyEditor() {
  const [, params] = useRoute('/parties/:id')
  const [, navigate] = useLocation()
  const party = usePartiesStore((s) => (params ? s.parties[params.id] : undefined))
  const updateParty = usePartiesStore((s) => s.updateParty)
  const setEntryCount = usePartiesStore((s) => s.setEntryCount)
  const [adding, setAdding] = useState(false)
  const [sharing, setSharing] = useState(false)

  if (!party) {
    return (
      <div className="mx-auto max-w-lg p-4">
        <p className="py-8 text-center opacity-70">This party doesn't exist (anymore).</p>
        <Link href="/parties" className="block text-center font-medium text-amber-700 underline">
          ← My parties
        </Link>
      </div>
    )
  }

  const check = checkParty(party.entries, party.budget, monsterById, party.dataVersion, gameData.dataVersion)
  const over = check.totalPoints > party.budget

  return (
    <div className="mx-auto max-w-lg p-4 pb-28">
      <Link href="/parties" className="text-sm font-medium opacity-70">
        ← My parties
      </Link>

      <div className="mt-2 mb-3 flex items-center gap-2">
        <input
          value={party.name}
          onChange={(e) => updateParty(party.id, { name: e.target.value })}
          aria-label="party name"
          className="font-display w-full rounded-xl border-2 border-zinc-900 bg-white px-3 py-2 text-lg font-bold dark:border-zinc-100 dark:bg-zinc-900"
        />
      </div>

      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm font-semibold opacity-70">Budget</span>
        {[50, 75, 100].map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => updateParty(party.id, { budget: b })}
            className={`rounded-full border-2 px-3 py-1 text-sm font-bold ${
              party.budget === b
                ? 'border-zinc-900 bg-amber-300 dark:border-amber-300 dark:bg-amber-700'
                : 'border-zinc-300 opacity-70 dark:border-zinc-700'
            }`}
          >
            {b}
          </button>
        ))}
        <BudgetInput
          key={party.budget}
          value={party.budget}
          onCommit={(b) => updateParty(party.id, { budget: b })}
        />
      </div>

      <div className="grid gap-2">
        {party.entries.map((e) => {
          const m = monsterById.get(e.monsterId)
          return (
            <div
              key={e.monsterId}
              className="flex items-center gap-3 rounded-xl border-2 border-zinc-900 bg-white p-3 dark:border-zinc-100 dark:bg-zinc-900"
            >
              <div className="min-w-0 flex-1">
                {m ? (
                  <Link href={`/monsters/${m.id}`} className="font-display flex items-center gap-2 font-bold">
                    <span className="truncate">{m.name}</span>
                    <SizeBadge size={m.size} />
                  </Link>
                ) : (
                  <span className="font-bold opacity-60">Unknown: {e.monsterId}</span>
                )}
                <div className="text-xs opacity-70">{m ? `${m.partyPoints} PP each · ${m.partyPoints * e.count} PP total` : ''}</div>
              </div>
              <Stepper value={e.count} onChange={(n) => setEntryCount(party.id, e.monsterId, n)} />
            </div>
          )
        })}
        {party.entries.length === 0 && (
          <p className="py-6 text-center text-sm opacity-70">No monsters yet — invite some friends to the party!</p>
        )}
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-xl border-2 border-dashed border-zinc-400 p-3 font-bold opacity-80"
        >
          + Add a monster
        </button>
      </div>

      {check.flags.length > 0 && (
        <div className="mt-3 grid gap-1.5">
          {check.flags.map((f, i) => (
            <div
              key={i}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                f.level === 'warn'
                  ? 'bg-amber-200 text-amber-950 dark:bg-amber-900 dark:text-amber-100'
                  : 'bg-zinc-200 dark:bg-zinc-800'
              }`}
            >
              {f.level === 'warn' ? '⚠️ ' : 'ℹ️ '}
              {f.message}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setSharing(true)}
          className="flex-1 rounded-xl border-2 border-zinc-900 bg-white py-2.5 font-bold dark:border-zinc-100 dark:bg-zinc-900"
        >
          Share
        </button>
        <button
          type="button"
          onClick={() => navigate(`/parties/${party.id}/print`)}
          className="flex-1 rounded-xl border-2 border-zinc-900 bg-white py-2.5 font-bold dark:border-zinc-100 dark:bg-zinc-900"
        >
          Print
        </button>
      </div>

      {/* sticky points total */}
      <div className="fixed right-0 bottom-14 left-0 z-30 mx-auto max-w-lg px-4">
        <div
          className={`rounded-xl border-2 px-4 py-2 text-center font-bold shadow-lg ${
            over
              ? 'border-amber-700 bg-amber-300 text-amber-950'
              : 'border-zinc-900 bg-white dark:border-zinc-100 dark:bg-zinc-900'
          }`}
        >
          {check.totalPoints} / {party.budget} Party Points · {check.modelCount} monster{check.modelCount === 1 ? '' : 's'}
          {over && ' · over budget!'}
        </div>
      </div>

      <AddMonsterSheet
        open={adding}
        onClose={() => setAdding(false)}
        onAdd={(id) => {
          const cur = party.entries.find((e) => e.monsterId === id)?.count ?? 0
          setEntryCount(party.id, id, cur + 1)
        }}
      />
      <ShareSheet party={party} open={sharing} onClose={() => setSharing(false)} />
    </div>
  )
}

/** Custom budget field with a local draft so clearing/retyping works normally. */
function BudgetInput({ value, onCommit }: { value: number; onCommit: (b: number) => void }) {
  const [draft, setDraft] = useState(String(value))
  function commit() {
    const n = Number(draft)
    if (Number.isFinite(n) && n >= 1) onCommit(Math.floor(n))
    else setDraft(String(value))
  }
  return (
    <input
      type="number"
      value={draft}
      min={1}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
      }}
      aria-label="custom budget"
      className="w-20 rounded-xl border-2 border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
    />
  )
}

function AddMonsterSheet({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (id: string) => void }) {
  const [q, setQ] = useState('')
  const list = monsters.filter((m) => m.name.toLowerCase().includes(q.toLowerCase()))
  return (
    <Sheet open={open} onClose={onClose} title="Add a monster">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search…"
        className="mb-2 w-full rounded-xl border-2 border-zinc-900 bg-white px-3 py-2 dark:border-zinc-100 dark:bg-zinc-900"
      />
      <div className="grid gap-1.5">
        {list.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onAdd(m.id)}
            className="flex items-center justify-between rounded-xl border-2 border-zinc-900 bg-white px-3 py-2 text-left active:bg-amber-200 dark:border-zinc-100 dark:bg-zinc-900 dark:active:bg-amber-800"
          >
            <span className="font-bold">
              {m.name} <SizeBadge size={m.size} />
            </span>
            <span className="font-display font-black">{m.partyPoints} PP</span>
          </button>
        ))}
      </div>
    </Sheet>
  )
}
