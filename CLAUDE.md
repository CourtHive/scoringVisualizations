# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`@tennisvisuals/scoring-visualizations` is a standalone library of D3-based match visualizations for tennis scoring data. It transforms TODS match data into episode sequences and renders interactive charts: GameTree, Momentum, PTS (Point Timeline Series), GameFish, Corona, and statistics panels.

Published to npm as `@tennisvisuals/scoring-visualizations`. Consumed by `epixodic` (point-by-point match tracker).

## Commands

```bash
pnpm install              # Install dependencies (use pnpm only)
pnpm build                # Vite library build → dist/
pnpm build:types          # Emit .d.ts declarations only
pnpm test                 # Vitest single run
pnpm test:watch           # Vitest watch mode
pnpm lint                 # ESLint on src/
pnpm storybook            # Storybook dev server on :6006
pnpm build-storybook      # Build static Storybook
pnpm prerelease           # lint + test + build + build-storybook
```

## Architecture

### Source Layout

```
src/
├── index.ts              # Public API exports
├── engine/               # Episode processing engine
├── episodes/             # Episode transform logic (TODS → visualization data)
├── parsers/              # Score/stats parsers
├── statistics/           # Statistical computations
├── utils/                # Shared helpers
├── visualizations/       # D3 chart implementations
│   ├── gameTree/
│   ├── momentum/
│   ├── pts/
│   ├── gameFish/
│   └── corona/
└── __tests__/            # Test files
```

### Build

Vite library mode outputs ES and UMD bundles to `dist/`. TypeScript declarations generated via `tsc --emitDeclarationOnly`.

### Key Dependencies

| Package | Purpose |
|---|---|
| `d3` | Charting / SVG rendering |
| `tippy.js` | Tooltips for interactive elements |
| `tods-competition-factory` | TODS types and match data utilities (peer dependency) |

## Key Conventions

- TypeScript strict mode
- ESLint with sonarjs plugin for code quality
- Storybook for visual development and testing
- `@typescript-eslint/no-explicit-any` is OFF
- Target: ES2022, bundler module resolution

## Ecosystem Coding Standards

This project follows the CourtHive ecosystem coding standards.
See [CourtHive/Mentat/standards/coding-standards.md](https://github.com/CourtHive/Mentat/blob/main/standards/coding-standards.md) for the full reference.

Key repo-specific notes:
- Package manager: pnpm only
- Test runner: vitest
- Lint command: `pnpm lint`
