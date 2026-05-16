import type { BattleCharacterInput, BattleReward } from './battle';

export const ULTRA_BOSS_DROP_NAME = 'Nucleo Ultra Lendario';

export const ULTRA_BOSS: BattleCharacterInput = {
  id: 'erebus-prime-ultra',
  name: 'Erebus Prime',
  rarity: 'lendário',
  element: 'sombra',
  class: 'controlador',
  level: 30,
  stars: 6,
  baseStats: {
    health: 4200,
    attack: 210,
    defense: 130,
    speed: 128
  },
  weaponLevel: 20,
  basicSkillLevel: 10,
  specialSkillLevel: 10
};

export const ULTRA_BOSS_REWARD: BattleReward = {
  coins: 32000,
  crystals: 750,
  levelPotions: 50,
  ultraCores: 1
};

export function createUltraBossEnemyTeam(): BattleCharacterInput[] {
  return [ULTRA_BOSS];
}
