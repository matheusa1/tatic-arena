import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEY } from '../../../shared/constants';
import {
  clearGameState,
  createInitialGameState,
  exportGameState,
  importGameState,
  loadGameState,
  saveGameState
} from '../localStorageRepository';

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear() {
    this.store.clear();
  }

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

describe('localStorageRepository', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new MemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stores game state in split buckets instead of the legacy single key', () => {
    const state = {
      ...createInitialGameState(),
      coins: 12345
    };

    saveGameState(state);

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(`${STORAGE_KEY}:manifest`)).toContain('heroes-tactics-arena');
    expect(localStorage.getItem(`${STORAGE_KEY}:resources`)).toContain('12345');
    expect(loadGameState()?.coins).toBe(12345);
  });

  it('migrates legacy single-key saves into split storage', () => {
    const legacyState = {
      ...createInitialGameState(),
      crystals: 777
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyState));

    const loaded = loadGameState();

    expect(loaded?.crystals).toBe(777);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(`${STORAGE_KEY}:manifest`)).not.toBeNull();
  });

  it('exports and imports encoded save text', () => {
    const state = createInitialGameState();
    state.roster['ember-squire'] = {
      ...state.roster['ember-squire'],
      level: 18
    };

    const saveText = exportGameState(state);
    const imported = importGameState(saveText);

    expect(saveText.startsWith('HTA_SAVE_')).toBe(true);
    expect(imported?.roster['ember-squire'].level).toBe(18);
  });

  it('clears all managed save buckets', () => {
    saveGameState(createInitialGameState());

    clearGameState();

    expect(localStorage.length).toBe(0);
  });
});
