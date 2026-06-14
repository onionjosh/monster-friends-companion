import { Link, useRoute, useLocation } from 'wouter'
import { scenarios, scenarioById } from '../data'
import { RichText } from '../lib/markup'
import { Icon } from '../components/Icon'
import { TornButton } from '../components/Torn'

export function Scenarios() {
  return (
    <div className="mx-auto max-w-lg p-4">
      <h1 className="mb-1" style={{ fontSize: 'var(--text-2xl)' }}>
        Scenarios
      </h1>
      <p className="mb-4" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
        Game modes and win conditions. More will be added to the Scenario Pack as they're written.
      </p>
      <div className="grid gap-2">
        {scenarios.map((s) => (
          <Link key={s.id} href={`/scenarios/${s.id}`} className="mf-torn-card p-3">
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)' }}>{s.name}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{s.summary}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function ScenarioDetail() {
  const [, params] = useRoute('/scenarios/:id')
  const [, navigate] = useLocation()
  const scenario = params ? scenarioById.get(params.id) : undefined

  if (!scenario) {
    return (
      <div className="mx-auto max-w-lg p-4">
        <p className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>
          Scenario not found.
        </p>
        <Link href="/scenarios" className="block text-center font-semibold underline" style={{ color: 'var(--accent-text)' }}>
          ← All scenarios
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg p-4">
      <Link href="/scenarios" className="flex items-center gap-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 700 }}>
        <Icon name="chevronLeft" size={18} /> ALL SCENARIOS
      </Link>
      <h1 className="mt-2" style={{ fontSize: 'var(--text-2xl)', color: 'var(--punk-red)' }}>
        {scenario.name}
      </h1>
      {scenario.recommendedPoints && (
        <p className="mt-1" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
          Recommended: {scenario.recommendedPoints} Party Points
        </p>
      )}

      <h2 className="mt-4 mb-1" style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontSize: 'var(--text-base)' }}>
        How to win
      </h2>
      <div
        className="rounded-xl p-3 font-medium"
        style={{ border: '2px solid var(--border)', background: 'var(--surface-sunk)' }}
      >
        <RichText text={scenario.winCondition} />
      </div>

      {scenario.setup && (
        <>
          <h2 className="mt-4 mb-1" style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontSize: 'var(--text-base)' }}>
            Setup
          </h2>
          <RichText text={scenario.setup} />
        </>
      )}

      {scenario.specialRules.length > 0 && (
        <>
          <h2 className="mt-4 mb-1" style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontSize: 'var(--text-base)' }}>
            Special rules
          </h2>
          {scenario.specialRules.map((r, i) => (
            <RichText key={i} text={r} />
          ))}
        </>
      )}

      <div className="mt-6 flex justify-center">
        <TornButton variant="gold" cut={1} tilt="sm" leftIcon="dice" onClick={() => navigate('/play')}>
          Use in Game Night
        </TornButton>
      </div>
    </div>
  )
}
