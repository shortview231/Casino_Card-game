import type { Capture11Move, Capture11State } from './game';
import type { BoardItem, Card, PlayerId } from './model';

interface CardLocation {
  readonly id: string;
  readonly where: string;
}

export interface Capture11InvariantResult {
  readonly ok: boolean;
  readonly count: number;
  readonly uniqueCount: number;
  readonly duplicates: readonly string[];
  readonly message: string;
}

interface StateSnapshot {
  readonly handNumber: number;
  readonly phase: Capture11State['phase'];
  readonly dealer: PlayerId;
  readonly turn: PlayerId;
  readonly seed: number;
  readonly deck: readonly string[];
  readonly player1Hand: readonly string[];
  readonly player2Hand: readonly string[];
  readonly board: readonly unknown[];
  readonly player1Captured: readonly string[];
  readonly player2Captured: readonly string[];
  readonly player1Score: number;
  readonly player2Score: number;
  readonly lastCapturer: PlayerId | null;
  readonly lastAction: string;
}

interface PlaytestEntry {
  readonly sequence: number;
  readonly kind: 'start' | 'move' | 'next-hand' | 'note';
  readonly player?: PlayerId;
  readonly move?: Capture11Move;
  readonly invariant: Capture11InvariantResult;
  readonly state: StateSnapshot;
  readonly note?: string;
}

function cardIds(cards: readonly Card[]): string[] {
  return cards.map((card) => card.id);
}

function boardSnapshot(item: BoardItem): unknown {
  if (item.kind === 'loose') {
    return { kind: 'loose', card: item.card.id };
  }
  return {
    kind: 'build',
    id: item.id,
    target: item.target,
    mode: item.mode,
    createdBy: item.createdBy,
    cards: cardIds(item.cards),
  };
}

function locationsForState(state: Capture11State): CardLocation[] {
  const locations: CardLocation[] = [];
  state.deck.forEach((card) => locations.push({ id: card.id, where: 'deck' }));
  state.players.player1.hand.forEach((card) => locations.push({ id: card.id, where: 'player1.hand' }));
  state.players.player2.hand.forEach((card) => locations.push({ id: card.id, where: 'player2.hand' }));
  state.players.player1.captured.forEach((card) => locations.push({ id: card.id, where: 'player1.captured' }));
  state.players.player2.captured.forEach((card) => locations.push({ id: card.id, where: 'player2.captured' }));
  state.board.forEach((item) => {
    if (item.kind === 'loose') locations.push({ id: item.card.id, where: 'board.loose' });
    else item.cards.forEach((card) => locations.push({ id: card.id, where: `board.build:${item.id}` }));
  });
  return locations;
}

export function checkCardConservation(state: Capture11State): Capture11InvariantResult {
  const locations = locationsForState(state);
  const counts = new Map<string, number>();
  for (const location of locations) {
    counts.set(location.id, (counts.get(location.id) ?? 0) + 1);
  }
  const duplicates = [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([id]) => id)
    .sort();
  const ok = locations.length === 52 && counts.size === 52 && duplicates.length === 0;
  return {
    ok,
    count: locations.length,
    uniqueCount: counts.size,
    duplicates,
    message: ok
      ? '52/52 cards accounted for exactly once.'
      : `Card invariant failed: ${locations.length} locations, ${counts.size} unique, ${duplicates.length} duplicate IDs.`,
  };
}

function snapshot(state: Capture11State): StateSnapshot {
  return {
    handNumber: state.handNumber,
    phase: state.phase,
    dealer: state.dealer,
    turn: state.turn,
    seed: state.seed,
    deck: cardIds(state.deck),
    player1Hand: cardIds(state.players.player1.hand),
    player2Hand: cardIds(state.players.player2.hand),
    board: state.board.map(boardSnapshot),
    player1Captured: cardIds(state.players.player1.captured),
    player2Captured: cardIds(state.players.player2.captured),
    player1Score: state.players.player1.matchScore,
    player2Score: state.players.player2.matchScore,
    lastCapturer: state.lastCapturer,
    lastAction: state.lastAction,
  };
}

export class Capture11PlaytestRecorder {
  readonly matchSeed: number;
  private sequence = 0;
  private readonly entries: PlaytestEntry[] = [];

  constructor(matchSeed: number, initialState: Capture11State) {
    this.matchSeed = matchSeed;
    this.record('start', initialState, undefined, undefined, 'Match created');
  }

  recordMove(player: PlayerId, move: Capture11Move, state: Capture11State): void {
    this.record('move', state, player, move);
  }

  recordNextHand(state: Capture11State): void {
    this.record('next-hand', state, undefined, undefined, `Hand ${state.handNumber} started`);
  }

  recordNote(state: Capture11State, note: string): void {
    this.record('note', state, undefined, undefined, note);
  }

  invariant(state: Capture11State): Capture11InvariantResult {
    return checkCardConservation(state);
  }

  exportText(): string {
    return JSON.stringify({
      format: 'capture11-playtest-log-v1',
      matchSeed: this.matchSeed,
      entries: this.entries,
    }, null, 2);
  }

  private record(
    kind: PlaytestEntry['kind'],
    state: Capture11State,
    player?: PlayerId,
    move?: Capture11Move,
    note?: string,
  ): void {
    this.sequence += 1;
    const invariant = checkCardConservation(state);
    if (!invariant.ok) {
      console.error('[Capture 11] card conservation failure', invariant, state);
    }
    this.entries.push({
      sequence: this.sequence,
      kind,
      player,
      move,
      invariant,
      state: snapshot(state),
      note,
    });
  }
}

export async function copyPlaytestLog(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
