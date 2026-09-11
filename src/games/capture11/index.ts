import type { GameModule, MountedGame } from '../../engine/contracts';
import { chooseCpuMove, createCpuMemory } from './ai';
import { renderBuildContents } from './buildRenderer';
import { describeCpuMove, type CpuPlayPresentation } from './cpuPresentation';
import { Capture11PlaytestRecorder, copyPlaytestLog } from './debug';
import {
  applyMove,
  beginNextHand,
  createMatch,
  legalMoves,
  movesForExactSelection,
  type Capture11Move,
  type Capture11State,
} from './game';
import type { BoardItem, Card, NumericBuild, PlayerId } from './model';
import { isExpectedScenarioMove, loadScenario, SCENARIO_IDS, type Capture11Scenario } from './scenarios';
import './capture11.css';

const SUIT_SYMBOL: Record<Card['suit'], string> = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' };
const SUIT_NAME: Record<Card['suit'], string> = { spades: 'Spades', hearts: 'Hearts', diamonds: 'Diamonds', clubs: 'Clubs' };

function cardText(card: Card): string { return `${card.rank}${SUIT_SYMBOL[card.suit]}`; }
function cardColorClass(card: Card): string { return card.suit === 'hearts' || card.suit === 'diamonds' ? 'red-card' : 'black-card'; }
function ownerName(player: PlayerId): string { return player === 'player1' ? 'You' : 'CPU'; }
function boardKey(item: BoardItem): string { return item.kind === 'loose' ? `loose:${item.card.id}` : `build:${item.id}`; }

function actionLabel(move: Capture11Move, state: Capture11State): string {
  if (move.type === 'trail') return 'Play selected card to table';
  if (move.type === 'capture-loose') return `Capture ${move.cardIds.length} board card${move.cardIds.length === 1 ? '' : 's'}`;
  if (move.type === 'capture-build') {
    const build = state.board.find((item) => item.kind === 'build' && item.id === move.buildId);
    return `Capture ${build?.kind === 'build' ? build.target : ''} build`;
  }
  if (move.type === 'capture-combined') return `Capture ${move.buildIds.length} build + ${move.cardIds.length} loose`;
  if (move.type === 'build-open') return `Build ${move.target}`;
  if (move.type === 'build-paired') return `Lock paired ${move.target}`;
  if (move.type === 'extend-paired') return `Add another ${move.target} group`;
  if (move.type === 'extend-build') return `Add ${move.target} component`;
  return `Burn build → ${move.target}`;
}

function scoreLine(label: string, you: number, cpu: number): HTMLDivElement {
  const row = document.createElement('div'); row.className = 'score-row';
  const name = document.createElement('span'); name.textContent = label;
  const yours = document.createElement('strong'); yours.textContent = String(you); yours.setAttribute('aria-label', `You ${you}`);
  const theirs = document.createElement('strong'); theirs.textContent = String(cpu); theirs.setAttribute('aria-label', `CPU ${cpu}`);
  row.append(name, yours, theirs); return row;
}

function buildDescription(build: NumericBuild): string {
  const mode = build.mode === 'paired' ? 'locked' : 'open';
  return `${build.target} build, ${mode}, ${ownerName(build.createdBy)}, ${build.cards.map(cardText).join(' + ')}`;
}

