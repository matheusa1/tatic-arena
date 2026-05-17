import { describe, expect, it } from 'vitest';
import { CHEST_DEFINITIONS } from '../../../shared/constants';
import { CHARACTER_CATALOG } from '../../entities/characters';
import { openChest, rollChestLootEntry } from '../chestService';

describe('chestService', () => {
  it('rolls a weighted loot entry from the configured chest table', () => {
    const entry = rollChestLootEntry(CHEST_DEFINITIONS.raro, () => 0);

    expect(entry.rewardType).toBe('fragments');
    expect(entry.reward.fragments?.[0]).toMatchObject({ rarity: 'raro', amount: 12 });
  });

  it('targets a concrete character when the reward is fragments', () => {
    const rolls = [0, 0];
    const result = openChest({
      chestType: 'raro',
      catalog: CHARACTER_CATALOG,
      rng: () => rolls.shift() ?? 0,
      now: new Date('2026-05-17T12:00:00-03:00')
    });

    const rareCharacter = CHARACTER_CATALOG.find((character) => character.rarity === 'raro');

    expect(rareCharacter).toBeDefined();
    expect(result.rewardType).toBe('fragments');
    expect(result.reward.fragments?.[0].characterId).toBe(rareCharacter?.id);
    expect(result.label).toContain(rareCharacter!.name);
  });

  it('can drop item rewards from a legendary chest', () => {
    const result = openChest({
      chestType: 'lendário',
      catalog: CHARACTER_CATALOG,
      rng: () => 0.55,
      now: new Date('2026-05-17T12:00:00-03:00')
    });

    expect(result.rewardType).toBe('item');
    expect(result.tier).toBe('legendary');
    expect(result.reward.ultraCores).toBe(2);
  });
});
