import { useState, useEffect, useRef } from 'react'
import { fetchConfig, fetchBoard } from '../api'

// Ported from bracket's useMatches.js — same two-tier poll cadence, same
// init/poll/cleanup shape. "Live" here is board.event.status === 'live',
// which standings boards never set (see cache.js's isLive) — so a standings
// page always polls at the idle cadence, matching the "a table doesn't
// change by the second" finding.
const TTL_LIVE = 30_000
const TTL_IDLE = 60_000

const DEFAULT_CONFIG = {
  name: '',
  subtitle: '',
  sport: '',
  kind: 'leaderboard',
  accentColor: '#f7b731',
  finishedLabel: 'Final',
}

export function useBoard(slug) {
  const [board, setBoard] = useState(null)
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const boardRef = useRef(null)

  useEffect(() => {
    if (!slug) return
    let timer
    let cancelled = false

    function nextDelay() {
      return boardRef.current?.event?.status === 'live' ? TTL_LIVE : TTL_IDLE
    }

    async function poll() {
      try {
        const b = await fetchBoard(slug)
        if (cancelled) return
        boardRef.current = b
        setBoard(b)
        setError(null)
      } catch (e) {
        if (!cancelled) setError(e.message)
      }
      if (cancelled) return
      timer = setTimeout(poll, nextDelay())
    }

    async function init() {
      setLoading(true)
      try {
        const [cfg, b] = await Promise.all([fetchConfig(slug), fetchBoard(slug)])
        if (cancelled) return
        boardRef.current = b
        setConfig(cfg)
        setBoard(b)
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
      if (cancelled) return
      timer = setTimeout(poll, nextDelay())
    }

    init()
    return () => { cancelled = true; clearTimeout(timer) }
  }, [slug])

  return { board, config, loading, error }
}
