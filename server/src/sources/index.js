// Source registry. Each STATIC entry (an ESPN-backed leaderboard/standings
// edition) is a module exporting { config, adapter } — see shapes/*.js for the
// normalised board contracts each adapter must satisfy. Add an edition = add a
// module + one line here; no route or client changes.
//
// The bracket source is different in kind: it's a FAN-OUT proxy over bracket's
// own already-deployed API, representing many editions dynamically (whatever
// bracket.cherryslabs.com currently has), not a single slug we register here.
// It only ever contributes to listSources()/live-now — it has no getBoard,
// because a bracket-kind item never renders inside Live Scores; clicking it
// opens bracketUrl in a new tab. So getSource()/getConfig()/getBoard() only
// ever need to resolve STATIC editions.
import * as theOpen from './theOpen.js'
import * as premierLeague from './premierLeague.js'
import * as bracketSource from './bracketSource.js'

const staticSources = {
  [theOpen.config.slug]: theOpen,
  [premierLeague.config.slug]: premierLeague,
}

// Sync lookup — only ever finds a static (ESPN) edition. A bracket-backed slug
// intentionally isn't resolvable here (see module comment above).
export function getSource(slug) {
  return staticSources[slug] ?? null
}

// Sync list of our own registered (slug, module) pairs — used by proxy.js's
// getHub to enrich each with live status/context (see summarise() there,
// mirroring bracket's own proxy.js pattern) and by getLiveNow to scan for
// live leaderboards, without either needing to know the internal Map shape.
export function listStaticEntries() {
  return Object.entries(staticSources)
}

// Every static edition's bare public config, for the Hub/sitemap.
function listStaticSources() {
  return Object.values(staticSources).map(s => ({ slug: s.config.slug, ...s.config }))
}

// Full cross-source list for the hub/sitemap: our own editions + whatever
// bracket.cherryslabs.com currently has (tagged kind:'bracket', with a
// bracketUrl). A failing bracket fetch degrades to just our own editions
// (bracketSource itself already falls back IP→domain and serve-stale before
// this ever throws — see bracketSource.js).
export async function listSources() {
  const [own, bracket] = await Promise.all([
    listStaticSources(),
    bracketSource.listEditions().catch(() => []),
  ])
  return [...own, ...bracket]
}

// The fallback edition for the root landing when nothing is live. ACTIVE_SOURCE
// (set by the systemd unit) selects it, defaulting to the first registered.
export function defaultSource() {
  const env = process.env.ACTIVE_SOURCE
  return env && staticSources[env] ? env : Object.keys(staticSources)[0]
}
