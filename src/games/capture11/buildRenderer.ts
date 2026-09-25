import { renderPlayingCardFace } from '../../engine/playingCards';
import type { NumericBuild } from './model';

/**
 * Render a Capture 11 build as the physical cards that make it up, plus a
 * compact target/control label. This keeps the board readable even when a
 * build grows to many cards.
 */
export function renderBuildContents(
  host: HTMLElement,
  build: NumericBuild,
  ownerLabel: string,
): void {
  host.replaceChildren();
  host.classList.add('capture11-build');
  host.classList.toggle('is-locked', build.mode === 'paired');
  host.classList.toggle('is-open', build.mode === 'open');

  const header = document.createElement('span');
  header.className = 'capture11-build-header';

  const target = document.createElement('strong');
  target.className = 'capture11-build-target';
  target.textContent = `BUILD ${build.target}`;

  const state = document.createElement('span');
  state.className = 'capture11-build-state';
  state.textContent = build.mode === 'paired' ? 'LOCKED' : 'OPEN';

  const owner = document.createElement('span');
  owner.className = 'capture11-build-owner';
  owner.textContent = ownerLabel;

  header.append(target, state, owner);

  const cards = document.createElement('span');
  cards.className = 'capture11-build-cards';
  const components = build.components ?? [build.cards];
  for (const [componentIndex, component] of components.entries()) {
    if (componentIndex > 0) {
      const separator = document.createElement('span'); separator.className = 'capture11-build-component-separator'; separator.textContent = '+'; separator.setAttribute('aria-hidden', 'true'); cards.append(separator);
    }
    for (const card of component) {
    const cardFace = document.createElement('span');
    cardFace.className = 'capture11-build-card';
    cardFace.setAttribute('aria-hidden', 'true');
    renderPlayingCardFace(cardFace, card);
    cards.append(cardFace);
    }
  }

  const count = document.createElement('span');
  count.className = 'capture11-build-count';
  count.textContent = `${build.cards.length} card${build.cards.length === 1 ? '' : 's'}`;

  host.append(header, cards, count);
}
