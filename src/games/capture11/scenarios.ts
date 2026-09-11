import { createStandardDeck } from './deck';
import type { Capture11Move, Capture11State } from './game';
import type { BoardItem, Card, PlayerId, Rank, Suit } from './model';

export const SCENARIO_IDS = [
  'basic_capture', 'bug_004_multi_equal_capture', 'build_demo',
  'build_takeover_demo', 'strategy_demo', 'final_sweep_demo',
] as const;
export type ScenarioId = typeof SCENARIO_IDS[number];

export interface Capture11Scenario {
  readonly id: ScenarioId;
  readonly title: string;
  readonly instruction: string;
  readonly success: string;
  readonly state: Capture11State;
  readonly expected: Capture11Move;
  readonly isComplete: (state: Capture11State) => boolean;
  readonly suggestedHandCardId: string;
  readonly suggestedBoardKeys: readonly string[];
}

const deck = createStandardDeck();
function card(rank: Rank, suit: Suit): Card {
  const result = deck.find(candidate => candidate.rank === rank && candidate.suit === suit);
  if (!result) throw new Error(`Missing scenario card ${rank} of ${suit}`);
  return result;
}
const loose = (value: Card): BoardItem => ({ kind: 'loose', card: value });
const build = (id: string, target: number, createdBy: PlayerId, cards: Card[]): BoardItem =>
  ({ kind: 'build', id, target, createdBy, cards, mode: 'open' });

interface StateParts {
  hand: Card[]; cpu?: Card[]; board: BoardItem[]; deck?: Card[];
  captured?: Card[]; cpuCaptured?: Card[]; lastCapturer?: PlayerId | null;
  turn?: PlayerId; dealer?: PlayerId; matchScore?: number; cpuMatchScore?: number; handNumber?: number;
}
function state(parts: StateParts): Capture11State {
  return {
    seed: 110011, dealer: parts.dealer ?? 'player2', turn: parts.turn ?? 'player1', deck: parts.deck ?? [card('K', 'spades')],
    board: parts.board,
    players: {
      player1: { id: 'player1', hand: parts.hand, captured: parts.captured ?? [], matchScore: parts.matchScore ?? 0 },
      player2: { id: 'player2', hand: parts.cpu ?? [card('Q', 'spades')], captured: parts.cpuCaptured ?? [], matchScore: parts.cpuMatchScore ?? 0 },
    },
    lastCapturer: parts.lastCapturer ?? null, handNumber: parts.handNumber ?? 1, phase: 'playing',
    lastAction: 'Guided Demo: follow the marked cards.', lastHandScore: null, winner: null,
  };
}

function scenario(definition: Omit<Capture11Scenario, 'suggestedHandCardId' | 'suggestedBoardKeys'>): Capture11Scenario {
  const expected = definition.expected;
  const boardKeys = expected.type === 'capture-build' || expected.type === 'raise-build'
    ? [`build:${expected.buildId}`]
    : expected.type === 'capture-combined'
      ? [...expected.buildIds.map(id => `build:${id}`), ...expected.cardIds.map(id => `loose:${id}`)]
      : 'cardIds' in expected ? expected.cardIds.map(id => `loose:${id}`) : [];
  return { ...definition, suggestedHandCardId: expected.handCardId, suggestedBoardKeys: boardKeys };
}

