import { describe, expect, it } from 'vitest';
import { createStandardDeck, openingDeal, redealHands, shuffledDeck } from '../../src/games/capture11/deck';
import { resolveFinalSweep } from '../../src/games/capture11/hand';
import type { Card, HandState } from '../../src/games/capture11/model';
import { firstPlayerForDealer, nextDealer, numericBuildValue } from '../../src/games/capture11/model';

function findCard(rank: Card['rank'], suit: Card['suit']): Card {
  const found = createStandardDeck().find((card) => card.rank === rank && card.suit === suit);
  if (!found) throw new Error('Card not found');
  return found;
}

describe('Capture 11 card model', () => {
  it('creates exactly 52 unique standard cards', () => {
    const deck = createStandardDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map((card) => card.id)).size).toBe(52);
  });

  it('uses ace as one, numeric cards as printed, and keeps face cards out of build arithmetic', () => {
    expect(numericBuildValue(findCard('A', 'clubs'))).toBe(1);
    expect(numericBuildValue(findCard('10', 'hearts'))).toBe(10);
    expect(numericBuildValue(findCard('J', 'hearts'))).toBeNull();
    expect(numericBuildValue(findCard('Q', 'hearts'))).toBeNull();
    expect(numericBuildValue(findCard('K', 'hearts'))).toBeNull();
  });

  it('shuffles deterministically from a seed', () => {
    const a = shuffledDeck(11).map((card) => card.id);
    const b = shuffledDeck(11).map((card) => card.id);
    const c = shuffledDeck(12).map((card) => card.id);

    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });
});

describe('Capture 11 deal flow', () => {
  it('opens with four cards per player, four on board, and 40 in deck', () => {
    const result = openingDeal(createStandardDeck(), 'player1');
    expect(result.player1Hand).toHaveLength(4);
    expect(result.player2Hand).toHaveLength(4);
    expect(result.board).toHaveLength(4);
    expect(result.deck).toHaveLength(40);
  });

  it('gives first action to the non-dealer and rotates dealer', () => {
    expect(firstPlayerForDealer('player1')).toBe('player2');
    expect(firstPlayerForDealer('player2')).toBe('player1');
    expect(nextDealer('player1')).toBe('player2');
    expect(nextDealer('player2')).toBe('player1');
  });

  it('redeals four to each player without creating board cards', () => {
    const result = redealHands(createStandardDeck().slice(12));
    expect(result.player1Hand).toHaveLength(4);
    expect(result.player2Hand).toHaveLength(4);
    expect(result.deck).toHaveLength(32);
    expect(Object.hasOwn(result, 'board')).toBe(false);
  });
});

describe('Capture 11 final board sweep', () => {
  it('awards every remaining loose/build card to the last capturer', () => {
    const loose = findCard('Q', 'clubs');
    const buildA = findCard('A', 'spades');
    const buildFour = findCard('4', 'diamonds');

    const state: HandState = {
      dealer: 'player1',
      turn: 'player2',
      deck: [],
      board: [
        { kind: 'loose', card: loose },
        {
          kind: 'build',
          id: 'build-1',
          cards: [buildA, buildFour],
          target: 5,
          mode: 'open',
          createdBy: 'player1',
        },
      ],
      players: {
        player1: { id: 'player1', hand: [], captured: [], matchScore: 0 },
        player2: { id: 'player2', hand: [], captured: [], matchScore: 0 },
      },
      lastCapturer: 'player2',
      handNumber: 1,
    };

    const result = resolveFinalSweep(state);
    expect(result.recipient).toBe('player2');
    expect(result.cards.map((card) => card.id)).toEqual([
      loose.id,
      buildA.id,
      buildFour.id,
    ]);
  });

  it('does not invent a winner when no capture was recorded', () => {
    const state: HandState = {
      dealer: 'player1',
      turn: 'player2',
      deck: [],
      board: [{ kind: 'loose', card: findCard('Q', 'clubs') }],
      players: {
        player1: { id: 'player1', hand: [], captured: [], matchScore: 0 },
        player2: { id: 'player2', hand: [], captured: [], matchScore: 0 },
      },
      lastCapturer: null,
      handNumber: 1,
    };

    const result = resolveFinalSweep(state);
    expect(result.recipient).toBeNull();
    expect(result.reason).toBe('no-capture-recorded');
  });
});
