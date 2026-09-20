import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  // Le tsconfig de Next est en `jsx: preserve` (Next transforme lui-même).
  // Vitest doit donc transformer le JSX de son côté pour rendre les composants.
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