export const capture11: GameModule = {
  manifest: { id: 'capture-11', title: 'Capture 11', version: '0.1.0-playtest', description: 'Build, steal, burn and capture. First to 11 points wins.', minPlayers: 1, maxPlayers: 2 },

  mount(root, services): MountedGame {
    let scenarioIndex = 0;
    let activeScenario: Capture11Scenario | null = services.mode === 'guided-demo' ? loadScenario(SCENARIO_IDS[0]) : null;
    let state = activeScenario?.state ?? createMatch(services.seed);
    let recorder = new Capture11PlaytestRecorder(services.seed, state);
    let scenarioComplete = false;
    let scenarioFeedback = '';
    let selectedHandCardId: string | null = null;
    const selectedBoard = new Set<string>();
    let cpuTimer: number | null = null;
    let cpuPreview: CpuPlayPresentation | null = null;
    let lastCpuPlay: CpuPlayPresentation | null = null;
    let destroyed = false;
    const cpuMemory = createCpuMemory();

    const clearSelection = () => { selectedHandCardId = null; selectedBoard.clear(); };

    const makeButton = (label: string, onClick: () => void, className = ''): HTMLButtonElement => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
      if (className) button.className = className; button.addEventListener('click', onClick); return button;
    };

    const makeCpuPlayPanel = (play: CpuPlayPresentation, preview: boolean): HTMLElement => {
      const panel = document.createElement('section'); panel.className = `cpu-play-panel${preview ? ' is-preview' : ''}`; panel.setAttribute('aria-live', 'assertive');
      const label = document.createElement('strong'); label.className = 'cpu-play-label'; label.textContent = preview ? 'CPU IS PLAYING' : 'LAST CPU PLAY';
      const card = document.createElement('span'); card.className = `playing-card cpu-play-card ${cardColorClass(play.card)}`; card.textContent = cardText(play.card); card.setAttribute('aria-label', `${play.card.rank} of ${SUIT_NAME[play.card.suit]}`);
      const text = document.createElement('div'); const heading = document.createElement('h3'); heading.textContent = play.heading; const detail = document.createElement('p'); detail.textContent = play.detail; text.append(heading, detail); panel.append(label, card, text); return panel;
    };

    const makeDiagnostics = (): HTMLDetailsElement => {
      const diagnostics = document.createElement('details'); diagnostics.className = 'playtest-diagnostics'; const invariant = recorder.invariant(state);
      const summary = document.createElement('summary'); summary.textContent = `Playtest · seed ${recorder.matchSeed} · ${invariant.ok ? '52 cards OK' : 'CARD ERROR'}`;
      const info = document.createElement('div'); info.className = 'playtest-diagnostics-body';
      const seed = document.createElement('p'); seed.innerHTML = `Match seed: <strong>${recorder.matchSeed}</strong> · Hand seed: <strong>${state.seed}</strong> · Hand: <strong>${state.handNumber}</strong>`;
      const status = document.createElement('p'); status.className = invariant.ok ? 'invariant-ok' : 'invariant-error'; status.textContent = invariant.message;
      const copy = makeButton('Copy playtest log', () => { void copyPlaytestLog(recorder.exportText()).then((copied) => { copy.textContent = copied ? 'Playtest log copied' : 'Copy failed · select log below'; }); }, 'quiet-action');
      const log = document.createElement('textarea'); log.className = 'playtest-log'; log.readOnly = true; log.rows = 7; log.setAttribute('aria-label', 'Capture 11 playtest log'); log.value = recorder.exportText();
      info.append(seed, status, copy, log); diagnostics.append(summary, info); return diagnostics;
    };

    const applyRecordedMove = (player: PlayerId, move: Capture11Move) => { state = applyMove(state, player, move); recorder.recordMove(player, move, state); };

    const scheduleCpu = () => {
      if (activeScenario) return;
      if (destroyed || state.phase !== 'playing' || state.turn !== 'player2' || cpuTimer !== null || cpuPreview !== null) return;
      cpuTimer = window.setTimeout(() => {
        cpuTimer = null;
        if (destroyed || state.phase !== 'playing' || state.turn !== 'player2') return;
        const move = chooseCpuMove(state, 'player2', services.difficulty, cpuMemory); cpuPreview = describeCpuMove(state, move); render();
        cpuTimer = window.setTimeout(() => {
          cpuTimer = null;
          if (destroyed || state.phase !== 'playing' || state.turn !== 'player2') return;
          const shown = cpuPreview; applyRecordedMove('player2', move); lastCpuPlay = shown; cpuPreview = null; clearSelection(); render();
        }, 2200);
      }, 650);
    };

    const playMove = (move: Capture11Move) => {
      if (activeScenario && !isExpectedScenarioMove(move, activeScenario.expected)) {
        scenarioFeedback = 'That move is legal, but this scene is demonstrating the marked move. Select every marked card and the matching action.';
        render(); return;
      }
      applyRecordedMove('player1', move); clearSelection();
      if (activeScenario) {
        scenarioComplete = activeScenario.isComplete(state);
        scenarioFeedback = scenarioComplete ? activeScenario.success : 'The expected move ran, but its required result was not produced. Replay the scene and report this regression.';
      }
      render();
    };

    const loadDemoScene = (index: number) => {
      scenarioIndex = index; activeScenario = loadScenario(SCENARIO_IDS[index]!); state = activeScenario.state;
      recorder = new Capture11PlaytestRecorder(state.seed, state); scenarioComplete = false; scenarioFeedback = ''; clearSelection(); render();
      root.scrollTo({ top: 0 }); window.scrollTo({ top: 0 });
      window.requestAnimationFrame(() => { root.scrollTo({ top: 0 }); window.scrollTo({ top: 0 }); });
    };

    const makeDemoPanel = (): HTMLElement | null => {
      if (!activeScenario) return null;
      const panel = document.createElement('section'); panel.className = 'scenario-panel'; panel.setAttribute('aria-label', 'Guided Demo instructions');
      const eyebrow = document.createElement('strong'); eyebrow.textContent = 'GUIDED DEMO';
      const title = document.createElement('h2'); title.textContent = activeScenario.title;
      const copy = document.createElement('p'); copy.textContent = scenarioComplete ? activeScenario.success : activeScenario.instruction; copy.setAttribute('aria-live', 'polite');
      const cue = document.createElement('p'); cue.className = 'scenario-cue'; cue.textContent = scenarioComplete ? '✓ Scene complete' : '★ MARKED means select this';
      const controls = document.createElement('div'); controls.className = 'scenario-controls';
      controls.append(makeButton('Replay Scene', () => loadDemoScene(scenarioIndex), 'quiet-action'));
      const finalScene = scenarioIndex === SCENARIO_IDS.length - 1;
      const next = makeButton(finalScene ? 'Finish Demo' : 'Next Scene', finalScene ? services.exitToTitle : () => loadDemoScene(scenarioIndex + 1), 'primary-action');
      next.disabled = !scenarioComplete; controls.append(next, makeButton('Exit Demo', services.exitToTitle, 'quiet-action'));
      panel.append(eyebrow, title, copy, cue);
      if (scenarioFeedback && !scenarioComplete) { const feedback = document.createElement('p'); feedback.className = 'scenario-feedback'; feedback.textContent = scenarioFeedback; feedback.setAttribute('role', 'alert'); panel.append(feedback); }
      panel.append(controls); return panel;
    };

    const makeActionPanel = (placementClass: string): HTMLElement => {
      const actionPanel = document.createElement('section'); actionPanel.className = `action-panel ${placementClass}`; actionPanel.setAttribute('aria-label', 'Available actions'); const actionHeading = document.createElement('h2'); actionHeading.textContent = 'TURN OPTIONS'; actionPanel.append(actionHeading);
      if (state.turn !== 'player1') { const waiting = document.createElement('p'); waiting.textContent = activeScenario && scenarioComplete ? 'Scene complete. Replay it or continue to the next scene.' : cpuPreview ? 'CPU card is revealed above. Board update is paused so you can inspect the play.' : 'CPU is thinking…'; actionPanel.append(waiting); }
      else if (!selectedHandCardId) { const help = document.createElement('p'); help.textContent = 'Choose a card from your hand. Then select board cards or a build to capture, build, or play the card to the table.'; actionPanel.append(help); const selectPrompt = makeButton('Select a hand card', () => {}, 'quiet-action'); selectPrompt.disabled = true; actionPanel.append(selectPrompt); }
      else {
        const exactMoves = movesForExactSelection(state, 'player1', selectedHandCardId, [...selectedBoard]);
        const trailMove = legalMoves(state, 'player1').find((move) => move.handCardId === selectedHandCardId && move.type === 'trail');
        const actions = document.createElement('div'); actions.className = 'action-buttons';
        if (exactMoves.length === 0) {
          const invalid = document.createElement('p'); invalid.textContent = 'Those board cards do not make a legal capture or build. You can still play your selected hand card to the table.'; actionPanel.append(invalid);
        } else {
          for (const move of exactMoves) {
            const expected = !!activeScenario && isExpectedScenarioMove(move, activeScenario.expected);
            const button = makeButton(actionLabel(move, state), () => playMove(move), expected || move.type.startsWith('capture') ? 'primary-action' : '');
            if (expected) { button.classList.add('scenario-suggested'); button.setAttribute('aria-description', 'Marked action for this demo scene'); }
            actions.append(button);
          }
        }
        if (selectedBoard.size > 0 && trailMove) actions.append(makeButton(actionLabel(trailMove, state), () => playMove(trailMove)));
        actionPanel.append(actions);
        if (selectedBoard.size > 0) actionPanel.append(makeButton('Clear board selection', () => { selectedBoard.clear(); render(); }, 'quiet-action'));
        actionPanel.append(makeButton('Cancel card selection', () => { clearSelection(); render(); }, 'quiet-action'));
      }
      return actionPanel;
    };

    const renderScoreScreen = () => {
      root.replaceChildren(); const score = state.lastHandScore; if (!score) return;
      const panel = document.createElement('section'); panel.className = 'capture11-score-screen';
      const heading = document.createElement('h1'); heading.textContent = state.phase === 'match-over' ? (state.winner === 'player1' ? 'You win Capture 11!' : 'CPU wins Capture 11') : `Hand ${state.handNumber} complete`;
      const match = document.createElement('p'); match.className = 'match-total'; match.textContent = `Match score: You ${state.players.player1.matchScore} · CPU ${state.players.player2.matchScore}`;
      const grid = document.createElement('div'); grid.className = 'score-breakdown'; const labels = document.createElement('div'); labels.className = 'score-row score-head'; labels.append(document.createElement('span'), Object.assign(document.createElement('strong'), { textContent: 'You' }), Object.assign(document.createElement('strong'), { textContent: 'CPU' }));
      grid.append(labels, scoreLine('Aces', score.scores.player1.aces, score.scores.player2.aces), scoreLine('2♠', score.scores.player1.twoOfSpades, score.scores.player2.twoOfSpades), scoreLine('Most spades', score.scores.player1.mostSpades, score.scores.player2.mostSpades), scoreLine('Most cards', score.scores.player1.mostCards, score.scores.player2.mostCards), scoreLine('10♦', score.scores.player1.tenOfDiamonds, score.scores.player2.tenOfDiamonds), scoreLine('Hand total', score.scores.player1.total, score.scores.player2.total));
      const counts = document.createElement('p'); counts.textContent = `Cards captured: ${score.cardCounts.player1}–${score.cardCounts.player2}. Spades: ${score.spadeCounts.player1}–${score.spadeCounts.player2}.`;
      const last = document.createElement('p'); last.className = 'last-action'; last.textContent = state.lastAction; panel.append(heading, match, grid, counts, last);
      if (activeScenario && score) {
        panel.prepend(makeDemoPanel()!);
        const yours = score.scores.player1; const explanation = document.createElement('p'); explanation.className = 'scenario-score-explanation';
        explanation.textContent = `Your ${yours.total} points: Aces ${yours.aces}, 2♠ ${yours.twoOfSpades}, most spades ${yours.mostSpades}, most cards ${yours.mostCards}, 10♦ ${yours.tenOfDiamonds}. Calculated by the normal scoring engine.`;
        panel.append(explanation);
      }
      if (!activeScenario && state.phase === 'match-over') panel.append(makeButton('Finish match', () => services.complete({ heading: state.winner === 'player1' ? 'You won Capture 11!' : 'CPU won Capture 11', summary: `Final score: You ${state.players.player1.matchScore}, CPU ${state.players.player2.matchScore}.`, score: state.players.player1.matchScore }), 'primary-action'));
      else if (!activeScenario) panel.append(makeButton('Deal next hand', () => { state = beginNextHand(state); recorder.recordNextHand(state); lastCpuPlay = null; clearSelection(); render(); }, 'primary-action'));
      if (!activeScenario) panel.append(makeDiagnostics()); root.append(panel);
    };

    const render = () => {
      if (destroyed) return; if (state.phase !== 'playing') { renderScoreScreen(); return; }
      root.replaceChildren(); const shell = document.createElement('div'); shell.className = `capture11${activeScenario ? ' is-guided-demo' : ''}`;
      const header = document.createElement('header'); header.className = 'capture11-header'; const titleWrap = document.createElement('div'); titleWrap.className = 'capture11-brand'; const heading = document.createElement('h1'); heading.innerHTML = 'CAPTURE <strong>11</strong>'; const subtitle = document.createElement('p'); subtitle.textContent = 'STRATEGY · RISK · BIG PLAYS'; titleWrap.append(heading, subtitle);
      const matchScore = document.createElement('div'); matchScore.className = 'match-score'; matchScore.setAttribute('aria-label', `Match score. You ${state.players.player1.matchScore}. CPU ${state.players.player2.matchScore}.`); matchScore.innerHTML = `<span>You <strong>${state.players.player1.matchScore}</strong></span><span>CPU <strong>${state.players.player2.matchScore}</strong></span>`; header.append(titleWrap, matchScore);
      const meta = document.createElement('div'); meta.className = 'table-meta'; meta.innerHTML = `<span>HAND <strong>${state.handNumber}</strong></span><span>DEALER <strong>${ownerName(state.dealer)}</strong></span><span>TURN <strong>${ownerName(state.turn)}</strong></span><span>DECK <strong>${state.deck.length}</strong></span><span class="cpu-difficulty">CPU <strong>${services.difficulty[0]!.toUpperCase()}${services.difficulty.slice(1)}</strong></span>`;
      const suitKey = document.createElement('p'); suitKey.className = 'suit-key';
      for (const [className, text] of [
        ['suit-spades', 'S ♠ Spades'],
        ['suit-hearts', 'H ♥ Hearts'],
        ['suit-diamonds', 'D ♦ Diamonds'],
        ['suit-clubs', 'C ♣ Clubs'],
      ] as const) {
        const suit = document.createElement('span');
        suit.className = className;
        suit.textContent = text;
        suitKey.append(suit);
      }
      const live = document.createElement('section'); live.className = 'last-action'; live.setAttribute('aria-live', 'polite'); live.innerHTML = `<strong>GAME STATUS</strong><span>${state.lastAction}</span>`;
      const table = document.createElement('section'); table.className = 'card-table'; table.setAttribute('aria-label', 'Capture 11 card table');

      const cpuArea = document.createElement('div'); cpuArea.className = 'player-area cpu-area'; const cpuLabel = document.createElement('h2'); cpuLabel.innerHTML = `<span>CPU</span><small>${state.players.player2.hand.length} cards · ${state.players.player2.captured.length} captured</small>`; const cpuHand = document.createElement('div'); cpuHand.className = 'cpu-hand';
      for (let i = 0; i < state.players.player2.hand.length; i += 1) { const back = document.createElement('span'); back.className = 'card-back'; back.setAttribute('aria-hidden', 'true'); back.textContent = '◆'; cpuHand.append(back); }
      cpuArea.append(cpuLabel, cpuHand); const playToShow = cpuPreview ?? lastCpuPlay; const cpuPlayPanel = playToShow ? makeCpuPlayPanel(playToShow, cpuPreview !== null) : null; if (cpuPlayPanel && cpuPreview) cpuArea.append(cpuPlayPanel);

      const boardArea = document.createElement('div'); boardArea.className = 'board-area'; const boardHeading = document.createElement('h2'); boardHeading.innerHTML = `<span>TABLE</span><small>${state.board.length} available item${state.board.length === 1 ? '' : 's'}</small>`; const boardGrid = document.createElement('div'); boardGrid.className = 'board-grid';
      if (state.board.length === 0) { const empty = document.createElement('p'); empty.textContent = 'Board is clear.'; boardGrid.append(empty); }
      for (const item of state.board) {
        const key = boardKey(item); const selected = selectedBoard.has(key); const button = document.createElement('button'); button.type = 'button'; button.className = item.kind === 'loose' ? `playing-card board-card ${cardColorClass(item.card)}` : `build-card ${item.mode}`; button.classList.toggle('selected', selected); const suggested = !!activeScenario && !scenarioComplete && activeScenario.suggestedBoardKeys.includes(key); button.classList.toggle('scenario-suggested', suggested); button.setAttribute('aria-pressed', String(selected)); button.disabled = state.turn !== 'player1';
        if (item.kind === 'loose') { button.textContent = cardText(item.card); button.setAttribute('aria-label', `${item.card.rank} of ${SUIT_NAME[item.card.suit]} on board`); }
        else { renderBuildContents(button, item, ownerName(item.createdBy)); button.setAttribute('aria-label', buildDescription(item)); }
        if (suggested) button.setAttribute('aria-description', 'Marked card for this demo scene');
        button.addEventListener('click', () => { if (selectedBoard.has(key)) selectedBoard.delete(key); else selectedBoard.add(key); render(); }); boardGrid.append(button);
      }
      boardArea.append(boardHeading, boardGrid);

      const humanArea = document.createElement('div'); humanArea.className = 'player-area human-area'; const handHeading = document.createElement('h2'); handHeading.innerHTML = `<span>YOUR HAND</span><small>${state.players.player1.hand.length} cards · ${state.players.player1.captured.length} captured</small>`; const hand = document.createElement('div'); hand.className = 'human-hand';
      for (const card of state.players.player1.hand) { const selected = selectedHandCardId === card.id; const button = document.createElement('button'); button.type = 'button'; button.className = `playing-card hand-card ${cardColorClass(card)}`; button.classList.toggle('selected', selected); const suggested = !!activeScenario && !scenarioComplete && activeScenario.suggestedHandCardId === card.id; button.classList.toggle('scenario-suggested', suggested); button.textContent = cardText(card); button.setAttribute('aria-label', `${card.rank} of ${SUIT_NAME[card.suit]} in your hand`); if (suggested) button.setAttribute('aria-description', 'Marked card for this demo scene'); button.setAttribute('aria-pressed', String(selected)); button.disabled = state.turn !== 'player1'; button.addEventListener('click', () => { selectedHandCardId = selected ? null : card.id; selectedBoard.clear(); render(); }); hand.append(button); }
      humanArea.append(handHeading, hand); table.append(cpuArea, boardArea, humanArea, makeActionPanel('mobile-action-panel'));

      const rules = document.createElement('details'); rules.className = 'rules-help'; rules.open = true; const summary = document.createElement('summary'); summary.textContent = 'GAME INFO'; const rulesText = document.createElement('div'); rulesText.innerHTML = `<p><strong>First to 11 points.</strong></p><p>Capture loose cards by matching faces or adding numeric cards to the value you play.</p><p>Locked builds may hold multiple groups equal to one target. Add complete groups while you still hold the pickup card.</p><p>Scoring: Aces 1, 2♠ 1, most spades 1, most cards 2, 10♦ 3.</p>`; rules.append(summary, rulesText);

      const handStatus = document.createElement('section'); handStatus.className = 'hand-status'; handStatus.innerHTML = `<h2>CURRENT HAND</h2><dl><div><dt>Hand</dt><dd>${state.handNumber}</dd></div><div><dt>Points</dt><dd>You ${state.players.player1.matchScore} · CPU ${state.players.player2.matchScore}</dd></div><div><dt>Status</dt><dd>${activeScenario && scenarioComplete ? 'Scene complete' : state.turn === 'player1' ? 'Your turn' : 'CPU turn'}</dd></div></dl>`;
      const leftRail = document.createElement('aside'); leftRail.className = 'capture11-rail left-rail'; leftRail.append(header, suitKey, rules); if (!activeScenario) leftRail.append(makeDiagnostics());
      const tableStage = document.createElement('main'); tableStage.className = 'capture11-table-stage'; tableStage.append(meta); const mobileDemoPanel = makeDemoPanel(); if (mobileDemoPanel) { mobileDemoPanel.classList.add('mobile-scenario-panel'); tableStage.append(mobileDemoPanel); } tableStage.append(table);
      const rightRail = document.createElement('aside'); rightRail.className = 'capture11-rail right-rail'; const desktopDemoPanel = makeDemoPanel(); if (desktopDemoPanel) { desktopDemoPanel.classList.add('desktop-scenario-panel'); rightRail.append(desktopDemoPanel); } rightRail.append(makeActionPanel('desktop-action-panel')); if (cpuPlayPanel && !cpuPreview) rightRail.append(cpuPlayPanel); rightRail.append(handStatus, live);
      shell.append(leftRail, tableStage, rightRail); root.append(shell); scheduleCpu();
    };

    render();
    return { destroy() { destroyed = true; if (cpuTimer !== null) window.clearTimeout(cpuTimer); root.replaceChildren(); } };
  },
};
