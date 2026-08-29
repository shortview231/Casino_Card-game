import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createGame } from '../../src/games/critterFlip/model';

describe('Critter Flip stress properties', () => {
  it('always creates a valid pair deck across seeds and sizes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 24 }),
        fc.integer(),
        (pairCount, seed) => {
          const state = createGame(pairCount, seed);
          expect(state.cards).toHaveLength(pairCount * 2);
          expect(new Set(state.cards.map((card) => card.id)).size).toBe(pairCount * 2);
          for (let pairId = 0; pairId < pairCount; pairId += 1) {
            expect(state.cards.filter((card) => card.pairId === pairId)).toHaveLength(2);
          }
          expect(state.moves).toBe(0);
          expect(state.matchedPairs).toBe(0);
          expect(state.locked).toBe(false);
        },
      ),
      { numRuns: 1000 },
    );
  });

  it('same seed and size always create identical order', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 24 }), fc.integer(), (pairCount, seed) => {
        const one = createGame(pairCount, seed).cards.map((card) => card.id);
        const two = createGame(pairCount, seed).cards.map((card) => card.id);
        expect(one).toEqual(two);
      }),
      { numRuns: 500 },
    );
  });
});
