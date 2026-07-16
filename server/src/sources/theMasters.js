// The Masters — early April, via the shared golf leaderboard factory.
import { createEspnLeaderboardEdition } from './espnLeaderboard.js'

const edition = createEspnLeaderboardEdition({
  slug: 'the-masters',
  name: 'The Masters',
  subtitle: 'Golf',
  accentColor: '#0b6e4f',
  tour: 'pga',
  eventName: 'Masters Tournament',
  window: { from: '04-01', to: '04-15' },
})

export const config = edition.config
export const adapter = edition.adapter
