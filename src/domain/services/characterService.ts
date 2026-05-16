import {
  CharacterPet,
  CharacterProfile,
  CharacterProgression,
  CharacterSkinTemplate,
  CharacterTemplate,
  FRAGMENTS_REQUIRED_BY_RARITY,
  MAX_CHARACTER_LEVEL,
  MAX_PET_BOND,
  MAX_PET_LEVEL,
  MAX_SKILL_LEVEL,
  MAX_WEAPON_LEVEL,
  PET_BY_ID,
  PlayerCharacter,
  Rarity,
  SkillSlot,
  StatBlock,
  ULTRA_MAX_SKILL_EFFECT_MULTIPLIER,
  ULTRA_MAX_SKILL_LEVEL,
  ULTRA_MAX_SKILL_STAT_BONUS,
  ULTRA_SKILL_CORE_COST
} from '../entities/character';

export function getRequiredFragments(rarity: Rarity) {
  return FRAGMENTS_REQUIRED_BY_RARITY[rarity];
}

export function createInitialRoster(
  catalog: CharacterTemplate[],
  initialCharacterIds: string[]
): Record<string, PlayerCharacter> {
  return Object.fromEntries(
    catalog.map((character) => [
      character.id,
      {
        id: character.id,
        level: 1,
        stars: 1,
        unlocked: initialCharacterIds.includes(character.id),
        fragments: 0,
        weaponLevel: 1,
        basicSkillLevel: 1,
        specialSkillLevel: 1
      }
    ])
  );
}

export function mergeCharacterProfile(
  template: CharacterTemplate,
  playerCharacter: PlayerCharacter
): CharacterProfile {
  return {
    ...template,
    ...playerCharacter
  };
}

export function buildCharacterProfiles(
  catalog: CharacterTemplate[],
  roster: Record<string, PlayerCharacter>
) {
  return catalog.map((template) => mergeCharacterProfile(template, roster[template.id]));
}

export function applyFragments(
  roster: Record<string, PlayerCharacter>,
  catalog: CharacterTemplate[],
  characterId: string,
  amount: number
) {
  const template = catalog.find((character) => character.id === characterId);
  const current = roster[characterId];

  if (!template || !current) {
    throw new Error(`Unknown character: ${characterId}`);
  }

  const nextCharacter: PlayerCharacter = {
    ...current,
    fragments: current.fragments + amount
  };

  const unlockedNow = !current.unlocked && nextCharacter.fragments >= template.requiredFragments;

  if (unlockedNow) {
    nextCharacter.unlocked = true;
  }

  return {
    roster: {
      ...roster,
      [characterId]: nextCharacter
    },
    unlockedNow
  };
}

export function canUnlockCharacter(
  roster: Record<string, PlayerCharacter>,
  catalog: CharacterTemplate[],
  characterId: string
) {
  const template = catalog.find((character) => character.id === characterId);
  const current = roster[characterId];

  return Boolean(template && current && !current.unlocked && current.fragments >= template.requiredFragments);
}

export function unlockCharacter(
  roster: Record<string, PlayerCharacter>,
  catalog: CharacterTemplate[],
  characterId: string
) {
  if (!canUnlockCharacter(roster, catalog, characterId)) {
    return { roster, unlocked: false };
  }

  return {
    roster: {
      ...roster,
      [characterId]: {
        ...roster[characterId],
        unlocked: true
      }
    },
    unlocked: true
  };
}

export function getLevelUpCost(level: number) {
  return Math.max(1, Math.min(MAX_CHARACTER_LEVEL - 1, level));
}

export function getWeaponUpgradeCost(level: number) {
  const safeLevel = Math.max(1, Math.min(MAX_WEAPON_LEVEL - 1, level));
  return Math.round(160 * safeLevel * (1 + safeLevel * 0.08));
}

export function getSkillUpgradeCost(level: number, slot: SkillSlot) {
  const safeLevel = Math.max(1, Math.min(MAX_SKILL_LEVEL - 1, level));
  const baseCost = slot === 'special' ? 210 : 140;

  return Math.round(baseCost * safeLevel * (1 + safeLevel * 0.06));
}

export function getPetAssignCost(currentPet: CharacterPet | undefined, petId: string) {
  if (currentPet?.id === petId) {
    return 0;
  }

  return currentPet ? 120 : 350;
}

