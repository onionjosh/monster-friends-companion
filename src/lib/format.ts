import type { Monster, Ability } from './schemas'
import type { Party } from './types'
import { SIZE_LABELS } from '../data'

export function formatEmi(emi: number): string {
  return `${emi}+`
}

export function formatBonus(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`
}

export function formatMovement(m: number): string {
  return m > 0 ? `${m}"` : '—'
}

export function formatAbilityCost(cost: Ability['cost']): string {
  if (cost.text) return cost.text
  const parts: string[] = []
  if (cost.energy > 0) parts.push(`${cost.energy} Energy`)
  if (cost.act > 0) parts.push(`${cost.act} AcT`)
  return parts.length ? parts.join(' + ') : 'Free'
}

export function attackLine(a: Monster['attacks'][number]): string {
  const bits = [
    a.type === 'ranged' ? `Ranged ${a.range ?? '?'}"` : 'Melee',
    `${a.swings} swing${a.swings === 1 ? '' : 's'}`,
    a.die,
    `Bonus ${formatBonus(a.bonus)}`,
    `Crit ${formatBonus(a.critBonus)}`,
  ]
  return bits.join(' · ')
}

/** Plain-text export, suitable for texting/Discord and event submission. */
export function partyToText(party: Party, monsterById: Map<string, Monster>, totalPoints: number): string {
  const lines: string[] = []
  lines.push(`${party.name} — ${totalPoints}/${party.budget} Party Points (Monster Friends, cards v${party.dataVersion})`)
  lines.push('')
  for (const e of party.entries) {
    const m = monsterById.get(e.monsterId)
    if (!m) {
      lines.push(`${e.count}x [unknown monster: ${e.monsterId}]`)
      continue
    }
    lines.push(`${e.count}x ${m.name} (${SIZE_LABELS[m.size]}, ${m.partyPoints} PP each)`)
    lines.push(
      `   AcT ${m.act} · M ${formatMovement(m.movement)} · EmI ${m.emi}+ · HP ${m.hp} · Def ${m.defense.die} ${formatBonus(m.defense.bonus)}/${formatBonus(m.defense.critBonus)}`,
    )
    for (const a of m.attacks) {
      lines.push(`   ${a.name}: ${attackLine(a)}`)
    }
  }
  if (party.notes) {
    lines.push('')
    lines.push(party.notes)
  }
  return lines.join('\n')
}
