export const FORMATION_GRID_SIZE = 3;
export const FORMATION_SLOT_COUNT = FORMATION_GRID_SIZE * FORMATION_GRID_SIZE;
export const MAX_TEAM_MEMBERS = 3;

export type TeamFormation = Array<string | null>;

export type FormationEntry = {
  slot: number;
  characterId: string;
  turn: number;
};

export const FORMATION_TURN_ORDER = [2, 5, 8, 1, 4, 7, 0, 3, 6] as const;

export function isFormationSlot(slot: number) {
  return Number.isInteger(slot) && slot >= 0 && slot < FORMATION_SLOT_COUNT;
}

export function getFormationSlotTurnRank(slot: number) {
  const rank = FORMATION_TURN_ORDER.indexOf(slot as (typeof FORMATION_TURN_ORDER)[number]);
  return rank >= 0 ? rank : Number.MAX_SAFE_INTEGER;
}

export function getFormationSlotCoordinates(slot: number) {
  return {
    row: Math.floor(slot / FORMATION_GRID_SIZE),
    column: slot % FORMATION_GRID_SIZE
  };
}

export function getDefaultFormationSlot(index: number) {
  return FORMATION_TURN_ORDER[index] ?? FORMATION_TURN_ORDER[FORMATION_TURN_ORDER.length - 1];
}

export function createEmptyTeamFormation(): TeamFormation {
  return Array.from({ length: FORMATION_SLOT_COUNT }, () => null);
}

export function createDefaultTeamFormation(characterIds: string[]): TeamFormation {
  const formation = createEmptyTeamFormation();

  characterIds.slice(0, MAX_TEAM_MEMBERS).forEach((characterId, index) => {
    formation[getDefaultFormationSlot(index)] = characterId;
  });

  return formation;
}

export function normalizeTeamFormation(
  formation: Array<string | null | undefined> | undefined,
  fallbackTeam: string[] = []
): TeamFormation {
  const hasSavedFormation = Boolean(formation?.some((characterId) => typeof characterId === 'string' && characterId));

  if (!hasSavedFormation) {
    return createDefaultTeamFormation(fallbackTeam);
  }

  const next = createEmptyTeamFormation();
  const usedCharacterIds = new Set<string>();

  FORMATION_TURN_ORDER.forEach((slot) => {
    const characterId = formation?.[slot];

    if (typeof characterId !== 'string' || !characterId || usedCharacterIds.has(characterId)) {
      return;
    }

    if (usedCharacterIds.size >= MAX_TEAM_MEMBERS) {
      return;
    }

    next[slot] = characterId;
    usedCharacterIds.add(characterId);
  });

  return next;
}

export function getFormationEntries(
  formation: Array<string | null | undefined> | undefined,
  fallbackTeam: string[] = []
): FormationEntry[] {
  const normalizedFormation = normalizeTeamFormation(formation, fallbackTeam);

  return FORMATION_TURN_ORDER.flatMap((slot, index) => {
    const characterId = normalizedFormation[slot];

    return characterId ? [{ slot, characterId, turn: index + 1 }] : [];
  });
}

export function getTeamIdsFromFormation(
  formation: Array<string | null | undefined> | undefined,
  fallbackTeam: string[] = []
) {
  return getFormationEntries(formation, fallbackTeam).map((entry) => entry.characterId);
}

export function findFormationSlotByCharacterId(
  formation: Array<string | null | undefined> | undefined,
  characterId: string
) {
  return normalizeTeamFormation(formation).findIndex((slotCharacterId) => slotCharacterId === characterId);
}

export function getFirstOpenFormationSlot(formation: Array<string | null | undefined> | undefined) {
  const normalizedFormation = normalizeTeamFormation(formation);
  return FORMATION_TURN_ORDER.find((slot) => !normalizedFormation[slot]);
}
