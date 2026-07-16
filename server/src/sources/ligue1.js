// Ligue 1 — via the shared standings factory. ESPN's soccer league code for
// Ligue 1 is 'fra.1'.
import { createEspnStandingsEdition } from './espnStandings.js'

const edition = createEspnStandingsEdition({
  slug: 'ligue-1',
  name: 'Ligue 1',
  subtitle: 'Football',
  accentColor: '#003c82',
  league: 'fra.1',
  columns: ['P', 'W', 'D', 'L', 'GD', 'Pts'],
})

export const config = edition.config
export const adapter = edition.adapter
