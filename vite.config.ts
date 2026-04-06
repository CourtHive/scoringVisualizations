import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.stories.ts', 'src/**/*.stories.tsx'],
      outDir: 'dist',
      insertTypesEntry: true,
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      fileName: (format) => `scoring-visualizations.${format}.js`,
      name: 'ScoringVisualizations',
    },
    rollupOptions: {
      external: ['tods-competition-factory', 'd3', /^d3-/, 'tippy.js'],
      output: {
        globals: {
          'tods-competition-factory': 'competitionFactory',
          d3: 'd3',
          'tippy.js': 'tippy',
        },
      },
    },
  },
});
