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

  it('captures three matching face cards through the normal legal move path', () => {
    const jack = card('J', 'hearts');
    const jacks = [card('J', 'clubs'), card('J', 'diamonds'), card('J', 'spades')];
    const state: Capture11State = {
      ...buildScenario(),
      board: jacks.map(cardOnBoard => ({ kind: 'loose' as const, card: cardOnBoard })),
      players: { ...buildScenario().players, player1: { ...buildScenario().players.player1, hand: [jack] } },
    };
    const move = legalMoves(state, 'player1').find(candidate => candidate.type === 'capture-loose' && candidate.cardIds.length === 3);
    expect(move).toBeDefined();
    const next = applyMove(state, 'player1', move!);
    expect(next.board).toHaveLength(0);
    expect(next.players.player1.captured).toHaveLength(4);
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

  it('creates the required locked 7 build from played 3 plus loose 4 and loose 7', () => {
    const three = card('3', 'spades');
    const four = card('4', 'clubs');
    const boardSeven = card('7', 'diamonds');
    const heldSeven = card('7', 'hearts');
    const state: Capture11State = {
      ...buildScenario(),
      board: [{ kind: 'loose', card: four }, { kind: 'loose', card: boardSeven }],
      players: {
        player1: { id: 'player1', hand: [three, heldSeven], captured: [], matchScore: 0 },
        player2: buildScenario().players.player2,
      },
    };

    const move = movesForExactSelection(
      state,
      'player1',
      three.id,
      [`loose:${four.id}`, `loose:${boardSeven.id}`],
    ).find((candidate) => candidate.type === 'build-paired' && candidate.target === 7);

    expect(move).toBeDefined();
    const next = applyMove(state, 'player1', move!);
    const locked = next.board.find((item) => item.kind === 'build');
    expect(locked).toMatchObject({ kind: 'build', target: 7, mode: 'paired' });
    if (locked?.kind === 'build') expect(locked.cards).toHaveLength(3);
    expect(next.players.player1.hand).toEqual([heldSeven]);
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

  it('captures a locked 10 build plus loose 9 and A in one move', () => {
    const playedTen = card('10', 'spades');
    const looseNine = card('9', 'diamonds');
    const looseAce = card('A', 'clubs');
    const unrelated = card('K', 'hearts');
    const locked: Extract<Capture11State['board'][number], { kind: 'build' }> = {
      kind: 'build',
      id: 'locked-10',
      cards: [card('10', 'clubs'), card('10', 'hearts')],
      target: 10,
      mode: 'paired',
      createdBy: 'player1',
    };
    const state: Capture11State = {
      ...buildScenario(),
      board: [
        locked,
        { kind: 'loose', card: looseNine },
        { kind: 'loose', card: looseAce },
        { kind: 'loose', card: unrelated },
      ],
      players: {
        player1: { id: 'player1', hand: [playedTen], captured: [], matchScore: 0 },
        player2: buildScenario().players.player2,
      },
    };

    const move = movesForExactSelection(
      state,
      'player1',
      playedTen.id,
      [`build:${locked.id}`, `loose:${looseNine.id}`, `loose:${looseAce.id}`],
    ).find((candidate) => candidate.type === 'capture-combined');

    expect(move).toBeDefined();
    const next = applyMove(state, 'player1', move!);
    expect(next.board).toEqual([{ kind: 'loose', card: unrelated }]);
    expect(next.players.player1.captured).toHaveLength(5);
    expect(next.players.player1.captured.map((captured) => captured.id)).toEqual(
      expect.arrayContaining([
        playedTen.id,
        looseNine.id,
        looseAce.id,
        card('10', 'clubs').id,
        card('10', 'hearts').id,
      ]),
    );
    expect(next.players.player1.hand).toHaveLength(0);
    expect(next.lastCapturer).toBe('player1');
  });

  it('captures a 7 build plus loose 3 and 4 in one move', () => {
    const playedSeven = card('7', 'spades');
    const looseThree = card('3', 'diamonds');
    const looseFour = card('4', 'clubs');
    const locked: Extract<Capture11State['board'][number], { kind: 'build' }> = {
      kind: 'build',
      id: 'locked-7',
      cards: [card('2', 'clubs'), card('5', 'hearts')],
      target: 7,
      mode: 'paired',
      createdBy: 'player2',
    };
    const state: Capture11State = {
      ...buildScenario(),
      board: [locked, { kind: 'loose', card: looseThree }, { kind: 'loose', card: looseFour }],
      players: {
        player1: { id: 'player1', hand: [playedSeven], captured: [], matchScore: 0 },
        player2: buildScenario().players.player2,
      },
    };

    const move = movesForExactSelection(
      state,
      'player1',
      playedSeven.id,
      [`build:${locked.id}`, `loose:${looseThree.id}`, `loose:${looseFour.id}`],
    ).find((candidate) => candidate.type === 'capture-combined');

    expect(move).toBeDefined();
    const next = applyMove(state, 'player1', move!);
    expect(next.board).toHaveLength(0);
    expect(next.players.player1.captured).toHaveLength(5);
  });

  it('adds two valid components to one build, then captures the entire unit', () => {
    const ten = card('10', 'spades');
    const six = card('6', 'hearts'); const four = card('4', 'clubs');
    const seven = card('7', 'diamonds'); const three = card('3', 'spades');
    const build: Extract<Capture11State['board'][number], { kind: 'build' }> = {
      kind: 'build', id: 'multi-10', cards: [six, four], components: [[six, four]], target: 10, mode: 'open', createdBy: 'player1',
    };
    const state: Capture11State = {
      ...buildScenario(), board: [build, { kind: 'loose', card: seven }, { kind: 'loose', card: three }],
      players: { player1: { id: 'player1', hand: [ten], captured: [], matchScore: 0 }, player2: buildScenario().players.player2 },
    };
    const extend = movesForExactSelection(state, 'player1', ten.id, [`build:${build.id}`, `loose:${seven.id}`, `loose:${three.id}`])
      .find((move) => move.type === 'extend-build');
    expect(extend).toBeDefined();
    const extended = applyMove(state, 'player1', extend!);
    const extendedBuild = extended.board.find((item) => item.kind === 'build');
    expect(extendedBuild?.kind).toBe('build');
    if (extendedBuild?.kind === 'build') {
      expect(extendedBuild.components).toHaveLength(2);
      expect(extendedBuild.cards).toHaveLength(4);
    }
    const capture = movesForExactSelection(extended, 'player1', ten.id, [`build:${build.id}`]).find((move) => move.type === 'capture-build');
    expect(capture).toBeDefined();
    const next = applyMove(extended, 'player1', capture!);
    expect(next.board).toHaveLength(0);
    expect(next.players.player1.captured.map((captured) => captured.id)).toEqual(expect.arrayContaining([ten.id, six.id, four.id, seven.id, three.id]));
  });

  it('keeps three independent components together', () => {
    const ten = card('10', 'spades'); const six = card('6', 'hearts'); const four = card('4', 'clubs');
    const seven = card('7', 'diamonds'); const three = card('3', 'spades'); const eight = card('8', 'clubs'); const two = card('2', 'hearts');
    const build: Extract<Capture11State['board'][number], { kind: 'build' }> = { kind: 'build', id: 'triple-10', cards: [six, four], components: [[six, four]], target: 10, mode: 'open', createdBy: 'player1' };
    const state: Capture11State = { ...buildScenario(), board: [build, { kind: 'loose', card: seven }, { kind: 'loose', card: three }, { kind: 'loose', card: eight }, { kind: 'loose', card: two }], players: { player1: { id: 'player1', hand: [ten], captured: [], matchScore: 0 }, player2: buildScenario().players.player2 } };
    const first = movesForExactSelection(state, 'player1', ten.id, [`build:${build.id}`, `loose:${seven.id}`, `loose:${three.id}`]).find(move => move.type === 'extend-build');
    expect(first).toBeDefined();
    const afterFirst = applyMove(state, 'player1', first!);
    const secondBuild = afterFirst.board.find(item => item.kind === 'build');
    expect(secondBuild?.kind).toBe('build');
    if (secondBuild?.kind !== 'build') return;
    const second = movesForExactSelection(afterFirst, 'player1', ten.id, [`build:${secondBuild.id}`, `loose:${eight.id}`, `loose:${two.id}`]).find(move => move.type === 'extend-build');
    expect(second).toBeDefined();
    const complete = applyMove(afterFirst, 'player1', second!);
    const finalBuild = complete.board.find(item => item.kind === 'build');
    expect(finalBuild?.kind).toBe('build');
    if (finalBuild?.kind === 'build') expect(finalBuild.components).toHaveLength(3);
  });

  it('preserves takeover and raise behavior for ordinary builds', () => {
    const state = buildScenario();
    const build = legalMoves(state, 'player1').find((move) => move.type === 'build-open' && move.target === 5);
    const afterBuild = applyMove(state, 'player1', build!);
    const raise = legalMoves(afterBuild, 'player2').find((move) => move.type === 'raise-build' && move.target === 8);
    expect(raise).toBeDefined();
    const afterRaise = applyMove(afterBuild, 'player2', raise!);
    expect(afterRaise.board.some((item) => item.kind === 'build' && item.target === 8 && item.createdBy === 'player2')).toBe(true);
  });
});