export function getPetTrainingCost(level: number) {
  const safeLevel = Math.max(1, Math.min(MAX_PET_LEVEL - 1, level));
  return Math.round(145 * safeLevel * (1 + safeLevel * 0.07));
}

export function canUpgradeWeapon(
  roster: Record<string, PlayerCharacter>,
  characterId: string,
  availableCoins: number
) {
  const current = roster[characterId];

  return Boolean(
    current?.unlocked &&
      current.weaponLevel < MAX_WEAPON_LEVEL &&
      availableCoins >= getWeaponUpgradeCost(current.weaponLevel)
  );
}

export function upgradeWeapon(
  roster: Record<string, PlayerCharacter>,
  characterId: string,
  availableCoins: number
) {
  const current = roster[characterId];

  if (!current?.unlocked || current.weaponLevel >= MAX_WEAPON_LEVEL) {
    return { roster, upgraded: false, coinsSpent: 0 };
  }

  const coinsSpent = getWeaponUpgradeCost(current.weaponLevel);

  if (availableCoins < coinsSpent) {
    return { roster, upgraded: false, coinsSpent: 0 };
  }

  return {
    roster: {
      ...roster,
      [characterId]: {
        ...current,
        weaponLevel: current.weaponLevel + 1
      }
    },
    upgraded: true,
    coinsSpent
  };
}

export function canUpgradeSkill(
  roster: Record<string, PlayerCharacter>,
  characterId: string,
  slot: SkillSlot,
  availableCoins: number
) {
  const current = roster[characterId];
  const currentLevel = slot === 'basic' ? current?.basicSkillLevel : current?.specialSkillLevel;

  return Boolean(
    current?.unlocked &&
      currentLevel !== undefined &&
      currentLevel < MAX_SKILL_LEVEL &&
      availableCoins >= getSkillUpgradeCost(currentLevel, slot)
  );
}

export function canAscendSkillToUltraMax(
  roster: Record<string, PlayerCharacter>,
  characterId: string,
  slot: SkillSlot,
  availableUltraCores: number
) {
  const current = roster[characterId];
  const currentLevel = slot === 'basic' ? current?.basicSkillLevel : current?.specialSkillLevel;

  return Boolean(
    current?.unlocked &&
      currentLevel === MAX_SKILL_LEVEL &&
      availableUltraCores >= ULTRA_SKILL_CORE_COST
  );
}

export function upgradeSkill(
  roster: Record<string, PlayerCharacter>,
  characterId: string,
  slot: SkillSlot,
  availableCoins: number
) {
  const current = roster[characterId];
  const currentLevel = slot === 'basic' ? current?.basicSkillLevel : current?.specialSkillLevel;

  if (!current?.unlocked || currentLevel === undefined || currentLevel >= MAX_SKILL_LEVEL) {
    return { roster, upgraded: false, coinsSpent: 0 };
  }

  const coinsSpent = getSkillUpgradeCost(currentLevel, slot);

  if (availableCoins < coinsSpent) {
    return { roster, upgraded: false, coinsSpent: 0 };
  }

  return {
    roster: {
      ...roster,
      [characterId]: {
        ...current,
        [slot === 'basic' ? 'basicSkillLevel' : 'specialSkillLevel']: currentLevel + 1
      }
    },
    upgraded: true,
    coinsSpent
  };
}

export function ascendSkillToUltraMax(
  roster: Record<string, PlayerCharacter>,
  characterId: string,
  slot: SkillSlot,
  availableUltraCores: number
) {
  const current = roster[characterId];
  const currentLevel = slot === 'basic' ? current?.basicSkillLevel : current?.specialSkillLevel;

  if (!current?.unlocked || currentLevel !== MAX_SKILL_LEVEL || availableUltraCores < ULTRA_SKILL_CORE_COST) {
    return { roster, ascended: false, coresSpent: 0 };
  }

  return {
    roster: {
      ...roster,
      [characterId]: {
        ...current,
        [slot === 'basic' ? 'basicSkillLevel' : 'specialSkillLevel']: ULTRA_MAX_SKILL_LEVEL
      }
    },
    ascended: true,
    coresSpent: ULTRA_SKILL_CORE_COST
  };
}

