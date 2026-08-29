import './styles.css';
import { MicrogameRuntime } from './engine/runtime';
import { critterFlip } from './games/critterFlip';

const root = document.querySelector<HTMLElement>('#game-root');
if (!root) throw new Error('Missing #game-root');

const runtime = new MicrogameRuntime(root, critterFlip);
runtime.start();
