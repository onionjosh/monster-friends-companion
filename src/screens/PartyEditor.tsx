import { useState } from 'react'
import { Link, useLocation, useRoute } from 'wouter'
import { monsters, monsterById, gameData } from '../data'
import { usePartiesStore } from '../stores/parties'
import { checkParty } from '../lib/validation'
import { Sheet } from '../components/Sheet'
import { ShareSheet } from '../components/ShareSheet'
import { SizeBadge } from '../components/StatBlock'
import { Stepper } from '../components/Stepper'
import { Icon } from '../components/Icon'
import { TornButton } from '../components/Torn'

export function PartyEditor() {
  const [, params] = useRoute('/parties/:id')
  const [, navigate] = useLocation()
  const party = usePartiesStore((s) => (params ? s.parties[params.id] : undefined))
  const updateParty = usePartiesStore((s) => s.updateParty)
  const setEntryCount = usePartiesStore((s) => s.setEntryCount)
  const deleteParty = usePartiesStore((s) => s.deleteParty)
  const [adding, setAdding] = useState(false)
  const [sharing, setSharing] = useState(false)

  if (!party) {
    return (
      <div className="mx-auto max-w-lg p-4">
        <p className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>
          This party doesn't exist (anymore).
        </p>
        <Link href="/parties" className="block text-center font-semibold underline" style={{ color: 'var(--accent-text)' }}>
          ← My parties
        </Link>
      </div>
    )
  }

  const check = checkParty(party.entries, party.budget, monsterById, party.dataVersion, gameData.dataVersion)
  const over = check.totalPoints > party.budget

  return (
    <div className="mx-auto max-w-lg p-4 pb-32">
      <div className="grid gap-3">
        <Link
          href="/parties"
          className="flex items-center gap-1"
          style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)' }}
        >
          <Icon name="chevronLeft" size={18} /> MY PARTIES
        </Link>

        <input
          value={party.name}
          onChange={(e) => updateParty(party.id, { name: e.target.value })}
          aria-label="party name"
          className="mf-input"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)', padding: '12px 14px' }}
        />

        <div className="flex items-center gap-2.5">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
            Budget
          </span>
          {[50, 75, 100].map((b, i) => (
            <button
              key={b}
              type="button"
              className="mf-press"
              onClick={() => updateParty(party.id, { budget: b })}
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 'var(--text-base)',
                cursor: 'pointer',
                border: 0,
                padding: '8px 16px',
                clipPath: `var(--clip-torn-${(i % 3) + 1})`,
                transform: `rotate(${i % 2 ? 1.5 : -1.5}deg)`,
                background: party.budget === b ? 'var(--primary)' : 'var(--surface-sunk)',
                color: party.budget === b ? 'var(--on-primary)' : 'var(--text-muted)',
                filter: party.budget === b ? 'drop-shadow(2px 2px 0 var(--shadow-ink))' : 'none',
              }}
            >
              {b}
            </button>
          ))}
          <BudgetInput key={party.budget} value={party.budget} onCommit={(b) => updateParty(party.id, { budget: b })} />
        </div>

        {party.entries.map((e, i) => {
          const m = monsterById.get(e.monsterId)
          return (
            <div
              key={e.monsterId}
              className={`mf-torn-card ${['', 'mf-torn-card--2', 'mf-torn-card--3'][i % 3]} flex items-center gap-2.5 p-3`}
            >
              <div className="min-w-0 flex-1">
                {m ? (
                  <Link href={`/monsters/${m.id}`} className="flex items-center gap-2">
                    <span className="truncate" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)' }}>
                      {m.name}
                    </span>
                    <SizeBadge size={m.size} />
                  </Link>
                ) : (
                  <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Unknown: {e.monsterId}</span>
                )}
                <div className="mt-0.5" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                  {m ? `${m.partyPoints} PP each · ${m.partyPoints * e.count} total` : ''}
                </div>
              </div>
              <Stepper value={e.count} onChange={(n) => setEntryCount(party.id, e.monsterId, n)} />
            </div>
          )
        })}
        {party.entries.length === 0 && (
          <p className="py-6 text-center" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            No monsters yet — invite some friends to the party!
          </p>
        )}

        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mf-torn-card mf-torn-card--2 flex w-full items-center justify-center gap-1.5 p-4"
          style={{ background: 'var(--surface-sunk)', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 700 }}
        >
          <Icon name="plus" size={20} /> Add a monster
        </button>

        {check.flags.length > 0 && (
          <div className="grid gap-1.5">
            {check.flags.map((f, i) => (
              <div
                key={i}
                className="rounded-lg px-3 py-1.5"
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  background: f.level === 'warn' ? 'var(--warning)' : 'var(--surface-sunk)',
                  color: f.level === 'warn' ? '#fff' : 'var(--text)',
                }}
              >
                {f.message}
              </div>
            ))}
          </div>
        )}

        <div className="mt-1 flex flex-wrap justify-center gap-3">
          <TornButton variant="cream" size="sm" leftIcon="share" cut={1} tilt="sm" onClick={() => setSharing(true)}>
            Share
          </TornButton>
          <TornButton variant="cream" size="sm" leftIcon="printer" cut={2} tilt="rev" onClick={() => navigate(`/parties/${party.id}/print`)}>
            Print
          </TornButton>
          <TornButton
            variant="red"
            size="sm"
            leftIcon="skull"
            cut={3}
            tilt="sm"
            onClick={() => {
              if (confirm(`Delete "${party.name}"? This can't be undone.`)) {
                navigate('/parties')
                deleteParty(party.id)
              }
            }}
          >
            Delete
          </TornButton>
        </div>
      </div>

      {/* sticky torn total banner */}
      <div className="no-print fixed right-0 bottom-16 left-0 z-30 mx-auto flex justify-center px-4" style={{ maxWidth: 'var(--content-max)' }}>
        <div
          className="flex items-center gap-1.5"
          style={{
            clipPath: 'var(--clip-callout)',
            padding: '14px 28px',
            textAlign: 'center',
            transform: 'rotate(-1deg)',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 'var(--text-lg)',
            background: over ? 'var(--punk-red)' : 'var(--primary)',
            color: over ? '#fff' : 'var(--on-primary)',
            filter: 'drop-shadow(3px 3px 0 var(--shadow-ink))',
          }}
        >
          {over && <Icon name="zap" size={18} />}
          {check.totalPoints} / {party.budget} PP · {check.modelCount} monster{check.modelCount === 1 ? '' : 's'}
        </div>
      </div>

      <AddMonsterSheet
        open={adding}
        onClose={() => setAdding(false)}
        total={check.totalPoints}
        budget={party.budget}
        modelCount={check.modelCount}
        over={over}
        countOf={(id) => party.entries.find((e) => e.monsterId === id)?.count ?? 0}
        onSet={(id, n) => setEntryCount(party.id, id, n)}
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
      className="mf-input"
      style={{ width: 72, padding: '8px 10px' }}
    />
  )
}

