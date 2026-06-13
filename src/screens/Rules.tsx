import { useMemo, useState } from 'react'
import { Link, useRoute } from 'wouter'
import { ruleSections, ruleSectionById, keywords, monsters, genericAbilities } from '../data'
import { RichText } from '../lib/markup'
import { useUiStore } from '../stores/ui'

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
      <h1 className="font-display mb-3 text-2xl font-black">Rules</h1>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search rules, keywords, abilities…"
        className="mb-3 w-full rounded-xl border-2 border-zinc-900 bg-white px-3 py-2 dark:border-zinc-100 dark:bg-zinc-900"
      />

      {query.trim().length >= 2 ? (
        <div className="grid gap-2">
          {hits.map((h, i) =>
            h.keywordId ? (
              <button
                key={i}
                type="button"
                onClick={() => openKeyword(h.keywordId!)}
                className="rounded-xl border-2 border-zinc-900 bg-white p-3 text-left dark:border-zinc-100 dark:bg-zinc-900"
              >
                <div className="font-bold">{h.title}</div>
                <div className="text-sm opacity-70">{h.snippet}</div>
              </button>
            ) : (
              <Link
                key={i}
                href={h.href!}
                className="rounded-xl border-2 border-zinc-900 bg-white p-3 dark:border-zinc-100 dark:bg-zinc-900"
              >
                <div className="font-bold">{h.title}</div>
                <div className="text-sm opacity-70">{h.snippet}</div>
              </Link>
            ),
          )}
          {hits.length === 0 && <p className="py-6 text-center opacity-70">Nothing found for "{query}".</p>}
        </div>
      ) : (
        <>
          <div className="grid gap-1.5">
            {ruleSections.map((r, i) => (
              <Link
                key={r.id}
                href={`/rules/${r.id}`}
                className="flex items-center gap-3 rounded-xl border-2 border-zinc-900 bg-white px-3 py-2.5 font-semibold dark:border-zinc-100 dark:bg-zinc-900"
              >
                <span className="font-display w-6 text-right font-black opacity-40">{i + 1}</span>
                {r.title}
              </Link>
            ))}
          </div>

          <h2 className="font-display mt-6 mb-2 font-bold tracking-wide uppercase opacity-70">Glossary</h2>
          <div className="flex flex-wrap gap-1.5">
            {glossary.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => openKeyword(k.id)}
                className="rounded-full border-2 border-zinc-900 bg-white px-2.5 py-1 text-sm font-semibold dark:border-zinc-100 dark:bg-zinc-900"
              >
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
        <p className="py-8 text-center opacity-70">Section not found.</p>
        <Link href="/rules" className="block text-center font-medium text-amber-700 underline">
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
      <Link href="/rules" className="text-sm font-medium opacity-70">
        ← Rules
      </Link>
      <h1 className="font-display mt-2 mb-3 text-2xl font-black">{section.title}</h1>
      <RichText text={section.body} />
      <div className="mt-6 flex justify-between gap-2 text-sm font-semibold">
        {prev ? (
          <Link href={`/rules/${prev.id}`} className="text-amber-700 underline dark:text-amber-400">
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/rules/${next.id}`} className="text-right text-amber-700 underline dark:text-amber-400">
            {next.title} →
          </Link>
        )}
      </div>
    </div>
  )
}
