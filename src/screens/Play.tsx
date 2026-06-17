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
import { Icon } from '../components/Icon'
import { TornButton } from '../components/Torn'

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

  const pick = (active: boolean) => `mf-torn-card w-full p-3 text-left font-semibold${active ? ' mf-pick--on' : ''}`

  return (
    <div className="mx-auto max-w-lg p-4">
      <h1 className="mb-1" style={{ fontSize: 'var(--text-2xl)' }}>
        Game Night
      </h1>
      <p className="mb-4" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
        Track HP, Action Tokens, Energy and conditions at the table.
      </p>

      <h2 className="mb-1.5" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
        Your party
      </h2>
      <div className="mb-4 grid gap-1.5">
        {list.map((p) => (
          <button key={p.id} type="button" className={pick(mineId === p.id)} onClick={() => setMineId(p.id)}>
            {p.name}
          </button>
        ))}
        {list.length === 0 && (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            No saved parties yet —{' '}
            <Link href="/builder" className="font-semibold underline" style={{ color: 'var(--accent-text)' }}>
              build one first
            </Link>
            .
          </p>
        )}
      </div>

      <h2 className="mb-1.5" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
        Opponent's party
      </h2>
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
        className="mf-input mb-1"
      />
      {opp.error && (
        <p className="mb-2" style={{ fontSize: 'var(--text-sm)', color: 'var(--warning-text)' }}>
          {opp.error}
        </p>
      )}
      {oppFromCode && (
        <p className="mb-2 font-medium" style={{ fontSize: 'var(--text-sm)' }}>
          ✓ {oppFromCode.n || 'Opponent'} — {oppFromCode.e.reduce((n, [, c]) => n + c, 0)} monsters
        </p>
      )}

      <h2 className="mt-3 mb-1.5" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
        Scenario
      </h2>
      <div className="mb-5 grid gap-1.5">
        {scenarios.map((s) => (
          <button key={s.id} type="button" className={pick(scenarioId === s.id)} onClick={() => setScenarioId(s.id)}>
            {s.name}
            <span className="block" style={{ fontWeight: 400, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {s.winCondition}
            </span>
          </button>
        ))}
      </div>

      <div className="flex justify-center">
        <TornButton variant="gold" cut={1} tilt="sm" leftIcon="dice" disabled={!canStart} onClick={start} style={!canStart ? { opacity: 0.4 } : undefined}>
          Start the Battle!
        </TornButton>
      </div>
    </div>
  )
}

/* ---------------- Tracker ---------------- */

function Tracker() {
  const game = usePlayStore((s) => s.game)!
  const endGame = usePlayStore((s) => s.endGame)
  const newGame = usePlayStore((s) => s.newGame)
  const setEnergy = usePlayStore((s) => s.setEnergy)
  const [side, setSide] = useState<Side>('mine')
  const [cardUnit, setCardUnit] = useState<UnitState | null>(null)
  const [rulesOpen, setRulesOpen] = useState(false)

  const scenario = game.scenarioId ? scenarioById.get(game.scenarioId) : undefined
  const cur = game[side]
  const winner = sideDefeated(game.mine) ? game.theirs.name : sideDefeated(game.theirs) ? game.mine.name : null

  return (
    <div className="mx-auto max-w-lg p-4 pb-24">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 800 }}>{scenario?.name ?? 'Battle'}</div>
          {scenario && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
              {scenario.winCondition}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <TornButton
            variant="gold"
            size="sm"
            cut={1}
            tilt="sm"
            onClick={() => {
              if (confirm('Start a new game? This resets all HP, Action Tokens, Energy, conditions and KOs.')) newGame()
            }}
          >
            New Game
          </TornButton>
          <button
            type="button"
            onClick={() => {
              if (confirm('End this game? The tracker state will be cleared.')) endGame()
            }}
            className="mf-btn px-2.5 py-1.5"
            style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}
          >
            End
          </button>
        </div>
      </div>

      {winner && (
        <div
          className="mb-3 flex items-center justify-center gap-2 rounded-xl p-3 text-center"
          style={{ background: 'var(--primary)', color: 'var(--on-primary)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-lg)', border: '2px solid var(--border)' }}
        >
          <Icon name="trophy" size={22} /> {winner} wins!
        </div>
      )}

      {/* side switcher */}
      <div className="mf-card mb-2 grid grid-cols-2 overflow-hidden p-0">
        {(['mine', 'theirs'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSide(s)}
            className="mf-press truncate px-2 py-2 font-bold"
            style={side === s ? { background: 'var(--text)', color: 'var(--text-inverse)' } : { background: 'transparent', color: 'var(--text)' }}
          >
            {game[s].name}
          </button>
        ))}
      </div>

      {/* energy + party rules */}
      <div className="mf-card mb-3 flex items-center justify-between p-3">
        <Stepper big label="⚡ Energy" value={cur.energy} min={0} max={MAX_ENERGY} onChange={(v) => setEnergy(side, v)} />
        <button type="button" onClick={() => setRulesOpen(true)} className="mf-btn px-2.5 py-1.5" style={{ fontSize: 'var(--text-sm)' }}>
          <Icon name="book" size={16} /> Party rules
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

  return (
    <div className="mf-card p-3" style={unit.dead ? { opacity: 0.55 } : undefined}>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onShowCard}
          className="truncate text-left"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)' }}
        >
          {unit.label}
        </button>
        <button
          type="button"
          onClick={() => toggleDead(side, unit.uid)}
          className="mf-btn px-2 py-1"
          style={
            unit.dead
              ? { background: 'var(--punk-red)', color: '#fff', fontSize: 'var(--text-sm)' }
              : { color: 'var(--punk-red)', fontSize: 'var(--text-sm)' }
          }
        >
          <Icon name="skull" size={16} />
          {unit.dead ? "KO'd" : ''}
        </button>
      </div>

      {!unit.dead && (
        <>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <Stepper big label="HP" value={unit.hp} min={0} onChange={(v) => adjustHp(side, unit.uid, v - unit.hp)} />
            <Stepper label="AcT" value={unit.act} min={0} onChange={(v) => adjustAct(side, unit.uid, v - unit.act)} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {conditions.map((c) => (
              <button
                key={c.id}
                type="button"
                title={c.short}
                onClick={() => toggleCondition(side, unit.uid, c.id)}
                className="mf-chip mf-chip--condition"
                data-active={unit.conditions.includes(c.id)}
              >
                {c.name}
              </button>
            ))}
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
          {m.image && (
            <div style={{ clipPath: 'var(--clip-torn-photo)', aspectRatio: '4 / 3', background: 'var(--surface)', filter: 'drop-shadow(3px 3px 0 var(--shadow-ink))' }}>
              <img
                src={`${import.meta.env.BASE_URL}monsters/${m.image}`}
                alt={m.name}
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          )}
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

  const head = (t: string) => (
    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
      {t}
    </h3>
  )

  return (
    <Sheet open={open} onClose={onClose} title={`${game[side].name} — all rules`}>
      <div className="grid gap-2.5">
        {reactions.length > 0 && (
          <>
            {head('Usable out of turn')}
            {reactions.map(({ a, owner }) => (
              <AbilityCard key={`${owner}-${a.id}`} ability={a} owner={owner} />
            ))}
          </>
        )}
        {actives.length > 0 && (
          <>
            {head('On their activation')}
            {actives.map(({ a, owner }) => (
              <AbilityCard key={`${owner}-${a.id}`} ability={a} owner={owner} />
            ))}
          </>
        )}
        {kwIds.length > 0 && (
          <>
            {head('Keywords in this party')}
            <KeywordChips ids={kwIds} />
          </>
        )}
        {head('Generic abilities (anyone)')}
        {genericAbilities.map((a) => (
          <AbilityCard key={a.id} ability={a} />
        ))}
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          <b>Conditions:</b> {conditions.map((c) => `${c.name} — ${conditionById.get(c.id)?.short}`).join(' · ')}
        </div>
      </div>
    </Sheet>
  )
}
