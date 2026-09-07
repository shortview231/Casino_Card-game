import type { Capture11Move, Capture11State } from './game';
import type { Card, NumericBuild } from './model';

const SUIT_SYMBOL: Record<Card['suit'], string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

const SUIT_NAME: Record<Card['suit'], string> = {
  spades: 'Spades',
  hearts: 'Hearts',
  diamonds: 'Diamonds',
  clubs: 'Clubs',
};

export interface CpuPlayPresentation {
  readonly card: Card;
  readonly heading: string;
  readonly detail: string;
}

function cardLabel(card: Card): string {
  return `${card.rank} of ${SUIT_NAME[card.suit]} (${SUIT_SYMBOL[card.suit]})`;
}

function playedCard(state: Capture11State, move: Capture11Move): Card {
  const card = state.players.player2.hand.find((candidate) => candidate.id === move.handCardId);
  if (!card) throw new Error('CPU presentation could not find played card');
  return card;
}

function buildById(state: Capture11State, id: string): NumericBuild | undefined {
  const item = state.board.find((candidate) => candidate.kind === 'build' && candidate.id === id);
  return item?.kind === 'build' ? item : undefined;
}

export function describeCpuMove(state: Capture11State, move: Capture11Move): CpuPlayPresentation {
  const card = playedCard(state, move);
  const cardName = cardLabel(card);

  switch (move.type) {
    case 'trail':
      return { card, heading: `CPU plays ${cardName}`, detail: 'Placed loose on the board.' };
    case 'capture-loose': {
      const captured = move.cardIds
        .map((id) => state.board.find((item) => item.kind === 'loose' && item.card.id === id))
        .filter((item): item is Extract<(typeof state.board)[number], { kind: 'loose' }> => item?.kind === 'loose')
        .map((item) => cardLabel(item.card));
      return {
        card,
        heading: `CPU plays ${cardName}`,
        detail: `Captures ${captured.join(' + ') || 'selected board cards'}.`,
      };
    }
    case 'capture-build': {
      const build = buildById(state, move.buildId);
      return {
        card,
        heading: `CPU plays ${cardName}`,
        detail: build
          ? `Captures BUILD ${build.target}: ${build.cards.map(cardLabel).join(' + ')}.`
          : 'Captures a build.',
      };
    }
    case 'build-open':
      return { card, heading: `CPU plays ${cardName}`, detail: `Creates open BUILD ${move.target}.` };
    case 'build-paired':
      return { card, heading: `CPU plays ${cardName}`, detail: `Creates locked paired BUILD ${move.target}.` };
    case 'raise-build': {
      const build = buildById(state, move.buildId);
      return {
        card,
        heading: `CPU plays ${cardName}`,
        detail: build ? `Burns/raises BUILD ${build.target} to ${move.target}.` : `Raises a build to ${move.target}.`,
      };
    }
  }
}
