import { useSyncExternalStore } from 'react'

// THE colour source for the whole app. Change a colour here and everything
// follows: styles read these as CSS variables (var(--accent),
// rgb(var(--accent-rgb) / 0.2)); places that can't read CSS variables (MUI
// palette, Chart.js, SVG attributes, colours with a hex alpha appended) read
// `tokens`, which always holds the active mode's hex values.
//
// Not in here on purpose: category colours (user data), the category colour
// picker palette, the Google Drive logo, and PDF/Excel export colours.
const dark = {
  bg: '#101218',          // page and dialog background
  surface2: '#181b28',    // cards
  surface3: '#222640',    // raised bits inside cards, tracks
  accentDeep: '#1e2d5e',  // accent-tinted panel

  text: '#e4e8f5',
  textSoft: '#c8cfea',
  text2: '#8891b8',       // secondary text
  textMuted: '#6a7190',
  textFaint: '#5a6080',
  text3: '#484f72',       // disabled / hints
  line: '#3a4060',        // solid borders, faint labels

  accent: '#5b7fff',
  accentStrong: '#4a6eee',
  accentSoft: '#a0b4ff',
  accent2: '#3de8a0',     // green: income, good
  income: '#52b788',
  incomeSoft: '#7fd6a8',
  danger: '#ff5f5f',
  dangerSoft: '#ff7a7a',
  dangerStrong: '#e05555',
  dangerDeep: '#8b0000',
  warn: '#ffb347',
  purple: '#b97fff',
  pink: '#ff6eb4',

  ink: '#ffffff',         // translucent overlays: rgb(var(--ink-rgb) / 0.07)
}

// Same roles, tuned for a white page: text colours darkened so they stay
// readable, and overlays flip to black.
const light = {
  bg: '#f3f5fa',
  surface2: '#ffffff',
  surface3: '#e7ebf5',
  accentDeep: '#dfe6ff',

  text: '#141829',
  textSoft: '#2b3150',
  text2: '#565e80',
  textMuted: '#686f8f',
  textFaint: '#757c9b',
  text3: '#9399b5',
  line: '#a9b0c9',

  accent: '#4466f0',
  accentStrong: '#3352d6',
  accentSoft: '#3f5fd8',
  accent2: '#0f9a63',
  income: '#2f8f63',
  incomeSoft: '#2a8459',
  danger: '#e03e3e',
  dangerSoft: '#d64545',
  dangerStrong: '#c22f2f',
  dangerDeep: '#8b0000',
  warn: '#b86e00',
  purple: '#8044dc',
  pink: '#d23a88',

  ink: '#000000',
}

export const palettes = { dark, light }
export const tokens = { ...dark }

const kebab = (k) => k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())
const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))

/** 'rgba(r,g,b,a)' from a token hex — for Chart.js, which can't read CSS variables. */
export const rgba = (hex, a) => `rgba(${channels(hex).join(',')},${a})`

const KEY = 'budgetiq_theme'
const listeners = new Set()
let mode = 'dark'
try { if (localStorage.getItem(KEY) === 'light') mode = 'light' } catch { }

/** Publish the active palette as --name and --name-rgb on :root. */
export function applyTokens(root = document.documentElement) {
  Object.assign(tokens, palettes[mode])
  for (const [k, hex] of Object.entries(tokens)) {
    root.style.setProperty(`--${kebab(k)}`, hex)
    root.style.setProperty(`--${kebab(k)}-rgb`, channels(hex).join(' '))
  }
  root.style.colorScheme = mode
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tokens.bg)
}

export const getThemeMode = () => mode

export function setThemeMode(next) {
  mode = next
  try { localStorage.setItem(KEY, next) } catch { }
  applyTokens()
  listeners.forEach((l) => l())
}

/** Current mode; re-renders the caller when it changes. */
export function useThemeMode() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, getThemeMode)
}
