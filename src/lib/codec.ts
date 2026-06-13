import type { Party, SharedParty } from './types'

const PREFIX = 'MF1.'
/** Sanity bounds so a crafted/corrupt code can't freeze the app. */
const MAX_ENTRIES = 100
const MAX_COUNT = 200

function toBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64)
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function encodeParty(party: Pick<Party, 'name' | 'budget' | 'dataVersion' | 'entries'>): string {
  const payload: SharedParty = {
    v: 1,
    d: party.dataVersion,
    b: party.budget,
    n: party.name,
    e: party.entries.filter((e) => e.count > 0).map((e) => [e.monsterId, e.count]),
  }
  return PREFIX + toBase64Url(JSON.stringify(payload))
}

export class DecodeError extends Error {}

/**
 * Decode a share code. Accepts a bare "MF1.…" code or any text containing
 * one (a full share link, a QR payload pasted with whitespace, etc).
 * Throws DecodeError with a human-readable message on bad input.
 */
export function decodeParty(code: string): SharedParty {
  // pull the code out of whatever was pasted (e.g. https://…/#/import/MF1.xxx)
  const match = code.match(/MF1\.[A-Za-z0-9_-]+/)
  if (!match) {
    throw new DecodeError('Not a Monster Friends party code (should contain "MF1.…").')
  }
  let json: string
  try {
    json = fromBase64Url(match[0].slice(PREFIX.length))
  } catch {
    throw new DecodeError('This party code is damaged and could not be read.')
  }
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    throw new DecodeError('This party code is damaged and could not be read.')
  }
  const p = raw as Partial<SharedParty>
  if (
    p === null ||
    typeof p !== 'object' ||
    p.v !== 1 ||
    typeof p.d !== 'string' ||
    typeof p.b !== 'number' ||
    typeof p.n !== 'string' ||
    !Array.isArray(p.e) ||
    !p.e.every(
      (pair) =>
        Array.isArray(pair) &&
        pair.length === 2 &&
        typeof pair[0] === 'string' &&
        typeof pair[1] === 'number' &&
        Number.isInteger(pair[1]) &&
        pair[1] > 0,
    )
  ) {
    throw new DecodeError('This party code is not in a format this app understands.')
  }
  if (p.e.length > MAX_ENTRIES || p.e.some((pair) => pair[1] > MAX_COUNT)) {
    throw new DecodeError('This party code describes an impossibly large party.')
  }
  // merge duplicate monster ids so downstream lists/uids stay unique
  const merged = new Map<string, number>()
  for (const [id, count] of p.e) {
    merged.set(id, (merged.get(id) ?? 0) + count)
  }
  return { v: 1, d: p.d, b: p.b, n: p.n, e: [...merged.entries()] }
}

/** Build the absolute share URL for a party. */
export function shareUrl(code: string): string {
  const base = `${location.origin}${location.pathname}`
  return `${base}#/import/${code}`
}
