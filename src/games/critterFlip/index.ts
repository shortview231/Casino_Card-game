import type { GameModule, MountedGame } from '../../engine/contracts';
import { createGame, isComplete, resolvePair, reveal, type CritterFlipState } from './model';

const PAIRS = 6;

export const critterFlip: GameModule = {
  manifest: {
    id: 'critter-flip',
    title: 'Critter Flip',
    version: '0.1.0',
    description: 'Match original critters and add them to your Critter Book.',
    minPlayers: 1,
    maxPlayers: 1,
  },

  mount(root, services): MountedGame {
    let state: CritterFlipState = createGame(PAIRS, services.seed);
    let timer: number | null = null;

    const render = () => {
      root.replaceChildren();

      const header = document.createElement('div');
      header.className = 'game-header';
      const heading = document.createElement('h1');
      heading.textContent = 'Critter Flip';
      const status = document.createElement('p');
      status.textContent = `${state.matchedPairs} of ${state.pairCount} pairs matched · ${state.moves} moves`;
      header.append(heading, status);

      const board = document.createElement('div');
      board.className = 'memory-grid';
      board.setAttribute('role', 'grid');
      board.setAttribute('aria-label', 'Critter matching board');

      for (const card of state.cards) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `memory-card ${card.state}`;
        button.disabled = state.locked || card.state === 'matched';
        const visible = card.state !== 'hidden';
        button.textContent = visible ? card.label : '?';
        button.setAttribute(
          'aria-label',
          visible ? `${card.label}, ${card.state}` : 'Hidden critter card',
        );
        button.addEventListener('click', () => {
          state = reveal(state, card.id);
          render();
          if (state.locked) {
            const delay = services.preferences.reducedMotion ? 0 : 450;
            timer = window.setTimeout(() => {
              const firstId = state.firstCardId;
              const secondId = state.secondCardId;
              const first = state.cards.find((item) => item.id === firstId);
              const second = state.cards.find((item) => item.id === secondId);
              const matchedLabel = first && second && first.pairId === second.pairId ? first.label : null;
              state = resolvePair(state);
              if (matchedLabel) {
                const book = services.load<string[]>('critter-book', []);
                services.save('critter-book', [...new Set([...book, matchedLabel])].sort());
              }
              if (isComplete(state)) {
                services.complete({
                  heading: 'All critters found!',
                  summary: `You matched ${state.pairCount} pairs in ${state.moves} moves.`,
                  score: Math.max(0, state.pairCount * 20 - state.moves),
                });
                return;
              }
              render();
            }, delay);
          }
        });
        board.append(button);
      }

      const book = services.load<string[]>('critter-book', []);
      const bookHeading = document.createElement('h2');
      bookHeading.textContent = 'Critter Book';
      const bookText = document.createElement('p');
      bookText.textContent = book.length ? book.join(', ') : 'No critters discovered yet.';

      root.append(header, board, bookHeading, bookText);
    };

    render();

    return {
      destroy() {
        if (timer !== null) window.clearTimeout(timer);
        root.replaceChildren();
      },
    };
  },
};
