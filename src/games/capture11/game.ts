import type { BoardItem, Card, HandState, LooseBoardCard, NumericBuild, PlayerId } from './model';
import { MATCH_TARGET, nextDealer, numericBuildValue, otherPlayer } from './model';
import { openingDeal, redealHands, shuffledDeck } from './deck';
import {
  canCaptureBuild,
  canCaptureCombinedSelection,
  canCaptureLooseSelection,
  canCreateOpenBuild,
  canCreatePairedBuild,
  canExtendPairedBuild,
  canRaiseOpenBuild,
} from './rules';
import { scoreHand, type HandScoreResult } from './scoring';

export type Capture11Phase = 'playing' | 'hand-over' | 'match-over';

export interface Capture11State extends HandState {
  readonly phase: Capture11Phase;
  readonly lastAction: string;
  readonly lastHandScore: HandScoreResult | null;
  readonly winner: PlayerId | null;
  readonly seed: number;
}

export type Capture11Move =
  | { readonly type: 'trail'; readonly handCardId: string }
  | { readonly type: 'capture-loose'; readonly handCardId: string; readonly cardIds: readonly string[] }
  | { readonly type: 'capture-build'; readonly handCardId: string; readonly buildId: string }
  | { readonly type: 'capture-combined'; readonly handCardId: string; readonly buildIds: readonly string[]; readonly cardIds: readonly string[] }
  | { readonly type: 'build-open'; readonly handCardId: string; readonly cardIds: readonly string[]; readonly target: number }
  | { readonly type: 'build-paired'; readonly handCardId: string; readonly cardIds: readonly string[]; readonly target: number }
  | { readonly type: 'extend-paired'; readonly handCardId: string; readonly buildId: string; readonly cardIds: readonly string[]; readonly target: number }
  | { readonly type: 'raise-build'; readonly handCardId: string; readonly buildId: string; readonly target: number };

function copyPlayers(state: Capture11State) {
  return {
    player1: { ...state.players.player1, hand: [...state.players.player1.hand], captured: [...state.players.player1.captured] },
    player2: { ...state.players.player2, hand: [...state.players.player2.hand], captured: [...state.players.player2.captured] },
  };
}

function startHand(seed: number, dealer: PlayerId, handNumber: number, scores: Readonly<Record<PlayerId, number>>): Capture11State {
  const dealt = openingDeal(shuffledDeck(seed), dealer);
  return {
    seed,
    dealer,
    turn: dealt.turn,
    deck: dealt.deck,
    board: dealt.board,
    players: {
      player1: { id: 'player1', hand: dealt.player1Hand, captured: [], matchScore: scores.player1 },
      player2: { id: 'player2', hand: dealt.player2Hand, captured: [], matchScore: scores.player2 },
    },
    lastCapturer: null,
    handNumber,
    phase: 'playing',
    lastAction: `${dealer === 'player1' ? 'You are' : 'CPU is'} dealing. ${dealt.turn === 'player1' ? 'You play' : 'CPU plays'} first.`,
    lastHandScore: null,
    winner: null,
  };
}

export function createMatch(seed: number): Capture11State {
  return startHand(seed, 'player2', 1, { player1: 0, player2: 0 });
}

export function beginNextHand(state: Capture11State): Capture11State {
  if (state.phase !== 'hand-over') throw new Error('Next hand can only start after a completed hand');
  return startHand(
    (state.seed + 0x9e3779b9 + state.handNumber) >>> 0,
    nextDealer(state.dealer),
    state.handNumber + 1,
    {
      player1: state.players.player1.matchScore,
      player2: state.players.player2.matchScore,
    },
  );
}

function getPlayedCard(state: Capture11State, player: PlayerId, cardId: string): Card {
  const card = state.players[player].hand.find((candidate) => candidate.id === cardId);
  if (!card) throw new Error('Selected card is not in the acting player hand');
  return card;
}

function looseByIds(board: readonly BoardItem[], ids: readonly string[]): LooseBoardCard[] {
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate board selection');
  return ids.map((id) => {
    const item = board.find((candidate) => candidate.kind === 'loose' && candidate.card.id === id);
    if (!item || item.kind !== 'loose') throw new Error('Selected loose card is not on the board');
    return item;
  });
}

function buildById(board: readonly BoardItem[], id: string): NumericBuild {
  const item = board.find((candidate) => candidate.kind === 'build' && candidate.id === id);
  if (!item || item.kind !== 'build') throw new Error('Selected build is not on the board');
  return item;
}

