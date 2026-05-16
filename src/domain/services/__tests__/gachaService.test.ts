import { describe, expect, it } from 'vitest';
import { CHARACTER_CATALOG } from '../../entities/characters';
import { GACHA_BANNERS } from '../../../shared/constants';
import { rollRarity, runGacha } from '../gachaService';

describe('gachaService', () => {
  it('rolls rarity according to configured ranges', () => {
    const rates = GACHA_BANNERS.common.rates;

    expect(rollRarity(rates, () => 0.59)).toBe('comum');
    expect(rollRarity(rates, () => 0.6)).toBe('raro');
    expect(rollRarity(rates, () => 0.9)).toBe('épico');
    expect(rollRarity(rates, () => 0.995)).toBe('lendário');
  });

  it('guarantees legendary when special pity threshold is reached', () => {
    const result = runGacha({
      bannerId: 'special',
      pulls: 1,
      progress: { specialPity: 50, history: [] },
      catalog: CHARACTER_CATALOG,
      rng: () => 0
    });

    expect(result.results[0].rarity).toBe('lendário');
    expect(result.results[0].guaranteedByPity).toBe(true);
    expect(result.progress.specialPity).toBe(0);
  });

  it('increments special pity when no legendary is pulled', () => {
    const result = runGacha({
      bannerId: 'special',
      pulls: 1,
      progress: { specialPity: 12, history: [] },
      catalog: CHARACTER_CATALOG,
      rng: () => 0
    });

    expect(result.results[0].rarity).toBe('raro');
    expect(result.progress.specialPity).toBe(13);
  });

  it('runs 100 pulls and applies cost, history cap, and pity within the batch', () => {
    const result = runGacha({
      bannerId: 'special',
      pulls: 100,
      progress: { specialPity: 49, history: [] },
      catalog: CHARACTER_CATALOG,
      rng: () => 0
    });

    expect(result.results).toHaveLength(100);
    expect(result.crystalsSpent).toBe(GACHA_BANNERS.special.costPerPull * 100);
    expect(result.progress.history).toHaveLength(30);
    expect(result.results.filter((item) => item.guaranteedByPity)).toHaveLength(2);
    expect(result.progress.specialPity).toBe(47);
  });
});
