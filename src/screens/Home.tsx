import { Link, useLocation } from 'wouter'
import { usePlayStore } from '../stores/play'
import { gameData } from '../data'
import { Icon, type IconName } from '../components/Icon'
import { TornButton, TornTag, TornCallout } from '../components/Torn'

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
        {/* wordmark + version tag */}
        <div className="flex items-start justify-between">
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, lineHeight: 0.95, color: 'var(--text)' }}>
              Monster
              <br />
              Friends
            </div>
            <div
              className="mt-1.5"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--punk-red)' }}
            >
              Battle for New Florida
            </div>
          </div>
          <TornTag variant="red" tilt="rev">
            v{gameData.dataVersion}
          </TornTag>
        </div>

        {/* hero */}
        <div
          style={{
            position: 'relative',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '2px solid var(--border)',
            background: 'var(--poster-black)',
            backgroundImage: 'radial-gradient(rgba(255,255,255,.05) 1.1px, transparent 1.2px)',
            backgroundSize: '8px 8px',
            padding: '20px 18px',
            boxShadow: 'var(--shadow-sticker)',
          }}
        >
          <div
            className="flex items-center gap-2.5"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 38, lineHeight: 0.9, color: 'var(--poster-cream)' }}
          >
            HELLO <Icon name="skull" size={34} style={{ color: '#cfe8f0' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 38, lineHeight: 0.95, color: 'var(--punk-red)' }}>FRIENDS.</div>
          <p className="my-3" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.5, color: 'rgba(242,236,221,.85)', maxWidth: 260 }}>
            Plan an army, learn the rules, and track HP at the table. Free to play.
          </p>
          <div className="flex flex-wrap gap-3.5">
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
          <Link href="/play" className="mf-torn-card block p-4" style={{ background: 'var(--punk-red)', color: '#fff' }}>
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
            <Link key={t.href} href={t.href} className={`mf-torn-card block ${i % 2 ? 'mf-torn-card--2' : 'mf-torn-card--3'} p-4`}>
              <span
                className="inline-flex items-center justify-center"
                style={{ width: 42, height: 42, clipPath: 'var(--clip-torn-2)', background: 'var(--punk-red)', color: '#fff' }}
              >
                <Icon name={t.icon} size={24} />
              </span>
              <div className="mt-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)' }}>
                {t.title}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{t.sub}</div>
            </Link>
          ))}
        </div>

        <Link href="/scenarios" className="mf-torn-card mf-torn-card--2 flex items-center gap-3 p-3">
          <span
            className="inline-flex items-center justify-center"
            style={{ width: 38, height: 38, clipPath: 'var(--clip-torn-1)', background: 'var(--primary)', color: 'var(--on-primary)' }}
          >
            <Icon name="trophy" size={22} />
          </span>
          <span>
            <span className="block" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)' }}>
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
