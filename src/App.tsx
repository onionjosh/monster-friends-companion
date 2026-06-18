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
import { PartyRules } from './screens/PartyRules'
import { Rules, RuleSection } from './screens/Rules'
import { Scenarios, ScenarioDetail } from './screens/Scenarios'
import { Import } from './screens/Import'
import { About } from './screens/About'
import { KeywordSheet } from './components/KeywordSheet'
import { Icon, type IconName } from './components/Icon'

const tabs: { href: string; label: string; icon: IconName }[] = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/monsters', label: 'Monsters', icon: 'ghost' },
  { href: '/parties', label: 'Parties', icon: 'roster' },
  { href: '/play', label: 'Play', icon: 'dice' },
  { href: '/rules', label: 'Rules', icon: 'book' },
]

function TabBar() {
  const [location] = useLocation()
  const isActive = (href: string) => (href === '/' ? location === '/' : location.startsWith(href))
  return (
    <nav className="mf-tabbar no-print fixed right-0 bottom-0 left-0 z-40 mx-auto" style={{ maxWidth: 'var(--content-max)' }}>
      {tabs.map((t) => {
        const active = isActive(t.href)
        return (
          <Link key={t.href} href={t.href} className="mf-tabbar__item" data-active={active} aria-current={active ? 'page' : undefined}>
            <Icon name={t.icon} size={24} strokeWidth={active ? 2.4 : 2} />
            <span className="max-w-full truncate">{t.label}</span>
          </Link>
        )
      })}
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
    <div className="no-print fixed top-2 right-2 left-2 z-50 mx-auto" style={{ maxWidth: 'var(--content-max)' }}>
      <button
        type="button"
        onClick={() => updateServiceWorker(true)}
        className="mf-card mf-card--interactive w-full p-3 text-center font-bold"
        style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
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
          <Route path="/play/rules/:side" component={PartyRules} />
          <Route path="/rules" component={Rules} />
          <Route path="/rules/:id" component={RuleSection} />
          <Route path="/scenarios" component={Scenarios} />
          <Route path="/scenarios/:id" component={ScenarioDetail} />
          <Route path="/import/:code" component={Import} />
          <Route path="/about" component={About} />
          <Route>
            <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
              Page not found.
            </div>
          </Route>
        </Switch>
      </main>
      <TabBar />
      <KeywordSheet />
    </Router>
  )
}
