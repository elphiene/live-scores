import { createContext, useContext, useCallback, useMemo, useState } from 'react'

// Spoiler settings: ported verbatim from bracket's useSpoiler.jsx (own
// localStorage namespace) — el's explicit requirement was that Live Scores
// ships with the same panel, not a placeholder. Three modes:
//   'off'   — show everything normally (default).
//   'delay' — show results, but only `delaySeconds` after first observed.
//             Meaningful for leaderboard boards (whole-board snapshot
//             substitution, same model as bracket's designed delay mode —
//             see useDelayedSnapshot.js). A NO-OP for standings boards: a
//             league table only changes when a match finishes, not by the
//             second, so time-shifting it hides nothing real — see
//             boardStatus.js and shapes/standings.js.
//   'hide'  — hide result-revealing UI. For leaderboard: scores/movement/
//             positions, same idea as bracket's match-card hide. For
//             standings: blank the form-adjacent bits and show only the
//             last-confirmed table (there is no "form" in v1, see
//             shapes/standings.js, so this currently just means "don't show
//             a live/provisional table" — which v1 never renders anyway).
// `spoilerFree` is kept as a derived boolean (true only in 'hide' mode) so
// consumers that just need a yes/no gate don't need to know about modes.
const MODE_KEY = 'live-scores:spoilerMode'
const DELAY_KEY = 'live-scores:spoilerDelay'
const DEFAULT_DELAY = 30
const MODES = ['off', 'delay', 'hide']

const SpoilerContext = createContext(null)

export function SpoilerProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    try {
      const stored = localStorage.getItem(MODE_KEY)
      return MODES.includes(stored) ? stored : 'off'
    } catch {
      return 'off'
    }
  })
  const [delaySeconds, setDelaySecondsState] = useState(() => {
    try {
      const stored = Number(localStorage.getItem(DELAY_KEY))
      return Number.isFinite(stored) && stored > 0 ? stored : DEFAULT_DELAY
    } catch {
      return DEFAULT_DELAY
    }
  })

  const setMode = useCallback(next => {
    setModeState(next)
    try { localStorage.setItem(MODE_KEY, next) } catch { /* private browsing */ }
  }, [])

  const setDelaySeconds = useCallback(next => {
    setDelaySecondsState(next)
    try { localStorage.setItem(DELAY_KEY, String(next)) } catch { /* private browsing */ }
  }, [])

  const value = useMemo(
    () => ({ mode, delaySeconds, setMode, setDelaySeconds, spoilerFree: mode === 'hide' }),
    [mode, delaySeconds, setMode, setDelaySeconds]
  )
  return <SpoilerContext.Provider value={value}>{children}</SpoilerContext.Provider>
}

export function useSpoiler() {
  const ctx = useContext(SpoilerContext)
  return ctx ?? {
    mode: 'off', delaySeconds: DEFAULT_DELAY,
    setMode: () => {}, setDelaySeconds: () => {}, spoilerFree: false,
  }
}
