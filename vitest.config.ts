import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/stress/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // Coverage gate targets pure deterministic logic. DOM shell/storage are
      // verified through browser E2E and accessibility flows in this milestone.
      include: ['src/engine/rng.ts', 'src/games/**/model.ts'],
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 70,
      },
    },
  },
});
