import './styles.css';
import { MicrogameRuntime } from './engine/runtime';
import { capture11 } from './games/capture11';

const root = document.querySelector<HTMLElement>('#game-root');
if (!root) throw new Error('Missing #game-root');

const runtime = new MicrogameRuntime(root, capture11);
runtime.start();
