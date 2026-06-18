import { Link, useRoute } from 'wouter'
import { monsterById } from '../data'
import { MonsterCard, FavoriteStar } from '../components/MonsterCard'
import { Icon } from '../components/Icon'
import { useFavoritesStore } from '../stores/favorites'

export function MonsterDetail() {
  const [, params] = useRoute('/monsters/:id')
  const monster = params ? monsterById.get(params.id) : undefined
  const favs = useFavoritesStore((s) => s.ids)
  const toggleFav = useFavoritesStore((s) => s.toggle)

  if (!monster) {
    return (
      <div className="mx-auto max-w-lg p-4">
        <p className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>
          Monster not found — the game data may have changed.
        </p>
        <Link href="/monsters" className="block text-center font-semibold underline" style={{ color: 'var(--accent-text)' }}>
          ← All monsters
        </Link>
      </div>
    )
  }

  const fav = favs.includes(monster.id)

  return (
    <div className="mx-auto max-w-lg p-4">
      <Link
        href="/monsters"
        className="mb-3 flex items-center gap-1"
        style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)' }}
      >
        <Icon name="chevronLeft" size={18} /> ALL MONSTERS
      </Link>
      <MonsterCard monster={monster} action={<FavoriteStar on={fav} onToggle={() => toggleFav(monster.id)} />} />
    </div>
  )
}
