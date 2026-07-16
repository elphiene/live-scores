const BASE = import.meta.env.VITE_API_URL

async function get(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`${path} → ${res.status}`)
  return res.json()
}

// Per-edition resources.
export const fetchConfig = slug => get(`/api/${slug}/config`)
export const fetchBoard  = slug => get(`/api/${slug}/board`)

// Cross-source.
export const fetchHub     = () => get('/api/hub')
export const fetchLiveNow = () => get('/api/live-now')
