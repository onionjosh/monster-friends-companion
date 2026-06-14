import { Link, useLocation } from 'wouter'
import { usePlayStore } from '../stores/play'
import { gameData } from '../data'
import { Icon, type IconName } from '../components/Icon'
import { TornButton, TornCallout } from '../components/Torn'

const HUB: { href: string; icon: IconName; title: string; sub: string }[] = [
  { href: '/monsters', icon: 'ghost', title: 'Monsters', sub: 'Every card' },
  { href: '/parties', icon: 'roster', title: 'Parties', sub: 'Build & save' },
  { href: '/play', icon: 'dice', title: 'Play', sub: 'Track a game' },
  { href: '/rules', icon: 'book', title: 'Rules', sub: `v${gameData.rulesVersion}` },
]

export function Home() {
  const game = usePlayStore((s) => s.game)
  const [, navigate] = useLocation()

  return (
    <div className="mx-auto max-w-lg p-4">
      <div className="grid gap-4">
        {/* hero — official logo */}
        <div
          className="relative"
          style={{
            clipPath: 'var(--clip-torn-1)',
            background: 'var(--poster-black)',
            backgroundImage: 'radial-gradient(rgba(255,255,255,.05) 1.1px, transparent 1.2px)',
            backgroundSize: '8px 8px',
            padding: '20px 18px 22px',
            filter: 'drop-shadow(3px 3px 0 var(--shadow-ink))',
          }}
        >
          <img
            src={`${import.meta.env.BASE_URL}brand/logo.webp`}
            alt="Monster Friends — Battle for New Florida"
            className="mx-auto block"
            style={{ width: '100%', maxWidth: 300 }}
          />
          <p className="mt-3 text-center" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.5, color: 'rgba(242,236,221,.85)' }}>
            Plan an army, learn the rules, and track HP at the table. Free to play.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-3.5">
            <TornButton variant="red" leftIcon="roster" cut={1} tilt="sm" onClick={() => navigate('/builder')}>
              Build a Party
            </TornButton>
            <TornButton variant="cream" leftIcon="ghost" cut={2} tilt="rev" onClick={() => navigate('/monsters')}>
              Monsters
            </TornButton>
          </div>
        </div>

        {/* resume */}
        {game && (
          <Link href="/play" className="mf-torn-card block" style={{ background: 'var(--punk-red)', color: '#fff', padding: 18 }}>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-lg)' }}>
                <Icon name="dice" size={22} /> Resume Game
              </span>
              <Icon name="chevronRight" size={22} />
            </div>
            <div className="mt-0.5 text-left" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, opacity: 0.9 }}>
              Round {game.round} · {game.mine.name} vs {game.theirs.name}
            </div>
          </Link>
        )}

        {/* hub grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {HUB.map((t, i) => (
            <Link
              key={t.href}
              href={t.href}
              className={`mf-torn-card block ${i % 2 ? 'mf-torn-card--2' : 'mf-torn-card--3'}`}
              style={{ background: 'var(--surface-sunk)', padding: '20px 18px', minHeight: 120 }}
            >
              <span
                className="inline-flex items-center justify-center"
                style={{ width: 48, height: 48, clipPath: 'var(--clip-torn-2)', background: 'var(--punk-red)', color: '#fff' }}
              >
                <Icon name={t.icon} size={26} />
              </span>
              <div className="mt-2.5" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-xl)' }}>
                {t.title}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{t.sub}</div>
            </Link>
          ))}
        </div>

        <Link
          href="/scenarios"
          className="mf-torn-card mf-torn-card--2 flex items-center gap-3.5"
          style={{ background: 'var(--surface-sunk)', padding: 18 }}
        >
          <span
            className="inline-flex shrink-0 items-center justify-center"
            style={{ width: 46, height: 46, clipPath: 'var(--clip-torn-1)', background: 'var(--primary)', color: 'var(--on-primary)' }}
          >
            <Icon name="trophy" size={26} />
          </span>
          <span>
            <span className="block" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-xl)' }}>
              Scenarios
            </span>
            <span className="block" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
              Game modes & win conditions
            </span>
          </span>
        </Link>

        <TornCallout eyebrow={`Beta ${gameData.dataVersion}`} variant="gold" tilt="md" className="self-center">
          Out now &amp; free to play!
        </TornCallout>

        <footer className="text-center" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          Cards v{gameData.dataVersion} · Rules v{gameData.rulesVersion} ·{' '}
          <Link href="/about" className="underline">
            About
          </Link>
        </footer>
      </div>
    </div>
  )
}
