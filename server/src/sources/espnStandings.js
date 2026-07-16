// Shared factory for ESPN football league-standings editions.
//
// Endpoint confirmed by a feed spike — and it's a REAL GOTCHA worth flagging
// loudly: the working path is `site.api.espn.com/apis/v2/sports/soccer/
// {league}/standings` (e.g. 'eng.1' for the Premier League). The
// `/apis/site/v2/...` path every other ESPN adapter in this codebase family
// uses (see espnLeaderboard.js, and bracket's tennisEdition.js/espnTeam.js)
// returns an EMPTY `{}` for standings specifically. Don't "fix" this to match
// the other adapters' path — it's deliberately different because that's what
// actually works.
//
// Confirmed rich: `note{color,description}` per entry is ESPN's own
// promotion/relegation/qualification zone system — passed through directly as
// `zone` (see shapes/standings.js for why there's no separate zone
// dictionary), and `stats[].rankChange` is a genuine upstream movement value
// (no self-diffing needed here, unlike golf). Confirmed ABSENT: no "form"
// (last-N-results) field anywhere — deliberately omitted from v1, see
// shapes/standings.js.
import './shapes/standings.js'

const BASE = 'https://site.api.espn.com/apis/v2/sports/soccer'

function stat(stats, name) {
  return stats.find(s => s.name === name)?.displayValue
}

function toNumber(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

export function createEspnStandingsEdition(opts) {
  const {
    slug, name, subtitle = null, accentColor = '#4ac97e',
    league, columns = ['P', 'W', 'D', 'L', 'GD', 'Pts'],
  } = opts

  const config = {
    slug, name, subtitle, sport: 'football', kind: 'standings', accentColor,
    finishedLabel: 'Final', scoreNoun: 'points', columns,
    capabilities: { form: false, provisional: false },
  }

  async function fetchStandings(season) {
    const url = `${BASE}/${league}/standings${season ? `?season=${season}` : ''}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Standings (${slug}) upstream → ${res.status}`)
    const body = await res.json()
    return body?.children?.[0]?.standings ?? null
  }

  function toRow(entry) {
    const stats = entry.stats ?? []
    const rankChange = toNumber(stat(stats, 'rankChange'))
    return {
      id: entry.team?.id ?? null,
      position: toNumber(stat(stats, 'rank')) ?? 0,
      // Sign convention (does +1 mean "up" or "down"?) was never confirmed
      // against a real mid-season change during the feed spike — only ever
      // observed 0 (a fully-completed season). Verify before relying on it.
      movement: rankChange,
      team: {
        id: entry.team?.id ?? null,
        name: entry.team?.displayName ?? entry.team?.name ?? 'TBD',
        crest: entry.team?.logos?.[0]?.href ?? null,
      },
      played: toNumber(stat(stats, 'gamesPlayed')) ?? 0,
      won: toNumber(stat(stats, 'wins')) ?? 0,
      drawn: toNumber(stat(stats, 'ties')) ?? 0,
      lost: toNumber(stat(stats, 'losses')) ?? 0,
      goalsFor: toNumber(stat(stats, 'pointsFor')),
      goalsAgainst: toNumber(stat(stats, 'pointsAgainst')),
      goalDiff: toNumber(stat(stats, 'pointDifferential')),
      points: toNumber(stat(stats, 'points')) ?? 0,
      zone: entry.note ? { color: entry.note.color, label: entry.note.description } : null,
    }
  }

  const adapter = {
    async getBoard() {
      let standings = await fetchStandings()
      let rows = (standings?.entries ?? []).map(toRow)

      // Season hasn't started (all zero games played) — show last season's
      // final table instead of an all-zero one. Mirrors bracket's "live if
      // in-season, else most-recent-completed" pattern, just without a fixed
      // MM-DD window (a season spans months, not a single tournament slot).
      if (rows.length && rows.every(r => r.played === 0)) {
        const lastYear = new Date().getUTCFullYear() - 1
        standings = await fetchStandings(lastYear)
        rows = (standings?.entries ?? []).map(toRow)
      }

      rows.sort((a, b) => a.position - b.position)
      const maxPlayed = rows.reduce((m, r) => Math.max(m, r.played), 0)

      return {
        kind: 'standings',
        event: {
          roundLabel: maxPlayed ? `Matchweek ${maxPlayed}` : 'Season not started',
          updatedAt: new Date().toISOString(),
          provisional: false,
        },
        rows,
      }
    },
  }

  return { config, adapter }
}
