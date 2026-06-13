import { useEffect, useRef } from 'react'
import { useLocation } from 'wouter'
import { usePartiesStore } from '../stores/parties'
import { useSettingsStore } from '../stores/settings'

/** #/builder creates a fresh party and jumps into the editor. */
export function Builder() {
  const [, navigate] = useLocation()
  const createParty = usePartiesStore((s) => s.createParty)
  const lastBudget = useSettingsStore((s) => s.lastBudget)
  // StrictMode runs effects twice in dev; only ever create one party
  const created = useRef(false)

  useEffect(() => {
    if (created.current) return
    created.current = true
    const party = createParty({ budget: lastBudget })
    navigate(`/parties/${party.id}`, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
