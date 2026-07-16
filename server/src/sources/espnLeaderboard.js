// Shared factory for ESPN golf leaderboard editions (majors first; motorsport
// will need its own factory later — racing's gap-to-leader/time scoring and
// session phases stress parts of the shape golf never exercises, per the
// architecture plan's recommendation not to conflate the two in v1).
//
// Endpoint confirmed by a feed spike: `site.api.espn.com/apis/site/v2/sports/
// golf/{tour}/scoreboard` (tour='pga' covers the majors too — The Open shows
// up in the PGA tour's event list by name). No auth. `?dates=YYYYMMDD-YYYYMMDD`
// selects a specific window, same idea as bracket's tennisEdition.js.
//
// Confirmed live: competitors arrive pre-sorted by `order` (= leaderboard
// position, and already correctly ranks cut players below the cut line
// regardless of score). Confirmed ABSENT: no "thru" (holes completed this
// round) and no movement field — the dedicated /leaderboard and /summary
// endpoint variants both 404/502'd during the spike, and no tournament was
// actually live to test against, so live-only fields may exist and just
// weren't reachable — worth a follow-up spike during a real live round.
import { peekCached } from '../cache.js'
import './shapes/leaderboard.js'

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/golf'

function normaliseStatus(state) {
  if (state === 'in') return 'live'
  if (state === 'post') return 'finished'
  return 'scheduled'
}

// '-4' → -4, 'E' → 0, '+16' → 16. Returns null for anything unparseable
// (upstream can legitimately send 'CUT'/'WD' in the score slot in some
// responses — not observed in the spike, but guarded against).
function parseToPar(score) {
  if (score == null) return null
  if (score === 'E') return 0
  const n = Number(String(score).replace(/^\+/, ''))
  return Number.isNaN(n) ? null : n
}

// Resolve ESPN's ?dates= window for the most recent occurrence of a month/day
// range — copied from bracket's tennisEdition.js (same problem: a fixed
// calendar slot should show the live event in-season, most-recent-completed
// out-of-season).
function resolveDates(window, now = new Date()) {
  if (!window) return ''
  const y = now.getUTCFullYear()
  const [fm, fd] = window.from.split('-').map(Number)
  const thisYearStart = Date.UTC(y, fm - 1, fd)
  const occYear = now.getTime() >= thisYearStart ? y : y - 1
  const from = `${occYear}${window.from.replace('-', '')}`
  const to = `${occYear + (window.to < window.from ? 1 : 0)}${window.to.replace('-', '')}`
  return `${from}-${to}`
}

export function createEspnLeaderboardEdition(opts) {
  const {
    slug, name, subtitle = null, accentColor = '#57a773',
    tour = 'pga', eventName, window = null, roundCount = 4,
  } = opts

  const config = {
    slug, name, subtitle, sport: 'golf', kind: 'leaderboard', accentColor,
    finishedLabel: 'Final', scoreFormat: 'to-par', scoreNoun: 'to par',
    progressNoun: 'holes', roundNoun: 'round', multiRound: true, topN: 10,
    capabilities: { movement: true, roundScore: true, cut: true },
  }

  async function fetchScoreboard() {
    const dates = resolveDates(window)
    const url = `${BASE}/${tour}/scoreboard${dates ? `?dates=${dates}` : ''}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Golf (${slug}) upstream → ${res.status}`)
    return res.json()
  }

  function findEvent(body) {
    return (body.events ?? []).find(e =>
      e.name?.toLowerCase().includes(eventName.toLowerCase())
    ) ?? null
  }

  // Best-effort "which round is active" — ESPN's golf scoreboard doesn't
  // expose this at the event level, so infer it from how many rounds the
  // tournament LEADER (order:1) has a linescore entry for.
  function currentRound(competitors) {
    const leader = competitors.find(c => c.order === 1)
    const played = (leader?.linescores ?? []).filter(ls => ls.value != null).length
    return Math.max(1, Math.min(played, roundCount))
  }

  function toRow(comp, round, prevPositions) {
    const linescores = comp.linescores ?? []
    const roundEntry = linescores.find(ls => ls.period === round)
    const scoreValue = parseToPar(comp.score)
    const finishedRounds = linescores.filter(ls => ls.value != null).length

    const prevPos = prevPositions.get(String(comp.id))
    const movement = prevPos != null ? prevPos - comp.order : null

    return {
      id: String(comp.id),
      position: comp.order ?? null,
      // TODO(v2): proper tie handling ('T4') — v1 shows a plain rank.
      posLabel: String(comp.order ?? '—'),
      movement,
      name: comp.athlete?.displayName ?? 'TBD',
      flag: comp.athlete?.flag?.href ?? null,
      subtitle: null,
      scoreValue,
      scoreDisplay: comp.score ?? '—',
      progress: {
        done: null, // not available from this endpoint — see module comment
        total: 18,
        label: roundEntry?.value != null ? 'F' : '—',
      },
      roundValue: roundEntry ? parseToPar(roundEntry.displayValue) : null,
      roundDisplay: roundEntry?.displayValue ?? null,
      // Heuristic, not an upstream field: a player who stopped accumulating
      // rounds while the field has moved on is presumed cut.
      status: finishedRounds < round - 1 && round > 2 ? 'cut' : 'active',
    }
  }

  const adapter = {
    async getBoard() {
      const body = await fetchScoreboard()
      const event = findEvent(body)
      if (!event) {
        return { kind: 'leaderboard', event: { status: 'scheduled', round: null, roundCount, roundLabel: 'Scheduled', phase: null, cutLine: null, updatedAt: new Date().toISOString() }, rows: [] }
      }

      const status = normaliseStatus(event.status?.type?.state)
      const competitors = (event.competitions?.[0]?.competitors ?? []).slice().sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
      const round = status === 'scheduled' ? 0 : currentRound(competitors)

      const prev = peekCached(slug, 'board')
      const prevPositions = new Map((prev?.rows ?? []).map(r => [r.id, r.position]))

      return {
        kind: 'leaderboard',
        event: {
          status,
          round: round || null,
          roundCount,
          roundLabel: status === 'scheduled' ? 'Scheduled' : `Round ${round}`,
          phase: null,
          cutLine: null,
          updatedAt: new Date().toISOString(),
        },
        rows: competitors.map(c => toRow(c, round, prevPositions)),
      }
    },
  }

  return { config, adapter }
}
