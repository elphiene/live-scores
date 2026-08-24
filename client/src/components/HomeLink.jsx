import { Link } from 'react-router-dom'
import './HomeLink.css'

// Back-to-hub link. Every edition page was otherwise a dead end — the only
// way back to `/` was the browser's back button — so this puts a way home in
// the header on every page.
export default function HomeLink() {
  return (
    <Link to="/" className="home-link" title="Back to the hub" aria-label="Back to home">
      <svg className="home-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 11l9-8 9 8" />
        <path d="M5 10v10h14V10" />
      </svg>
      <span className="home-label">Home</span>
    </Link>
  )
}
