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
  it('loads seven independent named states without sharing mutable collections', () => {
    expect(SCENARIO_IDS).toHaveLength(7);
    for (const id of SCENARIO_IDS) {
      const first = loadScenario(id); const second = loadScenario(id);
      expect(first.id).toBe(id); expect(first.state.turn).toBe('player1');
      expect(first.state.players.player1.hand.some(card => card.id === first.suggestedHandCardId)).toBe(true);
      expect(first.suggestedBoardKeys.every(key => first.state.board.some(item =>
        item.kind === 'loose' ? key === `loose:${item.card.id}` : key === `build:${item.id}`,
      ))).toBe(true);
      if (id !== 'final_sweep_demo') {
        expect(first.state.players.player1.hand).toHaveLength(4);
        expect(first.state.players.player2.hand).toHaveLength(4);
        expect(first.state.board.length).toBeGreaterThanOrEqual(4);
      } else {
        expect(first.state.players.player1.hand).toHaveLength(1);
        expect(first.state.players.player2.hand).toHaveLength(0);
        expect(first.state.deck).toHaveLength(0);
      }
      const inventory = [
        ...first.state.deck,
        ...first.state.players.player1.hand, ...first.state.players.player2.hand,
        ...first.state.players.player1.captured, ...first.state.players.player2.captured,
        ...first.state.board.flatMap(item => item.kind === 'loose' ? [item.card] : item.cards),
      ];
      expect(inventory, `${id} should stage a complete deck`).toHaveLength(52);
      expect(new Set(inventory.map(card => card.id)).size, `${id} should not duplicate cards`).toBe(52);
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
    expect(next.players.player1.hand.map(card => card.rank)).toEqual(['8', 'Q', '9']);
  });

  it('executes the strategic two-group capture including 10 of Diamonds', () => {
    const { next } = expectedMove('strategy_demo');
    expect(next.players.player1.captured).toHaveLength(4);
    expect(next.players.player1.captured).toContainEqual(expect.objectContaining({ rank: '10', suit: 'diamonds' }));
  });

  it('final capture sweeps leftovers and scores through normal hand resolution', () => {
    const { next } = expectedMove('final_sweep_demo');
    expect(next.phase).toBe('hand-over'); expect(next.board).toEqual([]);
    expect(next.players.player1.captured).toHaveLength(28);
    expect(next.players.player2.captured).toHaveLength(24);
    expect(next.lastAction).toContain('take the final 3 board cards');
    expect(next.lastHandScore).not.toBeNull();
    expect(next.players.player1.matchScore).toBe(next.lastHandScore!.scores.player1.total);
    expect(next.players.player2.matchScore).toBe(next.lastHandScore!.scores.player2.total);
  });

  it('adds and captures Scene 7 as one multi-component build unit', () => {
    const { scenario, next: extended } = expectedMove('multi_build_capture_demo');
    const build = extended.board.find(item => item.kind === 'build');
    expect(build?.kind).toBe('build');
    if (build?.kind !== 'build') return;
    expect(build.components).toHaveLength(2);
    const capture = movesForExactSelection(extended, 'player1', scenario.suggestedHandCardId, [`build:${build.id}`])
      .find(move => move.type === 'capture-build');
    expect(capture).toBeDefined();
    expect(isExpectedScenarioMove(capture!, scenario.expected)).toBe(true);
    const complete = applyMove(extended, 'player1', capture!);
    expect(complete.board.some(item => item.kind === 'build')).toBe(false);
    expect(complete.players.player1.captured.map(card => card.id)).toEqual(expect.arrayContaining(['10-spades', '6-hearts', '4-clubs', '7-diamonds', '3-spades']));
  });
});
