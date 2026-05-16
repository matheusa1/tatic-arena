import { Rarity } from './character';

export type BannerId = 'common' | 'special';

export type GachaPullCount = 1 | 10 | 100;

export type GachaRate = {
  rarity: Rarity;
  weight: number;
};

export type GachaBanner = {
  id: BannerId;
  name: string;
  costPerPull: number;
  fragmentAmount: number;
  rates: GachaRate[];
  pityThreshold?: number;
};

export type GachaResult = {
  id: string;
  bannerId: BannerId;
  characterId: string;
  characterName: string;
  rarity: Rarity;
  fragments: number;
  guaranteedByPity: boolean;
  createdAt: string;
};

export type GachaProgress = {
  specialPity: number;
  history: GachaResult[];
};
