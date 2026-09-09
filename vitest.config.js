import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Two kinds of test, split by extension so the fast ones stay fast:
//
//   *.test.js   pure logic — runs in Node, no DOM, no plugins
//   *.test.jsx  component render smoke tests — jsdom + the React plugin
//
// The .jsx ones exist because a missing variable inside JSX is valid syntax:
// `vite build` compiles it without complaint and the crash only surfaces when a
// user opens the component. Rendering each one in CI catches that instead.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    include: ['src/**/*.test.js', 'src/**/*.test.jsx'],
    // Node by default so the pure-logic tests stay fast. The render tests opt
    // in with a `// @vitest-environment jsdom` docblock — environmentMatchGlobs
    // was removed in Vitest 4, so the per-file pragma is the supported route.
    environment: 'node',
  },
})
