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

  const btn = 'mf-card mf-card--interactive w-full px-3 py-2.5 text-left font-semibold'

  return (
    <div className="mx-auto max-w-lg p-4">
      <h1 className="mb-1" style={{ fontSize: 'var(--text-2xl)' }}>
        About
      </h1>
      <p className="mb-4" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
        The unofficial-official companion app for <b>Monster Friends: Battle for New Florida</b>. Works offline — add it
        to your home screen and take it to game night.
      </p>

      <div className="mf-card mb-4 p-3" style={{ fontSize: 'var(--text-sm)' }}>
        <div>
          Monster cards: <b style={{ color: 'var(--accent-text)' }}>v{gameData.dataVersion}</b>
        </div>
        <div>
          Core rules: <b style={{ color: 'var(--accent-text)' }}>v{gameData.rulesVersion}</b>
        </div>
        <div style={{ color: 'var(--text-muted)' }}>
          {gameData.monsters.length} monsters · {gameData.keywords.length} glossary entries · {gameData.rules.length} rules sections
        </div>
      </div>

      <h2 className="mb-1.5" style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontSize: 'var(--text-base)' }}>
        Your data
      </h2>
      <div className="grid gap-2">
        <button type="button" className={btn} onClick={backup}>
          Copy a backup of my parties
        </button>
        <button type="button" className={btn} onClick={() => fileRef.current?.focus()}>
          Restore from a backup (paste below)
        </button>
        <textarea
          ref={fileRef}
          rows={2}
          placeholder="Paste a backup here…"
          onPaste={(e) => restore(e.clipboardData.getData('text'))}
          className="mf-input"
          style={{ fontSize: 'var(--text-xs)' }}
        />
        {msg && <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{msg}</p>}
      </div>

      {unverified.length > 0 && (
        <>
          <h2 className="mt-5 mb-1.5" style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontSize: 'var(--text-base)' }}>
            Data needing verification
          </h2>
          <p className="mb-2" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            These values were recovered from the printed PDFs and should be checked against the design source files.
          </p>
          <div className="grid gap-1.5" style={{ fontSize: 'var(--text-sm)' }}>
            {unverified.map((m) => (
              <div key={m.id} className="rounded-lg p-2" style={{ border: '1px dashed var(--border-soft)' }}>
                <b>{m.name}</b>
                <ul className="list-disc pl-5" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
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
