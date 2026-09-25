import type { CpuDifficulty } from '../../engine/contracts';
import type { Card, LooseBoardCard, PlayerId, Rank } from './model';
import { numericBuildValue } from './model';
import { applyMove, legalMoves, type Capture11Move, type Capture11State } from './game';

const DECK_SIZE = 52;
const RANKS: readonly Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export interface CpuMemory {
  round: number | null;
  seenCards: Set<string>;
  seenRankCounts: Map<Rank, number>;
  lastCapturePlayer: PlayerId | null;
}

export interface CpuMemorySnapshot {
  readonly round: number | null;
  readonly seenCards: readonly string[];
  readonly seenRankCounts: Readonly<Record<Rank, number>>;
  readonly cardsRemaining: number;
  readonly lastCapturePlayer: PlayerId | null;
}

export function createCpuMemory(): CpuMemory {
  return { round: null, seenCards: new Set(), seenRankCounts: new Map(), lastCapturePlayer: null };
}

export function resetCpuMemory(memory: CpuMemory): void {
  memory.round = null; memory.seenCards.clear(); memory.seenRankCounts.clear(); memory.lastCapturePlayer = null;
}

function remember(memory: CpuMemory, card: Card): void {
  if (memory.seenCards.has(card.id)) return;
  memory.seenCards.add(card.id);
  memory.seenRankCounts.set(card.rank, (memory.seenRankCounts.get(card.rank) ?? 0) + 1);
}

/** Observe public cards plus the CPU's own hand. The human hand is intentionally excluded. */
export function observePublicState(memory: CpuMemory, state: Capture11State, cpu: PlayerId = 'player2'): void {
  if (memory.round !== null && memory.round !== state.handNumber) resetCpuMemory(memory);
  memory.round = state.handNumber;
  for (const card of state.players[cpu].hand) remember(memory, card);
  for (const card of state.players.player1.captured) remember(memory, card);
  for (const card of state.players.player2.captured) remember(memory, card);
  for (const item of state.board) for (const card of item.kind === 'loose' ? [item.card] : item.cards) remember(memory, card);
  memory.lastCapturePlayer = state.lastCapturer;
}

export function snapshotCpuMemory(memory: CpuMemory): CpuMemorySnapshot {
  const seenRankCounts = Object.fromEntries(RANKS.map(rank => [rank, memory.seenRankCounts.get(rank) ?? 0])) as Record<Rank, number>;
  return { round: memory.round, seenCards: [...memory.seenCards], seenRankCounts, cardsRemaining: DECK_SIZE - memory.seenCards.size, lastCapturePlayer: memory.lastCapturePlayer };
}

function cardTacticalValue(card: Card): number {
  let value = 1;
  if (card.rank === 'A') value += 8;
  if (card.rank === '2' && card.suit === 'spades') value += 10;
  if (card.rank === '10' && card.suit === 'diamonds') value += 18;
  if (card.suit === 'spades') value += 2;
  return value;
}

function cardById(state: Capture11State, player: PlayerId, id: string): Card {
  const card = state.players[player].hand.find(candidate => candidate.id === id);
  if (!card) throw new Error('AI move references missing hand card');
  return card;
}

