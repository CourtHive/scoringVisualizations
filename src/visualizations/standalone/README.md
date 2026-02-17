# Standalone D3 Visualizations

This directory contains standalone versions of the D3-based tennis match visualizations, along with Storybook stories for development and documentation.

## Overview

All visualizations have been copied from the main `/src/visualizations/` directory and made self-contained with sample data, allowing them to work independently of the full application state.

## Directory Structure

```
standalone/
├── data/           # Sample data generators and fixtures
│   ├── sampleGame.ts      # Single game data (normal, deuce, tiebreak)
│   └── sampleMatch.ts     # Full match data generator
├── types/          # TypeScript type definitions
│   └── index.ts           # Point, Episode, GameGroup interfaces
├── *.ts/.js        # Visualization implementations
└── *.stories.ts    # Storybook stories for each visualization
```

## Visualizations

### 1. **simpleChart** ✅ Working
- **File**: `simpleChart.ts`
- **Story**: `simpleChart.stories.ts`
- **Purpose**: Simple line chart comparing rally lengths between two players
- **Data**: Array of number arrays `[[rally1, rally2...], [rally1, rally2...]]`
- **Status**: Fully functional with D3 v4

### 2. **gameFish** ✅ Working
- **File**: `gameFish.ts`
- **Story**: `gameFish.stories.ts`
- **Purpose**: Point-by-point visualization of a single game
- **Features**: Shows server, rally length, results, score progression
- **Data**: Array of `Point` objects
- **Status**: Fully functional with D3 v4

### 3. **gameTree** ✅ Working
- **File**: `gameTree.ts`
- **Story**: `gameTree.stories.ts`
- **Purpose**: Tree diagram showing score progression paths through a game
- **Features**: Line width indicates frequency, color indicates result type
- **Data**: Array of `Episode` objects
- **Status**: Fully functional with D3 v4

### 4. **momentumChart** ✅ Working
- **File**: `momentumChart.ts`
- **Story**: `momentumChart.stories.ts`
- **Purpose**: Displays momentum flow across multiple games
- **Features**: Multiple game fish arranged vertically or horizontally
- **Data**: Array of `Episode` objects
- **Status**: Fully functional with D3 v4

### 5. **ptsChart** ✅ Working
- **File**: `ptsChart.ts`
- **Story**: `ptsChart.stories.ts`
- **Purpose**: Comprehensive points-per-set visualization
- **Features**: Shows all sets, game boundaries, breakpoints
- **Data**: Match object with `history.action('addPoint')` method
- **Status**: Fully functional with D3 v4

### 6. **coronaChart** ✅ Working (Migrated!)
- **File**: `coronaChart.ts`
- **Story**: `coronaChart.stories.ts`
- **Purpose**: Radial visualization of score differentials
- **Features**: Corona/circular display of momentum, multiple display modes
- **Data**: Set map with score differentials
- **Status**: **Fully migrated to D3 v4 and working!**
- **Migration**: Converted from JS to TypeScript, updated D3 APIs

### 7. **RallyTree** ✅ Working (Migrated!)
- **Files**: `RallyTree.ts`, `rallyTreeWrapper.ts`
- **Story**: `RallyTree.stories.ts`
- **Purpose**: Rally length distribution visualization
- **Features**: Tree-like display of rally statistics, horizontal/vertical orientations
- **Data**: Array of points with rally information
- **Status**: **Fully migrated to D3 v4 and working!**
- **Migration**: Converted from JS to TypeScript, updated D3 APIs

## Data Structure

All visualizations use data structures based on the Universal Match Object (UMO):

### Point
```typescript
interface Point {
  index: number;
  game: number;
  set: number;
  server: 0 | 1;
  winner: 0 | 1;
  rally?: string;
  result: string;
  score?: string;
  points?: [number, number];
  tiebreak?: boolean;
  breakpoint?: boolean | number;
}
```

### Episode
```typescript
interface Episode {
  point: Point;
  game: {
    index: number;
    complete: boolean;
    games: [number, number];
  };
  set: {
    index: number;
    complete: boolean;
  };
}
```

### GameGroup
```typescript
interface GameGroup {
  points: Point[];
  index: number;
  set: number;
  score: [number, number];
  complete: boolean;
  winner?: 0 | 1;
  last_game?: boolean;
}
```

## Sample Data

### Generators
- `generateSampleMatch()`: Creates a full 3-set match with realistic data
- `generateSimpleChartData()`: Creates rally length arrays for simpleChart
- `sampleGamePoints`: Standard game (40-15)
- `deuceGamePoints`: Deuce game with multiple advantages
- `tiebreakGamePoints`: Tiebreak game (7-5)

### Using Sample Data in Stories
```typescript
import { sampleGamePoints } from './data/sampleGame';
import { generateSampleMatch } from './data/sampleMatch';

// For single game
chart.data(sampleGamePoints);

// For full match
const matchData = generateSampleMatch();
chart.data(matchData);
```

## Running Storybook

```bash
# Start Storybook development server
pnpm storybook

# Build static Storybook
pnpm build-storybook
```

## Current State & Next Steps

### ✅ Completed
- [x] Directory structure created
- [x] Type definitions for data structures
- [x] Sample data generators (games, matches)
- [x] 5 visualizations fully migrated and working
- [x] 7 Storybook stories created
- [x] All dependencies made standalone

### ⚠️ Needs Attention
- [ ] **coronaChart** and **RallyTree** require D3 v3 → v4+ migration
  - Currently use deprecated APIs: `d3.svg.line.radial()`, `d3.scale.linear()`
  - Stories provide placeholders showing migration is needed
  
### 🔮 Future Enhancements
1. **D3 Upgrade** (Phase 5) ✅ COMPLETE
   - ✅ Migrated coronaChart from D3 v3 to v4
   - ✅ Migrated RallyTree from D3 v3 to v4
   - Future: Update all visualizations to D3 v7 (latest)

2. **Data Abstraction**
   - Create adapter layer to decouple from UMO v3 structure
   - Support more flexible data inputs
   - Add data validation

3. **Enhanced Stories**
   - Add more interactive controls (color pickers, size sliders)
   - Create comparison views (side-by-side)
   - Add performance scenarios (long matches, many sets)

4. **TypeScript Conversion** ✅ COMPLETE
   - ✅ Converted coronaChart.js → coronaChart.ts
   - ✅ Converted RallyTree.js → RallyTree.ts
   - ✅ Added comprehensive type safety

## Dependencies

All visualizations depend on:
- **D3 v4.13.0** (current project version)
- **legacyRally.ts**: Rally notation parsing utilities
- **groupGames.ts**: Episode grouping utility (used by momentumChart)

## Testing

Each visualization can be tested via Storybook:
1. Navigate to the visualization in Storybook sidebar
2. Use interactive controls to test different scenarios
3. Test responsive behavior by resizing browser window
4. Verify data edge cases (empty, tiebreak, deuce, etc.)

## Notes

- All visualizations use the D3 reusable chart pattern (`.data()`, `.options()`, `.update()`)
- Color schemes can be customized via options
- Most support `sizeToFit` for responsive layouts
- Original files in `/src/visualizations/` remain unchanged
- This standalone version is for development and documentation purposes
