import { Route, Router, Switch, Link, useLocation } from 'wouter'
import { useHashLocation } from 'wouter/use-hash-location'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Home } from './screens/Home'
import { Monsters } from './screens/Monsters'
import { MonsterDetail } from './screens/MonsterDetail'
import { Builder } from './screens/Builder'
import { Parties } from './screens/Parties'
import { PartyEditor } from './screens/PartyEditor'
import { PrintRoster } from './screens/PrintRoster'
import { Play } from './screens/Play'
import { Rules, RuleSection } from './screens/Rules'
import { Scenarios, ScenarioDetail } from './screens/Scenarios'
import { Import } from './screens/Import'
import { About } from './screens/About'
import { KeywordSheet } from './components/KeywordSheet'

const tabs = [
  { href: '/', label: 'Home', emoji: '🏠' },
  { href: '/monsters', label: 'Monsters', emoji: '👾' },
  { href: '/parties', label: 'Parties', emoji: '📋' },
  { href: '/play', label: 'Play', emoji: '🎲' },
  { href: '/rules', label: 'Rules', emoji: '📖' },
] as const

function TabBar() {
  const [location] = useLocation()
  const isActive = (href: string) => (href === '/' ? location === '/' : location.startsWith(href))
  return (
    <nav className="no-print fixed right-0 bottom-0 left-0 z-40 border-t-2 border-zinc-900 bg-white pb-[env(safe-area-inset-bottom)] dark:border-zinc-100 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-lg">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`flex flex-1 flex-col items-center py-1.5 text-[11px] font-bold ${
              isActive(t.href) ? 'text-amber-600 dark:text-amber-400' : 'opacity-60'
            }`}
          >
            <span className="text-lg leading-tight">{t.emoji}</span>
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}

function UpdateToast() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()
  if (!needRefresh) return null
  return (
    <div className="no-print fixed top-2 right-2 left-2 z-50 mx-auto max-w-lg">
      <button
        type="button"
        onClick={() => updateServiceWorker(true)}
        className="w-full rounded-xl border-2 border-zinc-900 bg-amber-300 p-3 text-center font-bold shadow-lg dark:border-amber-300 dark:bg-amber-600"
      >
        ✨ A new version is ready — tap to update
      </button>
    </div>
  )
}

export default function App() {
  return (
    <Router hook={useHashLocation}>
      <UpdateToast />
      <main className="min-h-dvh pb-16">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/monsters" component={Monsters} />
          <Route path="/monsters/:id" component={MonsterDetail} />
          <Route path="/builder" component={Builder} />
          <Route path="/parties" component={Parties} />
          <Route path="/parties/:id" component={PartyEditor} />
          <Route path="/parties/:id/print" component={PrintRoster} />
          <Route path="/play" component={Play} />
          <Route path="/rules" component={Rules} />
          <Route path="/rules/:id" component={RuleSection} />
          <Route path="/scenarios" component={Scenarios} />
          <Route path="/scenarios/:id" component={ScenarioDetail} />
          <Route path="/import/:code" component={Import} />
          <Route path="/about" component={About} />
          <Route>
            <div className="p-8 text-center opacity-70">Page not found.</div>
          </Route>
        </Switch>
      </main>
      <TabBar />
      <KeywordSheet />
    </Router>
  )
}
