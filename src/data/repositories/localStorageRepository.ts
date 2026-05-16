import {
  CHARACTER_CATALOG,
  INITIAL_CHARACTER_IDS,
} from "../../domain/entities/characters";
import { GameSnapshot } from "../../domain/entities/player";
import {
  createDefaultTeamFormation,
  getTeamIdsFromFormation,
  normalizeTeamFormation,
} from "../../domain/entities/formation";
import { createInitialRoster } from "../../domain/services/characterService";
import { createInitialEventProgress } from "../../domain/services/eventService";
import { GAME_STATE_VERSION, STORAGE_KEY } from "../../shared/constants";

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
      lendário: 0,
    },
    skinInventory: {
      ownedSkinIds: [],
    },
    roster: createInitialRoster(CHARACTER_CATALOG, INITIAL_CHARACTER_IDS),
    formation,
    team: getTeamIdsFromFormation(formation),
    gacha: {
      specialPity: 0,
      history: [],
    },
    event: createInitialEventProgress(),
  };
}

function mergeRoster(savedRoster: GameSnapshot["roster"] | undefined) {
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
          basicSkillLevel:
            savedCharacter?.basicSkillLevel ?? baseCharacter.basicSkillLevel,
          specialSkillLevel:
            savedCharacter?.specialSkillLevel ??
            baseCharacter.specialSkillLevel,
          equippedSkinId: savedCharacter?.equippedSkinId,
          pet: savedCharacter?.pet
            ? {
                id: savedCharacter.pet.id,
                level: savedCharacter.pet.level ?? 1,
                bond: savedCharacter.pet.bond ?? 1,
              }
            : undefined,
        },
      ];
    }),
  );
}

export function loadGameState(): GameSnapshot | undefined {
  if (typeof localStorage === "undefined") {
    return undefined;
  }

  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw) as GameSnapshot;

    if (parsed.version !== GAME_STATE_VERSION) {
      return undefined;
    }
    const initialState = createInitialGameState();
    const formation = normalizeTeamFormation(
      parsed.formation,
      parsed.team ?? initialState.team,
    );

    return {
      ...initialState,
      ...parsed,
      ultraCores: parsed.ultraCores ?? initialState.ultraCores,
      chests: {
        ...initialState.chests,
        ...parsed.chests,
      },
      skinInventory: {
        ...initialState.skinInventory,
        ...parsed.skinInventory,
        ownedSkinIds: parsed.skinInventory?.ownedSkinIds ?? [],
      },
      roster: mergeRoster(parsed.roster),
      formation,
      team: getTeamIdsFromFormation(formation),
      event: {
        ...createInitialEventProgress(),
        ...parsed.event,
        purchasedPackages: parsed.event?.purchasedPackages ?? {},
        luckyDiceRollHistory: parsed.event?.luckyDiceRollHistory ?? [],
        exchangedDiceItems: parsed.event?.exchangedDiceItems ?? {},
      },
      gacha: {
        specialPity: parsed.gacha?.specialPity ?? 0,
        history: parsed.gacha?.history ?? [],
      },
    };
  } catch {
    return undefined;
  }
}

export function saveGameState(state: GameSnapshot) {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearGameState() {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
}
