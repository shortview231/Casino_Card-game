export interface GameManifest {
  id: string;
  title: string;
  version: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
}

export interface AccessibilityPreferences {
  textScale: 1 | 1.25 | 1.5;
  highContrast: boolean;
  reducedMotion: boolean;
  soundEnabled: boolean;
}

export interface GameResult {
  heading: string;
  summary: string;
  score?: number;
}

export type CpuDifficulty = 'easy' | 'medium' | 'hard';

export interface GameServices {
  readonly seed: number;
  readonly preferences: AccessibilityPreferences;
  save<T>(key: string, value: T): void;
  load<T>(key: string, fallback: T): T;
  complete(result: GameResult): void;
  exitToTitle(): void;
  readonly mode: 'normal' | 'guided-demo';
  readonly difficulty: CpuDifficulty;
}

export interface MountedGame {
  destroy(): void;
}

export interface GameTitleActions {
  play(difficulty?: CpuDifficulty): void;
  loadDifficulty?(): CpuDifficulty;
  guidedDemo(): void;
  settings(): void;
}

export interface GameModule {
  manifest: GameManifest;
  renderTitle?(root: HTMLElement, actions: GameTitleActions): void;
  mount(root: HTMLElement, services: GameServices): MountedGame;
}
