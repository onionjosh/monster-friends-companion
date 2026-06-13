import { useMemo } from 'react'
import { Link, useLocation, useRoute } from 'wouter'
import { decodeParty, DecodeError } from '../lib/codec'
import { monsterById, gameData } from '../data'
import { checkParty } from '../lib/validation'
import { usePartiesStore } from '../stores/parties'
import { SizeBadge } from '../components/StatBlock'

export function Import() {
  const [, params] = useRoute('/import/:code')
  const [, navigate] = useLocation()
  const createParty = usePartiesStore((s) => s.createParty)

  const result = useMemo(() => {
    if (!params?.code) return { error: 'No party code in this link.' }
    try {
      return { shared: decodeParty(decodeURIComponent(params.code)) }
    } catch (e) {
      return { error: e instanceof DecodeError ? e.message : 'Could not read this party code.' }
    }
  }, [params?.code])

  if ('error' in result) {
    return (
      <div className="mx-auto max-w-lg p-4">
        <h1 className="font-display mb-2 text-2xl font-black">Import party</h1>
        <p className="rounded-xl bg-amber-200 p-3 font-medium text-amber-950 dark:bg-amber-900 dark:text-amber-100">
          {result.error}
        </p>
        <Link href="/" className="mt-4 block text-center font-medium text-amber-700 underline">
          ← Home
        </Link>
      </div>
    )
  }

  const shared = result.shared!
  const entries = shared.e.map(([monsterId, count]) => ({ monsterId, count }))
  const check = checkParty(entries, shared.b, monsterById, shared.d, gameData.dataVersion)

  function save() {
    const party = createParty({ name: shared.n || 'Imported party', budget: shared.b, entries, dataVersion: shared.d })
    navigate(`/parties/${party.id}`)
  }

  return (
    <div className="mx-auto max-w-lg p-4">
      <h1 className="font-display mb-1 text-2xl font-black">Incoming party!</h1>
      <p className="mb-3 text-sm opacity-70">Someone shared this list with you.</p>

      <div className="rounded-xl border-2 border-zinc-900 bg-white p-3 dark:border-zinc-100 dark:bg-zinc-900">
        <div className="flex items-baseline justify-between">
          <span className="font-display text-lg font-bold">{shared.n || 'Unnamed party'}</span>
          <span className="font-bold">
            {check.totalPoints}/{shared.b} PP
          </span>
        </div>
        <div className="mt-2 grid gap-1">
          {entries.map((e) => {
            const m = monsterById.get(e.monsterId)
            return (
              <div key={e.monsterId} className="flex items-center justify-between text-sm">
                <span>
                  {e.count}x {m ? m.name : `Unknown monster (${e.monsterId})`} {m && <SizeBadge size={m.size} />}
                </span>
                <span className="opacity-70">{m ? `${m.partyPoints * e.count} PP` : '—'}</span>
              </div>
            )
          })}
        </div>
      </div>

      {check.flags.length > 0 && (
        <div className="mt-2 grid gap-1.5">
          {check.flags.map((f, i) => (
            <div key={i} className="rounded-lg bg-zinc-200 px-3 py-1.5 text-sm dark:bg-zinc-800">
              {f.level === 'warn' ? '⚠️ ' : 'ℹ️ '}
              {f.message}
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={save}
        className="font-display mt-4 w-full rounded-2xl border-2 border-zinc-900 bg-amber-300 py-3 text-lg font-black dark:border-amber-300 dark:bg-amber-600"
      >
        Save to my parties
      </button>
      <p className="mt-2 text-center text-xs opacity-70">
        You can also use it as the opponent's list when starting a game — go to Play and paste the code there.
      </p>
    </div>
  )
}
