import { defineConfig } from 'vitest/config'

// Pure-logic unit tests run in Node — no DOM, no Vite plugins (PWA/react) needed.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.js'],
  },
})