function buildsByIds(board: readonly BoardItem[], ids: readonly string[]): NumericBuild[] {
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate build selection');
  return ids.map((id) => buildById(board, id));
}

function withoutHandCard(hand: readonly Card[], cardId: string): Card[] {
  return hand.filter((card) => card.id !== cardId);
}

function describeCard(card: Card): string {
  const suit = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }[card.suit];
  return `${card.rank}${suit}`;
}

function boardCards(board: readonly BoardItem[]): Card[] {
  return board.flatMap((item) => item.kind === 'loose' ? [item.card] : [...item.cards]);
}

function resolveHandEnd(state: Capture11State): Capture11State {
  if (state.deck.length > 0 || state.players.player1.hand.length > 0 || state.players.player2.hand.length > 0) {
    return state;
  }

  const players = copyPlayers(state);
  const leftovers = boardCards(state.board);
  let sweepText = '';
  if (leftovers.length > 0 && state.lastCapturer !== null) {
    const recipient = state.lastCapturer;
    players[recipient] = {
      ...players[recipient],
      captured: [...players[recipient].captured, ...leftovers],
    };
    sweepText = ` ${recipient === 'player1' ? 'You' : 'CPU'} take${recipient === 'player1' ? '' : 's'} the final ${leftovers.length} board card${leftovers.length === 1 ? '' : 's'}.`;
  }

  const handScore = scoreHand(players.player1.captured, players.player2.captured);
  players.player1 = {
    ...players.player1,
    matchScore: players.player1.matchScore + handScore.scores.player1.total,
  };
  players.player2 = {
    ...players.player2,
    matchScore: players.player2.matchScore + handScore.scores.player2.total,
  };

  let winner: PlayerId | null = null;
  const p1 = players.player1.matchScore;
  const p2 = players.player2.matchScore;
  if (p1 >= MATCH_TARGET || p2 >= MATCH_TARGET) {
    if (p1 > p2) winner = 'player1';
    if (p2 > p1) winner = 'player2';
  }

  return {
    ...state,
    board: [],
    players,
    phase: winner ? 'match-over' : 'hand-over',
    lastHandScore: handScore,
    winner,
    lastAction: `${state.lastAction}${sweepText}`.trim(),
  };
}

function redealIfNeeded(state: Capture11State): Capture11State {
  if (state.players.player1.hand.length > 0 || state.players.player2.hand.length > 0 || state.deck.length === 0) {
    return state;
  }
  const dealt = redealHands(state.deck);
  return {
    ...state,
    deck: dealt.deck,
    players: {
      player1: { ...state.players.player1, hand: dealt.player1Hand },
      player2: { ...state.players.player2, hand: dealt.player2Hand },
    },
    lastAction: `${state.lastAction} Four new cards each.`,
  };
}

