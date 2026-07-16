// The normalised STANDINGS board — the contract for kind:'standings' editions
// (league tables). Adapters map their upstream's JSON into THIS; the client
// renders it with no per-league branches.
//
// This module is documentation only (no runtime code), mirroring bracket's
// shape.js. See espnStandings.js for the concrete producer of this shape.
//
// A standings BOARD:
// {
//   kind:  'standings',
//   event: {
//     roundLabel:  string,   // 'Matchweek 34'
//     updatedAt:   string,   // ISO — last result incorporated (the freshness boundary)
//     provisional: boolean,  // true if a live match is currently shifting the table
//   },
//   rows: [ StandingsRow, ... ]   // pre-sorted by the adapter (league sort order)
// }
//
// StandingsRow:
// {
//   id:        string,       // stable team id
//   position:  number,
//   movement:  number|null,  // position change vs the previous published table. A
//                             //   GENUINE UPSTREAM PASSTHROUGH (ESPN's own `rankChange`
//                             //   stat) — confirmed present via a feed spike, unlike
//                             //   leaderboard movement, which has to be self-computed.
//                             //   CAVEAT: only ever observed as 0 (a fully-completed
//                             //   season, nothing left to change) — the sign convention
//                             //   (does positive mean "moved up" or "moved down"?) was
//                             //   never actually verified against a real change. Confirm
//                             //   with a mid-season snapshot before shipping this in the UI.
//   team:      { id, name, crest|null },
//   played:    number,
//   won:       number,
//   drawn:     number,       // ties/OT — which columns exist at all is config-driven,
//   lost:      number,       //   see config.columns below (NHL/NFL differ from soccer)
//   goalsFor:  number|null,
//   goalsAgainst: number|null,
//   goalDiff:  number|null,
//   points:    number,
//   zone: { color: string, label: string } | null,
//                             // DIRECT PASSTHROUGH of ESPN's own `note{color,description}`
//                             // per row — deliberately NOT reduced to a zone *key* looked
//                             // up in a client-side config.zones dictionary, as first
//                             // designed. A feed spike found ESPN already hands over a
//                             // ready-made colour+label per row (confirmed both
//                             // "Champions League" green and "Relegation" red on the same
//                             // table, non-zone rows get `note: null`) — inventing our own
//                             // dictionary on top would just be a redundant indirection
//                             // layer for something the upstream already solved. The
//                             // client renders `zone.color` as the row's left-edge accent
//                             // bar directly, and builds its legend from the distinct
//                             // `zone.label`s present in `rows`.
// }
//
// NOTE — "form" (last-5 results) is DELIBERATELY OMITTED from v1. No ESPN
// standings field carries it; getting it means a second per-team fetch
// (recent results/schedule) and stitching it in. That's real added complexity
// for a nice-to-have, cut for v1 rather than deferred-with-a-fetch — add it
// back later only if it proves worth the extra upstream call.
//
// NOTE — spoiler-mode applicability differs in kind from bracket/leaderboard:
// seconds-based DELAY is a no-op here (a table only changes when a match
// finishes, hours apart — time-shifting it 30s hides nothing real). HIDE mode
// instead should show only the last-confirmed table (drop any live/provisional
// movement) — the real spoiler risk is "the result that changed the table,"
// not the cells themselves. See client/src/boardStatus.js.

export const STANDINGS_SHAPE = 'see comment above'
