import type { Card, PlayerId } from './model';

export interface PlayerHandScore {
  readonly aces: number;
  readonly twoOfSpades: number;
  readonly tenOfDiamonds: number;
  readonly mostSpades: number;
  readonly mostCards: number;
  readonly total: number;
}

export interface HandScoreResult {
  readonly scores: Readonly<Record<PlayerId, PlayerHandScore>>;
  readonly cardCounts: Readonly<Record<PlayerId, number>>;
  readonly spadeCounts: Readonly<Record<PlayerId, number>>;
  readonly mostCardsWinner: PlayerId | null;
  readonly mostSpadesWinner: PlayerId | null;
}

function countRank(cards: readonly Card[], rank: Card['rank']): number {
  return cards.filter((card) => card.rank === rank).length;
}

function countSuit(cards: readonly Card[], suit: Card['suit']): number {
  return cards.filter((card) => card.suit === suit).length;
}

function hasCard(cards: readonly Card[], rank: Card['rank'], suit: Card['suit']): boolean {
  return cards.some((card) => card.rank === rank && card.suit === suit);
}

function strictWinner(
  player1Value: number,
  player2Value: number,
): PlayerId | null {
  if (player1Value === player2Value) return null;
  return player1Value > player2Value ? 'player1' : 'player2';
}

export function scoreHand(
  player1Captured: readonly Card[],
  player2Captured: readonly Card[],
): HandScoreResult {
  const cardCounts = {
    player1: player1Captured.length,
    player2: player2Captured.length,
  } as const;

  const spadeCounts = {
    player1: countSuit(player1Captured, 'spades'),
    player2: countSuit(player2Captured, 'spades'),
  } as const;

  const mostCardsWinner = strictWinner(cardCounts.player1, cardCounts.player2);
  const mostSpadesWinner = strictWinner(spadeCounts.player1, spadeCounts.player2);

  const buildScore = (player: PlayerId, cards: readonly Card[]): PlayerHandScore => {
    const aces = countRank(cards, 'A');
    const twoOfSpades = hasCard(cards, '2', 'spades') ? 1 : 0;
    const tenOfDiamonds = hasCard(cards, '10', 'diamonds') ? 3 : 0;
    const mostSpades = mostSpadesWinner === player ? 1 : 0;
    const mostCards = mostCardsWinner === player ? 2 : 0;
    const total = aces + twoOfSpades + tenOfDiamonds + mostSpades + mostCards;

    return {
      aces,
      twoOfSpades,
      tenOfDiamonds,
      mostSpades,
      mostCards,
      total,
    };
  };

  return {
    scores: {
      player1: buildScore('player1', player1Captured),
      player2: buildScore('player2', player2Captured),
    },
    cardCounts,
    spadeCounts,
    mostCardsWinner,
    mostSpadesWinner,
  };
}
