import { Link, useRoute } from 'wouter'
import { monsterById, SIZE_LABELS, BASE_SIZES } from '../data'
import { StatRow, DefenseLine, AttackCard, AbilityCard, KeywordChips, SizeBadge, SectionHead } from '../components/StatBlock'
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
      <div className="grid gap-3">
        <Link
          href="/monsters"
          className="flex items-center gap-1"
          style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)' }}
        >
          <Icon name="chevronLeft" size={18} /> ALL MONSTERS
        </Link>

        <div className="flex items-start justify-between gap-2.5">
          <div>
            <h1 style={{ fontSize: 'var(--text-2xl)', color: 'var(--punk-red)', lineHeight: 1 }}>{monster.name}</h1>
            <div className="mt-1.5 flex items-center gap-2" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
              <SizeBadge size={monster.size} /> {SIZE_LABELS[monster.size]} · {BASE_SIZES[monster.size]} base
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              aria-label="toggle favorite"
              onClick={() => toggleFav(monster.id)}
              style={{ background: 'none', border: 0, padding: 2, color: fav ? 'var(--primary)' : 'var(--text-muted)', opacity: fav ? 1 : 0.5 }}
            >
              <Icon name="star" size={26} style={fav ? { fill: 'var(--primary)' } : undefined} />
            </button>
            <span
              className="inline-flex flex-col items-center"
              style={{
                clipPath: 'var(--clip-callout)',
                background: 'var(--primary)',
                color: 'var(--on-primary)',
                padding: '8px 18px',
                filter: 'drop-shadow(3px 3px 0 var(--shadow-ink))',
                transform: 'rotate(-2deg)',
              }}
            >
              <b style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-2xl)', lineHeight: 1 }}>{monster.partyPoints}</b>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em' }}>PARTY PTS</span>
            </span>
          </div>
        </div>

        {monster.image && (
          <div
            style={{
              clipPath: 'var(--clip-torn-soft)',
              filter: 'drop-shadow(4px 4px 0 var(--shadow-ink))',
              aspectRatio: '4 / 3',
              background: 'var(--surface)',
            }}
          >
            <img
              src={`${import.meta.env.BASE_URL}monsters/${monster.image}`}
              alt={`${monster.name} miniature`}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}

        <StatRow monster={monster} />
        <DefenseLine monster={monster} />
        {monster.keywords.length > 0 && <KeywordChips ids={monster.keywords} />}

        {monster.attacks.length > 0 && (
          <>
            <SectionHead icon="swords">Basic Attacks</SectionHead>
            {monster.attacks.map((a) => (
              <AttackCard key={a.name} attack={a} />
            ))}
          </>
        )}

        {monster.abilities.length > 0 && (
          <>
            <SectionHead icon="star">Special Abilities</SectionHead>
            {monster.abilities.map((a) => (
              <AbilityCard key={a.id} ability={a} />
            ))}
          </>
        )}

        {monster.flavor && (
          <p className="mt-1" style={{ fontFamily: 'var(--font-marker)', fontSize: 'var(--text-lg)', color: 'var(--text-muted)' }}>
            {monster.flavor}
          </p>
        )}

        {monster.unverified.length > 0 && (
          <div
            className="mt-1 rounded-xl p-3"
            style={{ border: '1px dashed var(--border-soft)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}
          >
            <b>Needs verification against source data:</b>
            <ul className="mt-1 list-disc pl-4">
              {monster.unverified.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
