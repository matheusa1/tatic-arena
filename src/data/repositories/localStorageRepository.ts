import {
  CHARACTER_CATALOG,
  INITIAL_CHARACTER_IDS
} from '../../domain/entities/characters';
import { GameSnapshot } from '../../domain/entities/player';
import {
  createDefaultTeamFormation,
  getTeamIdsFromFormation,
  normalizeTeamFormation
} from '../../domain/entities/formation';
import { createInitialRoster } from '../../domain/services/characterService';
import { createInitialEventProgress } from '../../domain/services/eventService';
import { GAME_STATE_VERSION, STORAGE_KEY } from '../../shared/constants';

const STORAGE_SCHEMA_VERSION = 2;
const SAVE_EXPORT_PREFIX = 'HTA_SAVE_';
const MAX_STORED_HISTORY = 30;
const MAX_STORED_BATTLE_LOGS = 80;
const STORAGE_MANIFEST_KEY = `${STORAGE_KEY}:manifest`;
const STORAGE_PART_KEYS = {
  resources: `${STORAGE_KEY}:resources`,
  inventory: `${STORAGE_KEY}:inventory`,
  roster: `${STORAGE_KEY}:roster`,
  formation: `${STORAGE_KEY}:formation`,
  gacha: `${STORAGE_KEY}:gacha`,
  event: `${STORAGE_KEY}:event`,
  battle: `${STORAGE_KEY}:battle`
} as const;
const MANAGED_STORAGE_KEYS = [
  STORAGE_KEY,
  STORAGE_MANIFEST_KEY,
  ...Object.values(STORAGE_PART_KEYS)
];

type StoredGameSnapshot = Partial<GameSnapshot> & Pick<GameSnapshot, 'version'>;
type StoragePartName = keyof typeof STORAGE_PART_KEYS;

type StorageManifest = {
  app: 'heroes-tactics-arena';
  version: number;
  schemaVersion: number;
  parts: StoragePartName[];
  updatedAt: string;
};

type ExportedSave = {
  app?: string;
  version?: number;
  exportedAt?: string;
  state?: StoredGameSnapshot;
};

export function createInitialGameState(): GameSnapshot {
  const formation = createDefaultTeamFormation(INITIAL_CHARACTER_IDS);

  return {
    version: GAME_STATE_VERSION,
    coins: 10000,
    crystals: 100000,
    levelPotions: 0,
    ultraCores: 0,
    chests: {
      raro: 0,
      épico: 0,
      lendário: 0
    },
    skinInventory: {
      ownedSkinIds: []
    },
    roster: createInitialRoster(CHARACTER_CATALOG, INITIAL_CHARACTER_IDS),
    formation,
    team: getTeamIdsFromFormation(formation),
    gacha: {
      specialPity: 0,
      history: []
    },
    event: createInitialEventProgress()
  };
}

