import type { GameModule, MountedGame } from '../../engine/contracts';
import { chooseCpuMove } from './ai';
import { renderBuildContents } from './buildRenderer';
import { Capture11PlaytestRecorder, copyPlaytestLog } from './debug';
import {
  applyMove,
  beginNextHand,
  createMatch,
  movesForExactSelection,
  type Capture11Move,
  type Capture11State,
} from './game';
import type { BoardItem, Card, NumericBuild, PlayerId } from './model';
import './capture11.css';

const SUIT_SYMBOL: Record<Card['suit'], string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

function cardText(card: Card): string {
  return `${card.rank}${SUIT_SYMBOL[card.suit]}`;
}

function cardColorClass(card: Card): string {
  return card.suit === 'hearts' || card.suit === 'diamonds' ? 'red-card' : 'black-card';
}

function ownerName(player: PlayerId): string {
  return player === 'player1' ? 'You' : 'CPU';
}

function boardKey(item: BoardItem): string {
  return item.kind === 'loose' ? `loose:${item.card.id}` : `build:${item.id}`;
}

function actionLabel(move: Capture11Move, state: Capture11State): string {
  if (move.type === 'trail') return 'Trail card';
  if (move.type === 'capture-loose') return `Capture ${move.cardIds.length} board card${move.cardIds.length === 1 ? '' : 's'}`;
  if (move.type === 'capture-build') {
    const build = state.board.find((item) => item.kind === 'build' && item.id === move.buildId);
    return `Capture ${build?.kind === 'build' ? build.target : ''} build`;
  }
  if (move.type === 'build-open') return `Build ${move.target}`;
  if (move.type === 'build-paired') return `Lock paired ${move.target}`;
  return `Burn build → ${move.target}`;
}

function scoreLine(label: string, you: number, cpu: number): HTMLDivElement {
  const row = document.createElement('div');
  row.className = 'score-row';
  const name = document.createElement('span');
  name.textContent = label;
  const yours = document.createElement('strong');
  yours.textContent = String(you);
  yours.setAttribute('aria-label', `You ${you}`);
  const theirs = document.createElement('strong');
  theirs.textContent = String(cpu);
  theirs.setAttribute('aria-label', `CPU ${cpu}`);
  row.append(name, yours, theirs);
  return row;
}

function buildDescription(build: NumericBuild): string {
  const mode = build.mode === 'paired' ? 'locked' : 'open';
  return `${build.target} build, ${mode}, ${ownerName(build.createdBy)}, ${build.cards.map(cardText).join(' + ')}`;
}

