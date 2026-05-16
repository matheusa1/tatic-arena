import { describe, expect, it } from 'vitest';
import {
  addCrystalSpend,
  canUseFreeLuckyDiceRoll,
  canUseFreeDraw,
  claimMilestone,
  createInitialEventProgress,
  exchangeLuckyDiceShopItem,
  getClaimableMilestones,
  performFortuneDraw,
  rollLuckyDice
} from '../eventService';

describe('eventService', () => {
  it('accumulates event crystal spending', () => {
    const progress = addCrystalSpend(createInitialEventProgress(), 1000);

    expect(progress.crystalsSpent).toBe(1000);
  });

  it('unlocks and claims milestone rewards only once', () => {
    const progress = addCrystalSpend(createInitialEventProgress(), 1000);
    const claimable = getClaimableMilestones(progress);

    expect(claimable.map((milestone) => milestone.id)).toEqual(['spent-500', 'spent-1000']);

    const claimed = claimMilestone(progress, 'spent-500');
    expect(claimed.claimed).toBe(true);
    expect(claimed.progress.claimedMilestoneIds).toContain('spent-500');

    const secondClaim = claimMilestone(claimed.progress, 'spent-500');
    expect(secondClaim.claimed).toBe(false);
  });

  it('allows one free fortune draw per local date', () => {
    const date = new Date('2026-05-15T12:00:00-03:00');
    const progress = createInitialEventProgress();

    expect(canUseFreeDraw(progress, date)).toBe(true);

    const draw = performFortuneDraw(progress, {
      paidWithCrystals: false,
      now: date,
      rng: () => 0.1
    });

    expect(draw.success).toBe(true);
    expect(draw.progress.lastFreeDrawDate).toBe('2026-05-15');
    expect(canUseFreeDraw(draw.progress, date)).toBe(false);
  });

  it('rolls the lucky dice once for free per local date and adds exchange points', () => {
    const date = new Date('2026-05-15T12:00:00-03:00');
    const progress = createInitialEventProgress();

    expect(canUseFreeLuckyDiceRoll(progress, date)).toBe(true);

    const roll = rollLuckyDice(progress, {
      paidWithCrystals: false,
      now: date,
      rng: () => 0.99
    });

    expect(roll.success).toBe(true);
    expect(roll.result?.face).toBe(6);
    expect(roll.result?.points).toBe(120);
    expect(roll.progress.luckyDicePoints).toBe(120);
    expect(roll.progress.lastFreeLuckyDiceRollDate).toBe('2026-05-15');
    expect(canUseFreeLuckyDiceRoll(roll.progress, date)).toBe(false);
  });

  it('exchanges lucky dice points for a limited skin reward', () => {
    const progress = {
      ...createInitialEventProgress(),
      luckyDicePoints: 900
    };

    const exchange = exchangeLuckyDiceShopItem(progress, 'skin-aureon-solar-regalia');

    expect(exchange.exchanged).toBe(true);
    expect(exchange.progress.luckyDicePoints).toBe(0);
    expect(exchange.reward.skins?.[0].skinId).toBe('aureon-solar-regalia');

    const secondExchange = exchangeLuckyDiceShopItem(exchange.progress, 'skin-aureon-solar-regalia');
    expect(secondExchange.exchanged).toBe(false);
  });
});
