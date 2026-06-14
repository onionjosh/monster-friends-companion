import { Fragment, type ReactNode } from 'react'
import { Link } from 'wouter'
import { keywordById, keywords } from '../data'
import { useUiStore } from '../stores/ui'

/**
 * Tiny renderer for the rich text used in rules sections and ability text.
 * Supports: paragraphs, ## headings, "- " lists, "> " callouts,
 * **bold**, *italic*, [[kw:id|label]] keyword popups, [[rule:id|label]] links,
 * and auto-linking of bare keyword names.
 */

function KeywordChip({ id, children }: { id: string; children: ReactNode }) {
  const openKeyword = useUiStore((s) => s.openKeyword)
  return (
    <button
      type="button"
      onClick={() => openKeyword(id)}
      className="inline cursor-pointer font-semibold"
      style={{ color: 'var(--accent-text)', borderBottom: '1px dotted var(--accent-text)' }}
    >
      {children}
    </button>
  )
}

// Longest names first so "Hard To Kill" wins over hypothetical "Hard".
const autoLinkNames = [...keywords]
  .sort((a, b) => b.name.length - a.name.length)
  .map((k) => ({ id: k.id, name: k.name }))

function autoLink(text: string, key: number): ReactNode {
  for (const { id, name } of autoLinkNames) {
    const idx = text.toLowerCase().indexOf(name.toLowerCase())
    if (idx === -1) continue
    // avoid linking inside a word
    const before = text[idx - 1]
    const after = text[idx + name.length]
    if ((before && /[a-z0-9]/i.test(before)) || (after && /[a-z0-9]/i.test(after))) continue
    // avoid linking the tail of a proper noun ("Wimpy Guard" is a monster, not the Guard action)
    if (/[A-Z][A-Za-z]*[\s,]+$/.test(text.slice(0, idx))) continue
    return (
      <Fragment key={key}>
        {text.slice(0, idx)}
        <KeywordChip id={id}>{text.slice(idx, idx + name.length)}</KeywordChip>
        {autoLink(text.slice(idx + name.length), key + 1)}
      </Fragment>
    )
  }
  return <Fragment key={key}>{text}</Fragment>
}

const INLINE_RE = /\[\[(kw|rule):([a-z0-9-]+)(?:\|([^\]]*))?\]\]|\*\*([^*]+)\*\*|\*([^*]+)\*/g

export function renderInline(text: string, doAutoLink = true): ReactNode[] {
  const nodes: ReactNode[] = []
  let last = 0
  let key = 0
  for (const m of text.matchAll(INLINE_RE)) {
    if (m.index! > last) {
      const plain = text.slice(last, m.index)
      nodes.push(doAutoLink ? autoLink(plain, key++) : plain)
    }
    if (m[1] === 'kw') {
      const kw = keywordById.get(m[2])
      nodes.push(
        <KeywordChip key={key++} id={m[2]}>
          {m[3] || kw?.name || m[2]}
        </KeywordChip>,
      )
    } else if (m[1] === 'rule') {
      nodes.push(
        <Link key={key++} href={`/rules/${m[2]}`} className="font-semibold underline" style={{ color: 'var(--accent-text)' }}>
          {m[3] || m[2]}
        </Link>,
      )
    } else if (m[4] !== undefined) {
      nodes.push(<strong key={key++}>{renderInline(m[4], doAutoLink)}</strong>)
    } else if (m[5] !== undefined) {
      nodes.push(<em key={key++}>{renderInline(m[5], doAutoLink)}</em>)
    }
    last = m.index! + m[0].length
  }
  if (last < text.length) {
    const plain = text.slice(last)
    nodes.push(doAutoLink ? autoLink(plain, key++) : plain)
  }
  return nodes
}

export function RichText({ text, autoLink: doAutoLink = true }: { text: string; autoLink?: boolean }) {
  const blocks = text.replace(/\r\n/g, '\n').split(/\n{2,}/)
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split('\n').filter((l) => l.trim() !== '')
        if (lines.length === 0) return null
        if (lines.every((l) => l.startsWith('- '))) {
          return (
            <ul key={i} className="my-2 list-disc space-y-1 pl-5">
              {lines.map((l, j) => (
                <li key={j}>{renderInline(l.slice(2), doAutoLink)}</li>
              ))}
            </ul>
          )
        }
        if (lines.every((l) => l.startsWith('>'))) {
          const inner = lines.map((l) => l.replace(/^>\s?/, ''))
          return (
            <blockquote
              key={i}
              className="my-3 rounded-r-lg border-l-4 px-3 py-2"
              style={{ borderColor: 'var(--punk-red)', background: 'var(--surface-sunk)' }}
            >
              {inner.map((l, j) =>
                l.startsWith('- ') ? (
                  <ul key={j} className="my-1 list-disc pl-5">
                    <li>{renderInline(l.slice(2), doAutoLink)}</li>
                  </ul>
                ) : (
                  <p key={j} className="my-1">
                    {renderInline(l, doAutoLink)}
                  </p>
                ),
              )}
            </blockquote>
          )
        }
        if (lines.length === 1 && lines[0].startsWith('## ')) {
          return (
            <h3 key={i} className="mt-5 mb-2 font-display text-lg font-bold">
              {renderInline(lines[0].slice(3), false)}
            </h3>
          )
        }
        return (
          <p key={i} className="my-2 leading-relaxed">
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {renderInline(l, doAutoLink)}
              </Fragment>
            ))}
          </p>
        )
      })}
    </>
  )
}
