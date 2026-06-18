import type { ReactNode } from 'react'
import type { Monster } from '../lib/schemas'
import { BASE_SIZES } from '../data'
import { StatRow, DefenseLine, AttackCard, AbilityCard, KeywordChips, SizeBadge, SectionHead } from './StatBlock'
import { Icon } from './Icon'

/**
 * The full monster "card" body — shared by the Monsters detail page and the
 * in-game card sheet so they look identical. `action` slots into the top-right
 * (e.g. a favourite toggle) above the Party Points tag.
 */
export function MonsterCard({ monster, action }: { monster: Monster; action?: ReactNode }) {
  return (
    <div className="grid gap-3">
      <div className="flex items-start justify-between gap-2.5">
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', color: 'var(--punk-red)', lineHeight: 1 }}>{monster.name}</h1>
          <div className="mt-1.5 flex items-center gap-2" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
            <SizeBadge size={monster.size} /> {BASE_SIZES[monster.size]} base
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {action}
          <span
            className="inline-flex flex-col items-center"
            style={{
              clipPath: 'var(--clip-callout)',
              background: 'var(--primary)',
              color: 'var(--on-primary)',
              padding: '8px 18px',
              filter: 'drop-shadow(3px 3px 0 var(--shadow-ink))',
              transform: 'rotate(-2deg)',
            }}
          >
            <b style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-2xl)', lineHeight: 1 }}>{monster.partyPoints}</b>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em' }}>PARTY PTS</span>
          </span>
        </div>
      </div>

      {monster.image && (
        <div
          style={{
            clipPath: 'var(--clip-torn-photo)',
            filter: 'drop-shadow(4px 4px 0 var(--shadow-ink))',
            aspectRatio: '4 / 3',
            background: 'var(--surface)',
          }}
        >
          <img
            src={`${import.meta.env.BASE_URL}monsters/${monster.image}`}
            alt={`${monster.name} miniature`}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      <StatRow monster={monster} />
      <DefenseLine monster={monster} />
      {monster.keywords.length > 0 && <KeywordChips ids={monster.keywords} />}

      {monster.attacks.length > 0 && (
        <>
          <SectionHead icon="swords">Basic Attacks</SectionHead>
          {monster.attacks.map((a) => (
            <AttackCard key={a.name} attack={a} />
          ))}
        </>
      )}

      {monster.abilities.length > 0 && (
        <>
          <SectionHead icon="star">Special Abilities</SectionHead>
          {monster.abilities.map((a) => (
            <AbilityCard key={a.id} ability={a} />
          ))}
        </>
      )}

      {monster.flavor && (
        <p className="mt-1" style={{ fontFamily: 'var(--font-marker)', fontSize: 'var(--text-lg)', color: 'var(--text-muted)' }}>
          {monster.flavor}
        </p>
      )}

      {monster.unverified.length > 0 && (
        <div
          className="mt-1 rounded-xl p-3"
          style={{ border: '1px dashed var(--border-soft)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}
        >
          <b>Needs verification against source data:</b>
          <ul className="mt-1 list-disc pl-4">
            {monster.unverified.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/** The favourite toggle used as the MonsterCard `action` slot. */
export function FavoriteStar({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-label="toggle favorite"
      onClick={onToggle}
      style={{ background: 'none', border: 0, padding: 2, color: on ? 'var(--primary)' : 'var(--text-muted)', opacity: on ? 1 : 0.5 }}
    >
      <Icon name="star" size={26} style={on ? { fill: 'var(--primary)' } : undefined} />
    </button>
  )
}
