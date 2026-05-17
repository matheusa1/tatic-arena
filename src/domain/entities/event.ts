import { Rarity } from './character';

export type ChestType = 'raro' | 'épico' | 'lendário';

export type FragmentReward = {
  rarity: Rarity;
  amount: number;
  characterId?: string;
};

export type RewardBundle = {
  coins?: number;
  crystals?: number;
  levelPotions?: number;
  ultraCores?: number;
  chests?: Partial<Record<ChestType, number>>;
  fragments?: FragmentReward[];
  coupons?: DiscountCoupon[];
  skins?: SkinReward[];
};

export type SkinReward = {
  skinId: string;
};

export type EventMilestone = {
  id: string;
  crystalsRequired: number;
  reward: RewardBundle;
};

export type FortuneDrawRewardType =
  | 'coins'
  | 'potions'
  | 'common-fragments'
  | 'rare-fragments'
  | 'epic-fragments'
  | 'legendary-fragments'
  | 'coupon';

export type DiscountPercent = 10 | 20 | 30 | 50;

export type DiscountCoupon = {
  id: string;
  discountPercent: DiscountPercent;
  expiresAt: string;
  used: boolean;
  createdAt: string;
};

export type FortuneDrawResult = {
  id: string;
  rewardType: FortuneDrawRewardType;
  label: string;
  reward: RewardBundle;
  paidWithCrystals: boolean;
  createdAt: string;
};

export type EventPackage = {
  id: string;
  name: string;
  description: string;
  baseCrystalPrice: number;
  reward: RewardBundle;
  limit?: number;
};

export type LuckyDiceRollResult = {
  id: string;
  face: number;
  points: number;
  reward: RewardBundle;
  paidWithCrystals: boolean;
  createdAt: string;
};

export type LuckyDiceShopItem = {
  id: string;
  name: string;
  description: string;
  pointCost: number;
  reward: RewardBundle;
  limit?: number;
};

export type EventProgress = {
  crystalsSpent: number;
  claimedMilestoneIds: string[];
  lastFreeDrawDate?: string;
  fortunePrizePool: number;
  drawHistory: FortuneDrawResult[];
  coupons: DiscountCoupon[];
  purchasedPackages: Record<string, number>;
  luckyDicePoints: number;
  lastFreeLuckyDiceRollDate?: string;
  luckyDiceRollHistory: LuckyDiceRollResult[];
  exchangedDiceItems: Record<string, number>;
};
