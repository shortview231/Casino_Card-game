import type { Card, PlayerId } from './model';
import { numericBuildValue } from './model';
import { legalMoves, type Capture11Move, type Capture11State } from './game';

function cardTacticalValue(card: Card): number {
  let value = 1;
  if (card.rank === 'A') value += 8;
  if (card.rank === '2' && card.suit === 'spades') value += 10;
  if (card.rank === '10' && card.suit === 'diamonds') value += 18;
  if (card.suit === 'spades') value += 2;
  return value;
}

function cardById(state: Capture11State, player: PlayerId, id: string): Card {
  const card = state.players[player].hand.find((candidate) => candidate.id === id);
  if (!card) throw new Error('AI move references missing hand card');
  return card;
}

function scoreMove(state: Capture11State, player: PlayerId, move: Capture11Move): number {
  const played = cardById(state, player, move.handCardId);

  if (move.type === 'capture-loose') {
    const captured = state.board
      .filter((item) => item.kind === 'loose' && move.cardIds.includes(item.card.id))
      .map((item) => item.kind === 'loose' ? item.card : null)
      .filter((card): card is Card => card !== null);
    return 100 + captured.length * 7 + captured.reduce((sum, card) => sum + cardTacticalValue(card), 0) + cardTacticalValue(played);
  }

  if (move.type === 'capture-build') {
    const build = state.board.find((item) => item.kind === 'build' && item.id === move.buildId);
    const cards = build?.kind === 'build' ? build.cards : [];
    return 120 + cards.length * 8 + cards.reduce((sum, card) => sum + cardTacticalValue(card), 0) + cardTacticalValue(played);
  }

  if (move.type === 'raise-build') {
    const build = state.board.find((item) => item.kind === 'build' && item.id === move.buildId);
    const enemyBonus = build?.kind === 'build' && build.createdBy !== player ? 20 : 0;
    const sizeBonus = build?.kind === 'build' ? build.cards.length * 3 : 0;
    return 62 + enemyBonus + sizeBonus + move.target;
  }

  if (move.type === 'build-paired') {
    return 52 + move.target - cardTacticalValue(played) * 0.5;
  }

  if (move.type === 'build-open') {
    const selectedValue = state.board
      .filter((item) => item.kind === 'loose' && move.cardIds.includes(item.card.id))
      .reduce((sum, item) => sum + (item.kind === 'loose' ? cardTacticalValue(item.card) : 0), 0);
    return 45 + move.cardIds.length * 3 + move.target - selectedValue * 0.35;
  }

  const numeric = numericBuildValue(played);
  const facePenalty = numeric === null ? -2 : 0;
  return 5 - cardTacticalValue(played) + facePenalty;
}

export function chooseCpuMove(state: Capture11State, player: PlayerId = 'player2'): Capture11Move {
  const moves = legalMoves(state, player);
  if (moves.length === 0) throw new Error('CPU has no legal move');

  let best = moves[0]!;
  let bestScore = scoreMove(state, player, best);
  for (const move of moves.slice(1)) {
    const candidate = scoreMove(state, player, move);
    if (candidate > bestScore) {
      best = move;
      bestScore = candidate;
    }
  }
  return best;
}