export function canAssignPet(
  roster: Record<string, PlayerCharacter>,
  characterId: string,
  petId: string,
  availableCoins: number
) {
  const current = roster[characterId];
  const pet = PET_BY_ID[petId];

  return Boolean(
    current?.unlocked &&
      pet &&
      current.pet?.id !== petId &&
      availableCoins >= getPetAssignCost(current.pet, petId)
  );
}

export function canEquipSkin(
  roster: Record<string, PlayerCharacter>,
  skinCatalog: CharacterSkinTemplate[],
  characterId: string,
  skinId: string | undefined,
  ownedSkinIds: string[]
) {
  const current = roster[characterId];

  if (!current?.unlocked) {
    return false;
  }

  if (!skinId) {
    return Boolean(current.equippedSkinId);
  }

  const skin = skinCatalog.find((item) => item.id === skinId);

  return Boolean(skin && skin.characterId === characterId && ownedSkinIds.includes(skinId));
}

export function equipSkin(
  roster: Record<string, PlayerCharacter>,
  skinCatalog: CharacterSkinTemplate[],
  characterId: string,
  skinId: string | undefined,
  ownedSkinIds: string[]
) {
  if (!canEquipSkin(roster, skinCatalog, characterId, skinId, ownedSkinIds)) {
    return { roster, equipped: false };
  }

  const current = roster[characterId];

  return {
    equipped: true,
    roster: {
      ...roster,
      [characterId]: {
        ...current,
        equippedSkinId: skinId
      }
    }
  };
}

export function assignPet(
  roster: Record<string, PlayerCharacter>,
  characterId: string,
  petId: string,
  availableCoins: number
) {
  const current = roster[characterId];
  const pet = PET_BY_ID[petId];

  if (!current?.unlocked || !pet || current.pet?.id === petId) {
    return { roster, assigned: false, coinsSpent: 0 };
  }

  const coinsSpent = getPetAssignCost(current.pet, petId);

  if (availableCoins < coinsSpent) {
    return { roster, assigned: false, coinsSpent: 0 };
  }

  return {
    roster: {
      ...roster,
      [characterId]: {
        ...current,
        pet: {
          id: petId,
          level: current.pet?.level ?? 1,
          bond: current.pet?.bond ?? 1
        }
      }
    },
    assigned: true,
    coinsSpent
  };
}

export function canTrainPet(
  roster: Record<string, PlayerCharacter>,
  characterId: string,
  availableCoins: number
) {
  const current = roster[characterId];

  return Boolean(
    current?.unlocked &&
      current.pet &&
      current.pet.level < MAX_PET_LEVEL &&
      availableCoins >= getPetTrainingCost(current.pet.level)
  );
}

export function trainPet(
  roster: Record<string, PlayerCharacter>,
  characterId: string,
  availableCoins: number
) {
  const current = roster[characterId];

  if (!current?.unlocked || !current.pet || current.pet.level >= MAX_PET_LEVEL) {
    return { roster, trained: false, coinsSpent: 0 };
  }

  const coinsSpent = getPetTrainingCost(current.pet.level);

  if (availableCoins < coinsSpent) {
    return { roster, trained: false, coinsSpent: 0 };
  }

  return {
    roster: {
      ...roster,
      [characterId]: {
        ...current,
        pet: {
          ...current.pet,
          level: current.pet.level + 1,
          bond: Math.min(MAX_PET_BOND, current.pet.bond + 4)
        }
      }
    },
    trained: true,
    coinsSpent
  };
}

export function grantPetBond(
  roster: Record<string, PlayerCharacter>,
  characterIds: string[],
  amount: number
) {
  const uniqueIds = Array.from(new Set(characterIds));

  return uniqueIds.reduce((nextRoster, characterId) => {
    const current = nextRoster[characterId];

    if (!current?.pet) {
      return nextRoster;
    }

    return {
      ...nextRoster,
      [characterId]: {
        ...current,
        pet: {
          ...current.pet,
          bond: Math.min(MAX_PET_BOND, current.pet.bond + amount)
        }
      }
    };
  }, roster);
}

export function getSkillEffectMultiplier(level: number) {
  if (level >= ULTRA_MAX_SKILL_LEVEL) {
    return ULTRA_MAX_SKILL_EFFECT_MULTIPLIER;
  }

  return 1 + Math.max(0, Math.min(MAX_SKILL_LEVEL, level) - 1) * 0.06;
}