function AddMonsterSheet({
  open,
  onClose,
  total,
  budget,
  modelCount,
  over,
  countOf,
  onSet,
}: {
  open: boolean
  onClose: () => void
  total: number
  budget: number
  modelCount: number
  over: boolean
  countOf: (id: string) => number
  onSet: (id: string, count: number) => void
}) {
  const [q, setQ] = useState('')
  const list = monsters.filter((m) => m.name.toLowerCase().includes(q.toLowerCase()))
  return (
    <Sheet open={open} onClose={onClose}>
      <div
        className="sticky top-0 z-10 -mx-4 px-4 pb-2.5"
        style={{ borderBottom: '1px solid var(--border-soft)', background: 'var(--surface)' }}
      >
        <h2 className="mb-1.5" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-lg)' }}>
          Add monsters
        </h2>
        <div
          className="px-3 py-2 text-center"
          style={{ fontWeight: 800, clipPath: 'var(--clip-torn-2)', background: over ? 'var(--warning)' : 'var(--surface-sunk)', color: over ? '#fff' : 'var(--text)' }}
        >
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)' }}>
            {total} / {budget}
          </span>{' '}
          Party Points · {modelCount} monster{modelCount === 1 ? '' : 's'}
          {over && ' · over budget'}
        </div>
      </div>

      {/* dark panel so the surface cards stand out, like the Monsters browser */}
      <div className="-mx-4 px-4 pt-2.5 pb-2" style={{ background: 'var(--bg)' }}>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          className="mf-input mb-3"
        />
        <div className="grid gap-3">
          {list.map((m) => {
            const count = countOf(m.id)
            const ranged = m.attacks.some((a) => a.type === 'ranged')
            return (
              <div key={m.id} className="mf-torn-card mf-torn-card--row flex items-stretch overflow-hidden">
                <div
                  className="relative shrink-0 self-stretch"
                  style={{ width: 64, background: 'var(--surface-sunk)', clipPath: 'var(--clip-torn-photo)' }}
                >
                  {m.image ? (
                    <img
                      src={`${import.meta.env.BASE_URL}monsters/${m.image}`}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                      <Icon name="ghost" size={26} />
                    </span>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--text)', lineHeight: 1.2 }}>
                      {m.name} <SizeBadge size={m.size} />
                    </div>
                    <div className="mt-1 flex items-center gap-2" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                      <span>
                        <b style={{ color: 'var(--text)' }}>{m.hp}</b> HP
                      </span>
                      <span>·</span>
                      <span>
                        <b style={{ color: 'var(--text)' }}>{m.act}</b> AcT
                      </span>
                      <span>·</span>
                      <Icon name={ranged ? 'bow' : 'sword'} size={12} />
                    </div>
                    {count > 0 && (
                      <div className="mt-0.5" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-text)' }}>
                        {count} in party
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span
                      className="inline-flex items-center gap-1"
                      style={{
                        clipPath: 'var(--clip-tag)',
                        background: 'var(--primary)',
                        color: 'var(--on-primary)',
                        padding: '5px 11px',
                        filter: 'drop-shadow(2px 2px 0 var(--shadow-ink))',
                        transform: 'rotate(2deg)',
                      }}
                    >
                      <b style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-base)' }}>{m.partyPoints}</b>
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em' }}>PP</span>
                    </span>
                    <Stepper value={count} onChange={(n) => onSet(m.id, n)} />
                  </div>
                </div>
              </div>
            )
          })}
          {list.length === 0 && (
            <p className="py-6 text-center" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              No monsters match.
            </p>
          )}
        </div>
      </div>
    </Sheet>
  )
}
