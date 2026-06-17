const CRED_KEY = sheetId => `budgetiq_biometric_${sheetId}`

function toBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}
function fromBase64(b64) {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes.buffer
}

export async function isBiometricsAvailable() {
  try {
    if (!window.PublicKeyCredential) return false
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

export function hasBiometricCredential(sheetId) {
  return !!localStorage.getItem(CRED_KEY(sheetId))
}

export async function registerBiometric(sheetId, userName) {
  const challenge = crypto.getRandomValues(new Uint8Array(32))
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'BudgetIQ', id: window.location.hostname },
      user: {
        id: new TextEncoder().encode(sheetId.slice(0, 64)),
        name: userName || 'user',
        displayName: userName || 'BudgetIQ User',
      },
      pubKeyCredParams: [
        { alg: -7,   type: 'public-key' },
        { alg: -257, type: 'public-key' },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
    }
  })
  localStorage.setItem(CRED_KEY(sheetId), toBase64(credential.rawId))
  return true
}

export async function verifyBiometric(sheetId) {
  const stored = localStorage.getItem(CRED_KEY(sheetId))
  if (!stored) return false
  const challenge = crypto.getRandomValues(new Uint8Array(32))
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [{ id: fromBase64(stored), type: 'public-key', transports: ['internal'] }],
      userVerification: 'required',
      timeout: 60000,
    }
  })
  return !!assertion
}

export function clearBiometric(sheetId) {
  localStorage.removeItem(CRED_KEY(sheetId))
}
