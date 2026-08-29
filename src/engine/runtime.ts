import type {
  AccessibilityPreferences,
  GameModule,
  GameResult,
  MountedGame,
} from './contracts';
import { loadJson, saveJson } from './storage';

const DEFAULT_PREFS: AccessibilityPreferences = {
  textScale: 1,
  highContrast: false,
  reducedMotion: false,
  soundEnabled: true,
};

export class MicrogameRuntime {
  private mounted: MountedGame | null = null;
  private result: GameResult | null = null;
  private prefs: AccessibilityPreferences;

  constructor(
    private readonly root: HTMLElement,
    private readonly game: GameModule,
  ) {
    this.prefs = loadJson('engine', 'preferences', DEFAULT_PREFS);
    this.applyPreferences();
  }

  start(): void {
    this.showTitle();
  }

  private clear(): void {
    this.mounted?.destroy();
    this.mounted = null;
    this.root.replaceChildren();
  }

  private button(label: string, action: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', action);
    return button;
  }

  private showTitle(): void {
    this.clear();
    const section = document.createElement('section');
    section.className = 'screen';

    const heading = document.createElement('h1');
    heading.textContent = this.game.manifest.title;
    const description = document.createElement('p');
    description.textContent = this.game.manifest.description;

    section.append(
      heading,
      description,
      this.button('Play', () => this.showGame()),
      this.button('Settings', () => this.showSettings()),
    );
    this.root.append(section);
    heading.focus?.();
  }

  private showSettings(): void {
    this.clear();
    const section = document.createElement('section');
    section.className = 'screen';
    const heading = document.createElement('h1');
    heading.textContent = 'Settings';

    const makeToggle = (label: string, key: 'highContrast' | 'reducedMotion' | 'soundEnabled') => {
      const wrapper = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = this.prefs[key];
      input.addEventListener('change', () => {
        this.prefs = { ...this.prefs, [key]: input.checked };
        this.persistPreferences();
      });
      wrapper.append(input, ` ${label}`);
      return wrapper;
    };

    const scaleLabel = document.createElement('label');
    scaleLabel.textContent = 'Text size ';
    const scale = document.createElement('select');
    for (const value of [1, 1.25, 1.5] as const) {
      const option = document.createElement('option');
      option.value = String(value);
      option.textContent = `${Math.round(value * 100)}%`;
      option.selected = value === this.prefs.textScale;
      scale.append(option);
    }
    scale.addEventListener('change', () => {
      this.prefs = { ...this.prefs, textScale: Number(scale.value) as 1 | 1.25 | 1.5 };
      this.persistPreferences();
    });
    scaleLabel.append(scale);

    section.append(
      heading,
      scaleLabel,
      makeToggle('High contrast', 'highContrast'),
      makeToggle('Reduce motion', 'reducedMotion'),
      makeToggle('Sound', 'soundEnabled'),
      this.button('Back', () => this.showTitle()),
    );
    this.root.append(section);
  }

  private showGame(): void {
    this.clear();
    this.result = null;
    const gameHost = document.createElement('section');
    gameHost.className = 'screen game-screen';
    gameHost.setAttribute('aria-label', this.game.manifest.title);
    this.root.append(gameHost);

    const seed = Date.now() >>> 0;
    this.mounted = this.game.mount(gameHost, {
      seed,
      preferences: this.prefs,
      save: (key, value) => saveJson(this.game.manifest.id, key, value),
      load: (key, fallback) => loadJson(this.game.manifest.id, key, fallback),
      complete: (result) => {
        this.result = result;
        this.showResults();
      },
    });
  }

  private showResults(): void {
    this.clear();
    const section = document.createElement('section');
    section.className = 'screen';
    const heading = document.createElement('h1');
    heading.textContent = this.result?.heading ?? 'Game complete';
    const summary = document.createElement('p');
    summary.textContent = this.result?.summary ?? '';
    section.append(
      heading,
      summary,
      this.button('Play again', () => this.showGame()),
      this.button('Main menu', () => this.showTitle()),
    );
    this.root.append(section);
  }

  private persistPreferences(): void {
    saveJson('engine', 'preferences', this.prefs);
    this.applyPreferences();
  }

  private applyPreferences(): void {
    document.documentElement.style.setProperty('--text-scale', String(this.prefs.textScale));
    document.documentElement.dataset.contrast = this.prefs.highContrast ? 'high' : 'normal';
    document.documentElement.dataset.motion = this.prefs.reducedMotion ? 'reduced' : 'normal';
  }
}
