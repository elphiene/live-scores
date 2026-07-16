import { useState } from 'react'
import { useSpoiler } from '../hooks/useSpoiler'
import { shouldHideResult } from '../boardStatus'
import './LeaderboardBoard.css'

function MovementArrow({ movement }) {
  if (!movement) return null
  const up = movement > 0
  return (
    <svg className={`lb-move ${up ? 'lb-move-up' : 'lb-move-down'}`} viewBox="0 0 24 24" width="9" height="9">
      {up ? <path d="M18 15l-6-6-6 6" fill="none" stroke="currentColor" strokeWidth="3" />
           : <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="3" />}
    </svg>
  )
}

export default function LeaderboardBoard({ board, config }) {
  const { spoilerFree } = useSpoiler()
  const [showAll, setShowAll] = useState(false)

  if (!board) return null
  const hide = shouldHideResult('leaderboard', board, spoilerFree)
  const topN = config.topN ?? 10
  const rows = showAll ? board.rows : board.rows.slice(0, topN)

  if (!board.rows.length) {
    return <div className="lb-empty">No leaderboard yet — check back closer to the event.</div>
  }

  return (
    <section className="lb-wrap">
      <div className="lb-meta">{board.event.roundLabel}{board.event.cutLine != null ? ` · Cut ${board.event.cutLine}` : ''}</div>

      <div className="lb-headrow">
        <span>Pos</span><span>Player</span><span className="lb-r">{config.scoreNoun ?? 'Score'}</span>
        <span className="lb-r">{config.progressNoun === 'laps' ? 'Lap' : 'Thru'}</span>
        {config.multiRound && <span className="lb-r">Today</span>}
      </div>

      <div className="lb-rows">
        {rows.map((row, i) => (
          <div key={row.id} className={`lb-row${i === 0 ? ' lb-leader' : ''}`}>
            <span className="lb-pos">
              {row.posLabel}
              <MovementArrow movement={hide ? null : row.movement} />
            </span>
            <span className="lb-name">
              {row.flag && <img src={row.flag} alt="" className="lb-flag" />}
              {row.name}
              {row.status === 'cut' && <span className="lb-tag">CUT</span>}
            </span>
            <span className="lb-r lb-score">{hide ? '—' : row.scoreDisplay}</span>
            <span className="lb-r lb-dim">{hide ? '—' : row.progress.label}</span>
            {config.multiRound && (
              <span className="lb-r lb-dim">{hide ? '—' : (row.roundDisplay ?? '—')}</span>
            )}
          </div>
        ))}
      </div>

      {!showAll && board.rows.length > topN && (
        <button className="lb-more" onClick={() => setShowAll(true)}>
          Show all {board.rows.length}
        </button>
      )}
    </section>
  )
}
