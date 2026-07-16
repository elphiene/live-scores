// U.S. Open (golf) — mid-June, via the shared golf leaderboard factory.
// Slug is deliberately not just "us-open" — Live Scores may add tennis's
// US Open later, and the two must never collide.
import { createEspnLeaderboardEdition } from './espnLeaderboard.js'

const edition = createEspnLeaderboardEdition({
  slug: 'us-open-golf',
  name: 'U.S. Open',
  subtitle: 'Golf',
  accentColor: '#1d4ed8',
  tour: 'pga',
  eventName: 'U.S. Open',
  window: { from: '06-10', to: '06-25' },
})

export const config = edition.config
export const adapter = edition.adapter