export const capture11: GameModule = {
  manifest: {
    id: 'capture-11',
    title: 'Capture 11',
    version: '0.1.0-playtest',
    description: 'Build, steal, burn and capture. First to 11 points wins.',
    minPlayers: 1,
    maxPlayers: 2,
  },

  mount(root, services): MountedGame {
    let state = createMatch(services.seed);
    const recorder = new Capture11PlaytestRecorder(services.seed, state);
    let selectedHandCardId: string | null = null;
    const selectedBoard = new Set<string>();
    let cpuTimer: number | null = null;
    let destroyed = false;

    const clearSelection = () => {
      selectedHandCardId = null;
      selectedBoard.clear();
    };

    const makeButton = (label: string, onClick: () => void, className = ''): HTMLButtonElement => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      if (className) button.className = className;
      button.addEventListener('click', onClick);
      return button;
    };

    const makeDiagnostics = (): HTMLDetailsElement => {
      const diagnostics = document.createElement('details');
      diagnostics.className = 'playtest-diagnostics';

      const invariant = recorder.invariant(state);
      const summary = document.createElement('summary');
      summary.textContent = `Playtest · seed ${recorder.matchSeed} · ${invariant.ok ? '52 cards OK' : 'CARD ERROR'}`;

      const info = document.createElement('div');
      info.className = 'playtest-diagnostics-body';

      const seed = document.createElement('p');
      seed.innerHTML = `Match seed: <strong>${recorder.matchSeed}</strong> · Hand seed: <strong>${state.seed}</strong> · Hand: <strong>${state.handNumber}</strong>`;

      const status = document.createElement('p');
      status.className = invariant.ok ? 'invariant-ok' : 'invariant-error';
      status.textContent = invariant.message;

      const copy = makeButton('Copy playtest log', () => {
        void copyPlaytestLog(recorder.exportText()).then((copied) => {
          copy.textContent = copied ? 'Playtest log copied' : 'Copy failed · select log below';
        });
      }, 'quiet-action');

      const log = document.createElement('textarea');
      log.className = 'playtest-log';
      log.readOnly = true;
      log.rows = 7;
      log.setAttribute('aria-label', 'Capture 11 playtest log');
      log.value = recorder.exportText();

      info.append(seed, status, copy, log);
      diagnostics.append(summary, info);
      return diagnostics;
    };

    const applyRecordedMove = (player: PlayerId, move: Capture11Move) => {
      state = applyMove(state, player, move);
      recorder.recordMove(player, move, state);
    };

    const scheduleCpu = () => {
      if (destroyed || state.phase !== 'playing' || state.turn !== 'player2' || cpuTimer !== null) return;
      const delay = services.preferences.reducedMotion ? 0 : 420;
      cpuTimer = window.setTimeout(() => {
        cpuTimer = null;
        if (destroyed || state.phase !== 'playing' || state.turn !== 'player2') return;
        applyRecordedMove('player2', chooseCpuMove(state));
        clearSelection();
        render();
      }, delay);
    };

    const playMove = (move: Capture11Move) => {
      applyRecordedMove('player1', move);
      clearSelection();
      render();
    };

    const renderScoreScreen = () => {
      root.replaceChildren();
      const score = state.lastHandScore;
      if (!score) return;

      const panel = document.createElement('section');
      panel.className = 'capture11-score-screen';
      const heading = document.createElement('h1');
      heading.textContent = state.phase === 'match-over'
        ? (state.winner === 'player1' ? 'You win Capture 11!' : 'CPU wins Capture 11')
        : `Hand ${state.handNumber} complete`;

      const match = document.createElement('p');
      match.className = 'match-total';
      match.textContent = `Match score: You ${state.players.player1.matchScore} · CPU ${state.players.player2.matchScore}`;

      const grid = document.createElement('div');
      grid.className = 'score-breakdown';
      const labels = document.createElement('div');
      labels.className = 'score-row score-head';
      labels.append(
        document.createElement('span'),
        Object.assign(document.createElement('strong'), { textContent: 'You' }),
        Object.assign(document.createElement('strong'), { textContent: 'CPU' }),
      );
      grid.append(
        labels,
        scoreLine('Aces', score.scores.player1.aces, score.scores.player2.aces),
        scoreLine('2♠', score.scores.player1.twoOfSpades, score.scores.player2.twoOfSpades),
        scoreLine('Most spades', score.scores.player1.mostSpades, score.scores.player2.mostSpades),
        scoreLine('Most cards', score.scores.player1.mostCards, score.scores.player2.mostCards),
        scoreLine('10♦', score.scores.player1.tenOfDiamonds, score.scores.player2.tenOfDiamonds),
        scoreLine('Hand total', score.scores.player1.total, score.scores.player2.total),
      );

      const counts = document.createElement('p');
      counts.textContent = `Cards captured: ${score.cardCounts.player1}–${score.cardCounts.player2}. Spades: ${score.spadeCounts.player1}–${score.spadeCounts.player2}.`;

      const last = document.createElement('p');
      last.className = 'last-action';
      last.textContent = state.lastAction;

      panel.append(heading, match, grid, counts, last);

      if (state.phase === 'match-over') {
        panel.append(makeButton('Finish match', () => {
          services.complete({
            heading: state.winner === 'player1' ? 'You won Capture 11!' : 'CPU won Capture 11',
            summary: `Final score: You ${state.players.player1.matchScore}, CPU ${state.players.player2.matchScore}.`,
            score: state.players.player1.matchScore,
          });
        }, 'primary-action'));
      } else {
        panel.append(makeButton('Deal next hand', () => {
          state = beginNextHand(state);
          recorder.recordNextHand(state);
          clearSelection();
          render();
        }, 'primary-action'));
      }

      panel.append(makeDiagnostics());
      root.append(panel);
    };

    const render = () => {
      if (destroyed) return;
      if (state.phase !== 'playing') {
        renderScoreScreen();
        return;
      }

      root.replaceChildren();
      const shell = document.createElement('div');
      shell.className = 'capture11';

      const header = document.createElement('header');
      header.className = 'capture11-header';
      const titleWrap = document.createElement('div');
      const heading = document.createElement('h1');
      heading.textContent = 'Capture 11';
      const subtitle = document.createElement('p');
      subtitle.textContent = `Hand ${state.handNumber} · First to 11`;
      titleWrap.append(heading, subtitle);

      const matchScore = document.createElement('div');
      matchScore.className = 'match-score';
      matchScore.setAttribute('aria-label', `Match score. You ${state.players.player1.matchScore}. CPU ${state.players.player2.matchScore}.`);
      matchScore.innerHTML = `<span>You <strong>${state.players.player1.matchScore}</strong></span><span>CPU <strong>${state.players.player2.matchScore}</strong></span>`;
      header.append(titleWrap, matchScore);

      const meta = document.createElement('div');
      meta.className = 'table-meta';
      meta.innerHTML = `<span>Dealer: <strong>${ownerName(state.dealer)}</strong></span><span>Turn: <strong>${ownerName(state.turn)}</strong></span><span>Deck: <strong>${state.deck.length}</strong></span><span>Captured: <strong>${state.players.player1.captured.length} / ${state.players.player2.captured.length}</strong></span>`;

      const live = document.createElement('p');
      live.className = 'last-action';
      live.setAttribute('aria-live', 'polite');
      live.textContent = state.lastAction;

      const table = document.createElement('section');
      table.className = 'card-table';
      table.setAttribute('aria-label', 'Capture 11 card table');

      const cpuArea = document.createElement('div');
      cpuArea.className = 'player-area cpu-area';
      const cpuLabel = document.createElement('h2');
      cpuLabel.textContent = `CPU hand · ${state.players.player2.hand.length} cards`;
      const cpuHand = document.createElement('div');
      cpuHand.className = 'cpu-hand';
      for (let i = 0; i < state.players.player2.hand.length; i += 1) {
        const back = document.createElement('span');
        back.className = 'card-back';
        back.setAttribute('aria-hidden', 'true');
        back.textContent = '◆';
        cpuHand.append(back);
      }
      cpuArea.append(cpuLabel, cpuHand);

      const boardArea = document.createElement('div');
      boardArea.className = 'board-area';
      const boardHeading = document.createElement('h2');
      boardHeading.textContent = `Board · ${state.board.length} items`;
      const boardGrid = document.createElement('div');
      boardGrid.className = 'board-grid';

      if (state.board.length === 0) {
        const empty = document.createElement('p');
        empty.textContent = 'Board is clear.';
        boardGrid.append(empty);
      }

      for (const item of state.board) {
        const key = boardKey(item);
        const selected = selectedBoard.has(key);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = item.kind === 'loose'
          ? `playing-card board-card ${cardColorClass(item.card)}`
          : `build-card ${item.mode}`;
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-pressed', String(selected));
        button.disabled = state.turn !== 'player1';
        if (item.kind === 'loose') {
          button.textContent = cardText(item.card);
          button.setAttribute('aria-label', `${cardText(item.card)} on board`);
        } else {
          renderBuildContents(button, item, ownerName(item.createdBy));
          button.setAttribute('aria-label', buildDescription(item));
        }
        button.addEventListener('click', () => {
          if (selectedBoard.has(key)) selectedBoard.delete(key);
          else selectedBoard.add(key);
          render();
        });
        boardGrid.append(button);
      }
      boardArea.append(boardHeading, boardGrid);

      const humanArea = document.createElement('div');
      humanArea.className = 'player-area human-area';
      const handHeading = document.createElement('h2');
      handHeading.textContent = 'Your hand';
      const hand = document.createElement('div');
      hand.className = 'human-hand';
      for (const card of state.players.player1.hand) {
        const selected = selectedHandCardId === card.id;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `playing-card hand-card ${cardColorClass(card)}`;
        button.classList.toggle('selected', selected);
        button.textContent = cardText(card);
        button.setAttribute('aria-label', `${cardText(card)} in your hand`);
        button.setAttribute('aria-pressed', String(selected));
        button.disabled = state.turn !== 'player1';
        button.addEventListener('click', () => {
          selectedHandCardId = selected ? null : card.id;
          selectedBoard.clear();
          render();
        });
        hand.append(button);
      }
      humanArea.append(handHeading, hand);

      table.append(cpuArea, boardArea, humanArea);

      const actionPanel = document.createElement('section');
      actionPanel.className = 'action-panel';
      actionPanel.setAttribute('aria-label', 'Available actions');
      const actionHeading = document.createElement('h2');
      actionHeading.textContent = 'Move';
      actionPanel.append(actionHeading);

      if (state.turn !== 'player1') {
        const waiting = document.createElement('p');
        waiting.textContent = 'CPU is thinking…';
        actionPanel.append(waiting);
      } else if (!selectedHandCardId) {
        const help = document.createElement('p');
        help.textContent = 'Choose a card from your hand. Then select board cards or a build to see legal moves.';
        actionPanel.append(help);
      } else {
        const exactMoves = movesForExactSelection(state, 'player1', selectedHandCardId, [...selectedBoard]);
        if (exactMoves.length === 0) {
          const invalid = document.createElement('p');
          invalid.textContent = 'No legal action for that exact selection. Change the board selection, or clear it to trail the card.';
          actionPanel.append(invalid);
        } else {
          const actions = document.createElement('div');
          actions.className = 'action-buttons';
          for (const move of exactMoves) {
            actions.append(makeButton(
              actionLabel(move, state),
              () => playMove(move),
              move.type.startsWith('capture') ? 'primary-action' : '',
            ));
          }
          actionPanel.append(actions);
        }
        if (selectedBoard.size > 0) {
          actionPanel.append(makeButton('Clear board selection', () => {
            selectedBoard.clear();
            render();
          }, 'quiet-action'));
        }
      }

      const rules = document.createElement('details');
      rules.className = 'rules-help';
      const summary = document.createElement('summary');
      summary.textContent = 'Quick rules';
      const rulesText = document.createElement('div');
      rulesText.innerHTML = `
        <p>Capture loose numeric cards whose values add to the card you play. Face cards capture the same face rank.</p>
        <p>To build, combine your played numeric card with board cards and declare a value you still hold in your hand. Open builds can be raised. Matching paired builds are locked against raises.</p>
        <p>The last player to make a capture gets every card left on the board at the end of the hand.</p>
        <p>Scoring: each Ace 1, 2♠ 1, most spades 1, most cards 2, 10♦ 3. A tie for a category scores nobody. First to 11 match points wins.</p>`;
      rules.append(summary, rulesText);

      shell.append(header, meta, live, table, actionPanel, rules, makeDiagnostics());
      root.append(shell);
      scheduleCpu();
    };

    render();

    return {
      destroy() {
        destroyed = true;
        if (cpuTimer !== null) window.clearTimeout(cpuTimer);
        root.replaceChildren();
      },
    };
  },
};