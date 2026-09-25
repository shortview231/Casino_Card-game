import { SeededRng } from '../../engine/rng';
import type { BoardItem, Card, PlayerId, Rank, Suit } from './model';
import { firstPlayerForDealer } from './model';

export const SUITS: readonly Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
export const RANKS: readonly Rank[] = [
  'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K',
];

export interface DealState {
  readonly deck: readonly Card[];
  readonly player1Hand: readonly Card[];
  readonly player2Hand: readonly Card[];
  readonly board: readonly BoardItem[];
  readonly turn: PlayerId;
}

export interface RedealState {
  readonly deck: readonly Card[];
  readonly player1Hand: readonly Card[];
  readonly player2Hand: readonly Card[];
}

export function createStandardDeck(): Card[] {
  return SUITS.flatMap((suit) =>
    RANKS.map((rank) => ({
      id: `${rank}-${suit}`,
      rank,
      suit,
    })),
  );
}

export function shuffledDeck(seed: number): Card[] {
  return new SeededRng(seed).shuffle(createStandardDeck());
}

function take(deck: readonly Card[], count: number): [Card[], Card[]] {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError('count must be a non-negative integer');
  }
  return [[...deck.slice(0, count)], [...deck.slice(count)]];
}

/** Opening deal: four to each player and four loose cards to the board. */
export function openingDeal(deck: readonly Card[], dealer: PlayerId): DealState {
  if (deck.length < 12) throw new Error('Opening deal requires at least 12 cards');

  let remaining = [...deck];
  let player1Hand: Card[];
  let player2Hand: Card[];
  let boardCards: Card[];

  [player1Hand, remaining] = take(remaining, 4);
  [player2Hand, remaining] = take(remaining, 4);
  [boardCards, remaining] = take(remaining, 4);

  return {
    deck: remaining,
    player1Hand,
    player2Hand,
    board: boardCards.map((card) => ({ kind: 'loose', card })),
    turn: firstPlayerForDealer(dealer),
  };
}

/**
 * Later deals put up to four cards into each hand and never add new board cards.
 * With a standard Capture 11 hand the remaining deck sizes make this exactly
 * four each until the deck is exhausted.
 */
export function redealHands(deck: readonly Card[]): RedealState {
  let remaining = [...deck];
  let player1Hand: Card[];
  let player2Hand: Card[];

  [player1Hand, remaining] = take(remaining, Math.min(4, remaining.length));
  [player2Hand, remaining] = take(remaining, Math.min(4, remaining.length));

  return {
    deck: remaining,
    player1Hand,
    player2Hand,
  };
}
