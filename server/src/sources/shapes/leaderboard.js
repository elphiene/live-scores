// The normalised LEADERBOARD board — the contract for kind:'leaderboard'
// editions (golf majors, motorsport). Adapters map their upstream's JSON into
// THIS; the client renders it with no per-sport branches.
//
// This module is documentation only (no runtime code), mirroring bracket's
// shape.js. See espnLeaderboard.js for the concrete producer of this shape.
//
// A leaderboard BOARD (one poll snapshot — self-consistent, delay-able as a
// unit, same "snapshot substitution" model as bracket's designed delay mode —
// see client/src/hooks/useDelayedSnapshot.js):
// {
//   kind:  'leaderboard',
//   event: {
//     status:     'scheduled'|'live'|'finished',
//     round:      number|null,     // current round/session index (golf R3 → 3)
//     roundCount: number|null,     // total rounds (golf 4); null for single-session
//     roundLabel: string,          // 'Round 3', 'Race', 'Qualifying'
//     phase:      string|null,     // event-level session state (motorsport only,
//                                   //   e.g. 'quali'|'race'); null for golf
//     cutLine:    number|null,     // golf: to-par cut; null when N/A
//     updatedAt:  string,          // ISO — snapshot receipt boundary (feeds delay)
//   },
//   rows: [ LeaderboardRow, ... ]   // pre-sorted by the adapter into finishing order
// }
//
// LeaderboardRow:
// {
//   id:        string,             // stable competitor id (ESPN athlete/team id)
//   position:  number|null,        // 1-based; null/ties share a number, see posLabel
//   posLabel:  string,              // 'T4','1','—' — display-ready (handles ties/DSQ)
//   movement:  number|null,        // +n up / -n down / 0 unchanged / null=new-or-unknown.
//                                   // ALWAYS ADAPTER-COMPUTED by diffing this poll's
//                                   // positions against the previous cached snapshot
//                                   // (cache.js's peekCached) — confirmed via a feed
//                                   // spike that ESPN's golf scoreboard does NOT supply
//                                   // this itself (unlike standings, where it's a
//                                   // genuine upstream passthrough — see standings.js).
//                                   // Never client-derived (single-source-of-truth rule).
//   name:      string,
//   flag:      string|null,        // country flag (golf) or constructor/team logo
//   subtitle:  string|null,        // constructor/team name for racing, else null
//   // ── primary score: one numeric for sorting/diffing + one display string ──
//   scoreValue:   number|null,     // signed normalised number: to-par (−12), gap-seconds
//                                  //   (3.1), or points (98). Sortable; drives flash-diff.
//   scoreDisplay: string,          // adapter-formatted: '−12','E','+3.1s','DNF','98'
//   // ── progress through the event ──
//   progress: {
//     done:  number|null,          // holes played / laps completed. BEST-EFFORT — a feed
//                                  //   spike found no live tournament to confirm this
//                                  //   against for golf, so adapters may legitimately
//                                  //   leave this null in v1. The client must render a
//                                  //   sane "—" rather than assume it's always populated.
//     total: number|null,          // 18 / 52 — null when unbounded
//     label: string,               // display: '14','F','40/52','DNF','PIT'
//   },
//   // ── per-round contribution (multi-round only; null for single-session) ──
//   roundValue:   number|null,     // this round's score-to-par (−5)
//   roundDisplay: string|null,     // '−5','E', null when not applicable
//   status: 'active'|'finished'|'cut'|'dnf'|'dns'|'dsq',
//                                  // For golf: INFERRED, not an upstream field — compare
//                                  //   this competitor's linescores.length against the
//                                  //   event's current round; falling behind signals cut.
//                                  //   A heuristic, documented here so it isn't mistaken
//                                  //   for a real status flag later.
// }

export const LEADERBOARD_SHAPE = 'see comment above'
