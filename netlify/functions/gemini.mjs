// Server-side proxy for the Gemini API.
// The API key lives only here (Netlify env var GEMINI_API_KEY) and never reaches
// the browser bundle. The client calls /.netlify/functions/gemini?path=… and we
// forward to Google with the key attached, streaming the response straight back
// (works for both JSON generateContent and SSE streamGenerateContent).

const BASE = 'https://generativelanguage.googleapis.com/v1beta'

// Only the exact endpoints the app uses are forwardable — so the proxy can't be
// turned into a general-purpose key for arbitrary Google calls.
function pathAllowed(path) {
  return path === 'models' ||
    /^models\/[\w.-]+:(generateContent|streamGenerateContent)$/.test(path)
}

function corsHeaders(origin) {
  const h = new Headers()
  if (origin) { h.set('Access-Control-Allow-Origin', origin); h.set('Vary', 'Origin') }
  h.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  h.set('Access-Control-Allow-Headers', 'Content-Type')
  return h
}

function jsonResponse(obj, status, origin) {
  const h = corsHeaders(origin)
  h.set('Content-Type', 'application/json')
  return new Response(JSON.stringify(obj), { status, headers: h })
}

export default async (req) => {
  const key = process.env.GEMINI_API_KEY
  const url = new URL(req.url)

  // Origin allowlist: same-origin (any Netlify domain incl. deploy previews) or
  // localhost. Browser cross-site calls are blocked; a missing Origin (non-CORS)
  // is allowed since it can't be reliably distinguished anyway.
  const origin     = req.headers.get('origin') || ''
  const originHost = origin ? new URL(origin).host : ''
  const isLocal    = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(originHost)
  const allowed    = !origin || originHost === url.host || isLocal
  const allowOrigin = allowed && origin ? origin : ''

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(allowOrigin) })
  }
  if (!allowed) return jsonResponse({ error: { message: 'Origin not allowed' } }, 403, allowOrigin)
  if (!key)     return jsonResponse({ error: { message: 'Server missing GEMINI_API_KEY' } }, 500, allowOrigin)

  const path = url.searchParams.get('path') || ''
  if (!pathAllowed(path)) {
    return jsonResponse({ error: { message: 'Path not allowed' } }, 400, allowOrigin)
  }

  const sse = url.searchParams.get('alt') === 'sse'
  const target = `${BASE}/${path}?key=${encodeURIComponent(key)}${sse ? '&alt=sse' : ''}`

  const init = { method: req.method, headers: { 'Content-Type': 'application/json' } }
  if (req.method === 'POST') init.body = await req.text()

  let upstream
  try {
    upstream = await fetch(target, init)
  } catch (e) {
    return jsonResponse({ error: { message: 'Upstream fetch failed: ' + e.message } }, 502, allowOrigin)
  }

  // Pass status + body straight through (streams SSE chunk-by-chunk).
  const headers = corsHeaders(allowOrigin)
  headers.set('Content-Type', upstream.headers.get('Content-Type') || 'application/json')
  return new Response(upstream.body, { status: upstream.status, headers })
}