export function applyMove(state: Capture11State, player: PlayerId, move: Capture11Move): Capture11State {
  if (state.phase !== 'playing') throw new Error('The hand is not accepting moves');
  if (state.turn !== player) throw new Error('It is not that player’s turn');

  const played = getPlayedCard(state, player, move.handCardId);
  const remainingHand = withoutHandCard(state.players[player].hand, played.id);
  const players = copyPlayers(state);
  players[player] = { ...players[player], hand: remainingHand };
  let board = [...state.board];
  let lastCapturer = state.lastCapturer;
  let lastAction = '';
  const newBuildId = `build-${state.handNumber}-${played.id}`;

  switch (move.type) {
    case 'trail': {
      board.push({ kind: 'loose', card: played });
      lastAction = `${player === 'player1' ? 'You trail' : 'CPU trails'} ${describeCard(played)}.`;
      break;
    }
    case 'capture-loose': {
      const selected = looseByIds(board, move.cardIds);
      if (!canCaptureLooseSelection(played, selected)) throw new Error('That loose-card capture is not legal');
      const selectedIds = new Set(selected.map((item) => item.card.id));
      board = board.filter((item) => item.kind !== 'loose' || !selectedIds.has(item.card.id));
      const captured = selected.map((item) => item.card);
      players[player] = { ...players[player], captured: [...players[player].captured, ...captured, played] };
      lastCapturer = player;
      lastAction = `${player === 'player1' ? 'You capture' : 'CPU captures'} ${captured.map(describeCard).join(' + ')} with ${describeCard(played)}.`;
      break;
    }
    case 'capture-build': {
      const build = buildById(board, move.buildId);
      if (!canCaptureBuild(played, build)) throw new Error('That build capture is not legal');
      board = board.filter((item) => item !== build);
      players[player] = { ...players[player], captured: [...players[player].captured, ...build.cards, played] };
      lastCapturer = player;
      lastAction = `${player === 'player1' ? 'You capture' : 'CPU captures'} a ${build.target} build (${build.cards.length} cards) with ${describeCard(played)}.`;
      break;
    }
    case 'capture-combined': {
      const selectedBuilds = buildsByIds(board, move.buildIds);
      const selectedLoose = looseByIds(board, move.cardIds);
      if (!canCaptureCombinedSelection(played, selectedBuilds, selectedLoose)) throw new Error('That combined capture is not legal');
      const selectedBuildIds = new Set(selectedBuilds.map((build) => build.id));
      const selectedLooseIds = new Set(selectedLoose.map((item) => item.card.id));
      board = board.filter((item) => item.kind === 'build'
        ? !selectedBuildIds.has(item.id)
        : !selectedLooseIds.has(item.card.id));
      const captured = [
        ...selectedBuilds.flatMap((build) => build.cards),
        ...selectedLoose.map((item) => item.card),
      ];
      players[player] = { ...players[player], captured: [...players[player].captured, ...captured, played] };
      lastCapturer = player;
      lastAction = `${player === 'player1' ? 'You capture' : 'CPU captures'} ${selectedBuilds.length} build${selectedBuilds.length === 1 ? '' : 's'} and ${selectedLoose.length} loose card${selectedLoose.length === 1 ? '' : 's'} with ${describeCard(played)}.`;
      break;
    }
    case 'build-open': {
      const selected = looseByIds(board, move.cardIds);
      if (!canCreateOpenBuild(played, selected, remainingHand, move.target)) throw new Error('That build is not legal');
      const selectedIds = new Set(selected.map((item) => item.card.id));
      board = board.filter((item) => item.kind !== 'loose' || !selectedIds.has(item.card.id));
      board.push({
        kind: 'build',
        id: newBuildId,
        cards: [...selected.map((item) => item.card), played],
        target: move.target,
        mode: 'open',
        createdBy: player,
      });
      lastAction = `${player === 'player1' ? 'You build' : 'CPU builds'} ${move.target}.`;
      break;
    }
    case 'build-paired': {
      const selected = looseByIds(board, move.cardIds);
      if (!canCreatePairedBuild(played, selected, remainingHand, move.target)) throw new Error('That paired build is not legal');
      const selectedIds = new Set(selected.map((item) => item.card.id));
      board = board.filter((item) => item.kind !== 'loose' || !selectedIds.has(item.card.id));
      board.push({
        kind: 'build',
        id: newBuildId,
        cards: [...selected.map((item) => item.card), played],
        target: move.target,
        mode: 'paired',
        createdBy: player,
      });
      lastAction = `${player === 'player1' ? 'You lock' : 'CPU locks'} a paired ${move.target} build with ${selected.length + 1} cards.`;
      break;
    }
    case 'extend-paired': {
      const build = buildById(board, move.buildId);
      const selected = looseByIds(board, move.cardIds);
      if (build.target !== move.target || !canExtendPairedBuild(played, selected, build, remainingHand)) throw new Error('That locked-build extension is not legal');
      const selectedIds = new Set(selected.map((item) => item.card.id));
      board = board.filter((item) => item !== build && (item.kind !== 'loose' || !selectedIds.has(item.card.id)));
      board.push({
        ...build,
        cards: [...build.cards, ...selected.map((item) => item.card), played],
        mode: 'paired',
        createdBy: player,
      });
      lastAction = `${player === 'player1' ? 'You add' : 'CPU adds'} another ${build.target} group to the locked build.`;
      break;
    }
    case 'raise-build': {
      const build = buildById(board, move.buildId);
      if (!canRaiseOpenBuild(played, build, remainingHand, move.target)) throw new Error('That build raise is not legal');
      board = board.filter((item) => item !== build);
      board.push({
        ...build,
        cards: [...build.cards, played],
        target: move.target,
        createdBy: player,
      });
      lastAction = `${player === 'player1' ? 'You burn the build' : 'CPU burns your build'} and raise it from ${build.target} to ${move.target}.`;
      break;
    }
  }

  let next: Capture11State = {
    ...state,
    board,
    players,
    lastCapturer,
    turn: otherPlayer(player),
    lastAction,
  };
  next = redealIfNeeded(next);
  next = resolveHandEnd(next);
  return next;
}

function looseItems(state: Capture11State): LooseBoardCard[] {
  return state.board.filter((item): item is LooseBoardCard => item.kind === 'loose');
}

