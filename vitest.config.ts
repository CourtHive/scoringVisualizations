import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    // '.claude/**' keeps a git worktree checked out under .claude/worktrees/ from being
    // discovered as a second copy of the entire suite — Vitest's default `include` globs
    // from the project root, and its default `exclude` does not cover .claude.
    exclude: [...configDefaults.exclude, '**/.claude/**'],
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.stories.ts', 'src/**/*.stories.tsx', 'src/**/types.ts', 'src/**/types/**'],
      reporter: ['text', 'text-summary'],
    },
  },
});
