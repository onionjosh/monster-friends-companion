import { useMemo, useState } from 'react'
import { Link, useRoute } from 'wouter'
import { ruleSections, ruleSectionById, keywords, monsters, genericAbilities } from '../data'
import { RichText } from '../lib/markup'
import { useUiStore } from '../stores/ui'
import { Icon } from '../components/Icon'

interface SearchHit {
  kind: 'rule' | 'keyword' | 'monster' | 'generic'
  title: string
  snippet: string
  href?: string
  keywordId?: string
}

function snippetAround(text: string, q: string): string {
  const idx = text.toLowerCase().indexOf(q)
  if (idx === -1) return text.slice(0, 90)
  const start = Math.max(0, idx - 40)
  return `${start > 0 ? '…' : ''}${text.slice(start, idx + q.length + 50)}…`.replace(/[#*[\]>]/g, '')
}

export function Rules() {
  const [query, setQuery] = useState('')
  const openKeyword = useUiStore((s) => s.openKeyword)

  const hits = useMemo<SearchHit[]>(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    const out: SearchHit[] = []
    for (const r of ruleSections) {
      if (r.title.toLowerCase().includes(q) || r.body.toLowerCase().includes(q)) {
        out.push({ kind: 'rule', title: r.title, snippet: snippetAround(r.body, q), href: `/rules/${r.id}` })
      }
    }
    for (const k of keywords) {
      if (k.name.toLowerCase().includes(q) || k.short.toLowerCase().includes(q)) {
        out.push({ kind: 'keyword', title: k.name, snippet: snippetAround(k.short, q), keywordId: k.id })
      }
    }
    for (const m of monsters) {
      for (const a of m.abilities) {
        if (a.name.toLowerCase().includes(q) || a.text.toLowerCase().includes(q)) {
          out.push({ kind: 'monster', title: `${a.name} (${m.name})`, snippet: snippetAround(a.text, q), href: `/monsters/${m.id}` })
        }
      }
    }
    for (const a of genericAbilities) {
      if (a.name.toLowerCase().includes(q) || a.text.toLowerCase().includes(q)) {
        out.push({ kind: 'generic', title: `${a.name} (generic ability)`, snippet: snippetAround(a.text, q), href: '/rules/generic-abilities' })
      }
    }
    return out
  }, [query])

  const glossary = [...keywords].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="mx-auto max-w-lg p-4">
      <h1 className="mb-3" style={{ fontSize: 'var(--text-2xl)' }}>
        Rules
      </h1>

      <div className="relative mb-3">
        <span className="absolute" style={{ left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
          <Icon name="search" size={19} />
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search rules, keywords, abilities…"
          className="mf-input"
          style={{ paddingLeft: 40 }}
        />
      </div>

      {query.trim().length >= 2 ? (
        <div className="grid gap-2">
          {hits.map((h, i) =>
            h.keywordId ? (
              <button key={i} type="button" onClick={() => openKeyword(h.keywordId!)} className="mf-card mf-card--interactive p-3 text-left">
                <div className="font-bold">{h.title}</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{h.snippet}</div>
              </button>
            ) : (
              <Link key={i} href={h.href!} className="mf-card mf-card--interactive p-3">
                <div className="font-bold">{h.title}</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{h.snippet}</div>
              </Link>
            ),
          )}
          {hits.length === 0 && (
            <p className="py-6 text-center" style={{ color: 'var(--text-muted)' }}>
              Nothing found for "{query}".
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-1.5">
            {ruleSections.map((r, i) => (
              <Link key={r.id} href={`/rules/${r.id}`} className="mf-card mf-card--interactive flex items-center gap-3 px-3 py-2.5 font-semibold">
                <span className="w-6 text-right font-black" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)', opacity: 0.5 }}>
                  {i + 1}
                </span>
                {r.title}
              </Link>
            ))}
          </div>

          <h2 className="mt-6 mb-2" style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontSize: 'var(--text-base)' }}>
            Glossary
          </h2>
          <div className="flex flex-wrap gap-2">
            {glossary.map((k) => (
              <button key={k.id} type="button" onClick={() => openKeyword(k.id)} className="mf-chip mf-chip--keyword">
                {k.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function RuleSection() {
  const [, params] = useRoute('/rules/:id')
  const section = params ? ruleSectionById.get(params.id) : undefined

  if (!section) {
    return (
      <div className="mx-auto max-w-lg p-4">
        <p className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>
          Section not found.
        </p>
        <Link href="/rules" className="block text-center font-semibold underline" style={{ color: 'var(--accent-text)' }}>
          ← Rules
        </Link>
      </div>
    )
  }

  const idx = ruleSections.findIndex((r) => r.id === section.id)
  const prev = ruleSections[idx - 1]
  const next = ruleSections[idx + 1]

  return (
    <div className="mx-auto max-w-lg p-4">
      <Link href="/rules" className="flex items-center gap-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 700 }}>
        <Icon name="chevronLeft" size={18} /> RULES
      </Link>
      <h1 className="mt-2 mb-3" style={{ fontSize: 'var(--text-2xl)', color: 'var(--punk-red)' }}>
        {section.title}
      </h1>
      <RichText text={section.body} />
      <div className="mt-6 flex justify-between gap-2" style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
        {prev ? (
          <Link href={`/rules/${prev.id}`} className="underline" style={{ color: 'var(--accent-text)' }}>
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/rules/${next.id}`} className="text-right underline" style={{ color: 'var(--accent-text)' }}>
            {next.title} →
          </Link>
        )}
      </div>
    </div>
  )
}
