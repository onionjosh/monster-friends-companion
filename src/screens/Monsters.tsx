import { useMemo, useState } from 'react'
import { Link } from 'wouter'
import { searchMonsters, SIZE_LABELS } from '../data'
import type { Monster } from '../lib/schemas'
import { useFavoritesStore } from '../stores/favorites'
import { SizeBadge } from '../components/StatBlock'

type SizeFilter = 'all' | Monster['size']
type TypeFilter = 'all' | 'melee' | 'ranged'

export function Monsters() {
  const [query, setQuery] = useState('')
  const [size, setSize] = useState<SizeFilter>('all')
  const [type, setType] = useState<TypeFilter>('all')
  const [onlyFavs, setOnlyFavs] = useState(false)
  const favs = useFavoritesStore((s) => s.ids)
  const toggleFav = useFavoritesStore((s) => s.toggle)

  const results = useMemo(() => {
    let list = searchMonsters(query)
    if (size !== 'all') list = list.filter((m) => m.size === size)
    if (type !== 'all') list = list.filter((m) => m.attacks.some((a) => a.type === type))
    if (onlyFavs) list = list.filter((m) => favs.includes(m.id))
    return list
  }, [query, size, type, onlyFavs, favs])

  const chip = (active: boolean) =>
    `rounded-full border-2 px-2.5 py-1 text-xs font-bold ${
      active
        ? 'border-zinc-900 bg-amber-300 dark:border-amber-300 dark:bg-amber-700'
        : 'border-zinc-300 bg-white opacity-70 dark:border-zinc-700 dark:bg-zinc-900'
    }`

  return (
    <div className="mx-auto max-w-lg p-4">
      <h1 className="font-display mb-3 text-2xl font-black">Monsters</h1>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search names, attacks, abilities…"
        className="mb-2 w-full rounded-xl border-2 border-zinc-900 bg-white px-3 py-2 dark:border-zinc-100 dark:bg-zinc-900"
      />

      <div className="mb-3 flex flex-wrap gap-1.5">
        {(['all', 'S', 'M', 'L'] as const).map((s) => (
          <button key={s} type="button" className={chip(size === s)} onClick={() => setSize(s)}>
            {s === 'all' ? 'All sizes' : SIZE_LABELS[s]}
          </button>
        ))}
        {(['melee', 'ranged'] as const).map((t) => (
          <button key={t} type="button" className={chip(type === t)} onClick={() => setType(type === t ? 'all' : t)}>
            {t === 'melee' ? '⚔️ Melee' : '🏹 Ranged'}
          </button>
        ))}
        <button type="button" className={chip(onlyFavs)} onClick={() => setOnlyFavs((v) => !v)}>
          ★ Favorites
        </button>
      </div>

      <div className="grid gap-2">
        {results.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 rounded-xl border-2 border-zinc-900 bg-white p-3 dark:border-zinc-100 dark:bg-zinc-900"
          >
            <Link href={`/monsters/${m.id}`} className="flex min-w-0 flex-1 items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-display flex items-center gap-2 font-bold">
                  <span className="truncate">{m.name}</span>
                  <SizeBadge size={m.size} />
                </div>
                <div className="text-xs opacity-70">
                  HP {m.hp} · AcT {m.act} · Move {m.movement > 0 ? `${m.movement}"` : '—'} · {m.abilities.length} abilit{m.abilities.length === 1 ? 'y' : 'ies'}
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-xl font-black">{m.partyPoints}</div>
                <div className="text-[10px] font-bold uppercase opacity-70">PP</div>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => toggleFav(m.id)}
              aria-label={favs.includes(m.id) ? 'remove favorite' : 'add favorite'}
              className={`text-2xl ${favs.includes(m.id) ? 'text-amber-500' : 'opacity-30'}`}
            >
              ★
            </button>
          </div>
        ))}
        {results.length === 0 && <p className="py-8 text-center opacity-70">No monsters match.</p>}
      </div>
    </div>
  )
}
