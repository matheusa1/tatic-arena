import type { ChestDefinition, ChestLootEntry, ChestOpenResult } from '../entities/chest';
import type { CharacterTemplate } from '../entities/character';
import type { ChestType, RewardBundle } from '../entities/event';
import { CHEST_DEFINITIONS } from '../../shared/constants';
import { createId, defaultRng, pickOne } from '../../shared/random';
import type { Rng } from '../../shared/random';

export type OpenChestInput = {
  chestType: ChestType;
  catalog: CharacterTemplate[];
  rng?: Rng;
  now?: Date;
};

function cloneReward(reward: RewardBundle): RewardBundle {
  return {
    ...reward,
    chests: reward.chests ? { ...reward.chests } : undefined,
    coupons: reward.coupons ? reward.coupons.map((coupon) => ({ ...coupon })) : undefined,
    fragments: reward.fragments ? reward.fragments.map((fragment) => ({ ...fragment })) : undefined,
    skins: reward.skins ? reward.skins.map((skin) => ({ ...skin })) : undefined
  };
}

export function rollChestLootEntry(definition: ChestDefinition, rng: Rng = defaultRng): ChestLootEntry {
  const totalWeight = definition.lootTable.reduce((sum, entry) => sum + entry.weight, 0);
  const roll = rng() * totalWeight;
  let cursor = 0;

  for (const entry of definition.lootTable) {
    cursor += entry.weight;
    if (roll < cursor) {
      return entry;
    }
  }

  return definition.lootTable[definition.lootTable.length - 1];
}

function withFragmentTargets(reward: RewardBundle, catalog: CharacterTemplate[], rng: Rng): RewardBundle {
  const next = cloneReward(reward);

  if (!next.fragments) {
    return next;
  }

  next.fragments = next.fragments.map((fragment) => {
    const explicitTarget = fragment.characterId
      ? catalog.find((character) => character.id === fragment.characterId && character.rarity === fragment.rarity)
      : undefined;
    const target = explicitTarget ?? pickOne(catalog.filter((character) => character.rarity === fragment.rarity), rng);

    return {
      ...fragment,
      characterId: target.id
    };
  });

  return next;
}

function buildChestResultLabel(entry: ChestLootEntry, reward: RewardBundle, catalog: CharacterTemplate[]) {
  const fragment = reward.fragments?.[0];

  if (fragment?.characterId) {
    const character = catalog.find((item) => item.id === fragment.characterId);
    return `${fragment.amount} fragmentos de ${character?.name ?? fragment.characterId}`;
  }

  return entry.label;
}

export function openChest({
  chestType,
  catalog,
  rng = defaultRng,
  now = new Date()
}: OpenChestInput): ChestOpenResult {
  const definition = CHEST_DEFINITIONS[chestType];
  const entry = rollChestLootEntry(definition, rng);
  const reward = withFragmentTargets(entry.reward, catalog, rng);

  return {
    id: createId('chest', now),
    chestType,
    rewardType: entry.rewardType,
    label: buildChestResultLabel(entry, reward, catalog),
    tier: entry.tier ?? 'standard',
    reward,
    createdAt: now.toISOString()
  };
}
