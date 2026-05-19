import type { BattleCharacterInput, BattleReward, MinionRole } from './battle';
import { FORMATION_TURN_ORDER } from './formation';

export const ULTRA_BOSS_DROP_NAME = 'Nucleo Ultra Lendario';
export const MAX_SUMMONED_MINIONS = 3;

export const ULTRA_BOSS: BattleCharacterInput = {
  id: 'erebus-prime-ultra',
  name: 'Erebus Prime',
  rarity: 'lendário',
  element: 'sombra',
  class: 'invocador',
  level: 30,
  stars: 6,
  baseStats: {
    health: 7600,
    attack: 92,
    defense: 170,
    speed: 114
  },
  weaponLevel: 20,
  basicSkillLevel: 10,
  specialSkillLevel: 10,
  formationSlot: FORMATION_TURN_ORDER[8],
  combatRole: 'boss'
};

export const ULTRA_BOSS_MINIONS: BattleCharacterInput[] = [
  {
    id: 'erebus-vanguard-tanker',
    name: 'Vanguarda Vinculada',
    rarity: 'épico',
    element: 'terra',
    class: 'defensor',
    level: 30,
    stars: 6,
    baseStats: {
      health: 1350,
      attack: 112,
      defense: 118,
      speed: 96
    },
    weaponLevel: 14,
    basicSkillLevel: 8,
    specialSkillLevel: 1,
    formationSlot: FORMATION_TURN_ORDER[0],
    occupiesSlot: false,
    combatRole: 'minion',
    minionRole: 'tanker',
    summonedById: ULTRA_BOSS.id,
    basicOnly: true
  },
  {
    id: 'erebus-vanguard-dps',
    name: 'Lamina Vinculada',
    rarity: 'épico',
    element: 'fogo',
    class: 'atacante',
    level: 30,
    stars: 6,
    baseStats: {
      health: 950,
      attack: 175,
      defense: 68,
      speed: 116
    },
    weaponLevel: 14,
    basicSkillLevel: 8,
    specialSkillLevel: 1,
    formationSlot: FORMATION_TURN_ORDER[1],
    occupiesSlot: false,
    combatRole: 'minion',
    minionRole: 'dps',
    summonedById: ULTRA_BOSS.id,
    basicOnly: true
  },
  {
    id: 'erebus-vanguard-control',
    name: 'Elo Vinculado',
    rarity: 'épico',
    element: 'sombra',
    class: 'controlador',
    level: 30,
    stars: 6,
    baseStats: {
      health: 880,
      attack: 128,
      defense: 70,
      speed: 126
    },
    weaponLevel: 14,
    basicSkillLevel: 8,
    specialSkillLevel: 1,
    formationSlot: FORMATION_TURN_ORDER[2],
    occupiesSlot: false,
    combatRole: 'minion',
    minionRole: 'controlador',
    summonedById: ULTRA_BOSS.id,
    basicOnly: true
  }
];

export const MINION_ROLE_LABEL: Record<MinionRole, string> = {
  tanker: 'Tanker',
  dps: 'DPS',
  controlador: 'Controlador',
  navio: 'Navio',
  couracado: 'Couracado'
};

export const ULTRA_BOSS_REWARD: BattleReward = {
  coins: 32000,
  crystals: 750,
  levelPotions: 50,
  ultraCores: 1
};

export function createUltraBossEnemyTeam(): BattleCharacterInput[] {
  return [...ULTRA_BOSS_MINIONS.slice(0, MAX_SUMMONED_MINIONS), ULTRA_BOSS];
}
