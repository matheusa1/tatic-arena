import { BattleReport } from './battle';
import { PlayerCharacter } from './character';
import { EventProgress } from './event';
import { TeamFormation } from './formation';
import { GachaProgress } from './gacha';

export type ChestInventory = {
  raro: number;
  épico: number;
  lendário: number;
};

export type SkinInventory = {
  ownedSkinIds: string[];
};

export type GameSnapshot = {
  version: number;
  coins: number;
  crystals: number;
  levelPotions: number;
  ultraCores: number;
  chests: ChestInventory;
  skinInventory: SkinInventory;
  roster: Record<string, PlayerCharacter>;
  formation: TeamFormation;
  team: string[];
  gacha: GachaProgress;
  event: EventProgress;
  lastBattle?: BattleReport;
};