function immediateScore(state: Capture11State, player: PlayerId, move: Capture11Move): number {
  const played = cardById(state, player, move.handCardId);
  if (move.type === 'capture-loose') {
    const captured = (state.board.filter(item => item.kind === 'loose') as LooseBoardCard[]).filter(item => move.cardIds.includes(item.card.id)).map(item => item.card);
    return 100 + captured.length * 7 + captured.reduce((sum, card) => sum + cardTacticalValue(card), 0) + cardTacticalValue(played);
  }
  if (move.type === 'capture-build') {
    const build = state.board.find(item => item.kind === 'build' && item.id === move.buildId);
    const cards = build?.kind === 'build' ? build.cards : [];
    return 120 + cards.length * 8 + cards.reduce((sum, card) => sum + cardTacticalValue(card), 0) + cardTacticalValue(played);
  }
  if (move.type === 'capture-combined') {
    const captured = state.board.flatMap(item => item.kind === 'build' && move.buildIds.includes(item.id)
      ? [...item.cards] : item.kind === 'loose' && move.cardIds.includes(item.card.id) ? [item.card] : []);
    return 120 + captured.length * 8 + captured.reduce((sum, card) => sum + cardTacticalValue(card), 0) + cardTacticalValue(played);
  }
  if (move.type === 'raise-build') {
    const build = state.board.find(item => item.kind === 'build' && item.id === move.buildId);
    return 62 + (build?.kind === 'build' && build.createdBy !== player ? 20 : 0) + (build?.kind === 'build' ? build.cards.length * 3 : 0) + move.target;
  }
  if (move.type === 'extend-build') return 58 + move.cardIds.length * 4 + move.target;
  if (move.type === 'build-paired' || move.type === 'extend-paired') return 52 + move.target - cardTacticalValue(played) * 0.5;
  if (move.type === 'build-open') {
    const selectedLoose = state.board.filter(item => item.kind === 'loose') as LooseBoardCard[];
    const selectedValue = selectedLoose.filter(item => move.cardIds.includes(item.card.id)).reduce((sum, item) => sum + cardTacticalValue(item.card), 0);
    return 45 + move.cardIds.length * 3 + move.target - selectedValue * 0.35;
  }
  const numeric = numericBuildValue(played);
  return 5 - cardTacticalValue(played) + (numeric === null ? -2 : 0);
}

function futureHandScore(state: Capture11State, player: PlayerId, move: Capture11Move): number {
  try {
    const next = applyMove(state, player, move);
    if (next.phase !== 'playing') return 0;
    const projected = { ...next, turn: player };
    return Math.max(0, ...legalMoves(projected, player).map(candidate => immediateScore(projected, player, candidate)));
  } catch {
    return 0;
  }
}

function rankForTarget(target: number): Rank | null {
  return target === 1 ? 'A' : target >= 2 && target <= 10 ? String(target) as Rank : null;
}

function hardBuildRisk(state: Capture11State, player: PlayerId, move: Capture11Move, memory: CpuMemory): number {
  if (move.type !== 'build-open' && move.type !== 'build-paired' && move.type !== 'raise-build' && move.type !== 'extend-build' && move.type !== 'extend-paired') return 0;
  const rank = rankForTarget(move.target);
  if (!rank) return 0;
  const unseen = Math.max(0, 4 - (memory.seenRankCounts.get(rank) ?? 0));
  const lateRound = Math.max(0, Math.min(1, 1 - state.deck.length / 40));
  const ownTarget = state.players[player].hand.some(card => numericBuildValue(card) === move.target);
  return unseen * lateRound * (ownTarget ? 7 : 12);
}

export function evaluateMove(state: Capture11State, player: PlayerId, move: Capture11Move, difficulty: CpuDifficulty = 'medium', memory: CpuMemory = createCpuMemory()): number {
  const immediate = immediateScore(state, player, move);
  if (difficulty === 'easy') return immediate;
  const played = cardById(state, player, move.handCardId);
  const remainingValue = state.players[player].hand.filter(card => card.id !== played.id).reduce((sum, card) => sum + cardTacticalValue(card), 0);
  const medium = immediate + futureHandScore(state, player, move) * 0.35 + remainingValue * 0.08 + (played.rank === '10' && played.suit === 'diamonds' ? -8 : 0);
  return difficulty === 'medium' ? medium : medium - hardBuildRisk(state, player, move, memory);
}

export function chooseCpuMove(state: Capture11State, player: PlayerId = 'player2', difficulty: CpuDifficulty = 'medium', memory: CpuMemory = createCpuMemory()): Capture11Move {
  observePublicState(memory, state, player);
  const moves = legalMoves(state, player);
  if (moves.length === 0) throw new Error('CPU has no legal move');
  let best = moves[0]!; let bestScore = evaluateMove(state, player, best, difficulty, memory);
  for (const move of moves.slice(1)) {
    const candidateScore = evaluateMove(state, player, move, difficulty, memory);
    if (candidateScore > bestScore) { best = move; bestScore = candidateScore; }
  }
  return best;
}
