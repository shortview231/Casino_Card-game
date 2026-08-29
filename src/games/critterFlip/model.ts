import { SeededRng } from '../../engine/rng';

export interface CritterCard {
  id: number;
  pairId: number;
  label: string;
  state: 'hidden' | 'revealed' | 'matched';
}

export interface CritterFlipState {
  cards: CritterCard[];
  firstCardId: number | null;
  secondCardId: number | null;
  moves: number;
  matchedPairs: number;
  pairCount: number;
  locked: boolean;
}

const LABELS = [
  'Moss Fox', 'Star Otter', 'Cloud Pup', 'Pebble Owl', 'Moon Moth', 'Coral Cat',
  'Ember Frog', 'Comet Hare', 'Sprout Bear', 'Dune Duck', 'River Bat', 'Glow Mouse',
  'Berry Lynx', 'Snow Finch', 'Sunny Yak', 'Mist Gecko', 'Acorn Seal', 'Nova Koala',
  'Cedar Crab', 'Lilac Crow', 'Quartz Bee', 'Tide Panda', 'Fern Ferret', 'Orbit Toad',
];

export function createGame(pairCount: number, seed: number): CritterFlipState {
  if (!Number.isInteger(pairCount) || pairCount < 1 || pairCount > LABELS.length) {
    throw new RangeError(`pairCount must be between 1 and ${LABELS.length}`);
  }

  const rng = new SeededRng(seed);
  const cards: CritterCard[] = [];
  for (let pairId = 0; pairId < pairCount; pairId += 1) {
    for (let copy = 0; copy < 2; copy += 1) {
      cards.push({
        id: pairId * 2 + copy,
        pairId,
        label: LABELS[pairId]!,
        state: 'hidden',
      });
    }
  }

  return {
    cards: rng.shuffle(cards),
    firstCardId: null,
    secondCardId: null,
    moves: 0,
    matchedPairs: 0,
    pairCount,
    locked: false,
  };
}

function findCard(state: CritterFlipState, id: number): CritterCard | undefined {
  return state.cards.find((card) => card.id === id);
}

export function reveal(state: CritterFlipState, id: number): CritterFlipState {
  if (state.locked) return state;
  const card = findCard(state, id);
  if (!card || card.state !== 'hidden') return state;

  const cards = state.cards.map((candidate) =>
    candidate.id === id ? { ...candidate, state: 'revealed' as const } : candidate,
  );

  if (state.firstCardId === null) {
    return { ...state, cards, firstCardId: id };
  }

  return {
    ...state,
    cards,
    secondCardId: id,
    moves: state.moves + 1,
    locked: true,
  };
}

export function resolvePair(state: CritterFlipState): CritterFlipState {
  if (!state.locked || state.firstCardId === null || state.secondCardId === null) return state;
  const first = findCard(state, state.firstCardId);
  const second = findCard(state, state.secondCardId);
  if (!first || !second) throw new Error('Selected card disappeared from state');
  const matched = first.pairId === second.pairId;

  const cards = state.cards.map((card) => {
    if (card.id !== first.id && card.id !== second.id) return card;
    return { ...card, state: matched ? ('matched' as const) : ('hidden' as const) };
  });

  return {
    ...state,
    cards,
    firstCardId: null,
    secondCardId: null,
    locked: false,
    matchedPairs: state.matchedPairs + (matched ? 1 : 0),
  };
}

export function isComplete(state: CritterFlipState): boolean {
  return state.matchedPairs === state.pairCount;
}
