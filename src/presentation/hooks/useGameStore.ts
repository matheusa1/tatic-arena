import { create } from 'zustand';
import { message } from 'antd';
import { CHARACTER_CATALOG, CHARACTER_BY_ID, CHARACTER_SKIN_BY_ID, CHARACTER_SKIN_CATALOG } from '../../domain/entities/characters';
import {
  CharacterTemplate,
  MAX_CHARACTER_LEVEL,
  MAX_PET_LEVEL,
  MAX_SKILL_LEVEL,
  ULTRA_MAX_SKILL_LEVEL,
  ULTRA_SKILL_CORE_COST,
  MAX_WEAPON_LEVEL,
  PET_BY_ID,
  PlayerCharacter,
  Rarity,
  SkillSlot
} from '../../domain/entities/character';
import type { ChestOpenResult } from '../../domain/entities/chest';
import type { ChestType, RewardBundle } from '../../domain/entities/event';
import type { GameSnapshot } from '../../domain/entities/player';
import {
  FORMATION_TURN_ORDER,
  MAX_TEAM_MEMBERS,
  getFirstOpenFormationSlot,
  getFormationEntries,
  getTeamIdsFromFormation,
  isFormationSlot,
  normalizeTeamFormation
} from '../../domain/entities/formation';
import { BannerId, GachaPullCount, GachaResult } from '../../domain/entities/gacha';
import { BattleCharacterInput, BattleReport, BattleReward } from '../../domain/entities/battle';
import {
  clearGameState,
  createInitialGameState,
  exportGameState,
  importGameState,
  loadGameState,
  saveGameState
} from '../../data/repositories/localStorageRepository';
import {
  assignPet as assignRosterPet,
  applyFragments,
  ascendSkillToUltraMax,
  equipSkin as equipRosterSkin,
  getLevelUpCost,
  getPetAssignCost,
  getPetTrainingCost,
  getSkillUpgradeCost,
  getWeaponUpgradeCost,
  grantPetBond,
  levelUpCharacter as levelUpRosterCharacter,
  trainPet as trainRosterPet,
  unlockCharacter as unlockRosterCharacter,
  upgradeSkill as upgradeRosterSkill,
  upgradeWeapon as upgradeRosterWeapon
} from '../../domain/services/characterService';
import { runGacha } from '../../domain/services/gachaService';
import { openChest as openLootChest } from '../../domain/services/chestService';
import {
  claimMilestone,
  exchangeLuckyDiceShopItem,
  getAvailableCoupons,
  performFortuneDraw,
  purchaseEventPackage,
  rollLuckyDice as rollEventLuckyDice
} from '../../domain/services/eventService';
import { runAutoBattle } from '../../domain/services/battleService';
import { EVENT_PACKAGES, GACHA_BANNERS, LUCKY_DICE_CONFIG } from '../../shared/constants';
import { pickOne } from '../../shared/random';
import { describeReward, formatNumber } from '../../shared/formatters';

type ActionResponse = {
  ok: boolean;
  message: string;
};

type GachaActionResponse =
  | {
      ok: true;
      message: string;
      results: GachaResult[];
    }
  | {
      ok: false;
      message: string;
    };

type ChestActionResponse =
  | {
      ok: true;
      message: string;
      result: ChestOpenResult;
    }
  | {
      ok: false;
      message: string;
    };

type GameStore = GameSnapshot & {
  resetGame: () => void;
  toggleTeamMember: (characterId: string) => ActionResponse;
  assignTeamSlot: (slot: number, characterId?: string) => ActionResponse;
  unlockCharacter: (characterId: string) => ActionResponse;
  levelUpCharacter: (characterId: string) => ActionResponse;
  upgradeWeapon: (characterId: string) => ActionResponse;
  upgradeSkill: (characterId: string, slot: SkillSlot) => ActionResponse;
  assignPet: (characterId: string, petId: string) => ActionResponse;
  trainPet: (characterId: string) => ActionResponse;
  performGacha: (bannerId: BannerId, pulls: GachaPullCount) => GachaActionResponse;
  claimEventMilestone: (milestoneId: string) => ActionResponse;
  drawFortune: (paidWithCrystals: boolean) => ActionResponse;
  rollLuckyDice: (paidWithCrystals: boolean) => ActionResponse;
  exchangeLuckyDiceItem: (itemId: string) => ActionResponse;
  buyEventPackage: (packageId: string, couponId?: string) => ActionResponse;
  openChest: (chestType: ChestType) => ChestActionResponse;
  equipSkin: (characterId: string, skinId?: string) => ActionResponse;
  exportSave: () => string;
  importSave: (saveText: string) => ActionResponse;
  startBattle: () => ActionResponse;
  completeBattle: (report: BattleReport) => ActionResponse;
};

