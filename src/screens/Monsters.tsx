import { useMemo, useState } from 'react'
import { Link } from 'wouter'
import { searchMonsters, SIZE_LABELS } from '../data'
import type { Monster } from '../lib/schemas'
import { useFavoritesStore } from '../stores/favorites'
import { SizeBadge } from '../components/StatBlock'
import { Icon } from '../components/Icon'

type SizeFilter = 'all' | Monster['size']
type TypeFilter = 'all' | 'melee' | 'ranged'

function MonsterRow({ m, fav, onFav }: { m: Monster; fav: boolean; onFav: () => void }) {
  const ranged = m.attacks.some((a) => a.type === 'ranged')
  return (
    <div className="relative">
      <Link href={`/monsters/${m.id}`} className="mf-torn-card mf-torn-card--row flex items-stretch overflow-hidden">
        <div
          className="relative shrink-0 self-stretch"
          style={{ width: 84, background: 'var(--surface-sunk)', clipPath: 'var(--clip-torn-photo)' }}
        >
          {m.image ? (
            <img
              src={`${import.meta.env.BASE_URL}monsters/${m.image}`}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
              <Icon name="ghost" size={28} />
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="truncate"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--text)' }}
              >
                {m.name}
              </span>
              <SizeBadge size={m.size} />
            </div>
            <div className="mt-0.5 flex items-center gap-2" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
              <span>
                <b style={{ color: 'var(--text)' }}>{m.hp}</b> HP
              </span>
              <span>·</span>
              <span>
                <b style={{ color: 'var(--text)' }}>{m.act}</b> AcT
              </span>
              <span>·</span>
              <Icon name={ranged ? 'bow' : 'sword'} size={12} />
            </div>
          </div>
        </div>
      </Link>
      {/* torn gold PP tag */}
      <span className="pointer-events-none absolute" style={{ top: -6, right: 10 }}>
        <span
          className="inline-flex items-center gap-1"
          style={{
            clipPath: 'var(--clip-tag)',
            background: 'var(--primary)',
            color: 'var(--on-primary)',
            padding: '5px 11px',
            filter: 'drop-shadow(2px 2px 0 var(--shadow-ink))',
            transform: 'rotate(2deg)',
          }}
        >
          <b style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-base)' }}>{m.partyPoints}</b>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em' }}>PP</span>
        </span>
      </span>
      {/* fav */}
      <button
        type="button"
        aria-label={fav ? 'remove favorite' : 'add favorite'}
        onClick={onFav}
        className="absolute flex items-center justify-center"
        style={{ bottom: 6, right: 8, width: 34, height: 34, background: 'transparent', border: 0, color: fav ? 'var(--primary)' : 'var(--text-muted)', opacity: fav ? 1 : 0.5 }}
      >
        <Icon name="star" size={20} style={fav ? { fill: 'var(--primary)' } : undefined} />
      </button>
    </div>
  )
}

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

  return (
    <div className="mx-auto max-w-lg p-4">
      <h1 className="mb-3" style={{ fontSize: 'var(--text-2xl)' }}>
        Monsters
      </h1>

      <div className="relative mb-2.5">
        <span className="absolute" style={{ left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
          <Icon name="search" size={19} />
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the roster…"
          className="mf-input"
          style={{ paddingLeft: 40 }}
        />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {(
          [
            ['all', 'All'],
            ['S', 'Small'],
            ['M', 'Medium'],
            ['L', 'Large'],
          ] as const
        ).map(([v, l]) => (
          <button key={v} type="button" className="mf-chip mf-chip--filter" data-active={size === v} onClick={() => setSize(v)}>
            {l}
          </button>
        ))}
        <button
          type="button"
          className="mf-chip mf-chip--filter"
          data-active={type === 'melee'}
          onClick={() => setType(type === 'melee' ? 'all' : 'melee')}
        >
          <Icon name="sword" size={15} /> Melee
        </button>
        <button
          type="button"
          className="mf-chip mf-chip--filter"
          data-active={type === 'ranged'}
          onClick={() => setType(type === 'ranged' ? 'all' : 'ranged')}
        >
          <Icon name="bow" size={15} /> Ranged
        </button>
        <button type="button" className="mf-chip mf-chip--filter" data-active={onlyFavs} onClick={() => setOnlyFavs((v) => !v)}>
          <Icon name="star" size={15} /> Favorites
        </button>
      </div>

      <div className="grid gap-3">
        {results.map((m) => (
          <MonsterRow key={m.id} m={m} fav={favs.includes(m.id)} onFav={() => toggleFav(m.id)} />
        ))}
        {results.length === 0 && (
          <p className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>
            No monsters match.
          </p>
        )}
        <p className="py-1 text-center" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          {SIZE_LABELS ? `${results.length} monster${results.length === 1 ? '' : 's'}` : ''}
        </p>
      </div>
    </div>
  )
}
