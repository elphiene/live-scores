// The bracket fan-out source — treats bracket's own already-deployed API as
// Live Scores' upstream for anything bracket-shaped (single-match knockout
// tournaments), instead of reimplementing World Cup/tennis-slam/AFL adapters
// here. Confirmed decision: hit the same-VM internal port first (fast, immune
// to any external DNS/tunnel hiccup), fall back to the public domain if that
// fails. No getBoard — a bracket-kind item never renders inside Live Scores;
// clicking it opens `bracketUrl` (always the PUBLIC domain — the internal IP
// is only reachable server-to-server) in a new tab, so this source only ever
// needs to list editions and surface live-now items.
import { getCached } from '../cache.js'

const INTERNAL = 'http://127.0.0.1:3001'
const PUBLIC = 'https://bracket.cherryslabs.com'

async function fetchBracket(path) {
  try {
    const res = await fetch(`${INTERNAL}${path}`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) throw new Error(`bracket internal ${path} → ${res.status}`)
    return await res.json()
  } catch {
    const res = await fetch(`${PUBLIC}${path}`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error(`bracket public ${path} → ${res.status}`)
    return res.json()
  }
}

// Edition summaries for the Hub/sitemap — bracket's /api/sports already
// returns almost exactly this shape (status/round/champion/startDate), we
// just tag kind + add the (always-public) bracketUrl.
export async function listEditions() {
  return getCached('bracket', 'editions', async () => {
    const editions = await fetchBracket('/api/sports')
    return editions.map(e => ({
      slug: e.slug,
      name: e.name,
      sport: e.sport,
      subtitle: e.subtitle,
      accentColor: e.accentColor,
      kind: 'bracket',
      status: e.status,
      liveCount: e.liveCount,
      round: e.round,
      champion: e.champion,
      startDate: e.startDate,
      bracketUrl: `${PUBLIC}/${e.slug}`,
    }))
  }, { ttl: 30_000 })
}

// Live-match items for the cross-source "live now" strip — bracket's
// /api/live-now is already the exact lightweight shape Live Scores wants.
export async function listLiveNow() {
  return getCached('bracket', 'live-now', async () => {
    const items = await fetchBracket('/api/live-now')
    return items.map(it => ({ ...it, kind: 'bracket', bracketUrl: `${PUBLIC}/${it.slug}` }))
  }, { ttl: 30_000 })
}
