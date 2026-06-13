import { Link } from 'wouter'
import { usePlayStore } from '../stores/play'
import { gameData } from '../data'

const tiles = [
  { href: '/monsters', emoji: '👾', title: 'Monsters', sub: 'Browse every monster card' },
  { href: '/builder', emoji: '🎉', title: 'Build a Party', sub: 'Plan your next army' },
  { href: '/parties', emoji: '📋', title: 'My Parties', sub: 'Saved lists, sharing & printing' },
  { href: '/rules', emoji: '📖', title: 'Rules', sub: 'The full rulebook, searchable' },
  { href: '/scenarios', emoji: '🏆', title: 'Scenarios', sub: 'Game modes & win conditions' },
] as const

export function Home() {
  const game = usePlayStore((s) => s.game)
  return (
    <div className="mx-auto max-w-lg p-4">
      <header className="my-6 text-center">
        <h1 className="font-display text-3xl font-black tracking-tight">
          Monster Friends
        </h1>
        <p className="text-sm font-semibold tracking-widest uppercase opacity-70">Battle for New Florida</p>
      </header>

      {game && (
        <Link
          href="/play"
          className="mb-4 block rounded-2xl border-2 border-zinc-900 bg-amber-300 p-4 text-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:border-amber-300 dark:bg-amber-600 dark:shadow-[4px_4px_0_0_rgba(251,191,36,0.4)]"
        >
          <div className="font-display text-lg font-black">▶ Resume Game</div>
          <div className="text-sm font-medium">
            Round {game.round} — {game.mine.name} vs {game.theirs.name}
          </div>
        </Link>
      )}

      <div className="grid gap-3">
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="flex items-center gap-4 rounded-2xl border-2 border-zinc-900 bg-white p-4 shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none dark:border-zinc-100 dark:bg-zinc-900 dark:shadow-[3px_3px_0_0_rgba(244,244,245,0.4)]"
          >
            <span className="text-3xl">{t.emoji}</span>
            <span>
              <span className="font-display block text-lg font-bold">{t.title}</span>
              <span className="block text-sm opacity-70">{t.sub}</span>
            </span>
          </Link>
        ))}
      </div>

      {!game && (
        <Link
          href="/play"
          className="mt-4 block rounded-2xl border-2 border-dashed border-zinc-400 p-4 text-center text-sm font-semibold opacity-80"
        >
          🎲 Start a game night session → track HP, AcT & Energy at the table
        </Link>
      )}

      <footer className="mt-8 text-center text-xs opacity-60">
        Cards v{gameData.dataVersion} · Rules v{gameData.rulesVersion} ·{' '}
        <Link href="/about" className="underline">
          About
        </Link>
      </footer>
    </div>
  )
}
