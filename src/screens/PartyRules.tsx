import { useState } from 'react'
import { Link, useRoute } from 'wouter'
import { usePlayStore, type Side } from '../stores/play'
import { monsterById, conditions, conditionById, genericAbilities } from '../data'
import { AbilityCard, KeywordChips } from '../components/StatBlock'
import { Icon } from '../components/Icon'

const SIDE_COLOR: Record<Side, string> = { mine: 'var(--mf-sky-700)', theirs: 'var(--mf-devil-700)' }

type GroupBy = 'character' | 'type'

function Head({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mt-1"
      style={{ fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}
    >
      {children}
    </h2>
  )
}

/** One-screen "Command Bunker": every rule the chosen party can use, grouped by
 *  character (default) or by type, with a reactions-only filter. */
export function PartyRules() {
  const [, params] = useRoute('/play/rules/:side')
  const side: Side = params?.side === 'theirs' ? 'theirs' : 'mine'
  const game = usePlayStore((s) => s.game)
  const [groupBy, setGroupBy] = useState<GroupBy>('character')
  const [reactionsOnly, setReactionsOnly] = useState(false)

  const back = (
    <Link
      href="/play"
      className="mb-2 flex items-center gap-1"
      style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)' }}
    >
      <Icon name="chevronLeft" size={18} /> Back
    </Link>
  )

  if (!game) {
    return (
      <div className="mx-auto max-w-lg p-4">
        {back}
        <p className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>
          No game in progress.{' '}
          <Link href="/play" className="underline" style={{ color: 'var(--accent-text)' }}>
            Start one
          </Link>
          .
        </p>
      </div>
    )
  }

  const ids = [...new Set(game[side].units.map((u) => u.monsterId))]
  const ms = ids.map((id) => monsterById.get(id)).filter((m) => m !== undefined)
  const keep = (a: { reaction: boolean }) => !reactionsOnly || a.reaction

  const byCharacter = ms.map((m) => ({ m, abilities: m.abilities.filter(keep) })).filter((g) => g.abilities.length > 0)
  const reactions = ms.flatMap((m) => m.abilities.filter((a) => a.reaction).map((a) => ({ a, owner: m.name })))
  const actives = reactionsOnly ? [] : ms.flatMap((m) => m.abilities.filter((a) => !a.reaction).map((a) => ({ a, owner: m.name })))
  const kwIds = [...new Set(ms.flatMap((m) => [...m.keywords, ...m.attacks.flatMap((at) => at.tags.map((t) => t.tag))]))]
  const generics = genericAbilities.filter(keep)

  const noAbilities = groupBy === 'character' ? byCharacter.length === 0 : reactions.length === 0 && actives.length === 0

  return (
    <div className="mx-auto max-w-lg p-4 pb-24">
      {back}
      <h1 className="mb-2" style={{ fontSize: 'var(--text-2xl)' }}>
        Party Rules
      </h1>

      {/* which party */}
      <div className="mf-card mb-3 grid grid-cols-2 overflow-hidden p-0">
        {(['mine', 'theirs'] as const).map((s) => (
          <Link
            key={s}
            href={`/play/rules/${s}`}
            className="mf-press truncate px-2 py-2 text-center font-bold"
            style={side === s ? { background: SIDE_COLOR[s], color: '#fff' } : { background: 'transparent', color: 'var(--text)' }}
          >
            {game[s].name}
          </Link>
        ))}
      </div>

      {/* group + filter controls */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
          Group
        </span>
        <button type="button" className="mf-chip mf-chip--filter" data-active={groupBy === 'character'} onClick={() => setGroupBy('character')}>
          By character
        </button>
        <button type="button" className="mf-chip mf-chip--filter" data-active={groupBy === 'type'} onClick={() => setGroupBy('type')}>
          By type
        </button>
        <span aria-hidden="true" style={{ width: 1, height: 18, background: 'var(--border-soft)', margin: '0 2px' }} />
        <button type="button" className="mf-chip mf-chip--filter" data-active={reactionsOnly} onClick={() => setReactionsOnly((v) => !v)}>
          Usable out of turn
        </button>
      </div>

      {/* abilities, grouped */}
      {noAbilities ? (
        <p className="py-6 text-center" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
          {reactionsOnly ? 'No reaction abilities in this party.' : 'No special abilities in this party.'}
        </p>
      ) : groupBy === 'character' ? (
        byCharacter.map(({ m, abilities }) => (
          <section key={m.id} className="mb-4 grid gap-2.5">
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-lg)', color: 'var(--punk-red)' }}>{m.name}</h3>
            {abilities.map((a) => (
              <AbilityCard key={a.id} ability={a} />
            ))}
          </section>
        ))
      ) : (
        <div className="mb-4 grid gap-2.5">
          {reactions.length > 0 && (
            <>
              <Head>Usable out of turn</Head>
              {reactions.map(({ a, owner }) => (
                <AbilityCard key={`${owner}-${a.id}`} ability={a} owner={owner} />
              ))}
            </>
          )}
          {actives.length > 0 && (
            <>
              <Head>On their activation</Head>
              {actives.map(({ a, owner }) => (
                <AbilityCard key={`${owner}-${a.id}`} ability={a} owner={owner} />
              ))}
            </>
          )}
        </div>
      )}

      {/* shared reference (always shown) */}
      <div className="grid gap-2.5">
        {kwIds.length > 0 && (
          <>
            <Head>Keywords in this party</Head>
            <KeywordChips ids={kwIds} />
          </>
        )}
        {generics.length > 0 && (
          <>
            <Head>Generic abilities (anyone)</Head>
            {generics.map((a) => (
              <AbilityCard key={a.id} ability={a} />
            ))}
          </>
        )}
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          <b>Conditions:</b> {conditions.map((c) => `${c.name} — ${conditionById.get(c.id)?.short}`).join(' · ')}
        </div>
      </div>
    </div>
  )
}
