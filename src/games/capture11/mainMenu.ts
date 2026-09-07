import type { GameTitleActions } from '../../engine/contracts';
import { renderPlayingCardFace, type PlayingCardVisual } from '../../engine/playingCards';
import './mainMenu.css';

const HERO_CARDS: readonly PlayingCardVisual[] = [
  { rank: '10', suit: 'diamonds' },
  { rank: '2', suit: 'spades' },
  { rank: 'A', suit: 'hearts' },
  { rank: 'A', suit: 'clubs' },
];

function text(tag: 'p' | 'h1' | 'h2' | 'h3' | 'span' | 'strong', value: string, className = ''): HTMLElement {
  const node = document.createElement(tag);
  node.textContent = value;
  if (className) node.className = className;
  return node;
}

function menuButton(icon: string, label: string, action: () => void, primary = false): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `c11-menu-button${primary ? ' is-primary' : ''}`;
  const iconNode = text('span', icon, 'c11-menu-button-icon');
  iconNode.setAttribute('aria-hidden', 'true');
  const labelNode = text('span', label, 'c11-menu-button-label');
  button.append(iconNode, labelNode);
  button.addEventListener('click', action);
  return button;
}

function makeScoringStrip(): HTMLElement {
  const strip = document.createElement('section');
  strip.className = 'c11-score-strip';
  strip.setAttribute('aria-label', 'Capture 11 scoring');
  strip.append(text('h2', 'HOW TO SCORE'));

  const items = document.createElement('div');
  items.className = 'c11-score-items';
  const scoring = [
    ['♥', 'Aces', '1 point each'],
    ['♠', '2♠', '1 point'],
    ['♦', '10♦', '3 points'],
    ['♠', 'Most Spades', '1 point'],
    ['▣', 'Most Cards', '2 points'],
  ] as const;

  for (const [icon, label, value] of scoring) {
    const item = document.createElement('div');
    item.className = 'c11-score-item';
    item.append(text('span', icon, 'c11-score-icon'), text('strong', label), text('span', value));
    items.append(item);
  }

  strip.append(items, text('p', 'First to 11 points wins!', 'c11-score-win'));
  return strip;
}

function makeHeroCards(): HTMLElement {
  const cards = document.createElement('div');
  cards.className = 'c11-menu-cards';
  cards.setAttribute('aria-label', 'Four scoring cards: 10 of Diamonds, 2 of Spades, Ace of Hearts, Ace of Clubs');

  for (const card of HERO_CARDS) {
    const host = document.createElement('span');
    host.className = 'c11-menu-card';
    renderPlayingCardFace(host, card);
    cards.append(host);
  }
  return cards;
}

function makePanelShell(title: string, eyebrow: string): { shell: HTMLElement; body: HTMLElement; heading: HTMLElement } {
  const shell = document.createElement('section');
  shell.className = 'c11-info-screen';
  const panel = document.createElement('div');
  panel.className = 'c11-info-panel';
  const heading = text('h1', title);
  panel.append(text('p', eyebrow, 'c11-info-eyebrow'), heading);
  const body = document.createElement('div');
  body.className = 'c11-info-body';
  panel.append(body);
  shell.append(panel);
  return { shell, body, heading };
}

function infoButton(label: string, action: () => void, primary = false): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `c11-info-button${primary ? ' is-primary' : ''}`;
  button.textContent = label;
  button.addEventListener('click', action);
  return button;
}

