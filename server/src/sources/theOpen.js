// The Open Championship — mid-July, via the shared golf leaderboard factory.
// ESPN lists it under the PGA tour's own scoreboard (majors show up there
// alongside regular Tour events), matched by name.
import { createEspnLeaderboardEdition } from './espnLeaderboard.js'

const edition = createEspnLeaderboardEdition({
  slug: 'the-open',
  name: 'The Open Championship',
  subtitle: 'Golf',
  accentColor: '#57a773',
  tour: 'pga',
  eventName: 'The Open',
  window: { from: '07-10', to: '07-21' },
})

export const config = edition.config
export const adapter = edition.adapter
