import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['tests/stripe-live/**/*.live.spec.ts'],
    testTimeout: 120000,
    hookTimeout: 120000,
  },
})