function toSnapshot(state: GameStore | GameSnapshot): GameSnapshot {
  return {
    version: state.version,
    coins: state.coins,
    crystals: state.crystals,
    levelPotions: state.levelPotions,
    ultraCores: state.ultraCores,
    chests: state.chests,
    skinInventory: state.skinInventory,
    roster: state.roster,
    formation: state.formation,
    team: state.team,
    gacha: state.gacha,
    event: state.event,
    lastBattle: state.lastBattle
  };
}

function persist(next: GameSnapshot) {
  saveGameState(toSnapshot(next));
  return next;
}

function withFormation(state: GameSnapshot, formation: ReturnType<typeof normalizeTeamFormation>): GameSnapshot {
  return {
    ...state,
    formation,
    team: getTeamIdsFromFormation(formation)
  };
}

function selectRewardCharacter(rarity: Rarity) {
  return pickOne(CHARACTER_CATALOG.filter((character) => character.rarity === rarity));
}

function applyReward(state: GameSnapshot, reward: RewardBundle): GameSnapshot {
  let roster = state.roster;
  const skinIds = reward.skins?.map((skin) => skin.skinId).filter((skinId) => CHARACTER_SKIN_BY_ID[skinId]) ?? [];

  reward.fragments?.forEach((fragmentReward) => {
    const target =
      (fragmentReward.characterId ? CHARACTER_BY_ID[fragmentReward.characterId] : undefined) ??
      selectRewardCharacter(fragmentReward.rarity);
    roster = applyFragments(roster, CHARACTER_CATALOG, target.id, fragmentReward.amount).roster;
  });

  return {
    ...state,
    coins: state.coins + (reward.coins ?? 0),
    crystals: state.crystals + (reward.crystals ?? 0),
    levelPotions: state.levelPotions + (reward.levelPotions ?? 0),
    ultraCores: state.ultraCores + (reward.ultraCores ?? 0),
    chests: {
      raro: state.chests.raro + (reward.chests?.raro ?? 0),
      épico: state.chests.épico + (reward.chests?.épico ?? 0),
      lendário: state.chests.lendário + (reward.chests?.lendário ?? 0)
    },
    skinInventory: {
      ownedSkinIds: Array.from(new Set([...state.skinInventory.ownedSkinIds, ...skinIds]))
    },
    roster,
    event: {
      ...state.event,
      coupons: [...state.event.coupons, ...(reward.coupons ?? [])]
    }
  };
}

function describeBattleReward(reward: BattleReward | undefined) {
  if (!reward) {
    return 'sem recompensa';
  }

  const parts = [
    `+${formatNumber(reward.coins)} moedas`,
    `+${formatNumber(reward.crystals)} cristais`,
    `+${formatNumber(reward.levelPotions)} pocoes`
  ];

  if (reward.ultraCores) {
    parts.push(`+${reward.ultraCores} Nucleo Ultra Lendario`);
  }

  return parts.join(' e ');
}

