import { describe, expect, it } from 'vitest';
import type { Card, Rank, Suit } from '../../src/games/capture11/model';
import { scoreHand } from '../../src/games/capture11/scoring';

function card(rank: Rank, suit: Suit, id = `${rank}-${suit}`): Card {
  return { id, rank, suit };
}

describe('Capture 11 scoring', () => {
  it('awards the four aces individually', () => {
    const p1 = [
      card('A', 'spades', 'as'),
      card('A', 'hearts', 'ah'),
      card('A', 'diamonds', 'ad'),
      card('A', 'clubs', 'ac'),
    ];

    const result = scoreHand(p1, []);
    expect(result.scores.player1.aces).toBe(4);
  });

  it('awards the 2 of spades as one point and the 10 of diamonds as three', () => {
    const result = scoreHand(
      [card('2', 'spades'), card('10', 'diamonds')],
      [],
    );

    expect(result.scores.player1.twoOfSpades).toBe(1);
    expect(result.scores.player1.tenOfDiamonds).toBe(3);
  });

  it('awards most cards as two points', () => {
    const p1 = [card('3', 'clubs', '1'), card('4', 'clubs', '2')];
    const p2 = [card('5', 'clubs', '3')];
    const result = scoreHand(p1, p2);

    expect(result.mostCardsWinner).toBe('player1');
    expect(result.scores.player1.mostCards).toBe(2);
    expect(result.scores.player2.mostCards).toBe(0);
  });

  it('awards no most-cards points on a 26-26 split', () => {
    const ranks: Rank[] = ['3', '4', '5', '6', '7', '8', '9', 'J', 'Q', 'K'];
    const p1 = Array.from({ length: 26 }, (_, index) =>
      card(ranks[index % ranks.length], 'clubs', `p1-${index}`),
    );
    const p2 = Array.from({ length: 26 }, (_, index) =>
      card(ranks[index % ranks.length], 'hearts', `p2-${index}`),
    );

    const result = scoreHand(p1, p2);
    expect(result.mostCardsWinner).toBeNull();
    expect(result.scores.player1.mostCards).toBe(0);
    expect(result.scores.player2.mostCards).toBe(0);
  });

  it('awards most spades as one point', () => {
    const p1 = [card('3', 'spades', '1'), card('4', 'spades', '2')];
    const p2 = [card('5', 'spades', '3')];
    const result = scoreHand(p1, p2);

    expect(result.mostSpadesWinner).toBe('player1');
    expect(result.scores.player1.mostSpades).toBe(1);
  });
});
