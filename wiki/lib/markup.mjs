/**
 * Rich-text engine shared by the wikitext and static-site generators.
 *
 * Source markup (same dialect the companion app uses) supports:
 *   **bold**, *italic*, [[kw:id|label]], [[rule:id|label]],
 *   "## " headings, "- " bullet lists, "1." numbered lists, "> " callouts,
 *   paragraphs (blank-line separated; single newlines are soft breaks).
 *
 * We deliberately render ONLY explicit [[kw:]]/[[rule:]] links — no fuzzy
 * auto-linking of bare keyword names — so every link is intentional and correct.
 */

export function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const INLINE_RE = /\[\[(kw|rule):([a-z0-9-]+)(?:\|([^\]]*))?\]\]|\*\*([^*]+)\*\*|\*([^*]+)\*/g

/** Walk inline markup, delegating each token kind to a handler that returns a string. */
function scanInline(text, h) {
  let out = ''
  let last = 0
  for (const m of text.matchAll(INLINE_RE)) {
    if (m.index > last) out += h.text(text.slice(last, m.index))
    if (m[1] === 'kw') out += h.kw(m[2], m[3])
    else if (m[1] === 'rule') out += h.rule(m[2], m[3])
    else if (m[4] !== undefined) out += h.bold(scanInline(m[4], h))
    else if (m[5] !== undefined) out += h.italic(scanInline(m[5], h))
    last = m.index + m[0].length
  }
  if (last < text.length) out += h.text(text.slice(last))
  return out
}

/** Parse a block of source text into a flat list of typed blocks. */
export function parseBlocks(text) {
  const blocks = []
  for (const rb of String(text).replace(/\r\n/g, '\n').split(/\n{2,}/)) {
    const lines = rb.split('\n').map((l) => l.replace(/\s+$/, '')).filter((l) => l.trim() !== '')
    let i = 0
    const isStruct = (l) => l.startsWith('## ') || l.startsWith('>') || l.startsWith('- ') || /^\d+\.\s/.test(l)
    while (i < lines.length) {
      const line = lines[i]
      if (line.startsWith('## ')) {
        blocks.push({ type: 'h', text: line.slice(3) })
        i++
      } else if (line.startsWith('>')) {
        const buf = []
        while (i < lines.length && lines[i].startsWith('>')) buf.push(lines[i].replace(/^>\s?/, '')), i++
        blocks.push({ type: 'quote', inner: buf.join('\n') })
      } else if (line.startsWith('- ')) {
        const items = []
        while (i < lines.length && lines[i].startsWith('- ')) items.push(lines[i].slice(2)), i++
        blocks.push({ type: 'ul', items })
      } else if (/^\d+\.\s/.test(line)) {
        const items = []
        while (i < lines.length && /^\d+\.\s/.test(lines[i])) items.push(lines[i].replace(/^\d+\.\s/, '')), i++
        blocks.push({ type: 'ol', items })
      } else {
        const buf = []
        while (i < lines.length && !isStruct(lines[i])) buf.push(lines[i]), i++
        blocks.push({ type: 'p', lines: buf })
      }
    }
  }
  return blocks
}

// --- wikitext ----------------------------------------------------------------
export function renderWiki(text, links) {
  const h = {
    text: (s) => s,
    bold: (s) => `'''${s}'''`,
    italic: (s) => `''${s}''`,
    kw: (id, label) => links.kw(id, label),
    rule: (id, label) => links.rule(id, label),
  }
  const inline = (s) => scanInline(s, h)
  const render = (src) =>
    parseBlocks(src)
      .map((b) => {
        if (b.type === 'h') return `== ${inline(b.text)} ==`
        if (b.type === 'ul') return b.items.map((it) => `* ${inline(it)}`).join('\n')
        if (b.type === 'ol') return b.items.map((it) => `# ${inline(it)}`).join('\n')
        if (b.type === 'quote') return `<blockquote>\n${render(b.inner)}\n</blockquote>`
        return b.lines.map(inline).join('<br>\n')
      })
      .join('\n\n')
  return render(text)
}

// --- HTML --------------------------------------------------------------------
export function renderHtml(text, { hLevel = 3, links }) {
  const h = {
    text: (s) => escapeHtml(s),
    bold: (s) => `<strong>${s}</strong>`,
    italic: (s) => `<em>${s}</em>`,
    kw: (id, label) => links.kw(id, label),
    rule: (id, label) => links.rule(id, label),
  }
  const inline = (s) => scanInline(s, h)
  const render = (src, lvl) =>
    parseBlocks(src)
      .map((b) => {
        if (b.type === 'h') return `<h${lvl}>${inline(b.text)}</h${lvl}>`
        if (b.type === 'ul') return `<ul>${b.items.map((it) => `<li>${inline(it)}</li>`).join('')}</ul>`
        if (b.type === 'ol') return `<ol>${b.items.map((it) => `<li>${inline(it)}</li>`).join('')}</ol>`
        if (b.type === 'quote') return `<blockquote>${render(b.inner, lvl + 1)}</blockquote>`
        return `<p>${b.lines.map(inline).join('<br>')}</p>`
      })
      .join('\n')
  return render(text, hLevel)
}
