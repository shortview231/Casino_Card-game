import { describe, expect, it } from 'vitest';
import { checkCardConservation, Capture11PlaytestRecorder } from '../../src/games/capture11/debug';
import { applyMove, createMatch, legalMoves, type Capture11State } from '../../src/games/capture11/game';

describe('Capture 11 playtest diagnostics', () => {
  it('accounts for all 52 cards exactly once at match start', () => {
    const state = createMatch(12345);
    const result = checkCardConservation(state);

    expect(result.ok).toBe(true);
    expect(result.count).toBe(52);
    expect(result.uniqueCount).toBe(52);
    expect(result.duplicates).toEqual([]);
  });

  it('keeps all 52 cards accounted for after a legal move', () => {
    const state = createMatch(24680);
    const move = legalMoves(state, state.turn)[0];
    expect(move).toBeDefined();

    const next = applyMove(state, state.turn, move!);
    expect(checkCardConservation(next).ok).toBe(true);
  });

  it('detects a duplicated card location', () => {
    const state = createMatch(17);
    const first = state.deck[0];
    expect(first).toBeDefined();

    const broken: Capture11State = {
      ...state,
      deck: [...state.deck, first!],
    };
    const result = checkCardConservation(broken);

    expect(result.ok).toBe(false);
    expect(result.count).toBe(53);
    expect(result.uniqueCount).toBe(52);
    expect(result.duplicates).toContain(first!.id);
  });

  it('exports the seed and recorded moves for reproduction', () => {
    let state = createMatch(9876);
    const recorder = new Capture11PlaytestRecorder(9876, state);
    const move = legalMoves(state, state.turn)[0]!;
    const player = state.turn;
    state = applyMove(state, player, move);
    recorder.recordMove(player, move, state);

    const exported = JSON.parse(recorder.exportText()) as {
      format: string;
      matchSeed: number;
      entries: Array<{ kind: string }>;
    };

    expect(exported.format).toBe('capture11-playtest-log-v1');
    expect(exported.matchSeed).toBe(9876);
    expect(exported.entries.map((entry) => entry.kind)).toEqual(['start', 'move']);
  });
});
