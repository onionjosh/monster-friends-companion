import { Link, useRoute } from 'wouter'
import { monsterById, SIZE_LABELS, BASE_SIZES } from '../data'
import { StatRow, DefenseLine, AttackCard, AbilityCard, KeywordChips, SizeBadge } from '../components/StatBlock'
import { useFavoritesStore } from '../stores/favorites'

export function MonsterDetail() {
  const [, params] = useRoute('/monsters/:id')
  const monster = params ? monsterById.get(params.id) : undefined
  const favs = useFavoritesStore((s) => s.ids)
  const toggleFav = useFavoritesStore((s) => s.toggle)

  if (!monster) {
    return (
      <div className="mx-auto max-w-lg p-4">
        <p className="py-8 text-center opacity-70">Monster not found — the game data may have changed.</p>
        <Link href="/monsters" className="block text-center font-medium text-amber-700 underline">
          ← All monsters
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg p-4">
      <Link href="/monsters" className="text-sm font-medium opacity-70">
        ← All monsters
      </Link>

      <header className="mt-2 mb-4 flex items-start justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-black">{monster.name}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm">
            <SizeBadge size={monster.size} />
            <span className="opacity-70">
              {SIZE_LABELS[monster.size]} · {BASE_SIZES[monster.size]} base
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <button
            type="button"
            onClick={() => toggleFav(monster.id)}
            aria-label="toggle favorite"
            className={`text-2xl ${favs.includes(monster.id) ? 'text-amber-500' : 'opacity-30'}`}
          >
            ★
          </button>
          <div className="rounded-xl border-2 border-zinc-900 bg-amber-300 px-2.5 py-1 text-center dark:border-amber-300 dark:bg-amber-700">
            <span className="font-display text-xl font-black">{monster.partyPoints}</span>
            <span className="block text-[10px] font-bold uppercase">Party Points</span>
          </div>
        </div>
      </header>

      <div className="grid gap-2.5">
        <StatRow monster={monster} />
        <DefenseLine monster={monster} />
        {monster.keywords.length > 0 && <KeywordChips ids={monster.keywords} />}

        {monster.attacks.length > 0 && (
          <>
            <h2 className="font-display mt-2 font-bold tracking-wide uppercase opacity-70">Basic Attacks</h2>
            {monster.attacks.map((a) => (
              <AttackCard key={a.name} attack={a} />
            ))}
          </>
        )}

        {monster.abilities.length > 0 && (
          <>
            <h2 className="font-display mt-2 font-bold tracking-wide uppercase opacity-70">Special Abilities</h2>
            {monster.abilities.map((a) => (
              <AbilityCard key={a.id} ability={a} />
            ))}
          </>
        )}

        {monster.flavor && <p className="mt-2 text-sm italic opacity-80">{monster.flavor}</p>}

        {monster.unverified.length > 0 && (
          <div className="mt-2 rounded-xl border border-dashed border-zinc-400 p-3 text-xs opacity-70">
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
