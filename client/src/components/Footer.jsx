import './Footer.css'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <span>No ads &middot; no sign-in &middot; no cookie banner</span>
      <span className="footer-sep">·</span>
      <a href="https://bracket.cherryslabs.com" target="_blank" rel="noopener noreferrer">Brackets</a>
      <span className="footer-sep">·</span>
      <span>&copy; {year} Cherry&apos;s Labs</span>
      <span className="footer-sep">·</span>
      <a href="mailto:el@cherryslabs.com">el@cherryslabs.com</a>
    </footer>
  )
}
