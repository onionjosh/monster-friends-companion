import type { Monster, Attack, Ability } from '../lib/schemas'
import { SIZE_LABELS } from '../data'
import { formatBonus, formatAbilityCost, formatMovement } from '../lib/format'
import { RichText } from '../lib/markup'
import { useUiStore } from '../stores/ui'
import { keywordById } from '../data'

export function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center rounded-xl border-2 border-zinc-900 bg-white px-2 py-1.5 dark:border-zinc-100 dark:bg-zinc-900">
      <span className="text-[10px] font-bold tracking-wider uppercase opacity-70">{label}</span>
      <span className="font-display text-lg leading-tight font-bold">{value}</span>
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
    <div className="flex items-center gap-3 rounded-xl border-2 border-zinc-900 bg-white px-3 py-2 dark:border-zinc-100 dark:bg-zinc-900">
      <span className="text-xl">🛡</span>
      <div>
        <div className="text-[10px] font-bold tracking-wider uppercase opacity-70">Defense Dice</div>
        <div className="font-display font-bold">
          {d.die} · Bonus {formatBonus(d.bonus)} · Crit {formatBonus(d.critBonus)}
        </div>
      </div>
    </div>
  )
}

export function AttackCard({ attack }: { attack: Attack }) {
  return (
    <div className="rounded-xl border-2 border-zinc-900 bg-white p-3 dark:border-zinc-100 dark:bg-zinc-900">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-display font-bold">
          {attack.type === 'ranged' ? '🏹' : '⚔️'} {attack.name}
        </span>
        <span className="text-xs font-semibold uppercase opacity-70">
          {attack.type === 'ranged' ? `Ranged ${attack.range ?? '?'}"` : 'Melee'}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm">
        <span>
          <b>{attack.swings}</b> swing{attack.swings === 1 ? '' : 's'}
        </span>
        <span>
          Attack Dice <b>{attack.die}</b>
        </span>
        <span>
          Bonus <b>{formatBonus(attack.bonus)}</b>
        </span>
        <span>
          Crit <b>{formatBonus(attack.critBonus)}</b>
        </span>
      </div>
      {attack.tags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {attack.tags.map((t) => (
            <AttackTagChip key={t.tag} tag={t.tag} value={t.value} />
          ))}
        </div>
      )}
      {attack.notes && <p className="mt-1 text-sm opacity-80">{attack.notes}</p>}
    </div>
  )
}

function AttackTagChip({ tag, value }: { tag: string; value?: number }) {
  const openKeyword = useUiStore((s) => s.openKeyword)
  const kw = keywordById.get(tag)
  const label = `${kw?.name ?? tag}${value !== undefined ? ` (${value}")` : ''}`
  return (
    <button
      type="button"
      onClick={() => kw && openKeyword(tag)}
      className="rounded-full border border-amber-600 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400"
    >
      {label}
    </button>
  )
}

export function AbilityCard({ ability, owner }: { ability: Ability; owner?: string }) {
  return (
    <div className="rounded-xl border-2 border-zinc-900 bg-white p-3 dark:border-zinc-100 dark:bg-zinc-900">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-display font-bold">★ {ability.name}</span>
        <span className="shrink-0 rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
          {formatAbilityCost(ability.cost)}
        </span>
      </div>
      {ability.reaction && (
        <div className="mt-1 text-xs font-semibold tracking-wide text-amber-700 uppercase dark:text-amber-400">
          Usable outside this monster's activation
        </div>
      )}
      <div className="mt-1 text-sm">
        <RichText text={ability.text} />
      </div>
      {owner && <div className="mt-1 text-xs opacity-60">{owner}</div>}
    </div>
  )
}

export function KeywordChips({ ids }: { ids: string[] }) {
  const openKeyword = useUiStore((s) => s.openKeyword)
  if (ids.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {ids.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => openKeyword(id)}
          className="rounded-full border-2 border-zinc-900 bg-amber-300 px-2.5 py-0.5 text-xs font-bold dark:border-amber-300 dark:bg-amber-700"
        >
          {keywordById.get(id)?.name ?? id}
        </button>
      ))}
    </div>
  )
}

export function SizeBadge({ size }: { size: Monster['size'] }) {
  return (
    <span className="rounded-md border border-zinc-400 px-1.5 py-0.5 text-xs font-bold uppercase" title={SIZE_LABELS[size]}>
      {size}
    </span>
  )
}
