import { useMemo, useState } from 'react'
import { Link } from 'wouter'
import { usePartiesStore } from '../stores/parties'
import { usePlayStore, type Side } from '../stores/play'
import { monsterById, conditions, conditionById, scenarios, scenarioById, genericAbilities } from '../data'
import type { UnitState } from '../lib/types'
import { sideDefeated, MAX_ENERGY } from '../lib/play'
import { decodeParty, DecodeError } from '../lib/codec'
import { Sheet } from '../components/Sheet'
import { Stepper } from '../components/Stepper'
import { StatRow, DefenseLine, AttackCard, AbilityCard, KeywordChips } from '../components/StatBlock'

export function Play() {
  const game = usePlayStore((s) => s.game)
  return game ? <Tracker /> : <Setup />
}

/* ---------------- Setup ---------------- */

function Setup() {
  const parties = usePartiesStore((s) => s.parties)
  const startGame = usePlayStore((s) => s.startGame)
  const list = Object.values(parties).sort((a, b) => b.updatedAt - a.updatedAt)

  const [mineId, setMineId] = useState<string | null>(null)
  const [theirsId, setTheirsId] = useState<string | null>(null)
  const [oppCode, setOppCode] = useState('')
  const [scenarioId, setScenarioId] = useState<string | null>(scenarios[0]?.id ?? null)

  // derive both outcomes from the input — no setState during render, no stale errors
  const opp = useMemo<{ shared?: ReturnType<typeof decodeParty>; error?: string }>(() => {
    if (!oppCode.trim()) return {}
    try {
      return { shared: decodeParty(oppCode) }
    } catch (e) {
      return { error: e instanceof DecodeError ? e.message : 'Could not read that code.' }
    }
  }, [oppCode])
  const oppFromCode = opp.shared ?? null

  const mine = mineId ? parties[mineId] : null
  const theirs = theirsId ? parties[theirsId] : null
  const canStart = !!mine && (!!theirs || !!oppFromCode)

  function start() {
    if (!mine) return
    const opponent = oppFromCode
      ? { name: oppFromCode.n || 'Opponent', entries: oppFromCode.e.map(([monsterId, count]) => ({ monsterId, count })) }
      : theirs
        ? { name: theirs.name, entries: theirs.entries }
        : null
    if (!opponent) return
    startGame({ name: mine.name, entries: mine.entries }, opponent, scenarioId)
  }

  const pick = (active: boolean) =>
    `w-full rounded-xl border-2 px-3 py-2 text-left font-semibold ${
      active ? 'border-zinc-900 bg-amber-300 dark:border-amber-300 dark:bg-amber-700' : 'border-zinc-300 dark:border-zinc-700'
    }`

  return (
    <div className="mx-auto max-w-lg p-4">
      <h1 className="font-display mb-1 text-2xl font-black">Game Night</h1>
      <p className="mb-4 text-sm opacity-70">Track HP, Action Tokens, Energy and conditions at the table.</p>

      <h2 className="font-display mb-1.5 font-bold tracking-wide uppercase opacity-70">Your party</h2>
      <div className="mb-4 grid gap-1.5">
        {list.map((p) => (
          <button key={p.id} type="button" className={pick(mineId === p.id)} onClick={() => setMineId(p.id)}>
            {p.name}
          </button>
        ))}
        {list.length === 0 && (
          <p className="text-sm opacity-70">
            No saved parties yet —{' '}
            <Link href="/builder" className="font-medium text-amber-700 underline dark:text-amber-400">
              build one first
            </Link>
            .
          </p>
        )}
      </div>

      <h2 className="font-display mb-1.5 font-bold tracking-wide uppercase opacity-70">Opponent's party</h2>
      <div className="mb-2 grid gap-1.5">
        {list.map((p) => (
          <button
            key={p.id}
            type="button"
            className={pick(theirsId === p.id && !oppFromCode)}
            onClick={() => {
              setTheirsId(p.id)
              setOppCode('')
            }}
          >
            {p.name}
          </button>
        ))}
      </div>
      <input
        value={oppCode}
        onChange={(e) => {
          setOppCode(e.target.value)
          if (e.target.value.trim()) setTheirsId(null)
        }}
        placeholder="…or paste their party code / share link"
        className="mb-1 w-full rounded-xl border-2 border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      {opp.error && <p className="mb-2 text-sm text-amber-700 dark:text-amber-400">{opp.error}</p>}
      {oppFromCode && (
        <p className="mb-2 text-sm font-medium">
          ✓ {oppFromCode.n || 'Opponent'} — {oppFromCode.e.reduce((n, [, c]) => n + c, 0)} monsters
        </p>
      )}

      <h2 className="font-display mt-3 mb-1.5 font-bold tracking-wide uppercase opacity-70">Scenario</h2>
      <div className="mb-5 grid gap-1.5">
        {scenarios.map((s) => (
          <button key={s.id} type="button" className={pick(scenarioId === s.id)} onClick={() => setScenarioId(s.id)}>
            {s.name}
            <span className="block text-xs font-normal opacity-70">{s.winCondition}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={!canStart}
        onClick={start}
        className="font-display w-full rounded-2xl border-2 border-zinc-900 bg-amber-300 py-3 text-lg font-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] disabled:opacity-40 dark:border-amber-300 dark:bg-amber-600"
      >
        Start the Battle!
      </button>
    </div>
  )
}

/* ---------------- Tracker ---------------- */

function Tracker() {
  const game = usePlayStore((s) => s.game)!
  const endGame = usePlayStore((s) => s.endGame)
  const advanceRound = usePlayStore((s) => s.advanceRound)
  const setEnergy = usePlayStore((s) => s.setEnergy)
  const [side, setSide] = useState<Side>('mine')
  const [cardUnit, setCardUnit] = useState<UnitState | null>(null)
  const [rulesOpen, setRulesOpen] = useState(false)

  const scenario = game.scenarioId ? scenarioById.get(game.scenarioId) : undefined
  const cur = game[side]
  const winner = sideDefeated(game.mine) ? game.theirs.name : sideDefeated(game.theirs) ? game.mine.name : null

  return (
    <div className="mx-auto max-w-lg p-4 pb-24">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="font-display text-xl font-black">Round {game.round}</div>
          {scenario && <div className="text-xs opacity-70">{scenario.name}: {scenario.winCondition}</div>}
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => {
              if (confirm('Start the next Round? All monsters refill Action Tokens and both players refill to 10 Energy.'))
                advanceRound()
            }}
            className="rounded-xl border-2 border-zinc-900 bg-amber-300 px-3 py-1.5 text-sm font-bold dark:border-amber-300 dark:bg-amber-700"
          >
            Next Round ↻
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm('End this game? The tracker state will be cleared.')) endGame()
            }}
            className="rounded-xl border border-zinc-400 px-2.5 py-1.5 text-sm font-semibold opacity-80 dark:border-zinc-600"
          >
            End
          </button>
        </div>
      </div>

      {winner && (
        <div className="mb-3 rounded-xl border-2 border-zinc-900 bg-amber-300 p-3 text-center font-display text-lg font-black dark:border-amber-300 dark:bg-amber-600">
          🏆 {winner} wins — the other party has no monsters left!
        </div>
      )}

      {/* side switcher */}
      <div className="mb-2 grid grid-cols-2 overflow-hidden rounded-xl border-2 border-zinc-900 dark:border-zinc-100">
        {(['mine', 'theirs'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSide(s)}
            className={`truncate px-2 py-2 font-bold ${
              side === s ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-white dark:bg-zinc-900'
            }`}
          >
            {game[s].name}
          </button>
        ))}
      </div>

      {/* energy + party rules */}
      <div className="mb-3 flex items-center justify-between rounded-xl border-2 border-zinc-900 bg-white px-3 py-2 dark:border-zinc-100 dark:bg-zinc-900">
        <Stepper
          big
          label="⚡ Energy"
          value={cur.energy}
          min={0}
          max={MAX_ENERGY}
          onChange={(v) => setEnergy(side, v)}
        />
        <button
          type="button"
          onClick={() => setRulesOpen(true)}
          className="rounded-lg border border-zinc-400 px-2.5 py-1.5 text-sm font-semibold dark:border-zinc-600"
        >
          📚 Party rules
        </button>
      </div>

      <div className="grid gap-2">
        {cur.units.map((u) => (
          <UnitCard key={u.uid} side={side} unit={u} onShowCard={() => setCardUnit(u)} />
        ))}
      </div>

      <FullCardSheet unit={cardUnit} onClose={() => setCardUnit(null)} />
      <PartyRulesSheet open={rulesOpen} onClose={() => setRulesOpen(false)} side={side} />
    </div>
  )
}

