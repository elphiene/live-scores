// Serie A — via the shared standings factory. ESPN's soccer league code for
// Serie A is 'ita.1'.
import { createEspnStandingsEdition } from './espnStandings.js'

const edition = createEspnStandingsEdition({
  slug: 'serie-a',
  name: 'Serie A',
  subtitle: 'Football',
  accentColor: '#00518a',
  league: 'ita.1',
  columns: ['P', 'W', 'D', 'L', 'GD', 'Pts'],
})

export const config = edition.config
export const adapter = edition.adapter
