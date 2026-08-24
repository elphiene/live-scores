import express from 'express'
import cors from 'cors'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, readFileSync, statSync } from 'fs'
import { getHub, getLiveNow, getConfig, getBoard } from './proxy.js'
import { listSources } from './sources/index.js'
import { buildHead, routeMeta, HEAD_META_RE } from './meta.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = join(__dirname, '../../client/dist')

const app = express()
const PORT = process.env.PORT || 3002

// Public canonical origin, used for canonical/OG URLs and the sitemap. Override
// via env if the deploy domain ever changes.
const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://scores.cherryslabs.com'

app.use(cors())
app.use(express.json())

// Cross-source (single-segment paths — no conflict with /api/:slug/*).
app.get('/api/hub', getHub)
app.get('/api/live-now', getLiveNow)

// ── Crawler files (generated from the registry so they track new editions) ──
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`)
})

app.get('/sitemap.xml', async (_req, res) => {
  const editions = await listSources()
  const paths = ['/', ...editions.map(e => `/${e.slug}`)]
  const urls = paths
    .map(p => `  <url><loc>${SITE_ORIGIN}${p}</loc><changefreq>${p === '/' ? 'daily' : 'hourly'}</changefreq></url>`)
    .join('\n')
  res
    .type('application/xml')
    .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`)
})

// Per-edition.
app.get('/api/:slug/config', getConfig)
app.get('/api/:slug/board', getBoard)

// Serve built client if dist exists. `index: false` so `/` falls through to the
// meta-injecting fallback instead of static serving the raw index.html.
if (existsSync(DIST)) {
  app.use(express.static(DIST, { index: false }))

  // index.html is re-read whenever it changes on disk. Caching it for the
  // life of the process turned every client rebuild into a silent outage: a
  // deploy here IS `npm run build` into this very directory (there is no
  // staging copy), and Vite writes new content-hashed asset names and deletes
  // the old ones — so the cached page kept pointing at files that no longer
  // existed until someone restarted the service. One statSync per request is
  // nothing at this traffic, and it makes a build a complete deploy.
  const INDEX_HTML = join(DIST, 'index.html')
  let template = null
  let templateMtime = -1
  function indexTemplate() {
    try {
      const { mtimeMs } = statSync(INDEX_HTML)
      if (template === null || mtimeMs !== templateMtime) {
        template = readFileSync(INDEX_HTML, 'utf8')
        templateMtime = mtimeMs
      }
    } catch {
      if (template === null) template = ''
    }
    return template
  }

  // A request for a missing *asset* must 404 rather than fall through to the
  // SPA shell. Answering /assets/index-abc123.js with a 200 and an HTML body
  // is what made a stale deploy invisible: every status-code check passed
  // while browsers got HTML where they asked for JavaScript, and rendered a
  // blank page. Routes without a file extension still fall through, because
  // those are real client routes (/tennis, /afl, …).
  const ASSET_RE = /\.(?:js|mjs|css|map|png|jpe?g|gif|svg|ico|webp|avif|woff2?|ttf|eot|json|txt|xml|webmanifest)$/i

  // SPA fallback: serve index.html for any non-asset route, injecting per-route
  // title/description/OG tags (see meta.js) so shared links preview correctly.
  app.get('*', (req, res) => {
    if (ASSET_RE.test(req.path)) {
      res.status(404).type('text/plain').send('Not found')
      return
    }
    const html = indexTemplate().replace(HEAD_META_RE, buildHead(routeMeta(req.path, SITE_ORIGIN)))
    res.type('html').send(html)
  })
}

app.listen(PORT, () => console.log(`live-scores on :${PORT}`))
