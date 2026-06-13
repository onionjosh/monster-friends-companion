import { Link, useRoute } from 'wouter'
import { usePartiesStore } from '../stores/parties'
import { monsterById, gameData, SIZE_LABELS } from '../data'
import { checkParty } from '../lib/validation'
import { encodeParty, shareUrl } from '../lib/codec'
import { formatBonus, formatAbilityCost } from '../lib/format'
import { QrCode } from '../components/QrCode'
import { keywordById, ruleSectionById } from '../data'

/** Flatten [[kw:]]/[[rule:]] links and bold markers to plain text for print. */
function stripMarkup(text: string): string {
  return text
    .replace(/\[\[(kw|rule):([a-z0-9-]+)(?:\|([^\]]*))?\]\]/g, (_, type, id, label) => {
      if (label) return label
      return type === 'kw' ? (keywordById.get(id)?.name ?? id) : (ruleSectionById.get(id)?.title ?? id)
    })
    .replace(/\*\*/g, '')
}

/** Print-friendly one-page roster with full profiles and a share QR. */
export function PrintRoster() {
  const [, params] = useRoute('/parties/:id/print')
  const party = usePartiesStore((s) => (params ? s.parties[params.id] : undefined))

  if (!party) {
    return (
      <div className="p-4 text-center">
        Party not found. <Link href="/parties">← back</Link>
      </div>
    )
  }

  const check = checkParty(party.entries, party.budget, monsterById, party.dataVersion, gameData.dataVersion)
  const code = encodeParty(party)

  return (
    <div className="mx-auto max-w-3xl bg-white p-6 text-black">
      <div className="no-print mb-4 flex items-center justify-between rounded-xl bg-zinc-100 p-3">
        <Link href={`/parties/${party.id}`} className="font-medium underline">
          ← Back to editor
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg border-2 border-zinc-900 bg-amber-300 px-4 py-1.5 font-bold"
        >
          🖨 Print
        </button>
      </div>

      <header className="mb-4 flex items-start justify-between gap-4 border-b-4 border-black pb-3">
        <div>
          <h1 className="text-2xl font-black">{party.name}</h1>
          <p className="text-sm">
            Monster Friends: Battle for New Florida · {check.totalPoints}/{party.budget} Party Points ·{' '}
            {check.modelCount} monsters · cards v{party.dataVersion}
          </p>
        </div>
        <QrCode value={shareUrl(code)} size={90} />
      </header>

      <div className="grid gap-3">
        {party.entries.map((e) => {
          const m = monsterById.get(e.monsterId)
          if (!m) {
            return (
              <div key={e.monsterId} className="rounded border-2 border-dashed border-zinc-400 p-2 text-sm">
                {e.count}x unknown monster ({e.monsterId})
              </div>
            )
          }
          return (
            <section key={e.monsterId} className="break-inside-avoid rounded-xl border-2 border-black p-3">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-black">
                  {e.count}x {m.name}
                </h2>
                <span className="text-sm font-bold">
                  {SIZE_LABELS[m.size]} · {m.partyPoints} PP each
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold">
                AcT {m.act} · Move {m.movement > 0 ? `${m.movement}"` : '—'} · EmI {m.emi}+ · HP {m.hp} · Defense {m.defense.die}{' '}
                {formatBonus(m.defense.bonus)} (Crit {formatBonus(m.defense.critBonus)})
                {m.keywords.length > 0 && ` · ${m.keywords.join(', ')}`}
              </p>
              {m.attacks.map((a) => (
                <p key={a.name} className="mt-1 text-sm">
                  <b>{a.name}</b> ({a.type === 'ranged' ? `Ranged ${a.range}"` : 'Melee'}): {a.swings} swing
                  {a.swings === 1 ? '' : 's'}, {a.die}, Bonus {formatBonus(a.bonus)}, Crit {formatBonus(a.critBonus)}
                  {a.tags.length > 0 && ` — ${a.tags.map((t) => `${t.tag}${t.value !== undefined ? ` (${t.value}")` : ''}`).join(', ')}`}
                </p>
              ))}
              {m.abilities.map((a) => (
                <p key={a.id} className="mt-1 text-sm">
                  <b>★ {a.name}</b> [{formatAbilityCost(a.cost)}
                  {a.reaction ? ', out-of-turn' : ''}]: {stripMarkup(a.text)}
                </p>
              ))}
            </section>
          )
        })}
      </div>

      <footer className="mt-4 text-center text-xs">
        Built with the Monster Friends Companion · scan the QR to import this list
      </footer>
    </div>
  )
}
