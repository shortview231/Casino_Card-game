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

export interface GameServices {
  readonly seed: number;
  readonly preferences: AccessibilityPreferences;
  save<T>(key: string, value: T): void;
  load<T>(key: string, fallback: T): T;
  complete(result: GameResult): void;
}

export interface MountedGame {
  destroy(): void;
}

export interface GameModule {
  manifest: GameManifest;
  mount(root: HTMLElement, services: GameServices): MountedGame;
}
