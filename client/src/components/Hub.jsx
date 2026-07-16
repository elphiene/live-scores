import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchHub, fetchLiveNow } from '../api'
import { useSpoiler } from '../hooks/useSpoiler'
import { useTimezone } from '../hooks/useTimezone'
import { formatKickoff } from '../timeFormat'
import SpoilerToggle from './SpoilerToggle'
import TimezoneSelect from './TimezoneSelect'
import Footer from './Footer'
import './Hub.css'

const POLL_MS = 30_000
const STATUS_LABEL = { live: 'Live', upcoming: 'Upcoming', finished: 'Finished' }

// The hub landing at `/`: a real, bookmarkable home (not a redirect) — same
// pattern as bracket's own Hub. Shows a cross-sport live-now strip and a grid
// of every edition, own and bracket-backed alike. Bracket-backed items open
// bracket.cherryslabs.com in a NEW TAB (confirmed — keeps the rest of the
// live board alive rather than navigating away from it).
export default function Hub() {
  const navigate = useNavigate()
  const { spoilerFree } = useSpoiler()
  const { timezone } = useTimezone()
  const [editions, setEditions] = useState([])
  const [live, setLive] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchHub()
      .then(e => { if (!cancelled) setEditions(Array.isArray(e) ? e : []) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    let timer
    async function poll() {
      try {
        const l = await fetchLiveNow()
        if (!cancelled) setLive(Array.isArray(l) ? l : [])
      } catch {
        if (!cancelled) setLive([])
      }
      if (!cancelled) timer = setTimeout(poll, POLL_MS)
    }
    poll()
    return () => { cancelled = true; clearTimeout(timer) }
  }, [])

  function openEdition(e) {
    if (e.kind === 'bracket') window.open(e.bracketUrl, '_blank', 'noopener,noreferrer')
    else navigate(`/${e.slug}`)
  }

  function jumpToLive() {
    if (live[0]) openEdition(live[0].kind === 'bracket' ? live[0] : editions.find(e => e.slug === live[0].slug) ?? live[0])
  }

  // Own editions arrive with a ready-made `context` string (see proxy.js's
  // summariseOwn). Bracket-kind editions don't — they carry round/champion/
  // liveCount/startDate instead (bracket's own /api/sports shape, just
  // passed through by bracketSource.js), so derive the equivalent line here,
  // mirroring bracket's own Hub.jsx contextLine().
  function contextLine(e) {
    if (e.kind !== 'bracket') return e.context ?? ''
    if (e.status === 'live') return `${e.round ?? 'In progress'} · ${e.liveCount} live now`
    if (e.status === 'upcoming') return e.startDate ? `Starts ${formatKickoff(e.startDate, timezone)}` : 'Upcoming'
    if (e.status === 'finished') {
      if (spoilerFree) return `${e.round ?? 'Complete'} · result hidden`
      return e.champion ? `Won by ${e.champion}` : 'Completed'
    }
    return ''
  }

  const anyLive = live.length > 0

  return (
    <div className="hub">
      <header className="hub-header">
        <span className="hub-wordmark">LIVE SCORES</span>
        <div className="hub-controls">
          <SpoilerToggle />
          <TimezoneSelect />
        </div>
      </header>

      <section className="hub-hero">
        <h1 className="hub-title">The least annoying way to check the score.</h1>
        <p className="hub-sub">Live scores, leaderboards and standings across every sport — no ads, no sign-in, no clutter, spoilers only if you want them.</p>
        {anyLive && <button className="hub-jump" onClick={jumpToLive}>Jump to what&rsquo;s live &rarr;</button>}
      </section>

      {anyLive && (
        <section className="hub-block">
          <div className="hub-live-label"><span className="hub-live-dot" />LIVE NOW</div>
          <div className="hub-live-list">
            {live.map((it, i) => (
              <button
                key={`${it.kind}-${it.slug}-${i}`}
                className="hub-live-item"
                onClick={() => it.kind === 'bracket' ? window.open(it.bracketUrl, '_blank', 'noopener,noreferrer') : navigate(`/${it.slug}`)}
              >
                <span className="hub-live-eyebrow" style={{ color: it.accentColor }}>
                  {it.sportName}{it.roundLabel ? ` · ${it.roundLabel}` : ''}{it.kind === 'bracket' ? ' · bracket ↗' : ''}
                </span>
                {it.kind === 'bracket' ? (
                  <span className="hub-live-teams">{it.home} v {it.away}</span>
                ) : (
                  <span className="hub-live-teams">{it.leaderName} leads</span>
                )}
                {!spoilerFree && (
                  <span className="hub-live-score">
                    {it.kind === 'bracket' ? `${it.homeScore ?? 0}–${it.awayScore ?? 0}` : it.leaderScore}
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="hub-block">
        <div className="hub-section-label">Editions</div>
        {loading ? (
          <div className="hub-loading">Loading editions&hellip;</div>
        ) : (
          <div className="hub-grid">
            {editions.map(e => (
              <button
                key={`${e.kind}-${e.slug}`}
                className="hub-card"
                style={{ '--accent': e.accentColor }}
                onClick={() => openEdition(e)}
              >
                <span className="hub-card-bar" />
                <span className="hub-card-content">
                  <span className="hub-card-top">
                    <span className="hub-card-eyebrow">{e.sport}{e.kind === 'bracket' ? ' · bracket ↗' : ''}</span>
                    {e.status && (
                      <span className={`hub-pill hub-pill-${e.status}`}>
                        {e.status === 'live' && <span className="hub-pill-dot" />}
                        {STATUS_LABEL[e.status]}
                      </span>
                    )}
                  </span>
                  <span className="hub-card-name">{e.name}</span>
                  <span className="hub-card-ctx">
                    {e.kind !== 'bracket' && spoilerFree && e.status === 'finished' ? 'Result hidden' : contextLine(e)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  )
}
