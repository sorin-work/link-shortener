import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['server/src/**/*.ts', 'web/src/**/*.{ts,tsx}'],
      exclude: ['**/*.test.*', 'server/src/test/**', 'server/src/index.ts', 'web/src/main.tsx'],
      reporter: ['text-summary', 'html'],
    },
    projects: [
      {
        test: {
          name: 'server',
          include: ['server/src/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        esbuild: { jsx: 'automatic', jsxImportSource: 'preact' },
        test: {
          name: 'web',
          include: ['web/src/**/*.test.{ts,tsx}'],
          environment: 'jsdom',
        },
      },
    ],
  },
});
