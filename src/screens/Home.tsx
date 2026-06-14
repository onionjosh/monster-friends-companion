import { Link, useLocation } from 'wouter'
import { usePlayStore } from '../stores/play'
import { gameData } from '../data'
import { Icon, type IconName } from '../components/Icon'
import { TornButton, TornCallout } from '../components/Torn'

type BtnSpec = {
  href: string
  icon: IconName
  label: string
  variant: 'red' | 'cream' | 'gold'
  cut: 1 | 2 | 3
  tilt: 'sm' | 'rev' | 'md'
}

// Secondary actions — same torn-button style as the primary "Build a Party" CTA.
const ACTIONS: BtnSpec[] = [
  { href: '/monsters', icon: 'ghost', label: 'Monsters', variant: 'cream', cut: 2, tilt: 'rev' },
  { href: '/play', icon: 'dice', label: 'Play', variant: 'red', cut: 3, tilt: 'sm' },
  { href: '/rules', icon: 'book', label: 'Rules', variant: 'cream', cut: 1, tilt: 'rev' },
  { href: '/scenarios', icon: 'trophy', label: 'Scenarios', variant: 'gold', cut: 2, tilt: 'md' },
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
        </div>

        {/* resume — matching torn button */}
        {game && (
          <button
            type="button"
            onClick={() => navigate('/play')}
            className="mf-torn mf-torn--red mf-torn--btn"
            style={{
              width: '100%',
              clipPath: 'var(--clip-torn-2)',
              transform: 'rotate(var(--tilt-rev))',
              ['--_tilt' as string]: 'var(--tilt-rev)',
              justifyContent: 'flex-start',
              whiteSpace: 'normal',
              gap: 12,
              padding: '14px 18px',
            }}
          >
            <Icon name="dice" size={22} />
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, lineHeight: 1.1 }}>
              <span>Resume Game</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 400, fontSize: 11, textTransform: 'none', letterSpacing: 0, opacity: 0.9 }}>
                Round {game.round} · {game.mine.name} vs {game.theirs.name}
              </span>
            </span>
          </button>
        )}

        {/* primary action — full-width torn button */}
        <TornButton
          variant="red"
          leftIcon="roster"
          cut={1}
          tilt="sm"
          onClick={() => navigate('/builder')}
          style={{ width: '100%', padding: '18px 16px' }}
        >
          Build a Party
        </TornButton>

        {/* secondary actions — same torn style */}
        <div className="grid grid-cols-2 gap-3.5">
          {ACTIONS.map((b) => (
            <TornButton
              key={b.href}
              variant={b.variant}
              leftIcon={b.icon}
              cut={b.cut}
              tilt={b.tilt}
              onClick={() => navigate(b.href)}
              style={{ width: '100%', padding: '18px 12px' }}
            >
              {b.label}
            </TornButton>
          ))}
        </div>

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
