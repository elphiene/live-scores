// PGA Championship — mid-May, via the shared golf leaderboard factory.
import { createEspnLeaderboardEdition } from './espnLeaderboard.js'

const edition = createEspnLeaderboardEdition({
  slug: 'pga-championship',
  name: 'PGA Championship',
  subtitle: 'Golf',
  accentColor: '#7c3aed',
  tour: 'pga',
  eventName: 'PGA Championship',
  window: { from: '05-05', to: '05-20' },
})

export const config = edition.config
export const adapter = edition.adapter
