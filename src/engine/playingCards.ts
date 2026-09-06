import './playingCards.css';

export type StandardSuit = 'spades' | 'hearts' | 'diamonds' | 'clubs';

export interface PlayingCardVisual {
  readonly rank: string;
  readonly suit: StandardSuit;
}

const SUIT_SYMBOL: Readonly<Record<StandardSuit, string>> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

const SYMBOL_SUIT: Readonly<Record<string, StandardSuit>> = {
  '♠': 'spades',
  '♥': 'hearts',
  '♦': 'diamonds',
  '♣': 'clubs',
};

const SUIT_LABEL: Readonly<Record<StandardSuit, string>> = {
  spades: 'spades',
  hearts: 'hearts',
  diamonds: 'diamonds',
  clubs: 'clubs',
};

const PIP_POSITIONS: Readonly<Record<string, readonly [row: number, column: number][]>> = {
  A: [[3, 2]],
  '2': [[1, 2], [5, 2]],
  '3': [[1, 2], [3, 2], [5, 2]],
  '4': [[1, 1], [1, 3], [5, 1], [5, 3]],
  '5': [[1, 1], [1, 3], [3, 2], [5, 1], [5, 3]],
  '6': [[1, 1], [1, 3], [3, 1], [3, 3], [5, 1], [5, 3]],
  '7': [[1, 1], [1, 3], [2, 2], [3, 1], [3, 3], [5, 1], [5, 3]],
  '8': [[1, 1], [1, 3], [2, 2], [3, 1], [3, 3], [4, 2], [5, 1], [5, 3]],
  '9': [[1, 1], [1, 3], [2, 1], [2, 3], [3, 2], [4, 1], [4, 3], [5, 1], [5, 3]],
  '10': [[1, 1], [1, 3], [2, 1], [2, 3], [3, 1], [3, 3], [4, 1], [4, 3], [5, 1], [5, 3]],
};

function corner(rank: string, symbol: string, flipped = false): HTMLSpanElement {
  const index = document.createElement('span');
  index.className = `lv-card-corner${flipped ? ' flipped' : ''}`;

  const rankText = document.createElement('strong');
  rankText.textContent = rank;
  const suitText = document.createElement('span');
  suitText.textContent = symbol;

  index.append(rankText, suitText);
  return index;
}

function pipLayout(rank: string, symbol: string): HTMLElement {
  const field = document.createElement('span');
  field.className = 'lv-card-pips';
  const positions = PIP_POSITIONS[rank] ?? [];

  for (const [row, column] of positions) {
    const pip = document.createElement('span');
    pip.className = 'lv-card-pip';
    pip.textContent = symbol;
    pip.style.gridRow = String(row);
    pip.style.gridColumn = String(column);
    if (row >= 4) pip.classList.add('inverted');
    field.append(pip);
  }

  return field;
}

function courtLayout(rank: string, symbol: string): HTMLElement {
  const court = document.createElement('span');
  court.className = `lv-card-court court-${rank.toLowerCase()}`;

  const top = document.createElement('span');
  top.className = 'lv-court-half';
  const monogram = document.createElement('strong');
  monogram.textContent = rank;
  const suit = document.createElement('span');
  suit.textContent = symbol;
  const ornament = document.createElement('span');
  ornament.className = 'lv-court-ornament';
  ornament.textContent = rank === 'K' ? '♚' : rank === 'Q' ? '♛' : '✦';
  top.append(monogram, ornament, suit);

  const bottom = top.cloneNode(true) as HTMLSpanElement;
  bottom.classList.add('flipped');
  court.append(top, bottom);
  return court;
}

/**
 * Paint a standard playing-card face into an existing element.
 * The deck is entirely HTML/CSS, so it scales without raster artwork and has
 * no third-party image dependency.
 */
export function renderPlayingCardFace(host: HTMLElement, card: PlayingCardVisual): void {
  const symbol = SUIT_SYMBOL[card.suit];
  const red = card.suit === 'hearts' || card.suit === 'diamonds';

  host.replaceChildren();
  host.classList.add('lv-playing-card', red ? 'lv-card-red' : 'lv-card-black');
  host.classList.remove(red ? 'lv-card-black' : 'lv-card-red');
  host.dataset.rank = card.rank;
  host.dataset.suit = card.suit;
  host.setAttribute('aria-label', `${card.rank} of ${SUIT_LABEL[card.suit]}`);

  const center = ['J', 'Q', 'K'].includes(card.rank)
    ? courtLayout(card.rank, symbol)
    : pipLayout(card.rank, symbol);

  host.append(corner(card.rank, symbol), center, corner(card.rank, symbol, true));
}

/** Paint the reusable Capture 11 / Microgame Engine card back. */
export function renderPlayingCardBack(host: HTMLElement, label = 'Face-down card'): void {
  host.replaceChildren();
  host.classList.add('lv-playing-card', 'lv-card-back');
  host.classList.remove('lv-card-red', 'lv-card-black');
  host.removeAttribute('data-rank');
  host.removeAttribute('data-suit');
  host.setAttribute('aria-label', label);

  const inset = document.createElement('span');
  inset.className = 'lv-card-back-inset';
  const mark = document.createElement('span');
  mark.className = 'lv-card-back-mark';
  mark.textContent = 'C11';
  inset.append(mark);
  host.append(inset);
}

function parseCompactCard(text: string): PlayingCardVisual | null {
  const match = /^(A|[2-9]|10|J|Q|K)([♠♥♦♣])$/.exec(text.trim());
  if (!match) return null;
  const rank = match[1];
  const symbol = match[2];
  if (!rank || !symbol) return null;
  const suit = SYMBOL_SUIT[symbol];
  if (!suit) return null;
  return { rank, suit };
}

/**
 * Upgrade the existing Microgame card markup to the coded deck. This keeps
 * the deck renderer independent from Capture 11's rules/state code and lets
 * other standard-card microgames opt in without copying art or CSS.
 */
export function upgradePlayingCards(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('.playing-card:not(.lv-playing-card)').forEach((host) => {
    const sourceText = host.textContent ?? '';
    const visual = parseCompactCard(sourceText);
    if (!visual) return;
    const ariaLabel = host.getAttribute('aria-label');
    renderPlayingCardFace(host, visual);
    if (ariaLabel) host.setAttribute('aria-label', ariaLabel);
  });

  root.querySelectorAll<HTMLElement>('.card-back:not(.lv-playing-card)').forEach((host) => {
    const ariaHidden = host.getAttribute('aria-hidden');
    renderPlayingCardBack(host, 'CPU face-down card');
    if (ariaHidden !== null) host.setAttribute('aria-hidden', ariaHidden);
  });
}

/** Keep newly rendered hands/boards upgraded as the game replaces DOM nodes. */
export function observePlayingCards(root: HTMLElement): () => void {
  upgradePlayingCards(root);
  const observer = new MutationObserver(() => upgradePlayingCards(root));
  observer.observe(root, { childList: true, subtree: true });
  return () => observer.disconnect();
}