export function loadScenario(id: ScenarioId): Capture11Scenario {
  const basicHand = card('4', 'spades'); const basicBoard = card('4', 'hearts');
  const bugHand = card('8', 'spades'); const bugA = card('8', 'hearts'); const bugB = card('8', 'diamonds');
  const buildHand = card('A', 'hearts'); const buildBoard = card('4', 'clubs');
  const takeoverHand = card('3', 'diamonds');
  const strategyHand = card('10', 'spades'); const strategyTen = card('10', 'diamonds');
  const strategyNine = card('9', 'hearts'); const strategyAce = card('A', 'clubs');
  const finalHand = card('4', 'spades'); const finalBoard = card('4', 'hearts');

  const scenarios: Record<ScenarioId, Capture11Scenario> = {
    basic_capture: scenario({ id: 'basic_capture', title: '1 of 6 · Basic Capture',
      instruction: 'Select the marked 4 in your hand, select the marked table 4, then choose Capture. Both cards go to your captured pile.',
      success: 'Captured. Your played 4 and the table 4 moved to your captured pile.',
      isComplete: next => next.players.player1.captured.some(value => value.id === basicHand.id) && next.players.player1.captured.some(value => value.id === basicBoard.id),
      state: state({ hand: [basicHand], board: [loose(basicBoard), loose(card('K', 'clubs')), loose(card('2', 'diamonds'))] }),
      expected: { type: 'capture-loose', handCardId: basicHand.id, cardIds: [basicBoard.id] } }),
    bug_004_multi_equal_capture: scenario({ id: 'bug_004_multi_equal_capture', title: '2 of 6 · Multiple Equal Cards',
      instruction: 'Select your marked 8 and BOTH marked table 8s, then capture them together. Each table 8 is a complete matching group.',
      success: 'Both loose 8s were captured in one move. This permanently reproduces the BUG-004 case.',
      isComplete: next => [bugHand, bugA, bugB].every(value => next.players.player1.captured.some(captured => captured.id === value.id)),
      state: state({ hand: [bugHand], board: [loose(bugA), loose(bugB), loose(card('K', 'clubs')), loose(card('2', 'diamonds'))] }),
      expected: { type: 'capture-loose', handCardId: bugHand.id, cardIds: [bugA.id, bugB.id] } }),
    build_demo: scenario({ id: 'build_demo', title: '3 of 6 · Make a Build',
      instruction: 'Play the marked Ace with the marked 4 and choose Build 5. You may build to 5 because you keep a 5 in your hand.',
      success: 'BUILD 5 created. A build combines table value for a later pickup, but an opponent may interfere.',
      isComplete: next => next.board.some(item => item.kind === 'build' && item.target === 5 && item.createdBy === 'player1'),
      state: state({ hand: [buildHand, card('5', 'spades')], board: [loose(buildBoard), loose(card('Q', 'clubs'))] }),
      expected: { type: 'build-open', handCardId: buildHand.id, cardIds: [buildBoard.id], target: 5 } }),
    build_takeover_demo: scenario({ id: 'build_takeover_demo', title: '4 of 6 · Take Over a Build',
      instruction: 'The CPU owns BUILD 5. Select your marked 3 and the marked build, then raise it to 8. Keeping an 8 makes the takeover legal.',
      success: 'You raised BUILD 5 to BUILD 8 and became its owner. Open builds can be taken over when the new target is held.',
      isComplete: next => next.board.some(item => item.kind === 'build' && item.target === 8 && item.createdBy === 'player1'),
      state: state({ hand: [takeoverHand, card('8', 'spades')], board: [build('demo-build-5', 5, 'player2', [card('A', 'diamonds'), card('4', 'clubs')]), loose(card('Q', 'hearts'))] }),
      expected: { type: 'raise-build', handCardId: takeoverHand.id, buildId: 'demo-build-5', target: 8 } }),
    strategy_demo: scenario({ id: 'strategy_demo', title: '5 of 6 · Capture More in One Play',
      instruction: 'Select your 10, then select 10♦, 9, and Ace. The 10 and 9 + Ace are two complete groups; taking both also secures the 3-point 10♦.',
      success: 'One 10 captured two legal groups and secured 10♦, which the normal scoring system values at 3 points.',
      isComplete: next => [strategyHand, strategyTen, strategyNine, strategyAce].every(value => next.players.player1.captured.some(captured => captured.id === value.id)),
      state: state({ hand: [strategyHand], board: [loose(strategyTen), loose(strategyNine), loose(strategyAce), loose(card('K', 'clubs'))] }),
      expected: { type: 'capture-loose', handCardId: strategyHand.id, cardIds: [strategyTen.id, strategyNine.id, strategyAce.id] } }),
    final_sweep_demo: scenario({ id: 'final_sweep_demo', title: '6 of 6 · Final Sweep and Scoring',
      instruction: 'This is the last play. Capture the marked table 4. As the final capturer, you also receive the remaining K and Q before normal scoring runs.',
      success: 'Final capture complete. The remaining board cards went to you, then the shared scoring engine calculated the result.',
      isComplete: next => next.phase === 'hand-over' && next.board.length === 0 && next.lastHandScore?.scores.player1.total === 8,
      state: state({ hand: [finalHand], cpu: [], deck: [], board: [loose(finalBoard), loose(card('K', 'clubs')), loose(card('Q', 'diamonds'))],
        captured: [card('A', 'spades'), card('2', 'spades'), card('10', 'diamonds'), card('3', 'spades'), card('5', 'spades')],
        cpuCaptured: [card('A', 'hearts'), card('6', 'clubs'), card('7', 'clubs'), card('8', 'clubs')], lastCapturer: 'player2' }),
      expected: { type: 'capture-loose', handCardId: finalHand.id, cardIds: [finalBoard.id] } }),
  };
  return scenarios[id];
}

export function isExpectedScenarioMove(actual: Capture11Move, expected: Capture11Move): boolean {
  const normalize = (move: Capture11Move) => JSON.stringify({
    ...move,
    ...('cardIds' in move ? { cardIds: [...move.cardIds].sort() } : {}),
    ...('buildIds' in move ? { buildIds: [...move.buildIds].sort() } : {}),
  }, Object.keys(move).sort());
  return normalize(actual) === normalize(expected);
}
