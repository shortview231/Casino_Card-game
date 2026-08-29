import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { SeededRng } from '../../src/engine/rng';

describe('SeededRng', () => {
  it('replays the same sequence for the same seed', () => {
    const a = new SeededRng(12345);
    const b = new SeededRng(12345);
    expect(Array.from({ length: 20 }, () => a.next())).toEqual(
      Array.from({ length: 20 }, () => b.next()),
    );
  });

  it('always returns values in [0, 1)', () => {
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const rng = new SeededRng(seed);
        for (let i = 0; i < 250; i += 1) {
          const value = rng.next();
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThan(1);
        }
      }),
    );
  });

  it('shuffle preserves every input value exactly once', () => {
    fc.assert(
      fc.property(fc.uniqueArray(fc.integer(), { maxLength: 100 }), fc.integer(), (values, seed) => {
        const shuffled = new SeededRng(seed).shuffle(values);
        expect([...shuffled].sort((a, b) => a - b)).toEqual([...values].sort((a, b) => a - b));
      }),
    );
  });
});
