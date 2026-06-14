import type { Monster, Attack, Ability } from '../lib/schemas'
import { SIZE_LABELS, keywordById } from '../data'
import { formatBonus, formatAbilityCost, formatMovement } from '../lib/format'
import { RichText } from '../lib/markup'
import { useUiStore } from '../stores/ui'
import { Icon } from './Icon'

export function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="mf-statpill">
      <span className="mf-statpill__label">{label}</span>
      <span className="mf-statpill__value">{value}</span>
    </div>
  )
}

export function StatRow({ monster }: { monster: Monster }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <StatPill label="AcT" value={monster.act} />
      <StatPill label="Move" value={formatMovement(monster.movement)} />
      <StatPill label="EmI" value={`${monster.emi}+`} />
      <StatPill label="HP" value={monster.hp} />
    </div>
  )
}

export function DefenseLine({ monster }: { monster: Monster }) {
  const d = monster.defense
  return (
    <div className="mf-statpill mf-statpill--row">
      <Icon name="shield" size={22} style={{ color: 'var(--info-text)' }} />
      <div>
        <div className="mf-statpill__label">Defense</div>
        <div className="mf-statpill__value">
          {d.die} · Bonus {formatBonus(d.bonus)} · Crit {formatBonus(d.critBonus)}
        </div>
      </div>
    </div>
  )
}

function AttackTagChip({ tag, value }: { tag: string; value?: number }) {
  const openKeyword = useUiStore((s) => s.openKeyword)
  const kw = keywordById.get(tag)
  const label = `${kw?.name ?? tag}${value !== undefined ? ` (${value}")` : ''}`
  return (
    <button type="button" onClick={() => kw && openKeyword(tag)} className="mf-chip mf-chip--keyword">
      {label}
    </button>
  )
}

export function AttackCard({ attack }: { attack: Attack }) {
  return (
    <div className="mf-card p-3">
      <div className="flex items-center justify-between gap-2">
        <span
          className="flex items-center gap-2"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)' }}
        >
          <Icon name={attack.type === 'ranged' ? 'bow' : 'sword'} size={20} style={{ color: 'var(--punk-red)' }} />
          {attack.name}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--text-muted)',
          }}
        >
          {attack.type === 'ranged' ? `Ranged ${attack.range ?? '?'}"` : 'Melee'}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1" style={{ fontSize: 'var(--text-sm)' }}>
        <span>
          {attack.swings} swing{attack.swings === 1 ? '' : 's'}
        </span>
        <span>
          Dice <b>{attack.die}</b>
        </span>
        <span>
          Bonus <b>{formatBonus(attack.bonus)}</b>
        </span>
        <span>
          Crit <b>{formatBonus(attack.critBonus)}</b>
        </span>
      </div>
      {attack.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {attack.tags.map((t) => (
            <AttackTagChip key={t.tag} tag={t.tag} value={t.value} />
          ))}
        </div>
      )}
    </div>
  )
}

export function AbilityCard({ ability, owner }: { ability: Ability; owner?: string }) {
  return (
    <div className="mf-card p-3">
      <div className="flex items-center justify-between gap-2">
        <span
          className="flex items-center gap-2"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)' }}
        >
          <Icon name="star" size={18} style={{ color: 'var(--primary)', fill: 'var(--primary)' }} />
          {ability.name}
        </span>
        <span className="mf-badge mf-badge--solid shrink-0">{formatAbilityCost(ability.cost)}</span>
      </div>
      {ability.reaction && (
        <div
          className="mt-1.5"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--punk-red)',
          }}
        >
          Usable out of turn
        </div>
      )}
      <div className="mt-1.5" style={{ fontSize: 'var(--text-sm)' }}>
        <RichText text={ability.text} />
      </div>
      {owner && (
        <div className="mt-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          {owner}
        </div>
      )}
    </div>
  )
}

export function KeywordChips({ ids }: { ids: string[] }) {
  const openKeyword = useUiStore((s) => s.openKeyword)
  if (ids.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {ids.map((id) => (
        <button key={id} type="button" onClick={() => openKeyword(id)} className="mf-chip mf-chip--keyword">
          {keywordById.get(id)?.name ?? id}
        </button>
      ))}
    </div>
  )
}

export function SizeBadge({ size }: { size: Monster['size'] }) {
  return (
    <span className="mf-badge mf-badge--outline" title={SIZE_LABELS[size]}>
      {size}
    </span>
  )
}

/** Section header: torn red icon bump + caps label (Basic Attacks / Special Abilities). */
export function SectionHead({ icon, children }: { icon: 'swords' | 'star' | 'book' | 'dice'; children: React.ReactNode }) {
  return (
    <div className="mf-section">
      <span className="mf-section__ico">
        <Icon name={icon} size={15} />
      </span>
      <h2>{children}</h2>
    </div>
  )
}
