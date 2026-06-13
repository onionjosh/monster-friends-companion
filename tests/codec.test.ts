import { describe, expect, it } from 'vitest'
import { decodeParty, encodeParty, DecodeError } from '../src/lib/codec'

const sample = {
  name: "Josh's Crew",
  budget: 75,
  dataVersion: '1.1',
  entries: [
    { monsterId: 'bucket-troll', count: 2 },
    { monsterId: 'gnorc-pillager', count: 5 },
  ],
}

describe('party share codec', () => {
  it('round-trips a party', () => {
    const decoded = decodeParty(encodeParty(sample))
    expect(decoded).toEqual({
      v: 1,
      d: '1.1',
      b: 75,
      n: "Josh's Crew",
      e: [
        ['bucket-troll', 2],
        ['gnorc-pillager', 5],
      ],
    })
  })

  it('round-trips names with emoji and quotes', () => {
    const decoded = decodeParty(encodeParty({ ...sample, name: '🎉 "Fun" párty' }))
    expect(decoded.n).toBe('🎉 "Fun" párty')
  })

  it('drops zero-count entries', () => {
    const decoded = decodeParty(
      encodeParty({ ...sample, entries: [...sample.entries, { monsterId: 'schnoz', count: 0 }] }),
    )
    expect(decoded.e).toHaveLength(2)
  })

  it('produces URL-safe QR-friendly codes', () => {
    const code = encodeParty(sample)
    expect(code).toMatch(/^MF1\.[A-Za-z0-9_-]+$/)
    expect(code.length).toBeLessThan(400)
  })

  it('extracts the code from a pasted share link', () => {
    const code = encodeParty(sample)
    const link = `https://josh.github.io/monster-friends/#/import/${code}`
    expect(decodeParty(link)).toEqual(decodeParty(code))
  })

  it('merges duplicate monster ids by summing counts', () => {
    const decoded = decodeParty(
      encodeParty({
        ...sample,
        entries: [
          { monsterId: 'gnorc-pillager', count: 2 },
          { monsterId: 'bucket-troll', count: 1 },
          { monsterId: 'gnorc-pillager', count: 3 },
        ],
      }),
    )
    expect(decoded.e).toEqual([
      ['gnorc-pillager', 5],
      ['bucket-troll', 1],
    ])
  })

  it('rejects impossibly large parties', () => {
    expect(() =>
      decodeParty(encodeParty({ ...sample, entries: [{ monsterId: 'gnorc-pillager', count: 1_000_000 }] })),
    ).toThrow(DecodeError)
    const many = Array.from({ length: 150 }, (_, i) => ({ monsterId: `m-${i}`, count: 1 }))
    expect(() => decodeParty(encodeParty({ ...sample, entries: many }))).toThrow(DecodeError)
  })

  it('rejects garbage prefixes', () => {
    expect(() => decodeParty('hello world')).toThrow(DecodeError)
    expect(() => decodeParty('MF2.abcdef')).toThrow(DecodeError)
  })

  it('rejects damaged payloads', () => {
    const code = encodeParty(sample)
    expect(() => decodeParty(code.slice(0, 10))).toThrow(DecodeError)
    expect(() => decodeParty('MF1.!!!not-base64!!!')).toThrow(DecodeError)
  })

  it('rejects structurally wrong payloads', () => {
    const bogus = 'MF1.' + Buffer.from(JSON.stringify({ v: 1, d: '1.1', b: 'x', n: 1, e: 'nope' })).toString('base64url')
    expect(() => decodeParty(bogus)).toThrow(DecodeError)
  })

  it('tolerates surrounding whitespace', () => {
    const code = encodeParty(sample)
    expect(decodeParty(`  ${code}\n`)).toEqual(decodeParty(code))
  })
})