function builds(state: Capture11State): NumericBuild[] {
  return state.board.filter((item): item is NumericBuild => item.kind === 'build');
}

function subsetsForSum(cards: readonly LooseBoardCard[], target: number, limit = 48): LooseBoardCard[][] {
  const candidates = cards
    .map((item) => ({ item, value: numericBuildValue(item.card) }))
    .filter((entry): entry is { item: LooseBoardCard; value: number } => entry.value !== null && entry.value <= target);
  const results: LooseBoardCard[][] = [];
  const chosen: LooseBoardCard[] = [];

  const visit = (index: number, sum: number) => {
    if (results.length >= limit) return;
    if (sum === target) {
      if (chosen.length > 0) results.push([...chosen]);
      return;
    }
    if (sum > target || index >= candidates.length) return;
    for (let i = index; i < candidates.length; i += 1) {
      const entry = candidates[i]!;
      if (sum + entry.value > target) continue;
      chosen.push(entry.item);
      visit(i + 1, sum + entry.value);
      chosen.pop();
      if (results.length >= limit) return;
    }
  };

  visit(0, 0);
  return results;
}

function pairedBuildSelections(
  cards: readonly LooseBoardCard[],
  played: Card,
  remainingHand: readonly Card[],
  target: number,
  limit = 96,
): LooseBoardCard[][] {
  const candidates = cards.filter((item) => {
    const value = numericBuildValue(item.card);
    return value !== null && value <= target;
  });
  const results: LooseBoardCard[][] = [];
  const chosen: LooseBoardCard[] = [];
  let visited = 0;

  const visit = (start: number) => {
    // Human selections are validated directly; this bound only keeps CPU
    // candidate discovery responsive on unusually crowded boards.
    if (results.length >= limit || visited >= 8192) return;
    visited += 1;
    if (chosen.length > 0 && canCreatePairedBuild(played, chosen, remainingHand, target)) {
      results.push([...chosen]);
    }
    for (let index = start; index < candidates.length; index += 1) {
      chosen.push(candidates[index]!);
      visit(index + 1);
      chosen.pop();
      if (results.length >= limit || visited >= 8192) return;
    }
  };

  visit(0);
  return results;
}

function combinedCaptureSelections(
  cards: readonly LooseBoardCard[],
  played: Card,
  build: NumericBuild,
  limit = 96,
): LooseBoardCard[][] {
  const playedValue = numericBuildValue(played);
  if (playedValue === null || build.target !== playedValue) return [];
  const candidates = cards.filter((item) => {
    const value = numericBuildValue(item.card);
    return value !== null && value <= playedValue;
  });
  const results: LooseBoardCard[][] = [];
  const chosen: LooseBoardCard[] = [];
  let visited = 0;

  const visit = (start: number) => {
    // Exact human selections are unbounded; this guard only limits CPU
    // candidate enumeration on crowded boards.
    if (results.length >= limit || visited >= 8192) return;
    visited += 1;
    if (chosen.length > 0 && canCaptureCombinedSelection(played, [build], chosen)) {
      results.push([...chosen]);
    }
    for (let index = start; index < candidates.length; index += 1) {
      chosen.push(candidates[index]!);
      visit(index + 1);
      chosen.pop();
      if (results.length >= limit || visited >= 8192) return;
    }
  };

  visit(0);
  return results;
}

function uniqueMoves(moves: readonly Capture11Move[]): Capture11Move[] {
  const seen = new Set<string>();
  const result: Capture11Move[] = [];
  for (const move of moves) {
    const key = JSON.stringify(move);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(move);
  }
  return result;
}

