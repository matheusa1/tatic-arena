import { CharacterClass, CharacterPet, ElementType, Rarity, StatBlock } from './character';

export type BattleTeam = 'player' | 'enemy';
export type BattleEncounterType = 'standard' | 'ultra-boss';
export type CombatantRole = 'boss' | 'minion';
export type MinionRole = 'tanker' | 'dps' | 'controlador' | 'navio' | 'couracado';

export type Combatant = {
  instanceId: string;
  characterId: string;
  name: string;
  rarity: Rarity;
  element: ElementType;
  class: CharacterClass;
  team: BattleTeam;
  maxHealth: number;
  currentHealth: number;
  attack: number;
  defense: number;
  speed: number;
  weaponLevel: number;
  basicSkillLevel: number;
  specialSkillLevel: number;
  pet?: CharacterPet;
  equippedSkinId?: string;
  formationSlot: number;
  turnPosition: number;
  occupiesSlot: boolean;
  actionCount: number;
  defenseBuffTurns: number;
  skipTurns: number;
  combatRole?: CombatantRole;
  minionRole?: MinionRole;
  summonedById?: string;
  basicOnly?: boolean;
};

export type BattleReward = {
  coins: number;
  crystals: number;
  levelPotions: number;
  ultraCores?: number;
};

export type BattleActionType = 'basic' | 'special' | 'guard';

export type InteractiveBattleState = {
  id: string;
  encounterType: BattleEncounterType;
  createdAt: string;
  status: 'active' | 'finished';
  winner?: BattleTeam | 'draw';
  turns: number;
  logs: string[];
  playerTeam: Combatant[];
  enemyTeam: Combatant[];
  turnPosition: number;
  turnQueue: string[];
  reward?: BattleReward;
};

export type BattleReport = {
  id: string;
  encounterType?: BattleEncounterType;
  createdAt: string;
  winner: BattleTeam | 'draw';
  turns: number;
  logs: string[];
  playerTeam: Combatant[];
  enemyTeam: Combatant[];
  reward?: BattleReward;
};

export type BattleCharacterInput = {
  id: string;
  name: string;
  rarity: Rarity;
  element: ElementType;
  class: CharacterClass;
  level: number;
  stars: number;
  baseStats: StatBlock;
  weaponLevel?: number;
  basicSkillLevel?: number;
  specialSkillLevel?: number;
  pet?: CharacterPet;
  equippedSkinId?: string;
  formationSlot?: number;
  occupiesSlot?: boolean;
  combatRole?: CombatantRole;
  minionRole?: MinionRole;
  summonedById?: string;
  basicOnly?: boolean;
};