export function canLevelUpCharacter(
  roster: Record<string, PlayerCharacter>,
  characterId: string,
  availablePotions: number
) {
  const current = roster[characterId];

  return Boolean(
    current?.unlocked &&
      current.level < MAX_CHARACTER_LEVEL &&
      availablePotions >= getLevelUpCost(current.level)
  );
}

export function levelUpCharacter(
  roster: Record<string, PlayerCharacter>,
  characterId: string,
  availablePotions: number
) {
  const current = roster[characterId];

  if (!current?.unlocked || current.level >= MAX_CHARACTER_LEVEL) {
    return { roster, leveled: false, potionsSpent: 0 };
  }

  const potionsSpent = getLevelUpCost(current.level);

  if (availablePotions < potionsSpent) {
    return { roster, leveled: false, potionsSpent: 0 };
  }

  return {
    roster: {
      ...roster,
      [characterId]: {
        ...current,
        level: current.level + 1
      }
    },
    leveled: true,
    potionsSpent
  };
}

function getPetEffectiveLevel(pet: CharacterPet | undefined) {
  if (!pet || !PET_BY_ID[pet.id]) {
    return 0;
  }

  return Math.min(MAX_PET_LEVEL + 5, pet.level + Math.floor(Math.max(0, pet.bond - 1) / 20));
}

function getPetStatMultiplier(pet: CharacterPet | undefined, stat: keyof StatBlock) {
  const template = pet ? PET_BY_ID[pet.id] : undefined;

  if (!template) {
    return 1;
  }

  return 1 + (template.statGrowth[stat] ?? 0) * getPetEffectiveLevel(pet);
}

export function getUltraMaxSkillCount(progression: CharacterProgression | undefined) {
  if (!progression) {
    return 0;
  }

  return [progression.basicSkillLevel, progression.specialSkillLevel].filter(
    (level) => level >= ULTRA_MAX_SKILL_LEVEL
  ).length;
}

function getUltraSkillStatMultiplier(progression: CharacterProgression | undefined) {
  return 1 + getUltraMaxSkillCount(progression) * ULTRA_MAX_SKILL_STAT_BONUS;
}

export function scaleStats(
  baseStats: StatBlock,
  level: number,
  stars: number,
  progression?: CharacterProgression
): StatBlock {
  const levelMultiplier = 1 + Math.max(0, level - 1) * 0.045;
  const starMultiplier = 1 + Math.max(0, stars - 1) * 0.11;
  const multiplier = levelMultiplier * starMultiplier;
  const weaponLevel = Math.max(1, progression?.weaponLevel ?? 1);
  const weaponAttackMultiplier = 1 + (weaponLevel - 1) * 0.035;
  const weaponDefenseMultiplier = 1 + (weaponLevel - 1) * 0.006;
  const weaponSpeedMultiplier = 1 + (weaponLevel - 1) * 0.002;
  const ultraSkillStatMultiplier = getUltraSkillStatMultiplier(progression);

  return {
    health: Math.round(
      baseStats.health * multiplier * ultraSkillStatMultiplier * getPetStatMultiplier(progression?.pet, 'health')
    ),
    attack: Math.round(
      baseStats.attack *
        multiplier *
        weaponAttackMultiplier *
        ultraSkillStatMultiplier *
        getPetStatMultiplier(progression?.pet, 'attack')
    ),
    defense: Math.round(
      baseStats.defense *
        multiplier *
        weaponDefenseMultiplier *
        ultraSkillStatMultiplier *
        getPetStatMultiplier(progression?.pet, 'defense')
    ),
    speed: Math.round(
      baseStats.speed *
        (1 + Math.max(0, stars - 1) * 0.035) *
        weaponSpeedMultiplier *
        ultraSkillStatMultiplier *
        getPetStatMultiplier(progression?.pet, 'speed')
    )
  };
}

export function getCharacterPower(character: CharacterProfile) {
  const stats = scaleStats(character.baseStats, character.level, character.stars, character);
  const skillPower = (character.basicSkillLevel + character.specialSkillLevel - 2) * 18;

  return Math.round(stats.health / 8 + stats.attack * 4.5 + stats.defense * 3 + stats.speed * 2.2 + skillPower);
}