export function legalMoves(state: Capture11State, player: PlayerId): Capture11Move[] {
  if (state.phase !== 'playing' || state.turn !== player) return [];
  const hand = state.players[player].hand;
  const loose = looseItems(state);
  const boardBuilds = builds(state);
  const moves: Capture11Move[] = [];

  for (const played of hand) {
    const remaining = withoutHandCard(hand, played.id);
    const value = numericBuildValue(played);

    moves.push({ type: 'trail', handCardId: played.id });

    if (value === null) {
      for (const item of loose) {
        if (item.card.rank === played.rank) {
          moves.push({ type: 'capture-loose', handCardId: played.id, cardIds: [item.card.id] });
        }
      }
      continue;
    }

    for (const selection of subsetsForSum(loose, value)) {
      moves.push({ type: 'capture-loose', handCardId: played.id, cardIds: selection.map((item) => item.card.id) });
    }

    for (const build of boardBuilds) {
      if (canCaptureBuild(played, build)) {
        moves.push({ type: 'capture-build', handCardId: played.id, buildId: build.id });
      }
      for (const selection of combinedCaptureSelections(loose, played, build)) {
        moves.push({
          type: 'capture-combined',
          handCardId: played.id,
          buildIds: [build.id],
          cardIds: selection.map((item) => item.card.id),
        });
      }
      const raisedTarget = build.target + value;
      if (canRaiseOpenBuild(played, build, remaining, raisedTarget)) {
        moves.push({ type: 'raise-build', handCardId: played.id, buildId: build.id, target: raisedTarget });
      }
      const neededForGroup = build.target - value;
      const extensionSelections = neededForGroup === 0 ? [[]] : subsetsForSum(loose, neededForGroup, 24);
      for (const selection of extensionSelections) {
        if (canExtendPairedBuild(played, selection, build, remaining)) {
          moves.push({
            type: 'extend-paired',
            handCardId: played.id,
            buildId: build.id,
            cardIds: selection.map((item) => item.card.id),
            target: build.target,
          });
        }
      }
    }

    const heldTargets = [...new Set(remaining.map(numericBuildValue).filter((target): target is number => target !== null))];
    for (const target of heldTargets) {
      const needed = target - value;
      if (needed > 0) {
        for (const selection of subsetsForSum(loose, needed, 24)) {
          if (canCreateOpenBuild(played, selection, remaining, target)) {
            moves.push({
              type: 'build-open',
              handCardId: played.id,
              cardIds: selection.map((item) => item.card.id),
              target,
            });
          }
        }
      }
      for (const selection of pairedBuildSelections(loose, played, remaining, target)) {
        moves.push({
          type: 'build-paired',
          handCardId: played.id,
          cardIds: selection.map((item) => item.card.id),
          target,
        });
      }
    }
  }

  return uniqueMoves(moves);
}

export function movesForExactSelection(
  state: Capture11State,
  player: PlayerId,
  handCardId: string,
  boardKeys: readonly string[],
): Capture11Move[] {
  if (state.phase !== 'playing' || state.turn !== player) return [];
  const played = getPlayedCard(state, player, handCardId);
  const remaining = withoutHandCard(state.players[player].hand, handCardId);
  if (boardKeys.length === 0) return [{ type: 'trail', handCardId }];

  const looseIds = boardKeys.filter((key) => key.startsWith('loose:')).map((key) => key.slice(6));
  const buildIds = boardKeys.filter((key) => key.startsWith('build:')).map((key) => key.slice(6));
  const selectedLoose = looseByIds(state.board, looseIds);
  const moves: Capture11Move[] = [];

  if (buildIds.length === 0) {
    if (canCaptureLooseSelection(played, selectedLoose)) {
      moves.push({ type: 'capture-loose', handCardId, cardIds: looseIds });
    }
    const heldTargets = [...new Set(remaining.map(numericBuildValue).filter((target): target is number => target !== null))];
    for (const target of heldTargets) {
      if (canCreateOpenBuild(played, selectedLoose, remaining, target)) {
        moves.push({ type: 'build-open', handCardId, cardIds: looseIds, target });
      }
      if (canCreatePairedBuild(played, selectedLoose, remaining, target)) {
        moves.push({ type: 'build-paired', handCardId, cardIds: looseIds, target });
      }
    }
    return uniqueMoves(moves);
  }

  const selectedBuilds = buildsByIds(state.board, buildIds);
  if (canCaptureCombinedSelection(played, selectedBuilds, selectedLoose)) {
    moves.push({ type: 'capture-combined', handCardId, buildIds, cardIds: looseIds });
  }
  if (buildIds.length !== 1) return uniqueMoves(moves);
  const build = selectedBuilds[0]!;
  if (selectedLoose.length === 0 && canCaptureBuild(played, build)) {
    moves.push({ type: 'capture-build', handCardId, buildId: build.id });
  }
  const playedValue = numericBuildValue(played);
  if (selectedLoose.length === 0 && playedValue !== null) {
    const raisedTarget = build.target + playedValue;
    if (canRaiseOpenBuild(played, build, remaining, raisedTarget)) {
      moves.push({ type: 'raise-build', handCardId, buildId: build.id, target: raisedTarget });
    }
  }
  if (canExtendPairedBuild(played, selectedLoose, build, remaining)) {
    moves.push({ type: 'extend-paired', handCardId, buildId: build.id, cardIds: looseIds, target: build.target });
  }
  return uniqueMoves(moves);
}