function getPlayableCharacter(state: GameSnapshot, characterId: string, formationSlot?: number): BattleCharacterInput | undefined {
  const template = CHARACTER_BY_ID[characterId] as CharacterTemplate | undefined;
  const player = state.roster[characterId] as PlayerCharacter | undefined;

  if (!template || !player || !player.unlocked) {
    return undefined;
  }

  return {
    id: template.id,
    name: template.name,
    rarity: template.rarity,
    element: template.element,
    class: template.class,
    level: player.level,
    stars: player.stars,
    baseStats: template.baseStats,
    weaponLevel: player.weaponLevel ?? 1,
    basicSkillLevel: player.basicSkillLevel ?? 1,
    specialSkillLevel: player.specialSkillLevel ?? 1,
    pet: player.pet,
    equippedSkinId: player.equippedSkinId,
    formationSlot
  };
}

function isBattleCharacterInput(character: BattleCharacterInput | undefined): character is BattleCharacterInput {
  return Boolean(character);
}

function generateEnemyTeam() {
  const candidates = CHARACTER_CATALOG.filter((character) => character.rarity === 'comum' || character.rarity === 'raro');

  return candidates.slice(3, 6).map((character, index) => ({
    id: character.id,
    name: `Eco de ${character.name}`,
    rarity: character.rarity,
    element: character.element,
    class: character.class,
    level: 1,
    stars: 1,
    baseStats: {
      health: Math.round(character.baseStats.health * 0.86),
      attack: Math.round(character.baseStats.attack * 0.86),
      defense: Math.round(character.baseStats.defense * 0.84),
      speed: Math.round(character.baseStats.speed * 0.92)
    },
    formationSlot: FORMATION_TURN_ORDER[index]
  }));
}

