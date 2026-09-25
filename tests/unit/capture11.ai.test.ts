import { describe, expect, it } from 'vitest';
import { createCpuMemory, evaluateMove, observePublicState, snapshotCpuMemory, chooseCpuMove } from '../../src/games/capture11/ai';
import { createStandardDeck } from '../../src/games/capture11/deck';
import { legalMoves, type Capture11State } from '../../src/games/capture11/game';
import type { Card } from '../../src/games/capture11/model';

function card(rank: Card['rank'], suit: Card['suit']): Card {
  return createStandardDeck().find(candidate => candidate.rank === rank && candidate.suit === suit)!;
}

function state(hand: Card[], board: Capture11State['board'], deckLength = 20, humanHand: Card[] = [card('Q', 'hearts')], handNumber = 1): Capture11State {
  return {
    seed: 1, dealer: 'player1', turn: 'player2', deck: createStandardDeck().slice(0, deckLength), board,
    players: { player1: { id: 'player1', hand: humanHand, captured: [], matchScore: 0 }, player2: { id: 'player2', hand, captured: [], matchScore: 0 } },
    lastCapturer: null, handNumber, phase: 'playing', lastAction: '', lastHandScore: null, winner: null,
  };
}

function move(stateValue: Capture11State, type: string, predicate: (candidate: ReturnType<typeof legalMoves>[number]) => boolean) {
  const found = legalMoves(stateValue, 'player2').find(candidate => candidate.type === type && predicate(candidate));
  expect(found).toBeDefined();
  return found!;
}

describe('Capture 11 CPU difficulty evaluation', () => {
  it('EASY_IMMEDIATE_CAPTURE chooses a sensible legal capture', () => {
    const current = state([card('5', 'clubs'), card('9', 'spades')], [{ kind: 'loose', card: card('2', 'hearts') }, { kind: 'loose', card: card('3', 'diamonds') }]);
    const chosen = chooseCpuMove(current, 'player2', 'easy');
    expect(chosen.type).toBe('capture-loose');
    expect(chosen.handCardId).toBe('5-clubs');
  });

  it('MEDIUM_CURRENT_HAND_SETUP values a build that sets up its held pickup card', () => {
    const current = state([card('A', 'clubs'), card('5', 'hearts'), card('9', 'spades')], [{ kind: 'loose', card: card('4', 'diamonds') }]);
    const build = move(current, 'build-open', candidate => 'target' in candidate && candidate.target === 5);
    const trail = move(current, 'trail', candidate => candidate.handCardId === '9-spades');
    expect(evaluateMove(current, 'player2', build, 'medium')).toBeGreaterThan(evaluateMove(current, 'player2', trail, 'medium'));
    expect(evaluateMove(current, 'player2', build, 'medium')).toBeGreaterThan(evaluateMove(current, 'player2', build, 'easy'));
  });

  it('MEDIUM_DOES_NOT_USE_OLD_DECK_MEMORY', () => {
    const current = state([card('A', 'clubs'), card('5', 'hearts')], [{ kind: 'loose', card: card('4', 'diamonds') }]);
    const build = move(current, 'build-open', candidate => 'target' in candidate && candidate.target === 5);
    const memory = createCpuMemory(); memory.seenRankCounts.set('10', 0);
    expect(evaluateMove(current, 'player2', build, 'medium', memory)).toBe(evaluateMove(current, 'player2', build, 'medium'));
  });

  it('HARD_TEN_BUILD_DANGER_NONE_SEEN penalizes a late risky BUILD 10', () => {
    const current = state([card('A', 'clubs'), card('10', 'hearts'), card('6', 'spades')], [{ kind: 'loose', card: card('9', 'diamonds') }, { kind: 'loose', card: card('3', 'clubs') }, { kind: 'loose', card: card('3', 'hearts') }], 4);
    const build = move(current, 'build-open', candidate => 'target' in candidate && candidate.target === 10);
    const memory = createCpuMemory();
    expect(evaluateMove(current, 'player2', build, 'hard', memory)).toBeLessThan(evaluateMove(current, 'player2', build, 'medium', memory));
  });

  it('HARD_TEN_BUILD_SAFER_THREE_SEEN changes the risk calculation', () => {
    const current = state([card('A', 'clubs'), card('10', 'hearts')], [{ kind: 'loose', card: card('9', 'diamonds') }], 4);
    const build = move(current, 'build-open', candidate => 'target' in candidate && candidate.target === 10);
    const none = createCpuMemory(); const three = createCpuMemory(); three.seenRankCounts.set('10', 3);
    expect(evaluateMove(current, 'player2', build, 'hard', three)).toBeGreaterThan(evaluateMove(current, 'player2', build, 'hard', none));
  });

  it('HARD_PRESERVE_TEN_OF_DIAMONDS recognizes the scoring card', () => {
    const current = state([card('10', 'diamonds'), card('7', 'clubs')], []);
    const tenTrail = move(current, 'trail', candidate => candidate.handCardId === '10-diamonds');
    const sevenTrail = move(current, 'trail', candidate => candidate.handCardId === '7-clubs');
    expect(evaluateMove(current, 'player2', tenTrail, 'hard')).toBeLessThan(evaluateMove(current, 'player2', sevenTrail, 'hard'));
  });

  it('HARD_MEMORY_RESETS_NEW_ROUND', () => {
    const memory = createCpuMemory();
    observePublicState(memory, state([card('10', 'hearts')], [], 20, [], 1));
    expect(snapshotCpuMemory(memory).seenRankCounts['10']).toBe(1);
    observePublicState(memory, state([card('A', 'clubs')], [], 20, [], 2));
    expect(snapshotCpuMemory(memory).seenRankCounts['10']).toBe(0);
  });

  it('HARD_NO_HIDDEN_HAND_CHEATING keeps evaluation independent of human cards', () => {
    const first = state([card('A', 'clubs'), card('10', 'hearts')], [{ kind: 'loose', card: card('9', 'diamonds') }], 4, [card('2', 'spades')]);
    const second = state(first.players.player2.hand as Card[], first.board, 4, [card('10', 'diamonds')]);
    const firstMove = move(first, 'build-open', candidate => 'target' in candidate && candidate.target === 10);
    const secondMove = move(second, 'build-open', candidate => 'target' in candidate && candidate.target === 10);
    expect(evaluateMove(first, 'player2', firstMove, 'hard')).toBe(evaluateMove(second, 'player2', secondMove, 'hard'));
  });
});
