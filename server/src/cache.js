// Generic per-source, per-resource in-memory cache — ported from bracket's
// cache.js (same two-tier TTL model), extended with `peekCached` so an
// adapter can read the PREVIOUS snapshot before overwriting it — needed to
// compute server-side movement/position-change by diffing (see
// espnLeaderboard.js), the same "derive once, server-side" discipline
// bracket's matchStatus.js documents for match state.
//
// Keyed by `${slug}:${resource}`. Two-tier TTL: 30s while a board is live
// (leaderboard only — standings boards never set `event.status`, so they
// always use the idle TTL; a table only meaningfully changes once a match
// finishes, not by the second). On producer failure we serve the last-good
// value (stale) instead of throwing — the handler only errors if there is no
// cached value at all.

export const TTL_LIVE  = 30_000
export const TTL_IDLE  = 60_000
export const TTL_LONG  = 3_600_000

const store = new Map() // `${slug}:${resource}` → { data, fetchedAt }

function isLive(data) {
  if (Array.isArray(data)) return data.some(m => m?.status === 'live')
  return data?.event?.status === 'live'
}

// Read the currently-cached value WITHOUT triggering a fetch — lets a
// producer diff its new result against the last one before returning
// (e.g. to compute a leaderboard row's movement since the last poll).
export function peekCached(slug, resource) {
  return store.get(`${slug}:${resource}`)?.data ?? null
}

// producer: async () => data
// opts.liveAware: shorten the TTL to TTL_LIVE when the cached data is live
// opts.ttl:       override the idle TTL (e.g. TTL_LONG)
export async function getCached(slug, resource, producer, opts = {}) {
  const key = `${slug}:${resource}`
  const entry = store.get(key)
  const now = Date.now()

  let ttl = opts.ttl ?? TTL_IDLE
  if (opts.liveAware && entry && isLive(entry.data)) ttl = TTL_LIVE

  if (entry && now - entry.fetchedAt < ttl) return entry.data

  try {
    const data = await producer()
    store.set(key, { data, fetchedAt: now })
    return data
  } catch (err) {
    if (entry) return entry.data // serve stale rather than error
    throw err
  }
}