function UnitCard({ side, unit, onShowCard }: { side: Side; unit: UnitState; onShowCard: () => void }) {
  const adjustHp = usePlayStore((s) => s.adjustHp)
  const adjustAct = usePlayStore((s) => s.adjustAct)
  const toggleDead = usePlayStore((s) => s.toggleDead)
  const toggleCondition = usePlayStore((s) => s.toggleCondition)
  const m = monsterById.get(unit.monsterId)

  return (
    <div
      className={`rounded-xl border-2 p-3 ${
        unit.dead
          ? 'border-zinc-300 bg-zinc-100 opacity-60 dark:border-zinc-700 dark:bg-zinc-900'
          : 'border-zinc-900 bg-white dark:border-zinc-100 dark:bg-zinc-900'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={onShowCard} className="font-display truncate text-left font-bold underline decoration-dotted">
          {unit.label}
        </button>
        <button
          type="button"
          onClick={() => toggleDead(side, unit.uid)}
          className={`rounded-lg border px-2 py-1 text-sm font-bold ${
            unit.dead ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900' : 'border-zinc-400 dark:border-zinc-600'
          }`}
        >
          {unit.dead ? 'KO’d 💀' : '💀'}
        </button>
      </div>

      {!unit.dead && (
        <>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <Stepper big label={`HP/${m?.hp ?? '?'}`} value={unit.hp} min={0} onChange={(v) => adjustHp(side, unit.uid, v - unit.hp)} />
            <Stepper label="AcT" value={unit.act} min={0} onChange={(v) => adjustAct(side, unit.uid, v - unit.act)} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {conditions.map((c) => {
              const on = unit.conditions.includes(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  title={c.short}
                  onClick={() => toggleCondition(side, unit.uid, c.id)}
                  className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                    on
                      ? 'border-zinc-900 bg-amber-300 dark:border-amber-300 dark:bg-amber-700'
                      : 'border-zinc-300 opacity-60 dark:border-zinc-700'
                  }`}
                >
                  {c.name}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function FullCardSheet({ unit, onClose }: { unit: UnitState | null; onClose: () => void }) {
  const m = unit ? monsterById.get(unit.monsterId) : undefined
  return (
    <Sheet open={!!unit && !!m} onClose={onClose} title={m?.name}>
      {m && (
        <div className="grid gap-2.5">
          <StatRow monster={m} />
          <DefenseLine monster={m} />
          {m.keywords.length > 0 && <KeywordChips ids={m.keywords} />}
          {m.attacks.map((a) => (
            <AttackCard key={a.name} attack={a} />
          ))}
          {m.abilities.map((a) => (
            <AbilityCard key={a.id} ability={a} />
          ))}
        </div>
      )}
    </Sheet>
  )
}

/** One-screen view of everything the selected party can do (Command Bunker pattern). */
function PartyRulesSheet({ open, onClose, side }: { open: boolean; onClose: () => void; side: Side }) {
  const game = usePlayStore((s) => s.game)
  if (!game) return null
  const ids = [...new Set(game[side].units.map((u) => u.monsterId))]
  const ms = ids.map((id) => monsterById.get(id)).filter((m) => m !== undefined)

  const reactions = ms.flatMap((m) => m.abilities.filter((a) => a.reaction).map((a) => ({ a, owner: m.name })))
  const actives = ms.flatMap((m) => m.abilities.filter((a) => !a.reaction).map((a) => ({ a, owner: m.name })))
  const kwIds = [...new Set(ms.flatMap((m) => [...m.keywords, ...m.attacks.flatMap((at) => at.tags.map((t) => t.tag))]))]

  return (
    <Sheet open={open} onClose={onClose} title={`${game[side].name} — all rules`}>
      <div className="grid gap-2.5">
        {reactions.length > 0 && (
          <>
            <h3 className="font-display font-bold tracking-wide uppercase opacity-70">Usable out of turn</h3>
            {reactions.map(({ a, owner }) => (
              <AbilityCard key={`${owner}-${a.id}`} ability={a} owner={owner} />
            ))}
          </>
        )}
        {actives.length > 0 && (
          <>
            <h3 className="font-display font-bold tracking-wide uppercase opacity-70">On their activation</h3>
            {actives.map(({ a, owner }) => (
              <AbilityCard key={`${owner}-${a.id}`} ability={a} owner={owner} />
            ))}
          </>
        )}
        {kwIds.length > 0 && (
          <>
            <h3 className="font-display font-bold tracking-wide uppercase opacity-70">Keywords in this party</h3>
            <KeywordChips ids={kwIds} />
          </>
        )}
        <h3 className="font-display font-bold tracking-wide uppercase opacity-70">Generic abilities (anyone)</h3>
        {genericAbilities.map((a) => (
          <AbilityCard key={a.id} ability={a} />
        ))}
        <div className="text-xs opacity-70">
          <b>Conditions:</b>{' '}
          {conditions.map((c) => `${c.name} — ${conditionById.get(c.id)?.short}`).join(' · ')}
        </div>
      </div>
    </Sheet>
  )
}
