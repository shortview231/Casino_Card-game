import { describe, expect, it } from 'vitest';
import { applyMove, movesForExactSelection } from '../../src/games/capture11/game';
import { isExpectedScenarioMove, loadScenario, SCENARIO_IDS } from '../../src/games/capture11/scenarios';

function expectedMove(id: typeof SCENARIO_IDS[number]) {
  const scenario = loadScenario(id);
  const moves = movesForExactSelection(scenario.state, 'player1', scenario.suggestedHandCardId, scenario.suggestedBoardKeys);
  const move = moves.find(candidate => isExpectedScenarioMove(candidate, scenario.expected));
  expect(move, `${id} expected move must pass normal exact-selection validation`).toBeDefined();
  return { scenario, next: applyMove(scenario.state, 'player1', move!) };
}

describe('Capture 11 reusable scenarios', () => {
  it('loads six independent named states without sharing mutable collections', () => {
    expect(SCENARIO_IDS).toHaveLength(6);
    for (const id of SCENARIO_IDS) {
      const first = loadScenario(id); const second = loadScenario(id);
      expect(first.id).toBe(id); expect(first.state.turn).toBe('player1');
      expect(first.state).not.toBe(second.state); expect(first.state.board).not.toBe(second.state.board);
    }
  });

  it('uses normal engine validation and rejects an invalid scenario capture', () => {
    const scenario = loadScenario('basic_capture');
    const unrelated = scenario.state.board.find(item => item.kind === 'loose' && item.card.rank === 'K');
    expect(unrelated?.kind).toBe('loose');
    expect(() => applyMove(scenario.state, 'player1', {
      type: 'capture-loose', handCardId: scenario.suggestedHandCardId,
      cardIds: unrelated?.kind === 'loose' ? [unrelated.card.id] : [],
    })).toThrow('not legal');
  });

  it('performs the basic capture through the exact UI selection path', () => {
    const { next } = expectedMove('basic_capture');
    expect(next.players.player1.captured).toHaveLength(2);
  });

  it('captures both loose 8s atomically for BUG-004', () => {
    const { scenario, next } = expectedMove('bug_004_multi_equal_capture');
    const eights = scenario.state.board.filter(item => item.kind === 'loose' && item.card.rank === '8');
    expect(eights).toHaveLength(2); expect(next.players.player1.captured).toHaveLength(3);
    expect(next.board.filter(item => item.kind === 'loose' && item.card.rank === '8')).toHaveLength(0);
  });

  it('creates BUILD 5 and retains the pickup 5', () => {
    const { next } = expectedMove('build_demo');
    expect(next.board.find(item => item.kind === 'build')).toMatchObject({ target: 5, createdBy: 'player1', mode: 'open' });
    expect(next.players.player1.hand.map(card => card.rank)).toContain('5');
  });

  it('raises the CPU build from 5 to 8 and transfers ownership', () => {
    const { next } = expectedMove('build_takeover_demo');
    expect(next.board.find(item => item.kind === 'build')).toMatchObject({ target: 8, createdBy: 'player1' });
    expect(next.players.player1.hand.map(card => card.rank)).toEqual(['8']);
  });

  it('executes the strategic two-group capture including 10 of Diamonds', () => {
    const { next } = expectedMove('strategy_demo');
    expect(next.players.player1.captured).toHaveLength(4);
    expect(next.players.player1.captured).toContainEqual(expect.objectContaining({ rank: '10', suit: 'diamonds' }));
  });

  it('final capture sweeps leftovers and scores through normal hand resolution', () => {
    const { next } = expectedMove('final_sweep_demo');
    expect(next.phase).toBe('hand-over'); expect(next.board).toEqual([]);
    expect(next.players.player1.captured).toHaveLength(9);
    expect(next.lastAction).toContain('take the final 2 board cards');
    expect(next.lastHandScore?.scores.player1).toMatchObject({ aces: 1, twoOfSpades: 1, mostSpades: 1, mostCards: 2, tenOfDiamonds: 3, total: 8 });
    expect(next.players.player1.matchScore).toBe(8); expect(next.players.player2.matchScore).toBe(1);
  });
});
