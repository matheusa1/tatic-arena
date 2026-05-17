import type { RewardBundle } from '../domain/entities/event';
import { CHARACTER_BY_ID, CHARACTER_SKIN_BY_ID } from '../domain/entities/characters';

export function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

export function localDateKey(date = new Date()) {
  return date.toLocaleDateString('en-CA');
}

export function describeReward(reward: RewardBundle) {
  const parts: string[] = [];

  if (reward.coins) parts.push(`${formatNumber(reward.coins)} moedas`);
  if (reward.crystals) parts.push(`${formatNumber(reward.crystals)} cristais`);
  if (reward.levelPotions) parts.push(`${formatNumber(reward.levelPotions)} pocoes`);
  if (reward.ultraCores) parts.push(`${reward.ultraCores} Nucleo Ultra Lendario`);

  reward.fragments?.forEach((fragment) => {
    const character = fragment.characterId ? CHARACTER_BY_ID[fragment.characterId] : undefined;
    parts.push(
      character
        ? `${fragment.amount} fragmentos de ${character.name}`
        : `${fragment.amount} fragmentos ${fragment.rarity}`
    );
  });

  if (reward.chests?.raro) parts.push(`${reward.chests.raro} bau raro`);
  if (reward.chests?.épico) parts.push(`${reward.chests.épico} bau epico`);
  if (reward.chests?.lendário) parts.push(`${reward.chests.lendário} bau lendario`);

  reward.coupons?.forEach((coupon) => {
    parts.push(`cupom ${coupon.discountPercent}%`);
  });

  reward.skins?.forEach((skinReward) => {
    const skin = CHARACTER_SKIN_BY_ID[skinReward.skinId];
    parts.push(`skin ${skin?.name ?? skinReward.skinId}`);
  });

  return parts.join(' + ');
}
