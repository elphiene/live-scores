import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchLiveNow } from '../api'
import { useSpoiler } from '../hooks/useSpoiler'
import './LiveBanner.css'

const POLL_MS = 30_000

// Thin cross-source ticker mounted atop an edition page: shows every live
// item across the whole site (bracket + our own leaderboards), excluding the
// one you're already viewing. Ported from bracket's LiveBanner.jsx.
export default function LiveBanner({ current }) {
  const navigate = useNavigate()
  const { spoilerFree } = useSpoiler()
  const [items, setItems] = useState([])

  useEffect(() => {
    let cancelled = false
    let timer
    async function poll() {
      try {
        const live = await fetchLiveNow()
        if (!cancelled) setItems(Array.isArray(live) ? live : [])
      } catch {
        if (!cancelled) setItems([])
      }
      if (!cancelled) timer = setTimeout(poll, POLL_MS)
    }
    poll()
    return () => { cancelled = true; clearTimeout(timer) }
  }, [])

  const shown = items.filter(it => it.slug !== current)
  if (!shown.length) return null

  const track = [...shown, ...shown]

  return (
    <div className="live-banner" role="region" aria-label="Live now">
      <div className="live-banner-track">
        {track.map((it, i) => (
          <button
            key={`${it.slug}-${i}`}
            className="live-banner-item"
            style={{ '--dot': it.accentColor }}
            onClick={() => it.kind === 'bracket' ? window.open(it.bracketUrl, '_blank', 'noopener,noreferrer') : navigate(`/${it.slug}`)}
            aria-hidden={i >= shown.length ? true : undefined}
            tabIndex={i >= shown.length ? -1 : undefined}
          >
            <span className="live-banner-dot" />
            <span className="live-banner-tag">NOW LIVE</span>
            <span className="live-banner-sport">{it.sportName}</span>
            <span className="live-banner-sep">·</span>
            {it.kind === 'bracket' ? (
              <>
                <span className="live-banner-teams">{it.home} v {it.away}</span>
                {!spoilerFree && <span className="live-banner-score">{it.homeScore ?? 0}–{it.awayScore ?? 0}</span>}
              </>
            ) : (
              <span className="live-banner-teams">
                {it.leaderName} leads{!spoilerFree ? ` · ${it.leaderScore}` : ''}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
