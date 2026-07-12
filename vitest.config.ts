import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    include: ['lib/timer/**/*.test.ts', 'lib/validation/**/*.test.ts', 'lib/block-colors.test.ts'],
  },
})
