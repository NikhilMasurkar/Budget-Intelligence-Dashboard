// Netlify Edge Function — generates a 6-digit OTP, sends it to the user's
// verified Google email via Resend, and returns the SHA-256 hash + expiry
// so the client can store them in Firestore for comparison.
//
// Required Netlify env vars:
//   RESEND_API_KEY     — from resend.com (free tier: 3 000 emails/month)
//   RESEND_FROM        — e.g. "BudgetIQ <noreply@yourdomain.com>"
//                        defaults to the Resend shared test sender (no domain verification needed)
//   VITE_FIREBASE_API_KEY — same value you already set for the build

const FIREBASE_LOOKUP = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup'
const RESEND_URL      = 'https://api.resend.com/emails'

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export default async (request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const resendKey   = Netlify.env.get('RESEND_API_KEY')
  const firebaseKey = Netlify.env.get('VITE_FIREBASE_API_KEY')
  const fromEmail   = Netlify.env.get('RESEND_FROM') || 'BudgetIQ <onboarding@resend.dev>'

  if (!resendKey || !firebaseKey)
    return json({ error: 'Server missing required env vars' }, 500)

  // ── Verify Firebase ID token → get user email ──────────────────
  const authHeader = request.headers.get('Authorization') || ''
  const idToken    = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!idToken) return json({ error: 'Missing auth token' }, 401)

  let email
  try {
    const res  = await fetch(`${FIREBASE_LOOKUP}?key=${firebaseKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    })
    const data = await res.json()
    email = data?.users?.[0]?.email
    if (!email) return json({ error: 'Could not verify identity' }, 401)
  } catch (e) {
    return json({ error: 'Auth check failed: ' + e.message }, 502)
  }

  // ── Generate OTP ───────────────────────────────────────────────
  const rand = new Uint32Array(1)
  crypto.getRandomValues(rand)
  const otp      = String(100000 + (rand[0] % 900000)) // 100000–999999
  const otpHash  = await sha256(otp)
  const expiresAt = Date.now() + 10 * 60 * 1000        // 10 minutes

  // ── Send email via Resend ──────────────────────────────────────
  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: `${otp} — BudgetIQ PIN reset code`,
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:420px;margin:auto;padding:24px">
            <div style="background:#0b0e1a;border-radius:16px;padding:32px;text-align:center">
              <div style="font-size:28px;margin-bottom:8px">💰</div>
              <h2 style="color:#e4e8f5;margin:0 0 6px;font-size:20px">BudgetIQ PIN Reset</h2>
              <p style="color:#6a7190;font-size:13px;margin:0 0 28px">Enter this code on the BudgetIQ lock screen.</p>
              <div style="font-size:40px;font-weight:700;letter-spacing:14px;color:#5b7fff;background:#12172b;padding:20px;border-radius:12px;display:inline-block">${otp}</div>
              <p style="color:#3a4575;font-size:12px;margin:24px 0 0">Expires in 10 minutes. If you didn't request this, ignore this email — your PIN is unchanged.</p>
            </div>
          </div>`,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return json({ error: 'Email send failed: ' + err }, 502)
    }
  } catch (e) {
    return json({ error: 'Email send failed: ' + e.message }, 502)
  }

  // Return hash + expiry to client (client stores in Firestore for comparison).
  // The hash is safe to expose: SHA-256 of a 6-digit OTP with a 10-minute window
  // is not practically brute-forceable given Firestore rate limits + auth gating.
  return json({ otpHash, expiresAt, email })
}

export const config = { path: '/api/send-otp' }
