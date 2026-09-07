import './styles.css';
import { MicrogameRuntime } from './engine/runtime';
import { observePlayingCards } from './engine/playingCards';
import { capture11 } from './games/capture11';
import { renderCapture11MainMenu } from './games/capture11/mainMenu';

const root = document.querySelector<HTMLElement>('#game-root');
if (!root) throw new Error('Missing #game-root');

observePlayingCards(root);
capture11.renderTitle = renderCapture11MainMenu;
const runtime = new MicrogameRuntime(root, capture11);
runtime.start();