function safeJsonParse<T>(raw: string | null | undefined): T | undefined {
  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

function mergeRoster(savedRoster: GameSnapshot['roster'] | undefined) {
  const baseRoster = createInitialGameState().roster;

  return Object.fromEntries(
    Object.entries(baseRoster).map(([characterId, baseCharacter]) => {
      const savedCharacter = savedRoster?.[characterId];

      return [
        characterId,
        {
          ...baseCharacter,
          ...savedCharacter,
          weaponLevel: savedCharacter?.weaponLevel ?? baseCharacter.weaponLevel,
          basicSkillLevel: savedCharacter?.basicSkillLevel ?? baseCharacter.basicSkillLevel,
          specialSkillLevel: savedCharacter?.specialSkillLevel ?? baseCharacter.specialSkillLevel,
          equippedSkinId: savedCharacter?.equippedSkinId,
          pet: savedCharacter?.pet
            ? {
                id: savedCharacter.pet.id,
                level: savedCharacter.pet.level ?? 1,
                bond: savedCharacter.pet.bond ?? 1
              }
            : undefined
        }
      ];
    })
  );
}

function normalizeGameState(parsed: Partial<GameSnapshot> | undefined): GameSnapshot | undefined {
  if (!parsed || parsed.version !== GAME_STATE_VERSION) {
    return undefined;
  }

  const initialState = createInitialGameState();
  const formation = normalizeTeamFormation(parsed.formation, parsed.team ?? initialState.team);

  return {
    ...initialState,
    ...parsed,
    ultraCores: parsed.ultraCores ?? initialState.ultraCores,
    chests: {
      ...initialState.chests,
      ...parsed.chests
    },
    skinInventory: {
      ...initialState.skinInventory,
      ...parsed.skinInventory,
      ownedSkinIds: parsed.skinInventory?.ownedSkinIds ?? []
    },
    roster: mergeRoster(parsed.roster),
    formation,
    team: getTeamIdsFromFormation(formation),
    event: {
      ...createInitialEventProgress(),
      ...parsed.event,
      drawHistory: parsed.event?.drawHistory?.slice(0, MAX_STORED_HISTORY) ?? [],
      coupons: parsed.event?.coupons ?? [],
      purchasedPackages: parsed.event?.purchasedPackages ?? {},
      luckyDiceRollHistory: parsed.event?.luckyDiceRollHistory?.slice(0, MAX_STORED_HISTORY) ?? [],
      exchangedDiceItems: parsed.event?.exchangedDiceItems ?? {}
    },
    gacha: {
      specialPity: parsed.gacha?.specialPity ?? 0,
      history: parsed.gacha?.history?.slice(0, MAX_STORED_HISTORY) ?? []
    },
    lastBattle: parsed.lastBattle
      ? {
          ...parsed.lastBattle,
          logs: parsed.lastBattle.logs.slice(0, MAX_STORED_BATTLE_LOGS)
        }
      : undefined
  };
}

function hasCharacterChanged(
  character: GameSnapshot['roster'][string],
  baseCharacter: GameSnapshot['roster'][string] | undefined
) {
  return !baseCharacter || JSON.stringify(character) !== JSON.stringify(baseCharacter);
}

function compactRoster(roster: GameSnapshot['roster']) {
  const baseRoster = createInitialGameState().roster;

  return Object.fromEntries(
    Object.entries(roster).filter(([characterId, character]) => hasCharacterChanged(character, baseRoster[characterId]))
  );
}

function compactGameState(state: GameSnapshot): GameSnapshot {
  const now = new Date();

  return {
    ...state,
    roster: compactRoster(state.roster),
    gacha: {
      ...state.gacha,
      history: state.gacha.history.slice(0, MAX_STORED_HISTORY)
    },
    event: {
      ...state.event,
      drawHistory: state.event.drawHistory.slice(0, MAX_STORED_HISTORY),
      coupons: state.event.coupons.filter((coupon) => !coupon.used && new Date(coupon.expiresAt) >= now),
      luckyDiceRollHistory: state.event.luckyDiceRollHistory.slice(0, MAX_STORED_HISTORY)
    },
    lastBattle: state.lastBattle
      ? {
          ...state.lastBattle,
          logs: state.lastBattle.logs.slice(0, MAX_STORED_BATTLE_LOGS)
        }
      : undefined
  };
}

function buildStorageEntries(state: GameSnapshot) {
  const compact = compactGameState(state);
  const partNames = Object.keys(STORAGE_PART_KEYS) as StoragePartName[];
  const manifest: StorageManifest = {
    app: 'heroes-tactics-arena',
    version: GAME_STATE_VERSION,
    schemaVersion: STORAGE_SCHEMA_VERSION,
    parts: partNames,
    updatedAt: new Date().toISOString()
  };

  return [
    [
      STORAGE_PART_KEYS.resources,
      JSON.stringify({
        coins: compact.coins,
        crystals: compact.crystals,
        levelPotions: compact.levelPotions,
        ultraCores: compact.ultraCores
      })
    ],
    [
      STORAGE_PART_KEYS.inventory,
      JSON.stringify({
        chests: compact.chests,
        skinInventory: compact.skinInventory
      })
    ],
    [STORAGE_PART_KEYS.roster, JSON.stringify({ roster: compact.roster })],
    [
      STORAGE_PART_KEYS.formation,
      JSON.stringify({
        formation: compact.formation,
        team: compact.team
      })
    ],
    [STORAGE_PART_KEYS.gacha, JSON.stringify({ gacha: compact.gacha })],
    [STORAGE_PART_KEYS.event, JSON.stringify({ event: compact.event })],
    [STORAGE_PART_KEYS.battle, JSON.stringify({ lastBattle: compact.lastBattle })],
    [STORAGE_MANIFEST_KEY, JSON.stringify(manifest)]
  ] as const;
}

function restoreStorageSnapshot(previousValues: Map<string, string | null>) {
  MANAGED_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  previousValues.forEach((value, key) => {
    if (value !== null) {
      localStorage.setItem(key, value);
    }
  });
}

function writeStorageEntries(entries: ReadonlyArray<readonly [string, string]>) {
  const previousValues = new Map(MANAGED_STORAGE_KEYS.map((key) => [key, localStorage.getItem(key)]));

  try {
    MANAGED_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    entries.forEach(([key, value]) => localStorage.setItem(key, value));
  } catch {
    restoreStorageSnapshot(previousValues);
  }
}

function loadSplitGameState() {
  const manifest = safeJsonParse<StorageManifest>(localStorage.getItem(STORAGE_MANIFEST_KEY));

  if (!manifest || manifest.version !== GAME_STATE_VERSION) {
    return undefined;
  }

  const resources = safeJsonParse<Partial<GameSnapshot>>(localStorage.getItem(STORAGE_PART_KEYS.resources));
  const inventory = safeJsonParse<Partial<GameSnapshot>>(localStorage.getItem(STORAGE_PART_KEYS.inventory));
  const roster = safeJsonParse<Pick<GameSnapshot, 'roster'>>(localStorage.getItem(STORAGE_PART_KEYS.roster));
  const formation = safeJsonParse<Pick<GameSnapshot, 'formation' | 'team'>>(localStorage.getItem(STORAGE_PART_KEYS.formation));
  const gacha = safeJsonParse<Pick<GameSnapshot, 'gacha'>>(localStorage.getItem(STORAGE_PART_KEYS.gacha));
  const event = safeJsonParse<Pick<GameSnapshot, 'event'>>(localStorage.getItem(STORAGE_PART_KEYS.event));
  const battle = safeJsonParse<Pick<GameSnapshot, 'lastBattle'>>(localStorage.getItem(STORAGE_PART_KEYS.battle));

  return normalizeGameState({
    version: manifest.version,
    ...resources,
    ...inventory,
    ...formation,
    roster: roster?.roster,
    gacha: gacha?.gacha,
    event: event?.event,
    lastBattle: battle?.lastBattle
  });
}

function loadLegacyGameState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = safeJsonParse<GameSnapshot>(raw);
  const state = normalizeGameState(parsed);

  return state ? { state } : undefined;
}

function encodeBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');

  return btoa(binary);
}

function decodeBase64(value: string) {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

function parseExportPayload(input: string): StoredGameSnapshot | undefined {
  const trimmed = input.trim();

  if (!trimmed) {
    return undefined;
  }

  const rawValue = trimmed.startsWith(SAVE_EXPORT_PREFIX)
    ? trimmed.slice(SAVE_EXPORT_PREFIX.length)
    : trimmed;
  const candidates = [trimmed, rawValue];

  try {
    candidates.push(decodeBase64(rawValue));
  } catch {
    // Plain JSON imports are supported as a fallback.
  }

  for (const candidate of candidates) {
    const parsed = safeJsonParse<ExportedSave | StoredGameSnapshot>(candidate);

    if (!parsed) {
      continue;
    }

    if ('state' in parsed && parsed.state) {
      return parsed.state;
    }

    if ('version' in parsed) {
      return parsed as StoredGameSnapshot;
    }
  }

  return undefined;
}

export function loadGameState(): GameSnapshot | undefined {
  if (typeof localStorage === 'undefined') {
    return undefined;
  }

  const splitState = loadSplitGameState();

  if (splitState) {
    return splitState;
  }

  const legacyState = loadLegacyGameState();

  if (!legacyState) {
    return undefined;
  }

  saveGameState(legacyState.state);
  return legacyState.state;
}

export function saveGameState(state: GameSnapshot) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  writeStorageEntries(buildStorageEntries(state));
}

export function clearGameState() {
  if (typeof localStorage === 'undefined') {
    return;
  }

  MANAGED_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function exportGameState(state: GameSnapshot) {
  const payload: ExportedSave = {
    app: 'heroes-tactics-arena',
    version: GAME_STATE_VERSION,
    exportedAt: new Date().toISOString(),
    state: compactGameState(state)
  };

  return `${SAVE_EXPORT_PREFIX}${encodeBase64(JSON.stringify(payload))}`;
}

export function importGameState(input: string) {
  return normalizeGameState(parseExportPayload(input));
}
