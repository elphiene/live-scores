import './SiteSwitcher.css'

// Sibling to Labs Bracket (bracket.cherryslabs.com) — a persistent segmented
// tab in every header (hub + every edition page) so the other site is one click
// away regardless of scroll position, instead of buried in the footer.
// Mirror of the same component on the bracket side; keep the two in step.
// Navigates in the same tab: the two sites read as one product, and a tab per
// switch is not what a segmented control implies.
const SITES = [
  { key: 'bracket', label: 'Bracket', href: 'https://bracket.cherryslabs.com' },
  { key: 'scores', label: 'Scores', href: null },
]

export default function SiteSwitcher() {
  return (
    <div className="site-switcher" role="group" aria-label="Switch site">
      {SITES.map(s => (
        s.href ? (
          <a key={s.key} className="site-switcher-tab" href={s.href}>
            {s.label}
          </a>
        ) : (
          <span key={s.key} className="site-switcher-tab active" aria-current="page">{s.label}</span>
        )
      ))}
    </div>
  )
}
