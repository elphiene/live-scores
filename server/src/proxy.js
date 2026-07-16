// Route handlers. Each resolves `:slug` → a static (ESPN) source, then runs it
// through the generic cache. Bracket-backed items never reach getConfig/
// getBoard — they're listed (via getHub/getLiveNow) but rendered by opening
// bracketUrl in a new tab, never fetched as a board here. Mirrors bracket's
// own proxy.js: this file is transport only, all upstream/normalisation
// knowledge lives in the sources.
import { getSource, listSources, listStaticEntries } from './sources/index.js'
import { listLiveNow as listBracketLiveNow } from './sources/bracketSource.js'
import { getCached } from './cache.js'

function resolve(req, res) {
  const source = getSource(req.params.slug)
  if (!source) {
    res.status(404).json({ error: `unknown edition: ${req.params.slug}` })
    return null
  }
  return source
}

export function getConfig(req, res) {
  const s = resolve(req, res); if (!s) return
  res.json(s.config)
}

export async function getBoard(req, res) {
  const s = resolve(req, res); if (!s) return
  try {
    res.json(await getCached(s.config.slug, 'board', () => s.adapter.getBoard(), { liveAware: true }))
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
}

// Light per-edition summary for our OWN sources (bracket-kind items already
// arrive fully summarised from bracketSource.listEditions()). Mirrors
// bracket's own proxy.js summarise() — status + a short human context line.
function summariseOwn(config, board) {
  if (config.kind === 'leaderboard') {
    const status = board.event.status === 'live' ? 'live'
      : board.event.status === 'finished' ? 'finished' : 'upcoming'
    const leader = board.rows[0]
    const context = status === 'live' ? `${board.event.roundLabel} · ${leader?.name ?? ''} leads`
      : status === 'finished' ? `Won by ${leader?.name ?? 'TBD'}`
      : 'Starting soon'
    return { status, context }
  }
  // standings: no live/upcoming/finished concept (see boardStatus.js) —
  // just the current matchweek as context, no status pill.
  return { status: null, context: board.event.roundLabel }
}

// Every edition (our own, enriched with live status/context + bracket's,
// already enriched) for the Hub + sitemap.
export async function getHub(_req, res) {
  const [own, bracket] = await Promise.all([
    Promise.all(listStaticEntries().map(async ([slug, s]) => {
      try {
        const board = await getCached(slug, 'board', () => s.adapter.getBoard(), { liveAware: true })
        return { slug, ...s.config, ...summariseOwn(s.config, board) }
      } catch {
        return { slug, ...s.config, status: null, context: null }
      }
    })),
    listSources().then(all => all.filter(e => e.kind === 'bracket')).catch(() => []),
  ])
  res.json([...own, ...bracket])
}

// Cross-source "live now": our own live leaderboards (standings never go
// here — a table has no per-second live moment, see shapes/standings.js)
// plus bracket's live matches. A failing source doesn't sink the rest.
export async function getLiveNow(_req, res) {
  const items = []

  for (const [slug, s] of listStaticEntries()) {
    if (s.config.kind !== 'leaderboard') continue
    try {
      const board = await getCached(slug, 'board', () => s.adapter.getBoard(), { liveAware: true })
      if (board.event.status !== 'live') continue
      const leader = board.rows[0]
      if (!leader) continue
      items.push({
        kind: 'leaderboard',
        slug,
        sportName: s.config.name,
        accentColor: s.config.accentColor,
        roundLabel: board.event.roundLabel,
        leaderName: leader.name,
        leaderScore: leader.scoreDisplay,
      })
    } catch {
      // ignore a failing source; keep scanning
    }
  }

  try {
    items.push(...await listBracketLiveNow())
  } catch {
    // ignore — bracketSource already falls back IP→domain and serves stale
  }

  res.json(items)
}
