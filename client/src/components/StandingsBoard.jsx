import { useTimezone } from '../hooks/useTimezone'
import { formatKickoff } from '../timeFormat'
import './StandingsBoard.css'

// Column code → display value off a StandingsRow. Which columns render at
// all is config-driven (config.columns) so the same component serves any
// league's table shape (soccer's D differs from NHL's OTL, etc. — see
// shapes/standings.js) without per-league branching here.
function columnValue(code, row) {
  switch (code) {
    case 'P': return row.played
    case 'W': return row.won
    case 'D': return row.drawn
    case 'L': return row.lost
    case 'GD': return row.goalDiff != null ? (row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff) : '—'
    case 'Pts': return row.points
    default: return '—'
  }
}

export default function StandingsBoard({ board, config }) {
  const { timezone } = useTimezone()

  if (!board) return null
  if (!board.rows.length) {
    return <div className="st-empty">{board.event.roundLabel || 'No table yet'}</div>
  }

  const columns = config.columns ?? ['P', 'W', 'D', 'L', 'GD', 'Pts']
  const zones = [...new Map(
    board.rows.filter(r => r.zone).map(r => [r.zone.label, r.zone])
  ).values()]

  return (
    <section className="st-wrap">
      <div className="st-meta">{board.event.roundLabel}</div>

      <div className="st-scroll">
        <div className="st-table" style={{ '--cols': columns.length }}>
          <div className="st-headrow">
            <span>#</span><span>Club</span>
            {columns.map(c => <span key={c} className="st-r">{c}</span>)}
          </div>

          {board.rows.map(row => (
            <div
              key={row.id}
              className="st-row"
              style={row.zone ? { borderLeftColor: row.zone.color } : undefined}
            >
              <span className="st-pos">{row.position}</span>
              <span className="st-team">
                {row.team.crest && <img src={row.team.crest} alt="" className="st-crest" />}
                {row.team.name}
              </span>
              {columns.map(c => (
                <span key={c} className={`st-r${c === 'Pts' ? ' st-pts' : ''}`}>{columnValue(c, row)}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {zones.length > 0 && (
        <div className="st-legend">
          {zones.map(z => (
            <span key={z.label} className="st-legend-item">
              <span className="st-legend-dot" style={{ background: z.color }} />
              {z.label}
            </span>
          ))}
        </div>
      )}

      <div className="st-updated">Updated {formatKickoff(board.event.updatedAt, timezone)}</div>
    </section>
  )
}
