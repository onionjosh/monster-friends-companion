/** A monster entry in a saved party. */
export interface PartyEntry {
  monsterId: string
  count: number
}

export interface Party {
  id: string
  name: string
  budget: number
  /** Game data version the party was built against. */
  dataVersion: string
  entries: PartyEntry[]
  notes?: string
  createdAt: number
  updatedAt: number
}

/** One model on the table during a game. */
export interface UnitState {
  uid: string
  monsterId: string
  /** e.g. "Gnorc Pillager #2" */
  label: string
  hp: number
  act: number
  conditions: string[]
  dead: boolean
}

export interface SideState {
  name: string
  energy: number
  units: UnitState[]
}

export interface GameState {
  startedAt: number
  round: number
  scenarioId: string | null
  mine: SideState
  theirs: SideState
}

/** Payload carried by share links / QR codes. */
export interface SharedParty {
  v: 1
  /** dataVersion at time of sharing */
  d: string
  /** budget */
  b: number
  /** name */
  n: string
  /** entries as [monsterId, count] pairs */
  e: [string, number][]
}
