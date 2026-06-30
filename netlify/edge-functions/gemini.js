// Server-side proxy for the Gemini API — runs as a Netlify EDGE function (Deno),
// so it runs close to the user and STREAMS the response token-by-token (regular
// Netlify Functions buffer the whole body, which made the chat feel slow).
//
// The API key lives only here (Netlify env var GEMINI_API_KEY) and never reaches
// the browser bundle. Client calls /api/gemini?path=… and we forward to Google.

const BASE = 'https://generativelanguage.googleapis.com/v1beta'

// Only the exact endpoints the app uses are forwardable, so this can't be turned
// into a general-purpose key for arbitrary Google calls.
function pathAllowed(path) {
  return path === 'models' ||
    /^models\/[\w.-]+:(generateContent|streamGenerateContent)$/.test(path)
}

export default async (request) => {
  const key = Netlify.env.get('GEMINI_API_KEY')
  if (!key) return json({ error: { message: 'Server missing GEMINI_API_KEY' } }, 500)

  const url  = new URL(request.url)
  const path = url.searchParams.get('path') || ''
  if (!pathAllowed(path)) return json({ error: { message: 'Path not allowed' } }, 400)

  const sse    = url.searchParams.get('alt') === 'sse'
  const target = `${BASE}/${path}?key=${encodeURIComponent(key)}${sse ? '&alt=sse' : ''}`

  const init = { method: request.method, headers: { 'Content-Type': 'application/json' } }
  if (request.method === 'POST') init.body = await request.text()

  let upstream
  try {
    upstream = await fetch(target, init)
  } catch (e) {
    return json({ error: { message: 'Upstream fetch failed: ' + e.message } }, 502)
  }

  // Stream the body straight through (SSE chunks arrive as Gemini produces them).
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('Content-Type') || 'application/json' },
  })
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status, headers: { 'Content-Type': 'application/json' },
  })
}

// Registers this edge function at both paths to handle custom proxy settings.
export const config = { path: ['/api/gemini', '/gemini'] }
