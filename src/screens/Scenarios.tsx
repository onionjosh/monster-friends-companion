import { Link, useRoute } from 'wouter'
import { scenarios, scenarioById } from '../data'
import { RichText } from '../lib/markup'

export function Scenarios() {
  return (
    <div className="mx-auto max-w-lg p-4">
      <h1 className="font-display mb-1 text-2xl font-black">Scenarios</h1>
      <p className="mb-4 text-sm opacity-70">
        Game modes and win conditions. More scenarios will be added to the Monster Friends Scenario Pack as they're written.
      </p>
      <div className="grid gap-2">
        {scenarios.map((s) => (
          <Link
            key={s.id}
            href={`/scenarios/${s.id}`}
            className="rounded-xl border-2 border-zinc-900 bg-white p-3 dark:border-zinc-100 dark:bg-zinc-900"
          >
            <div className="font-display text-lg font-bold">{s.name}</div>
            <div className="text-sm opacity-70">{s.summary}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function ScenarioDetail() {
  const [, params] = useRoute('/scenarios/:id')
  const scenario = params ? scenarioById.get(params.id) : undefined

  if (!scenario) {
    return (
      <div className="mx-auto max-w-lg p-4">
        <p className="py-8 text-center opacity-70">Scenario not found.</p>
        <Link href="/scenarios" className="block text-center font-medium text-amber-700 underline">
          ← All scenarios
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg p-4">
      <Link href="/scenarios" className="text-sm font-medium opacity-70">
        ← All scenarios
      </Link>
      <h1 className="font-display mt-2 text-2xl font-black">{scenario.name}</h1>
      {scenario.recommendedPoints && (
        <p className="mt-1 text-sm font-semibold opacity-70">Recommended: {scenario.recommendedPoints} Party Points</p>
      )}

      <h2 className="font-display mt-4 mb-1 font-bold tracking-wide uppercase opacity-70">How to win</h2>
      <div className="rounded-xl border-2 border-zinc-900 bg-amber-100 p-3 font-medium dark:border-amber-300 dark:bg-amber-950">
        <RichText text={scenario.winCondition} />
      </div>

      {scenario.setup && (
        <>
          <h2 className="font-display mt-4 mb-1 font-bold tracking-wide uppercase opacity-70">Setup</h2>
          <RichText text={scenario.setup} />
        </>
      )}

      {scenario.specialRules.length > 0 && (
        <>
          <h2 className="font-display mt-4 mb-1 font-bold tracking-wide uppercase opacity-70">Special rules</h2>
          {scenario.specialRules.map((r, i) => (
            <RichText key={i} text={r} />
          ))}
        </>
      )}

      <Link
        href="/play"
        className="mt-6 block rounded-2xl border-2 border-zinc-900 bg-amber-300 py-3 text-center font-display text-lg font-black dark:border-amber-300 dark:bg-amber-600"
      >
        Use in Game Night →
      </Link>
    </div>
  )
}
