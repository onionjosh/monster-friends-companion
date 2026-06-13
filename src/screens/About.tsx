import { useRef, useState } from 'react'
import { z } from 'zod'
import { gameData, monsters } from '../data'
import { usePartiesStore } from '../stores/parties'
import { useFavoritesStore } from '../stores/favorites'

const BackupPartySchema = z.object({
  name: z.string(),
  budget: z.number().int().positive(),
  entries: z.array(z.object({ monsterId: z.string(), count: z.number().int().positive() })),
  notes: z.string().optional(),
  dataVersion: z.string().optional(),
})

export function About() {
  const parties = usePartiesStore((s) => s.parties)
  const [msg, setMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLTextAreaElement>(null)

  const unverified = monsters.filter((m) => m.unverified.length > 0)

  async function backup() {
    const blob = JSON.stringify({
      app: 'monster-friends-companion',
      exportedAt: new Date().toISOString(),
      parties: Object.values(parties),
      favorites: useFavoritesStore.getState().ids,
    })
    try {
      await navigator.clipboard.writeText(blob)
      setMsg('Backup copied to clipboard — paste it somewhere safe.')
    } catch {
      setMsg('Could not access the clipboard.')
    }
  }

  function restore(text: string) {
    try {
      const data = JSON.parse(text) as { parties?: unknown; favorites?: unknown }
      if (!Array.isArray(data.parties)) throw new Error()
      const store = usePartiesStore.getState()
      let restored = 0
      let skipped = 0
      for (const raw of data.parties) {
        const parsed = BackupPartySchema.safeParse(raw)
        if (parsed.success) {
          store.createParty(parsed.data)
          restored++
        } else {
          skipped++
        }
      }
      if (Array.isArray(data.favorites)) {
        const favs = useFavoritesStore.getState()
        for (const id of data.favorites) if (typeof id === 'string' && !favs.has(id)) favs.toggle(id)
      }
      setMsg(`Restored ${restored} parties.${skipped ? ` Skipped ${skipped} that looked damaged.` : ''}`)
    } catch {
      setMsg('That did not look like a Monster Friends backup.')
    }
  }

  const btn =
    'w-full rounded-xl border-2 border-zinc-900 bg-white px-3 py-2.5 text-left font-semibold dark:border-zinc-100 dark:bg-zinc-900'

  return (
    <div className="mx-auto max-w-lg p-4">
      <h1 className="font-display mb-1 text-2xl font-black">About</h1>
      <p className="mb-4 text-sm opacity-80">
        The unofficial-official companion app for <b>Monster Friends: Battle for New Florida</b>. Works offline — add it
        to your home screen and take it to game night.
      </p>

      <div className="mb-4 rounded-xl border-2 border-zinc-900 bg-white p-3 text-sm dark:border-zinc-100 dark:bg-zinc-900">
        <div>
          Monster cards: <b>v{gameData.dataVersion}</b>
        </div>
        <div>
          Core rules: <b>v{gameData.rulesVersion}</b>
        </div>
        <div>
          {gameData.monsters.length} monsters · {gameData.keywords.length} glossary entries · {gameData.rules.length} rules
          sections
        </div>
      </div>

      <h2 className="font-display mb-1.5 font-bold tracking-wide uppercase opacity-70">Your data</h2>
      <div className="grid gap-2">
        <button type="button" className={btn} onClick={backup}>
          📦 Copy a backup of my parties
        </button>
        <button type="button" className={btn} onClick={() => fileRef.current?.focus()}>
          📥 Restore from a backup (paste below)
        </button>
        <textarea
          ref={fileRef}
          rows={2}
          placeholder="Paste a backup here…"
          onPaste={(e) => restore(e.clipboardData.getData('text'))}
          className="w-full rounded-xl border-2 border-zinc-300 bg-white px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
        />
        {msg && <p className="text-sm font-medium">{msg}</p>}
      </div>

      {unverified.length > 0 && (
        <>
          <h2 className="font-display mt-5 mb-1.5 font-bold tracking-wide uppercase opacity-70">
            Data needing verification
          </h2>
          <p className="mb-2 text-xs opacity-70">
            These values were recovered from the printed PDFs and should be checked against the design source files.
          </p>
          <div className="grid gap-1.5 text-sm">
            {unverified.map((m) => (
              <div key={m.id} className="rounded-lg border border-dashed border-zinc-400 p-2">
                <b>{m.name}</b>
                <ul className="list-disc pl-5 text-xs opacity-80">
                  {m.unverified.map((u) => (
                    <li key={u}>{u}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
