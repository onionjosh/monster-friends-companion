import { useMemo } from 'react'
import { Link, useLocation, useRoute } from 'wouter'
import { decodeParty, DecodeError } from '../lib/codec'
import { monsterById, gameData } from '../data'
import { checkParty } from '../lib/validation'
import { usePartiesStore } from '../stores/parties'
import { SizeBadge } from '../components/StatBlock'
import { TornButton } from '../components/Torn'

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
        <h1 className="mb-2" style={{ fontSize: 'var(--text-2xl)' }}>
          Import party
        </h1>
        <p className="rounded-xl p-3 font-medium" style={{ background: 'var(--warning)', color: '#fff' }}>
          {result.error}
        </p>
        <Link href="/" className="mt-4 block text-center font-semibold underline" style={{ color: 'var(--accent-text)' }}>
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
      <h1 className="mb-1" style={{ fontSize: 'var(--text-2xl)', color: 'var(--punk-red)' }}>
        Incoming party!
      </h1>
      <p className="mb-3" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
        Someone shared this list with you.
      </p>

      <div className="mf-card p-3">
        <div className="flex items-baseline justify-between">
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)' }}>{shared.n || 'Unnamed party'}</span>
          <span className="mf-nums font-bold" style={{ color: 'var(--accent-text)' }}>
            {check.totalPoints}/{shared.b} PP
          </span>
        </div>
        <div className="mt-2 grid gap-1">
          {entries.map((e) => {
            const m = monsterById.get(e.monsterId)
            return (
              <div key={e.monsterId} className="flex items-center justify-between" style={{ fontSize: 'var(--text-sm)' }}>
                <span className="flex items-center gap-1.5">
                  {e.count}x {m ? m.name : `Unknown monster (${e.monsterId})`} {m && <SizeBadge size={m.size} />}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>{m ? `${m.partyPoints * e.count} PP` : '—'}</span>
              </div>
            )
          })}
        </div>
      </div>

      {check.flags.length > 0 && (
        <div className="mt-2 grid gap-1.5">
          {check.flags.map((f, i) => (
            <div key={i} className="rounded-lg px-3 py-1.5" style={{ fontSize: 'var(--text-sm)', background: 'var(--surface-sunk)' }}>
              {f.message}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-center">
        <TornButton variant="gold" cut={1} tilt="sm" leftIcon="roster" onClick={save}>
          Save to my parties
        </TornButton>
      </div>
      <p className="mt-2 text-center" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
        You can also use it as the opponent's list when starting a game — go to Play and paste the code there.
      </p>
    </div>
  )
}
