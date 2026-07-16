// Bundesliga — via the shared standings factory. ESPN's soccer league code
// for the Bundesliga is 'ger.1'.
import { createEspnStandingsEdition } from './espnStandings.js'

const edition = createEspnStandingsEdition({
  slug: 'bundesliga',
  name: 'Bundesliga',
  subtitle: 'Football',
  accentColor: '#d20515',
  league: 'ger.1',
  columns: ['P', 'W', 'D', 'L', 'GD', 'Pts'],
})

export const config = edition.config
export const adapter = edition.adapter
