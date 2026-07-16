// Premier League — via the shared standings factory. ESPN's soccer league
// code for the EPL is 'eng.1'.
import { createEspnStandingsEdition } from './espnStandings.js'

const edition = createEspnStandingsEdition({
  slug: 'premier-league',
  name: 'Premier League',
  subtitle: 'Football',
  accentColor: '#4ac97e',
  league: 'eng.1',
  columns: ['P', 'W', 'D', 'L', 'GD', 'Pts'],
})

export const config = edition.config
export const adapter = edition.adapter
