// La Liga — via the shared standings factory. ESPN's soccer league code for
// La Liga is 'esp.1'.
import { createEspnStandingsEdition } from './espnStandings.js'

const edition = createEspnStandingsEdition({
  slug: 'la-liga',
  name: 'La Liga',
  subtitle: 'Football',
  accentColor: '#ee3524',
  league: 'esp.1',
  columns: ['P', 'W', 'D', 'L', 'GD', 'Pts'],
})

export const config = edition.config
export const adapter = edition.adapter
