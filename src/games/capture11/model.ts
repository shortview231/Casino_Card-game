export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';

export type Rank =
  | 'A'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K';

export type PlayerId = 'player1' | 'player2';

export interface Card {
  readonly id: string;
  readonly rank: Rank;
  readonly suit: Suit;
}

/**
 * Numeric value used by Capture 11 build arithmetic.
 * Face cards are intentionally not numeric build cards. They keep their rank
 * identity and may be captured by matching rank according to the game rules.
 */
export function numericBuildValue(card: Card): number | null {
  if (card.rank === 'A') return 1;
  if (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') return null;
  return Number(card.rank);
}

export interface LooseBoardCard {
  readonly kind: 'loose';
  readonly card: Card;
}

/**
 * A numeric build on the board.
 *
 * open: may be legally raised when the acting player can satisfy the new
 * declared target under Capture 11 rules.
 * paired: two or more card groups that each equal the declared target. The
 * target is fixed, but later complete target-sized groups may be added.
 */
export interface NumericBuild {
  readonly kind: 'build';
  readonly id: string;
  readonly cards: readonly Card[];
  /** Independent card groups; every group must add to target. Optional for legacy states. */
  readonly components?: readonly (readonly Card[])[];
  readonly target: number;
  readonly mode: 'open' | 'paired';
  readonly createdBy: PlayerId;
}

export type BoardItem = LooseBoardCard | NumericBuild;

export interface PlayerState {
  readonly id: PlayerId;
  readonly hand: readonly Card[];
  readonly captured: readonly Card[];
  readonly matchScore: number;
}

export interface HandState {
  readonly dealer: PlayerId;
  readonly turn: PlayerId;
  readonly deck: readonly Card[];
  readonly board: readonly BoardItem[];
  readonly players: Readonly<Record<PlayerId, PlayerState>>;
  readonly lastCapturer: PlayerId | null;
  readonly handNumber: number;
}

export const MATCH_TARGET = 11;

export function otherPlayer(player: PlayerId): PlayerId {
  return player === 'player1' ? 'player2' : 'player1';
}

export function firstPlayerForDealer(dealer: PlayerId): PlayerId {
  return otherPlayer(dealer);
}

export function nextDealer(dealer: PlayerId): PlayerId {
  return otherPlayer(dealer);
}
