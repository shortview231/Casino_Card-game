import type { BoardItem, Card, HandState, PlayerId } from './model';

export function cardsOnBoard(board: readonly BoardItem[]): Card[] {
  return board.flatMap((item) =>
    item.kind === 'loose' ? [item.card] : [...item.cards],
  );
}

export interface FinalSweepResult {
  readonly recipient: PlayerId | null;
  readonly cards: readonly Card[];
  readonly reason: 'last-capturer' | 'no-capture-recorded';
}

/**
 * At the end of a hand, every card remaining on the board belongs to the
 * player who made the last capture/pickup.
 *
 * The no-capture case is intentionally not guessed. If it ever occurs, the
 * caller receives an explicit unresolved result so the family rule can be
 * confirmed rather than silently inventing behavior.
 */
export function resolveFinalSweep(state: HandState): FinalSweepResult {
  const cards = cardsOnBoard(state.board);
  if (state.lastCapturer === null) {
    return {
      recipient: null,
      cards,
      reason: 'no-capture-recorded',
    };
  }

  return {
    recipient: state.lastCapturer,
    cards,
    reason: 'last-capturer',
  };
}
