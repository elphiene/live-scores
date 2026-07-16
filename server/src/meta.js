// Per-route <head> meta injection. Social/link-preview scrapers don't run JS, so
// title/description/OpenGraph tags must be in the served HTML. The Express server
// already knows every static edition's config, so it swaps the HEAD-META block in
// the built index.html per route — no SSR framework needed. See server.js's SPA
// fallback. Ported from bracket's meta.js.
import { getSource } from './sources/index.js'

const SITE_NAME = 'Live Scores'

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// The region in client/index.html between these markers is replaced wholesale.
export const HEAD_META_RE = /<!-- HEAD-META[\s\S]*?\/HEAD-META -->/

export function buildHead({ title, description, url, image, type = 'website' }) {
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="${esc(type)}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
  ].join('\n    ')
  return `<!-- HEAD-META -->\n    ${tags}\n    <!-- /HEAD-META -->`
}

// Resolve a request path to its route meta. `/` (and any unknown/bracket-only
// slug — see sources/index.js) → the hub defaults; `/:slug` → that STATIC
// edition, derived from its config.
export function routeMeta(pathname, origin) {
  const image = `${origin}/og-default.png`
  const slug = pathname.replace(/^\/+/, '').split('/')[0]
  const source = slug ? getSource(slug) : null

  if (!source) {
    return {
      title: `${SITE_NAME} — the least annoying way to check the score`,
      description: 'Live scores, leaderboards and standings across every sport, in one calm board — no ads, no sign-in, no clutter, spoilers only if you want them.',
      url: `${origin}/`,
      image,
    }
  }

  const c = source.config
  const kindWord = c.kind === 'leaderboard' ? 'leaderboard' : 'standings'
  return {
    title: `${c.name} — live ${kindWord}`,
    description: `Follow the ${c.name} ${kindWord} live — updated as it happens, no ads, no sign-in.`,
    url: `${origin}/${slug}`,
    image,
  }
}
