import type { Monster } from './schemas'
import type { PartyEntry } from './types'

export interface PartyFlag {
  level: 'warn' | 'info'
  message: string
}

export interface PartyCheck {
  totalPoints: number
  modelCount: number
  flags: PartyFlag[]
}

/**
 * Validation flags problems with plain-language reasons but never blocks
 * saving — players are free to experiment.
 */
export function checkParty(
  entries: PartyEntry[],
  budget: number,
  monsterById: Map<string, Monster>,
  dataVersion?: string,
  currentDataVersion?: string,
): PartyCheck {
  const flags: PartyFlag[] = []
  let totalPoints = 0
  let modelCount = 0

  for (const e of entries) {
    const m = monsterById.get(e.monsterId)
    if (!m) {
      flags.push({
        level: 'warn',
        message: `Unknown monster "${e.monsterId}" — the game data may have changed since this party was made.`,
      })
      continue
    }
    totalPoints += m.partyPoints * e.count
    modelCount += e.count
  }

  if (totalPoints > budget) {
    flags.push({
      level: 'warn',
      message: `${totalPoints - budget} Party Points over the agreed ${budget}-point budget.`,
    })
  }
  if (modelCount === 0) {
    flags.push({ level: 'info', message: 'This party has no monsters yet.' })
  }
  if (dataVersion && currentDataVersion && dataVersion !== currentDataVersion) {
    flags.push({
      level: 'info',
      message: `Built with cards v${dataVersion}; current data is v${currentDataVersion}. Point costs may have changed.`,
    })
  }

  return { totalPoints, modelCount, flags }
}