/** Capture 11-specific title screen. The game itself remains mounted by the reusable runtime. */
export function renderCapture11MainMenu(root: HTMLElement, actions: GameTitleActions): void {
  const showMain = () => {
    root.replaceChildren();

    const screen = document.createElement('section');
    screen.className = 'c11-menu-screen';
    screen.setAttribute('aria-label', 'Capture 11 main menu');

    const rail = document.createElement('aside');
    rail.className = 'c11-menu-rail';

    const brand = document.createElement('div');
    brand.className = 'c11-menu-brand';
    const logo = document.createElement('h1');
    logo.innerHTML = '<span>CAPTURE</span> <em>11</em>';
    const suits = text('p', '♠  ♥  ♦  ♣', 'c11-brand-suits');
    const tagline = text('p', 'BUILD. STEAL. BURN. CAPTURE.', 'c11-brand-tagline');
    const goal = text('p', 'FIRST TO 11.', 'c11-brand-goal');
    brand.append(logo, suits, tagline, goal);

    const nav = document.createElement('nav');
    nav.className = 'c11-menu-nav';
    nav.setAttribute('aria-label', 'Capture 11 menu');
    nav.append(
      menuButton('▶', 'Play vs CPU', actions.play, true),
      menuButton('▤', 'How to Play', showHowToPlay),
      menuButton('♿', 'Accessibility', showAccessibility),
      menuButton('⚙', 'Settings', actions.settings),
      menuButton('▣', 'Feedback', showFeedback),
      menuButton('↪', 'Quit', showQuit),
    );

    const vision = document.createElement('div');
    vision.className = 'c11-menu-vision';
    vision.append(text('span', '◉', 'c11-vision-icon'));
    const visionCopy = document.createElement('div');
    visionCopy.append(text('strong', 'Designed for everyone to play'), text('p', 'Large, clear cards and a high-contrast interface.'));
    vision.append(visionCopy);
    rail.append(brand, nav, vision);

    const stage = document.createElement('main');
    stage.className = 'c11-menu-stage';
    stage.append(
      text('p', 'SIMPLE CARDS. DEEP STRATEGY.', 'c11-menu-kicker'),
      makeHeroCards(),
      text('p', 'DIFFERENT PATHS. THE SAME GOAL.', 'c11-menu-paths'),
      text('h2', 'CAPTURE 11.', 'c11-menu-goal'),
      makeScoringStrip(),
    );

    const sideCopy = document.createElement('aside');
    sideCopy.className = 'c11-menu-sidecopy';
    sideCopy.append(
      text('p', 'A CLASSIC\nCARD GAME\nREIMAGINED', 'c11-sidecopy-top'),
      text('p', 'STRATEGY\nSKILL\nRISK\nBIG PLAYS', 'c11-sidecopy-mid'),
      text('blockquote', '“One card can change everything.”' as never, 'c11-menu-quote') as HTMLElement,
    );

    screen.append(rail, stage, sideCopy);
    root.append(screen);
    const first = screen.querySelector<HTMLButtonElement>('.c11-menu-button.is-primary');
    first?.focus();
  };

  const showHowToPlay = () => {
    const { shell, body, heading } = makePanelShell('How to Play', 'BUILD. STEAL. BURN. CAPTURE.');
    const list = document.createElement('ol');
    list.className = 'c11-rules-list';
    const rules = [
      'The match is first to 11 cumulative points. Each hand begins with four cards per player and four cards on the table.',
      'Play a numeric card to capture loose numeric cards that add to its value. Face cards capture a matching face card.',
      'Build by adding numeric values on the table. You may only declare a build target you still hold in your hand.',
      'Open builds can be raised or burned by the opponent when they can legally create a new target they still hold. Locked paired builds cannot be raised.',
      'The last player to make a capture takes every card left on the table when the hand ends.',
      'Scoring: each Ace 1, 2♠ 1, Most Spades 1, 10♦ 3, Most Cards 2. A tied category awards nobody.',
    ];
    for (const rule of rules) list.append(Object.assign(document.createElement('li'), { textContent: rule }));
    body.append(list);
    const buttons = document.createElement('div');
    buttons.className = 'c11-info-actions';
    buttons.append(infoButton('Play vs CPU', actions.play, true), infoButton('Back to Main Menu', showMain));
    body.append(buttons);
    root.replaceChildren(shell);
    heading.focus?.();
  };

  const showAccessibility = () => {
    const { shell, body, heading } = makePanelShell('Accessibility', 'BUILT INTO THE GAME');
    body.append(
      text('p', 'Capture 11 uses several independent cues so suit recognition never depends on color alone.'),
    );
    const suitGrid = document.createElement('div');
    suitGrid.className = 'c11-access-suits';
    for (const [label, className] of [
      ['S ♠ Spades', 'spades'],
      ['H ♥ Hearts', 'hearts'],
      ['D ♦ Diamonds', 'diamonds'],
      ['C ♣ Clubs', 'clubs'],
    ] as const) {
      const suit = text('strong', label, `is-${className}`);
      suitGrid.append(suit);
    }
    body.append(
      suitGrid,
      text('p', 'Large card faces, keyboard focus indicators, persistent CPU play information, high contrast, reduced motion, and text scaling are supported.'),
    );
    const buttons = document.createElement('div');
    buttons.className = 'c11-info-actions';
    buttons.append(infoButton('Open Settings', actions.settings, true), infoButton('Back to Main Menu', showMain));
    body.append(buttons);
    root.replaceChildren(shell);
    heading.focus?.();
  };

  const showFeedback = () => {
    const { shell, body, heading } = makePanelShell('Playtest Feedback', 'HELP US TEST THE REAL GAME');
    body.append(
      text('p', 'Play normally. If something is confusing, hard to see, or a move behaves differently than you expect, make a note of what happened.'),
      text('p', 'For rule problems, open the Playtest section in the game and copy the playtest log. That lets the exact hand and moves be reproduced.'),
    );
    const template = [
      'Capture 11 feedback',
      'What happened:',
      'What I expected:',
      'Was anything hard to see or understand:',
      'Playtest log if relevant:',
    ].join('\n');
    const copy = infoButton('Copy Feedback Template', () => {
      void navigator.clipboard?.writeText(template).then(() => { copy.textContent = 'Template Copied'; }).catch(() => { copy.textContent = 'Copy unavailable'; });
    }, true);
    const buttons = document.createElement('div');
    buttons.className = 'c11-info-actions';
    buttons.append(copy, infoButton('Back to Main Menu', showMain));
    body.append(buttons);
    root.replaceChildren(shell);
    heading.focus?.();
  };

  const showQuit = () => {
    const { shell, body, heading } = makePanelShell('Exit Capture 11', 'BROWSER PLAYTEST');
    body.append(text('p', 'Capture 11 is running in your browser. You can safely close this tab or window when you are finished.'));
    const buttons = document.createElement('div');
    buttons.className = 'c11-info-actions';
    buttons.append(infoButton('Return to Main Menu', showMain, true));
    body.append(buttons);
    root.replaceChildren(shell);
    heading.focus?.();
  };

  showMain();
}