const initialState = loadGameState() ?? createInitialGameState();

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  resetGame: () => {
    const next = createInitialGameState();
    clearGameState();
    saveGameState(next);
    set(next);
  },

  exportSave: () => exportGameState(toSnapshot(get())),

  importSave: (saveText) => {
    const importedState = importGameState(saveText);

    if (!importedState) {
      return { ok: false, message: 'Save invalido ou incompatível.' };
    }

    const next = persist(importedState);
    set(next);

    return { ok: true, message: 'Save importado com sucesso.' };
  },

  toggleTeamMember: (characterId) => {
    const state = get();
    const character = state.roster[characterId];

    if (!character?.unlocked) {
      return { ok: false, message: 'Personagem bloqueado.' };
    }

    const formation = normalizeTeamFormation(state.formation, state.team);
    const selectedSlot = formation.findIndex((slotCharacterId) => slotCharacterId === characterId);
    const isSelected = selectedSlot >= 0;

    if (isSelected) {
      const team = getTeamIdsFromFormation(formation);

      if (team.length <= 1) {
        return { ok: false, message: 'Mantenha ao menos 1 personagem na equipe.' };
      }

      formation[selectedSlot] = null;
      const next = persist(withFormation(state, formation));
      set(next);
      return { ok: true, message: 'Personagem removido da equipe.' };
    }

    const openSlot = getFirstOpenFormationSlot(formation);

    if (openSlot === undefined || getTeamIdsFromFormation(formation).length >= MAX_TEAM_MEMBERS) {
      return { ok: false, message: 'A equipe pode ter no maximo 3 personagens.' };
    }

    formation[openSlot] = characterId;
    const next = persist(withFormation(state, formation));
    set(next);
    return { ok: true, message: 'Personagem adicionado a equipe.' };
  },

  assignTeamSlot: (slot, characterId) => {
    const state = get();

    if (!isFormationSlot(slot)) {
      return { ok: false, message: 'Posicao de formacao invalida.' };
    }

    const formation = normalizeTeamFormation(state.formation, state.team);

    if (!characterId) {
      if (!formation[slot]) {
        return { ok: false, message: 'Posicao ja esta vazia.' };
      }

      if (getTeamIdsFromFormation(formation).length <= 1) {
        return { ok: false, message: 'Mantenha ao menos 1 personagem na equipe.' };
      }

      formation[slot] = null;
      const next = persist(withFormation(state, formation));
      set(next);
      return { ok: true, message: 'Posicao liberada.' };
    }

    const character = state.roster[characterId];

    if (!character?.unlocked) {
      return { ok: false, message: 'Personagem bloqueado.' };
    }

    const currentSlot = formation.findIndex((slotCharacterId) => slotCharacterId === characterId);
    const targetCharacterId = formation[slot];
    const assignedCount = getTeamIdsFromFormation(formation).length;

    if (!formation[slot] && currentSlot < 0 && assignedCount >= MAX_TEAM_MEMBERS) {
      return { ok: false, message: 'A equipe pode ter no maximo 3 personagens.' };
    }

    if (currentSlot >= 0) {
      formation[currentSlot] = targetCharacterId;
    }

    formation[slot] = characterId;
    const next = persist(withFormation(state, formation));
    set(next);

    return { ok: true, message: 'Formacao atualizada.' };
  },

  unlockCharacter: (characterId) => {
    const state = get();
    const result = unlockRosterCharacter(state.roster, CHARACTER_CATALOG, characterId);

    if (!result.unlocked) {
      return { ok: false, message: 'Fragmentos insuficientes para desbloquear.' };
    }

    const next = persist({ ...state, roster: result.roster });
    set(next);
    return { ok: true, message: 'Personagem desbloqueado.' };
  },

  levelUpCharacter: (characterId) => {
    const state = get();
    const character = state.roster[characterId];

    if (!character?.unlocked) {
      return { ok: false, message: 'Personagem bloqueado.' };
    }

    if (character.level >= MAX_CHARACTER_LEVEL) {
      return { ok: false, message: 'Personagem ja esta no nivel maximo.' };
    }

    const cost = getLevelUpCost(character.level);

    if (state.levelPotions < cost) {
      return { ok: false, message: `Pocoes insuficientes. Necessario: ${cost}.` };
    }

    const result = levelUpRosterCharacter(state.roster, characterId, state.levelPotions);

    if (!result.leveled) {
      return { ok: false, message: 'Nao foi possivel subir o personagem.' };
    }

    const next = persist({
      ...state,
      levelPotions: state.levelPotions - result.potionsSpent,
      roster: result.roster
    });
    set(next);

    return { ok: true, message: `Personagem evoluiu para o nivel ${character.level + 1}.` };
  },

  upgradeWeapon: (characterId) => {
    const state = get();
    const character = state.roster[characterId];

    if (!character?.unlocked) {
      return { ok: false, message: 'Personagem bloqueado.' };
    }

    if (character.weaponLevel >= MAX_WEAPON_LEVEL) {
      return { ok: false, message: 'Arma ja esta no nivel maximo.' };
    }

    const cost = getWeaponUpgradeCost(character.weaponLevel);

    if (state.coins < cost) {
      return { ok: false, message: `Moedas insuficientes. Necessario: ${cost}.` };
    }

    const result = upgradeRosterWeapon(state.roster, characterId, state.coins);

    if (!result.upgraded) {
      return { ok: false, message: 'Nao foi possivel upar a arma.' };
    }

    const next = persist({
      ...state,
      coins: state.coins - result.coinsSpent,
      roster: result.roster
    });
    set(next);

    return { ok: true, message: `Arma evoluiu para o nivel ${character.weaponLevel + 1}.` };
  },

  upgradeSkill: (characterId, slot) => {
    const state = get();
    const character = state.roster[characterId];
    const currentLevel = slot === 'basic' ? character?.basicSkillLevel : character?.specialSkillLevel;

    if (!character?.unlocked || currentLevel === undefined) {
      return { ok: false, message: 'Personagem bloqueado.' };
    }

    if (currentLevel >= ULTRA_MAX_SKILL_LEVEL) {
      return { ok: false, message: 'Habilidade ja esta no ULTRA MAX.' };
    }

    if (currentLevel >= MAX_SKILL_LEVEL) {
      if (state.ultraCores < ULTRA_SKILL_CORE_COST) {
        return {
          ok: false,
          message: `Nucleo Ultra Lendario insuficiente. Necessario: ${ULTRA_SKILL_CORE_COST}.`
        };
      }

      const result = ascendSkillToUltraMax(state.roster, characterId, slot, state.ultraCores);

      if (!result.ascended) {
        return { ok: false, message: 'Nao foi possivel ascender a habilidade.' };
      }

      const next = persist({
        ...state,
        ultraCores: state.ultraCores - result.coresSpent,
        roster: result.roster
      });
      set(next);

      return {
        ok: true,
        message: `${slot === 'basic' ? 'Habilidade basica' : 'Habilidade especial'} ascendeu para ULTRA MAX.`
      };
    }

    const cost = getSkillUpgradeCost(currentLevel, slot);

    if (state.coins < cost) {
      return { ok: false, message: `Moedas insuficientes. Necessario: ${cost}.` };
    }

    const result = upgradeRosterSkill(state.roster, characterId, slot, state.coins);

    if (!result.upgraded) {
      return { ok: false, message: 'Nao foi possivel upar a habilidade.' };
    }

    const next = persist({
      ...state,
      coins: state.coins - result.coinsSpent,
      roster: result.roster
    });
    set(next);

    return {
      ok: true,
      message: `${slot === 'basic' ? 'Habilidade basica' : 'Habilidade especial'} evoluiu para o nivel ${currentLevel + 1}.`
    };
  },

  assignPet: (characterId, petId) => {
    const state = get();
    const character = state.roster[characterId];
    const pet = PET_BY_ID[petId];

    if (!character?.unlocked) {
      return { ok: false, message: 'Personagem bloqueado.' };
    }

    if (!pet) {
      return { ok: false, message: 'Pet desconhecido.' };
    }

    if (character.pet?.id === petId) {
      return { ok: false, message: 'Pet ja esta vinculado.' };
    }

    const cost = getPetAssignCost(character.pet, petId);

    if (state.coins < cost) {
      return { ok: false, message: `Moedas insuficientes. Necessario: ${cost}.` };
    }

    const result = assignRosterPet(state.roster, characterId, petId, state.coins);

    if (!result.assigned) {
      return { ok: false, message: 'Nao foi possivel vincular o pet.' };
    }

    const next = persist({
      ...state,
      coins: state.coins - result.coinsSpent,
      roster: result.roster
    });
    set(next);

    return { ok: true, message: `${pet.name} vinculado ao personagem.` };
  },

  trainPet: (characterId) => {
    const state = get();
    const character = state.roster[characterId];

    if (!character?.unlocked) {
      return { ok: false, message: 'Personagem bloqueado.' };
    }

    if (!character.pet) {
      return { ok: false, message: 'Vincule um pet antes de treinar.' };
    }

    if (character.pet.level >= MAX_PET_LEVEL) {
      return { ok: false, message: 'Pet ja esta no nivel maximo.' };
    }

    const cost = getPetTrainingCost(character.pet.level);

    if (state.coins < cost) {
      return { ok: false, message: `Moedas insuficientes. Necessario: ${cost}.` };
    }

    const result = trainRosterPet(state.roster, characterId, state.coins);

    if (!result.trained) {
      return { ok: false, message: 'Nao foi possivel treinar o pet.' };
    }

    const next = persist({
      ...state,
      coins: state.coins - result.coinsSpent,
      roster: result.roster
    });
    set(next);

    return { ok: true, message: `Pet treinado para o nivel ${character.pet.level + 1}.` };
  },

  performGacha: (bannerId, pulls) => {
    const state = get();
    const banner = GACHA_BANNERS[bannerId];
    const cost = banner.costPerPull * pulls;

    if (state.crystals < cost) {
      return { ok: false, message: 'Cristais insuficientes.' };
    }

    const gacha = runGacha({
      bannerId,
      pulls,
      progress: state.gacha,
      catalog: CHARACTER_CATALOG
    });

    let roster = state.roster;
    gacha.results.forEach((result) => {
      roster = applyFragments(roster, CHARACTER_CATALOG, result.characterId, result.fragments).roster;
    });

    const next = persist({
      ...state,
      crystals: state.crystals - gacha.crystalsSpent,
      roster,
      gacha: gacha.progress,
      event: {
        ...state.event,
        crystalsSpent: state.event.crystalsSpent + gacha.crystalsSpent
      }
    });
    set(next);

    return { ok: true, message: `${pulls} invocacao(oes) concluida(s).`, results: gacha.results };
  },

  claimEventMilestone: (milestoneId) => {
    const state = get();
    const claimed = claimMilestone(state.event, milestoneId);

    if (!claimed.claimed) {
      return { ok: false, message: 'Marco ainda nao liberado ou ja resgatado.' };
    }

    const withReward = applyReward({ ...state, event: claimed.progress }, claimed.reward);
    const next = persist(withReward);
    set(next);

    return { ok: true, message: `Recompensa resgatada: ${describeReward(claimed.reward)}.` };
  },

  drawFortune: (paidWithCrystals) => {
    const state = get();

    if (paidWithCrystals && state.crystals < 50) {
      return { ok: false, message: 'Cristais insuficientes.' };
    }

    const draw = performFortuneDraw(state.event, { paidWithCrystals });

    if (!draw.success || !draw.result) {
      return { ok: false, message: 'A tentativa gratis de hoje ja foi usada.' };
    }

    const next = persist(
      applyReward(
        {
          ...state,
          crystals: state.crystals - draw.crystalsSpent,
          event: draw.progress
        },
        draw.result.reward
      )
    );
    set(next);

    return { ok: true, message: `Sorteio concluido: ${draw.result.label}.` };
  },

  rollLuckyDice: (paidWithCrystals) => {
    const state = get();

    if (paidWithCrystals && state.crystals < LUCKY_DICE_CONFIG.paidRollCost) {
      return { ok: false, message: 'Cristais insuficientes.' };
    }

    const roll = rollEventLuckyDice(state.event, { paidWithCrystals });

    if (!roll.success || !roll.result) {
      return { ok: false, message: 'A rolagem gratis de hoje ja foi usada.' };
    }

    const next = persist(
      applyReward(
        {
          ...state,
          crystals: state.crystals - roll.crystalsSpent,
          event: roll.progress
        },
        roll.result.reward
      )
    );
    set(next);

    return {
      ok: true,
      message: `Dado rolou ${roll.result.face}: +${roll.result.points} pontos e ${describeReward(roll.result.reward)}.`
    };
  },

  exchangeLuckyDiceItem: (itemId) => {
    const state = get();

    try {
      const exchange = exchangeLuckyDiceShopItem(state.event, itemId);
      const alreadyOwnedSkin = exchange.reward.skins?.some((skin) =>
        state.skinInventory.ownedSkinIds.includes(skin.skinId)
      );

      if (alreadyOwnedSkin) {
        return { ok: false, message: 'Skin ja esta no inventario.' };
      }

      if (!exchange.exchanged) {
        return { ok: false, message: 'Pontos insuficientes ou limite de troca atingido.' };
      }

      const next = persist(
        applyReward(
          {
            ...state,
            event: exchange.progress
          },
          exchange.reward
        )
      );
      set(next);

      return { ok: true, message: `Troca concluida: ${describeReward(exchange.reward)}.` };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : 'Erro ao trocar item.' };
    }
  },

  buyEventPackage: (packageId, couponId) => {
    const state = get();
    const eventPackage = EVENT_PACKAGES.find((item) => item.id === packageId);

    if (!eventPackage) {
      return { ok: false, message: 'Pacote desconhecido.' };
    }

    const coupon = couponId ? getAvailableCoupons(state.event).find((item) => item.id === couponId) : undefined;
    const estimatedPrice = Math.ceil(eventPackage.baseCrystalPrice * (1 - (coupon?.discountPercent ?? 0) / 100));

    if (state.crystals < estimatedPrice) {
      return { ok: false, message: 'Cristais insuficientes.' };
    }

    try {
      const purchase = purchaseEventPackage(state.event, packageId, couponId);
      const next = persist(
        applyReward(
          {
            ...state,
            crystals: state.crystals - purchase.finalPrice,
            event: purchase.progress
          },
          purchase.reward
        )
      );
      set(next);

      return {
        ok: true,
        message:
          purchase.discountPercent > 0
            ? `Pacote comprado com ${purchase.discountPercent}% de desconto.`
            : 'Pacote comprado.'
      };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : 'Erro ao comprar pacote.' };
    }
  },

  openChest: (chestType) => {
    const state = get();
    const availableChests = state.chests[chestType] ?? 0;

    if (availableChests <= 0) {
      return { ok: false, message: 'Nenhum bau desse tipo disponivel.' };
    }

    const result = openLootChest({
      chestType,
      catalog: CHARACTER_CATALOG
    });
    const stateAfterCost: GameSnapshot = {
      ...state,
      chests: {
        ...state.chests,
        [chestType]: availableChests - 1
      }
    };
    const next = persist(applyReward(stateAfterCost, result.reward));
    set(next);

    return {
      ok: true,
      message: `Bau aberto: ${describeReward(result.reward)}.`,
      result
    };
  },

  equipSkin: (characterId, skinId) => {
    const state = get();
    const character = state.roster[characterId];

    if (!character?.unlocked) {
      return { ok: false, message: 'Personagem bloqueado.' };
    }

    const result = equipRosterSkin(
      state.roster,
      CHARACTER_SKIN_CATALOG,
      characterId,
      skinId,
      state.skinInventory.ownedSkinIds
    );

    if (!result.equipped) {
      return { ok: false, message: skinId ? 'Skin indisponivel para este personagem.' : 'Nenhuma skin equipada.' };
    }

    const next = persist({ ...state, roster: result.roster });
    set(next);

    const skin = skinId ? CHARACTER_SKIN_BY_ID[skinId] : undefined;

    return { ok: true, message: skin ? `${skin.name} equipada.` : 'Visual padrao equipado.' };
  },

  startBattle: () => {
    const state = get();
    const formationEntries = getFormationEntries(state.formation, state.team);
    const team = formationEntries.map((entry) => entry.characterId);
    const playerTeam = formationEntries
      .map((entry) => getPlayableCharacter(state, entry.characterId, entry.slot))
      .filter(isBattleCharacterInput);

    if (playerTeam.length === 0) {
      return { ok: false, message: 'Monte uma equipe antes de iniciar a batalha.' };
    }

    const report = runAutoBattle({
      playerTeam,
      enemyTeam: generateEnemyTeam()
    });
    const roster = report.winner === 'player' ? grantPetBond(state.roster, team, 3) : state.roster;

    const next = persist({
      ...state,
      coins: state.coins + (report.reward?.coins ?? 0),
      crystals: state.crystals + (report.reward?.crystals ?? 0),
      levelPotions: state.levelPotions + (report.reward?.levelPotions ?? 0),
      ultraCores: state.ultraCores + (report.reward?.ultraCores ?? 0),
      roster,
      team,
      lastBattle: report
    });
    set(next);

    return {
      ok: true,
      message:
        report.winner === 'player'
          ? `Vitoria: ${describeBattleReward(report.reward)}.`
          : 'Batalha concluida sem vitoria.'
    };
  },

  completeBattle: (report) => {
    const state = get();
    const team = getTeamIdsFromFormation(state.formation, state.team);

    if (state.lastBattle?.id === report.id) {
      return { ok: true, message: 'Batalha ja registrada.' };
    }

    const roster = report.winner === 'player' ? grantPetBond(state.roster, team, 3) : state.roster;

    const next = persist({
      ...state,
      coins: state.coins + (report.reward?.coins ?? 0),
      crystals: state.crystals + (report.reward?.crystals ?? 0),
      levelPotions: state.levelPotions + (report.reward?.levelPotions ?? 0),
      ultraCores: state.ultraCores + (report.reward?.ultraCores ?? 0),
      roster,
      team,
      lastBattle: report
    });
    set(next);

    return {
      ok: true,
      message:
        report.winner === 'player'
          ? `Vitoria: ${describeBattleReward(report.reward)}.`
          : report.winner === 'enemy'
            ? 'Derrota registrada.'
            : 'Empate registrado.'
    };
  }
}));

export function notifyAction(result: ActionResponse) {
  if (result.ok) {
    message.success(result.message);
  } else {
    message.warning(result.message);
  }
}
