import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.stories.ts', 'src/**/*.stories.tsx', 'src/**/types.ts', 'src/**/types/**'],
      reporter: ['text', 'text-summary'],
    },
  },
});
