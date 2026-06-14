import { useMemo, useState } from 'react'
import type { Party } from '../lib/types'
import { encodeParty, shareUrl } from '../lib/codec'
import { partyToText } from '../lib/format'
import { checkParty } from '../lib/validation'
import { monsterById, gameData } from '../data'
import { Sheet } from './Sheet'
import { QrCode } from './QrCode'

export function ShareSheet({ party, open, onClose }: { party: Party; open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState<string | null>(null)
  const code = useMemo(() => encodeParty(party), [party])
  const url = useMemo(() => shareUrl(code), [code])
  const { totalPoints } = checkParty(party.entries, party.budget, monsterById, party.dataVersion, gameData.dataVersion)

  async function copy(kind: string, text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(kind)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      setCopied(null)
    }
  }

  const btn =
    'w-full rounded-xl border-2 border-zinc-900 bg-white px-3 py-2.5 text-left font-semibold active:bg-amber-200 dark:border-zinc-100 dark:bg-zinc-900 dark:active:bg-amber-800'

  return (
    <Sheet open={open} onClose={onClose} title={`Share "${party.name || 'Untitled Party'}"`}>
      <div className="grid gap-2">
        <div className="flex justify-center py-2">
          <QrCode value={url} />
        </div>
        <p className="text-center text-xs opacity-70">
          A friend can scan this with their phone camera to open your list.
        </p>
        <button type="button" className={btn} onClick={() => copy('link', url)}>
          🔗 {copied === 'link' ? 'Copied!' : 'Copy share link'}
        </button>
        <button type="button" className={btn} onClick={() => copy('text', partyToText(party, monsterById, totalPoints))}>
          📄 {copied === 'text' ? 'Copied!' : 'Copy as plain text'}
        </button>
        <button type="button" className={btn} onClick={() => copy('code', code)}>
          🎟 {copied === 'code' ? 'Copied!' : 'Copy party code'}
        </button>
      </div>
    </Sheet>
  )
}
