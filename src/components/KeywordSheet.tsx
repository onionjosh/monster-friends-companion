import { Link } from 'wouter'
import { keywordById } from '../data'
import { useUiStore } from '../stores/ui'
import { Sheet } from './Sheet'
import { RichText } from '../lib/markup'

/** Global keyword definition popup; opened by tapping any keyword chip. */
export function KeywordSheet() {
  const keywordId = useUiStore((s) => s.keywordId)
  const closeKeyword = useUiStore((s) => s.closeKeyword)
  const kw = keywordId ? keywordById.get(keywordId) : undefined

  return (
    <Sheet open={!!kw} onClose={closeKeyword} title={kw?.name}>
      {kw && (
        <div className="text-sm">
          {/* keyword popups must not auto-link, or definitions could loop into themselves */}
          <RichText text={kw.short} autoLink={false} />
          {kw.ruleRef && (
            <Link
              href={`/rules/${kw.ruleRef}`}
              onClick={closeKeyword}
              className="mt-3 inline-block font-semibold underline"
              style={{ color: 'var(--accent-text)' }}
            >
              Read the full rule →
            </Link>
          )}
        </div>
      )}
    </Sheet>
  )
}
