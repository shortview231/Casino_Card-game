import { describe, expect, it } from 'vitest';
import type { Card, LooseBoardCard, NumericBuild, Rank, Suit } from '../../src/games/capture11/model';
import {
  canCaptureBuild,
  canCaptureLooseSelection,
  canCreateOpenBuild,
  canCreatePairedBuild,
  canRaiseOpenBuild,
} from '../../src/games/capture11/rules';

function card(rank: Rank, suit: Suit, id = `${rank}-${suit}`): Card {
  return { id, rank, suit };
}

function loose(rank: Rank, suit: Suit, id?: string): LooseBoardCard {
  return { kind: 'loose', card: card(rank, suit, id) };
}

describe('Capture 11 loose captures', () => {
  it('captures numeric loose cards whose sum equals the played card', () => {
    expect(
      canCaptureLooseSelection(card('5', 'clubs'), [loose('A', 'spades'), loose('4', 'hearts')]),
    ).toBe(true);
  });

  it('rejects a numeric loose selection with the wrong sum', () => {
    expect(
      canCaptureLooseSelection(card('5', 'clubs'), [loose('A', 'spades'), loose('3', 'hearts')]),
    ).toBe(false);
  });

  it('lets a face card capture a matching face rank', () => {
    expect(canCaptureLooseSelection(card('Q', 'hearts'), [loose('Q', 'clubs')])).toBe(true);
    expect(canCaptureLooseSelection(card('Q', 'hearts'), [loose('K', 'clubs')])).toBe(false);
  });
});

describe('Capture 11 builds', () => {
  it('allows A + 4 = 5 when a separate 5 remains in hand', () => {
    const playedAce = card('A', 'clubs');
    const boardFour = loose('4', 'hearts');
    const remainingHand = [card('5', 'diamonds')];

    expect(canCreateOpenBuild(playedAce, [boardFour], remainingHand, 5)).toBe(true);
  });

  it('rejects A + 4 = 5 when the player does not still hold a 5', () => {
    expect(
      canCreateOpenBuild(
        card('A', 'clubs'),
        [loose('4', 'hearts')],
        [card('8', 'diamonds')],
        5,
      ),
    ).toBe(false);
  });

  it('allows an open 5 build to be raised with 3 to 8 when an 8 remains in hand', () => {
    const build: NumericBuild = {
      kind: 'build',
      id: 'b1',
      cards: [card('A', 'spades'), card('4', 'clubs')],
      target: 5,
      mode: 'open',
      createdBy: 'player1',
    };

    expect(canRaiseOpenBuild(card('3', 'hearts'), build, [card('8', 'clubs')], 8)).toBe(true);
  });

  it('rejects raising an open build when the new target is not still held', () => {
    const build: NumericBuild = {
      kind: 'build',
      id: 'b1',
      cards: [card('A', 'spades'), card('4', 'clubs')],
      target: 5,
      mode: 'open',
      createdBy: 'player1',
    };

    expect(canRaiseOpenBuild(card('3', 'hearts'), build, [card('7', 'clubs')], 8)).toBe(false);
  });

  it('creates a paired 5 build only when another 5 remains in hand', () => {
    expect(
      canCreatePairedBuild(card('5', 'hearts'), loose('5', 'clubs'), [card('5', 'diamonds')]),
    ).toBe(true);
    expect(
      canCreatePairedBuild(card('5', 'hearts'), loose('5', 'clubs'), [card('8', 'diamonds')]),
    ).toBe(false);
  });

  it('does not allow paired builds to be raised as open builds', () => {
    const paired: NumericBuild = {
      kind: 'build',
      id: 'paired-5',
      cards: [card('5', 'hearts'), card('5', 'clubs')],
      target: 5,
      mode: 'paired',
      createdBy: 'player1',
    };

    expect(canRaiseOpenBuild(card('3', 'clubs'), paired, [card('8', 'spades')], 8)).toBe(false);
  });

  it('captures a build with a matching numeric card', () => {
    const build: NumericBuild = {
      kind: 'build',
      id: 'b8',
      cards: [card('A', 'clubs'), card('4', 'hearts'), card('3', 'diamonds')],
      target: 8,
      mode: 'open',
      createdBy: 'player2',
    };

    expect(canCaptureBuild(card('8', 'spades'), build)).toBe(true);
    expect(canCaptureBuild(card('7', 'spades'), build)).toBe(false);
  });
});
