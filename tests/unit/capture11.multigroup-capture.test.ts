import { describe, expect, it } from 'vitest';
import { createStandardDeck } from '../../src/games/capture11/deck';
import {
  applyMove,
  movesForExactSelection,
  type Capture11State,
} from '../../src/games/capture11/game';
import type { Card, LooseBoardCard } from '../../src/games/capture11/model';
import { canCaptureLooseSelection } from '../../src/games/capture11/rules';

function card(rank: Card['rank'], suit: Card['suit']): Card {
  const found = createStandardDeck().find((candidate) => candidate.rank === rank && candidate.suit === suit);
  if (!found) throw new Error(`Missing ${rank} ${suit}`);
  return found;
}

function loose(value: Card): LooseBoardCard {
  return { kind: 'loose', card: value };
}

function stateForMultiGroupCapture(): Capture11State {
  const playedEight = card('8', 'spades');
  const boardEightOne = card('8', 'hearts');
  const boardEightTwo = card('8', 'diamonds');
  const unrelated = card('K', 'clubs');

  return {
    seed: 404,
    dealer: 'player2',
    turn: 'player1',
    deck: [card('Q', 'clubs')],
    board: [loose(boardEightOne), loose(boardEightTwo), loose(unrelated)],
    players: {
      player1: { id: 'player1', hand: [playedEight], captured: [], matchScore: 0 },
      player2: { id: 'player2', hand: [card('2', 'clubs')], captured: [], matchScore: 0 },
    },
    lastCapturer: null,
    handNumber: 1,
    phase: 'playing',
    lastAction: '',
    lastHandScore: null,
    winner: null,
  };
}

describe('Capture 11 multi-group loose captures', () => {
  it('allows one played 8 to capture two independent loose 8 groups', () => {
    expect(
      canCaptureLooseSelection(
        card('8', 'spades'),
        [loose(card('8', 'hearts')), loose(card('8', 'diamonds'))],
      ),
    ).toBe(true);
  });

  it('allows a matching loose 8 and a separate 3 + 5 group to be captured together', () => {
    expect(
      canCaptureLooseSelection(
        card('8', 'spades'),
        [loose(card('8', 'hearts')), loose(card('3', 'clubs')), loose(card('5', 'diamonds'))],
      ),
    ).toBe(true);
  });

  it('rejects loose cards that cannot be partitioned into complete played-value groups', () => {
    expect(
      canCaptureLooseSelection(
        card('8', 'spades'),
        [loose(card('8', 'hearts')), loose(card('3', 'clubs'))],
      ),
    ).toBe(false);
  });

  it('offers and applies the exact two-8 capture through the same selection path used by the UI', () => {
    const state = stateForMultiGroupCapture();
    const playedEight = state.players.player1.hand[0]!;
    const boardEights = state.board
      .filter((item): item is LooseBoardCard => item.kind === 'loose' && item.card.rank === '8');

    const move = movesForExactSelection(
      state,
      'player1',
      playedEight.id,
      boardEights.map((item) => `loose:${item.card.id}`),
    ).find((candidate) => candidate.type === 'capture-loose');

    expect(move).toBeDefined();
    const next = applyMove(state, 'player1', move!);

    expect(next.players.player1.captured.map((captured) => captured.id)).toEqual(
      expect.arrayContaining([playedEight.id, ...boardEights.map((item) => item.card.id)]),
    );
    expect(next.players.player1.captured).toHaveLength(3);
    expect(next.board).toEqual([{ kind: 'loose', card: card('K', 'clubs') }]);
    expect(next.lastCapturer).toBe('player1');
  });
});
