/**
 * Monster Friends wiki — build entry point.
 *
 *   node wiki/process-images.mjs   # once (or when photos change): resize photos
 *   node wiki/generate.mjs         # build wikitext export + static site
 *
 * Both outputs are generated from data/ — the single source of truth.
 */
import './gen-wikitext.mjs' // writes upload/ (wikitext + XML import dump + guide)
import { generateSite } from './gen-site.mjs'

generateSite()
console.log('\nDone. → wiki/upload/ (MediaWiki) and wiki/site/ (static site)')
