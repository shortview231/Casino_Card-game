import { describe, expect, it } from 'vitest';
import { createStandardDeck } from '../../src/games/capture11/deck';
import {
  applyMove,
  createMatch,
  legalMoves,
  movesForExactSelection,
  type Capture11State,
} from '../../src/games/capture11/game';
import type { Card } from '../../src/games/capture11/model';

function card(rank: Card['rank'], suit: Card['suit']): Card {
  const found = createStandardDeck().find((candidate) => candidate.rank === rank && candidate.suit === suit);
  if (!found) throw new Error(`Missing ${rank} ${suit}`);
  return found;
}

function buildScenario(): Capture11State {
  return {
    seed: 1,
    dealer: 'player2',
    turn: 'player1',
    deck: [card('K', 'clubs')],
    board: [{ kind: 'loose', card: card('4', 'clubs') }],
    players: {
      player1: {
        id: 'player1',
        hand: [card('A', 'hearts'), card('5', 'spades')],
        captured: [],
        matchScore: 0,
      },
      player2: {
        id: 'player2',
        hand: [card('3', 'diamonds'), card('8', 'clubs')],
        captured: [],
        matchScore: 0,
      },
    },
    lastCapturer: null,
    handNumber: 1,
    phase: 'playing',
    lastAction: '',
    lastHandScore: null,
    winner: null,
  };
}

describe('Capture 11 match flow', () => {
  it('starts with CPU dealing so the human gets the first move', () => {
    const state = createMatch(11);
    expect(state.dealer).toBe('player2');
    expect(state.turn).toBe('player1');
    expect(state.players.player1.hand).toHaveLength(4);
    expect(state.players.player2.hand).toHaveLength(4);
    expect(state.board).toHaveLength(4);
    expect(state.deck).toHaveLength(40);
  });

  it('allows a legal trail and advances the turn', () => {
    const state = createMatch(12);
    const played = state.players.player1.hand[0]!;
    const next = applyMove(state, 'player1', { type: 'trail', handCardId: played.id });

    expect(next.turn).toBe('player2');
    expect(next.players.player1.hand).toHaveLength(3);
    expect(next.board.some((item) => item.kind === 'loose' && item.card.id === played.id)).toBe(true);
  });

  it('builds A + 4 to five only because another five is held', () => {
    const state = buildScenario();
    const build = legalMoves(state, 'player1').find(
      (move) => move.type === 'build-open' && move.target === 5,
    );

    expect(build).toBeDefined();
    const next = applyMove(state, 'player1', build!);
    const boardBuild = next.board.find((item) => item.kind === 'build');
    expect(boardBuild?.kind).toBe('build');
    if (boardBuild?.kind === 'build') {
      expect(boardBuild.target).toBe(5);
      expect(boardBuild.cards).toHaveLength(2);
      expect(boardBuild.createdBy).toBe('player1');
    }
  });

  it('lets the opponent burn an open five build to eight while holding an eight', () => {
    const state = buildScenario();
    const build = legalMoves(state, 'player1').find(
      (move) => move.type === 'build-open' && move.target === 5,
    );
    const afterBuild = applyMove(state, 'player1', build!);
    const raise = legalMoves(afterBuild, 'player2').find(
      (move) => move.type === 'raise-build' && move.target === 8,
    );

    expect(raise).toBeDefined();
    const afterRaise = applyMove(afterBuild, 'player2', raise!);
    const raised = afterRaise.board.find((item) => item.kind === 'build');
    expect(raised?.kind).toBe('build');
    if (raised?.kind === 'build') {
      expect(raised.target).toBe(8);
      expect(raised.cards).toHaveLength(3);
      expect(raised.createdBy).toBe('player2');
    }
  });

  it('offers paired builds as locked builds when another target card remains in hand', () => {
    const state: Capture11State = {
      ...buildScenario(),
      players: {
        player1: {
          id: 'player1',
          hand: [card('5', 'hearts'), card('5', 'spades')],
          captured: [],
          matchScore: 0,
        },
        player2: buildScenario().players.player2,
      },
      board: [{ kind: 'loose', card: card('5', 'clubs') }],
    };

    const paired = legalMoves(state, 'player1').find((move) => move.type === 'build-paired');
    expect(paired).toBeDefined();
    const next = applyMove(state, 'player1', paired!);
    const locked = next.board.find((item) => item.kind === 'build');
    expect(locked?.kind).toBe('build');
    if (locked?.kind === 'build') expect(locked.mode).toBe('paired');
  });

  it('creates a locked 9 build from played 2 plus loose 7 and loose 9', () => {
    const two = card('2', 'spades');
    const seven = card('7', 'clubs');
    const boardNine = card('9', 'diamonds');
    const heldNine = card('9', 'hearts');
    const state: Capture11State = {
      ...buildScenario(),
      board: [{ kind: 'loose', card: seven }, { kind: 'loose', card: boardNine }],
      players: {
        player1: { id: 'player1', hand: [two, heldNine], captured: [], matchScore: 0 },
        player2: buildScenario().players.player2,
      },
    };

    const moves = movesForExactSelection(
      state,
      'player1',
      two.id,
      [`loose:${seven.id}`, `loose:${boardNine.id}`],
    );
    const paired = moves.find((move) => move.type === 'build-paired' && move.target === 9);

    expect(paired).toBeDefined();
    const next = applyMove(state, 'player1', paired!);
    const locked = next.board.find((item) => item.kind === 'build');
    expect(locked).toMatchObject({ kind: 'build', target: 9, mode: 'paired' });
    if (locked?.kind === 'build') expect(locked.cards).toHaveLength(3);
  });

  it('extends a locked 9 build with another 9 while retaining a pickup 9', () => {
    const playedNine = card('9', 'spades');
    const heldNine = card('9', 'hearts');
    const locked: Extract<Capture11State['board'][number], { kind: 'build' }> = {
      kind: 'build',
      id: 'locked-9',
      cards: [card('2', 'hearts'), card('7', 'clubs'), card('9', 'diamonds')],
      target: 9,
      mode: 'paired',
      createdBy: 'player1',
    };
    const state: Capture11State = {
      ...buildScenario(),
      board: [locked],
      players: {
        player1: { id: 'player1', hand: [playedNine, heldNine], captured: [], matchScore: 0 },
        player2: buildScenario().players.player2,
      },
    };

    const move = movesForExactSelection(state, 'player1', playedNine.id, [`build:${locked.id}`])
      .find((candidate) => candidate.type === 'extend-paired');

    expect(move).toBeDefined();
    const next = applyMove(state, 'player1', move!);
    const extended = next.board.find((item) => item.kind === 'build');
    if (extended?.kind === 'build') expect(extended.cards).toHaveLength(4);
  });
});
