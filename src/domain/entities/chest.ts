import type { ChestType, RewardBundle } from './event';

export type ChestRewardType = 'fragments' | 'item' | 'potions' | 'crystals' | 'coins';

export type ChestRewardTier = 'standard' | 'rare' | 'epic' | 'legendary';

export type ChestLootEntry = {
  rewardType: ChestRewardType;
  label: string;
  weight: number;
  reward: RewardBundle;
  tier?: ChestRewardTier;
};

export type ChestDefinition = {
  type: ChestType;
  name: string;
  shortName: string;
  description: string;
  accentColor: string;
  glowColor: string;
  lootTable: ChestLootEntry[];
};

export type ChestOpenResult = {
  id: string;
  chestType: ChestType;
  rewardType: ChestRewardType;
  label: string;
  tier: ChestRewardTier;
  reward: RewardBundle;
  createdAt: string;
};
