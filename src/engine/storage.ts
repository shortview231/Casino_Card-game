const STORAGE_PREFIX = 'product-engine.microgame.v1';

function storageKey(gameId: string, key: string): string {
  return `${STORAGE_PREFIX}.${gameId}.${key}`;
}

export function saveJson<T>(gameId: string, key: string, value: T): void {
  localStorage.setItem(storageKey(gameId, key), JSON.stringify({ version: 1, value }));
}

export function loadJson<T>(gameId: string, key: string, fallback: T): T {
  const raw = localStorage.getItem(storageKey(gameId, key));
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as { version?: number; value?: T };
    return parsed.version === 1 && parsed.value !== undefined ? parsed.value : fallback;
  } catch {
    return fallback;
  }
}
