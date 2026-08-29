import { describe, expect, it } from 'vitest';
import { createGame, isComplete, resolvePair, reveal } from '../../src/games/critterFlip/model';

describe('Critter Flip model', () => {
  it('creates exactly two cards per pair', () => {
    const state = createGame(6, 42);
    expect(state.cards).toHaveLength(12);
    for (let pairId = 0; pairId < 6; pairId += 1) {
      expect(state.cards.filter((card) => card.pairId === pairId)).toHaveLength(2);
    }
  });

  it('matches a known pair and counts one move', () => {
    let state = createGame(6, 42);
    const first = state.cards[0]!;
    const second = state.cards.find((card) => card.pairId === first.pairId && card.id !== first.id)!;
    state = reveal(state, first.id);
    state = reveal(state, second.id);
    expect(state.locked).toBe(true);
    state = resolvePair(state);
    expect(state.moves).toBe(1);
    expect(state.matchedPairs).toBe(1);
    expect(state.cards.filter((card) => card.pairId === first.pairId).every((card) => card.state === 'matched')).toBe(true);
  });

  it('hides a mismatch after resolving', () => {
    let state = createGame(6, 99);
    const first = state.cards[0]!;
    const second = state.cards.find((card) => card.pairId !== first.pairId)!;
    state = resolvePair(reveal(reveal(state, first.id), second.id));
    expect(state.matchedPairs).toBe(0);
    expect(state.cards.find((card) => card.id === first.id)?.state).toBe('hidden');
    expect(state.cards.find((card) => card.id === second.id)?.state).toBe('hidden');
  });

  it('reports completion only when all pairs are matched', () => {
    let state = createGame(2, 1);
    for (const pairId of [0, 1]) {
      const [a, b] = state.cards.filter((card) => card.pairId === pairId);
      state = resolvePair(reveal(reveal(state, a!.id), b!.id));
    }
    expect(isComplete(state)).toBe(true);
  });
});
