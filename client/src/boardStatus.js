// Single source of truth for board/spoiler state — the boardStatus.js
// analogue of bracket's matchStatus.js. Anything deciding whether to hide a
// result must go through here, not re-derive it in a component.
//
// v1 scope, deliberately: only 'hide' mode does anything (mirrors bracket's
// own current state — 'delay' is a real, designed mechanism but not yet
// wired to any renderer in either app, see useSpoiler.jsx). Leaderboard and
// standings get genuinely different treatment, per the architecture plan:
//   - leaderboard: hide is a straightforward "don't show the live/finished
//     result" gate, same idea as bracket's match-level shouldHideResult.
//   - standings: v1 has NOTHING to hide yet — form was cut from v1 (see
//     shapes/standings.js) and v1 never renders a live/provisional table
//     (always the last-confirmed one), so there's no result-shaped field
//     left to redact. This returns false unconditionally, on purpose, not
//     as an oversight — revisit if/when form or a live table ships.
export function shouldHideResult(kind, board, spoilerFree) {
  if (!spoilerFree) return false
  if (kind === 'leaderboard') {
    return board?.event?.status === 'live' || board?.event?.status === 'finished'
  }
  return false
}
