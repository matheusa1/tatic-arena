import { CharacterTemplate, Rarity } from '../entities/character';
import { BannerId, GachaBanner, GachaProgress, GachaPullCount, GachaRate, GachaResult } from '../entities/gacha';
import { GACHA_BANNERS } from '../../shared/constants';
import { createId, defaultRng, pickOne, Rng } from '../../shared/random';

export type RunGachaInput = {
  bannerId: BannerId;
  pulls: GachaPullCount;
  progress: GachaProgress;
  catalog: CharacterTemplate[];
  rng?: Rng;
  now?: Date;
};

export type RunGachaOutput = {
  results: GachaResult[];
  progress: GachaProgress;
  crystalsSpent: number;
};

export function rollRarity(rates: GachaRate[], rng: Rng = defaultRng): Rarity {
  const total = rates.reduce((sum, rate) => sum + rate.weight, 0);
  const roll = rng() * total;
  let cursor = 0;

  for (const rate of rates) {
    cursor += rate.weight;
    if (roll < cursor) {
      return rate.rarity;
    }
  }

  return rates[rates.length - 1].rarity;
}

export function getBanner(bannerId: BannerId): GachaBanner {
  return GACHA_BANNERS[bannerId];
}

export function runGacha({
  bannerId,
  pulls,
  progress,
  catalog,
  rng = defaultRng,
  now = new Date()
}: RunGachaInput): RunGachaOutput {
  const banner = getBanner(bannerId);
  const results: GachaResult[] = [];
  let specialPity = progress.specialPity;

  for (let index = 0; index < pulls; index += 1) {
    const guaranteedByPity =
      banner.id === 'special' && banner.pityThreshold !== undefined && specialPity >= banner.pityThreshold;
    const rarity = guaranteedByPity ? 'lendário' : rollRarity(banner.rates, rng);
    const pool = catalog.filter((character) => character.rarity === rarity);
    const character = pickOne(pool, rng);

    if (banner.id === 'special') {
      specialPity = rarity === 'lendário' ? 0 : specialPity + 1;
    }

    results.push({
      id: createId('gacha', now),
      bannerId,
      characterId: character.id,
      characterName: character.name,
      rarity,
      fragments: banner.fragmentAmount,
      guaranteedByPity,
      createdAt: now.toISOString()
    });
  }

  return {
    results,
    crystalsSpent: banner.costPerPull * pulls,
    progress: {
      specialPity,
      history: [...results, ...progress.history].slice(0, 30)
    }
  };
}
