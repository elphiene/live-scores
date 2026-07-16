import { useParams } from 'react-router-dom'
import { useBoard } from './hooks/useBoard'
import { ConfigProvider } from './hooks/useConfig'
import LeaderboardBoard from './components/LeaderboardBoard'
import StandingsBoard from './components/StandingsBoard'
import LiveBanner from './components/LiveBanner'
import SpoilerToggle from './components/SpoilerToggle'
import TimezoneSelect from './components/TimezoneSelect'
import Footer from './components/Footer'
import './App.css'

export default function App() {
  const { slug } = useParams()
  const { board, config, loading, error } = useBoard(slug)

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading…</div>
        <Footer />
      </div>
    )
  }

  return (
    <ConfigProvider config={config}>
      <div className="app">
        <LiveBanner current={slug} />
        <header className="site-header">
          {config.sport && <div className="header-eyebrow">{config.sport.toUpperCase()}</div>}
          <h1 className="header-title">{config.name}</h1>
          {config.subtitle && <div className="header-sub">{config.subtitle}</div>}
          <div className="header-controls">
            <SpoilerToggle />
            <TimezoneSelect />
          </div>
        </header>

        {error && <div className="error-banner">API error: {error}</div>}

        <div className="board-section">
          {config.kind === 'standings' ? (
            <StandingsBoard board={board} config={config} />
          ) : (
            <LeaderboardBoard board={board} config={config} />
          )}
        </div>

        <Footer />
      </div>
    </ConfigProvider>
  )
}
