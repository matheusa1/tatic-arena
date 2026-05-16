import {
  DiscountCoupon,
  DiscountPercent,
  EventMilestone,
  EventPackage,
  EventProgress,
  FortuneDrawResult,
  LuckyDiceRollResult,
  LuckyDiceShopItem,
  RewardBundle
} from '../entities/event';
import { EVENT_CONFIG, EVENT_MILESTONES, EVENT_PACKAGES, LUCKY_DICE_CONFIG, LUCKY_DICE_SHOP_ITEMS } from '../../shared/constants';
import { createId, defaultRng, Rng } from '../../shared/random';
import { localDateKey } from '../../shared/formatters';

type PurchasePackageOutput = {
  progress: EventProgress;
  reward: RewardBundle;
  finalPrice: number;
  discountPercent: number;
};

export function createInitialEventProgress(): EventProgress {
  return {
    crystalsSpent: 0,
    claimedMilestoneIds: [],
    fortunePrizePool: 0,
    drawHistory: [],
    coupons: [],
    purchasedPackages: {},
    luckyDicePoints: 0,
    luckyDiceRollHistory: [],
    exchangedDiceItems: {}
  };
}

export function isEventActive(now = new Date()) {
  return now >= new Date(EVENT_CONFIG.startDate) && now <= new Date(EVENT_CONFIG.endDate);
}

export function addCrystalSpend(progress: EventProgress, amount: number): EventProgress {
  return {
    ...progress,
    crystalsSpent: progress.crystalsSpent + Math.max(0, amount)
  };
}

export function getClaimableMilestones(
  progress: EventProgress,
  milestones: EventMilestone[] = EVENT_MILESTONES
) {
  return milestones.filter(
    (milestone) =>
      progress.crystalsSpent >= milestone.crystalsRequired &&
      !progress.claimedMilestoneIds.includes(milestone.id)
  );
}

export function claimMilestone(
  progress: EventProgress,
  milestoneId: string,
  milestones: EventMilestone[] = EVENT_MILESTONES
) {
  const milestone = milestones.find((item) => item.id === milestoneId);

  if (!milestone) {
    throw new Error(`Unknown event milestone: ${milestoneId}`);
  }

  const claimable = getClaimableMilestones(progress, milestones).some((item) => item.id === milestoneId);

  if (!claimable) {
    return {
      claimed: false,
      progress,
      reward: milestone.reward
    };
  }

  return {
    claimed: true,
    progress: {
      ...progress,
      claimedMilestoneIds: [...progress.claimedMilestoneIds, milestoneId]
    },
    reward: milestone.reward
  };
}

export function canUseFreeDraw(progress: EventProgress, date = new Date()) {
  return progress.lastFreeDrawDate !== localDateKey(date);
}

function createCoupon(discountPercent: DiscountPercent, now: Date): DiscountCoupon {
  return {
    id: createId('coupon', now),
    discountPercent,
    expiresAt: EVENT_CONFIG.endDate,
    used: false,
    createdAt: now.toISOString()
  };
}

export function rollFortuneReward(rng: Rng = defaultRng, now = new Date()): Omit<FortuneDrawResult, 'id' | 'paidWithCrystals' | 'createdAt'> {
  const roll = rng();

  if (roll < 0.35) {
    return {
      rewardType: 'coins',
      label: 'Moedas comuns',
      reward: { coins: 1500 }
    };
  }

  if (roll < 0.6) {
    return {
      rewardType: 'potions',
      label: 'Pocoes de nivel',
      reward: { levelPotions: 8 }
    };
  }

  if (roll < 0.78) {
    return {
      rewardType: 'common-fragments',
      label: 'Fragmentos comuns',
      reward: { fragments: [{ rarity: 'comum', amount: 10 }] }
    };
  }

  if (roll < 0.9) {
    return {
      rewardType: 'rare-fragments',
      label: 'Fragmentos raros',
      reward: { fragments: [{ rarity: 'raro', amount: 8 }] }
    };
  }

  if (roll < 0.96) {
    return {
      rewardType: 'epic-fragments',
      label: 'Fragmentos epicos',
      reward: { fragments: [{ rarity: 'épico', amount: 5 }] }
    };
  }

  if (roll < 0.97) {
    return {
      rewardType: 'legendary-fragments',
      label: 'Fragmentos lendarios',
      reward: { fragments: [{ rarity: 'lendário', amount: 3 }] }
    };
  }

  const discounts: DiscountPercent[] = [10, 20, 30, 50];
  const discountPercent = discounts[Math.min(discounts.length - 1, Math.floor(rng() * discounts.length))];

  return {
    rewardType: 'coupon',
    label: `Cupom de ${discountPercent}%`,
    reward: { coupons: [createCoupon(discountPercent, now)] }
  };
}

export function performFortuneDraw(
  progress: EventProgress,
  options: {
    paidWithCrystals: boolean;
    rng?: Rng;
    now?: Date;
  }
) {
  const now = options.now ?? new Date();

  if (!options.paidWithCrystals && !canUseFreeDraw(progress, now)) {
    return {
      success: false,
      progress,
      result: undefined,
      crystalsSpent: 0
    };
  }

  const rolledReward = rollFortuneReward(options.rng, now);
  const result: FortuneDrawResult = {
    ...rolledReward,
    id: createId('fortune', now),
    paidWithCrystals: options.paidWithCrystals,
    createdAt: now.toISOString()
  };
  const crystalsSpent = options.paidWithCrystals ? 50 : 0;

  return {
    success: true,
    result,
    crystalsSpent,
    progress: {
      ...progress,
      crystalsSpent: progress.crystalsSpent + crystalsSpent,
      lastFreeDrawDate: options.paidWithCrystals ? progress.lastFreeDrawDate : localDateKey(now),
      fortunePrizePool: progress.fortunePrizePool + 10,
      drawHistory: [result, ...progress.drawHistory].slice(0, 30)
    }
  };
}

export function canUseFreeLuckyDiceRoll(progress: EventProgress, date = new Date()) {
  return progress.lastFreeLuckyDiceRollDate !== localDateKey(date);
}

function getLuckyDiceReward(face: number): RewardBundle {
  if (face <= 1) {
    return { coins: 1200 };
  }

  if (face === 2) {
    return { levelPotions: 8 };
  }

  if (face === 3) {
    return { fragments: [{ rarity: 'raro', amount: 6 }] };
  }

  if (face === 4) {
    return { fragments: [{ rarity: 'épico', amount: 4 }] };
  }

  if (face === 5) {
    return { chests: { raro: 1 } };
  }

  return { fragments: [{ rarity: 'lendário', amount: 3 }] };
}

export function rollLuckyDice(
  progress: EventProgress,
  options: {
    paidWithCrystals: boolean;
    rng?: Rng;
    now?: Date;
  }
) {
  const now = options.now ?? new Date();

  if (!options.paidWithCrystals && !canUseFreeLuckyDiceRoll(progress, now)) {
    return {
      success: false,
      progress,
      result: undefined,
      crystalsSpent: 0
    };
  }

  const rng = options.rng ?? defaultRng;
  const face = Math.min(6, Math.floor(rng() * 6) + 1);
  const points = face * LUCKY_DICE_CONFIG.pointsPerFace;
  const crystalsSpent = options.paidWithCrystals ? LUCKY_DICE_CONFIG.paidRollCost : 0;
  const result: LuckyDiceRollResult = {
    id: createId('dice', now),
    face,
    points,
    reward: getLuckyDiceReward(face),
    paidWithCrystals: options.paidWithCrystals,
    createdAt: now.toISOString()
  };

  return {
    success: true,
    result,
    crystalsSpent,
    progress: {
      ...progress,
      crystalsSpent: progress.crystalsSpent + crystalsSpent,
      luckyDicePoints: progress.luckyDicePoints + points,
      lastFreeLuckyDiceRollDate: options.paidWithCrystals
        ? progress.lastFreeLuckyDiceRollDate
        : localDateKey(now),
      luckyDiceRollHistory: [result, ...progress.luckyDiceRollHistory].slice(0, 30)
    }
  };
}

export function exchangeLuckyDiceShopItem(
  progress: EventProgress,
  itemId: string,
  items: LuckyDiceShopItem[] = LUCKY_DICE_SHOP_ITEMS
) {
  const item = items.find((shopItem) => shopItem.id === itemId);

  if (!item) {
    throw new Error(`Unknown lucky dice shop item: ${itemId}`);
  }

  const exchanged = progress.exchangedDiceItems[itemId] ?? 0;

  if (item.limit !== undefined && exchanged >= item.limit) {
    return {
      exchanged: false,
      progress,
      reward: item.reward,
      pointCost: item.pointCost
    };
  }

  if (progress.luckyDicePoints < item.pointCost) {
    return {
      exchanged: false,
      progress,
      reward: item.reward,
      pointCost: item.pointCost
    };
  }

  return {
    exchanged: true,
    reward: item.reward,
    pointCost: item.pointCost,
    progress: {
      ...progress,
      luckyDicePoints: progress.luckyDicePoints - item.pointCost,
      exchangedDiceItems: {
        ...progress.exchangedDiceItems,
        [itemId]: exchanged + 1
      }
    }
  };
}

export function getAvailableCoupons(progress: EventProgress, now = new Date()) {
  return progress.coupons.filter((coupon) => !coupon.used && new Date(coupon.expiresAt) >= now);
}

export function calculateDiscountedPrice(basePrice: number, discountPercent = 0) {
  return Math.max(0, Math.ceil(basePrice * (1 - discountPercent / 100)));
}

export function purchaseEventPackage(
  progress: EventProgress,
  packageId: string,
  couponId?: string,
  now = new Date(),
  packages: EventPackage[] = EVENT_PACKAGES
): PurchasePackageOutput {
  const eventPackage = packages.find((item) => item.id === packageId);

  if (!eventPackage) {
    throw new Error(`Unknown event package: ${packageId}`);
  }

  const purchased = progress.purchasedPackages[packageId] ?? 0;

  if (eventPackage.limit !== undefined && purchased >= eventPackage.limit) {
    throw new Error('Package limit reached.');
  }

  const coupon = couponId ? getAvailableCoupons(progress, now).find((item) => item.id === couponId) : undefined;
  const discountPercent = coupon?.discountPercent ?? 0;
  const finalPrice = calculateDiscountedPrice(eventPackage.baseCrystalPrice, discountPercent);

  return {
    reward: eventPackage.reward,
    finalPrice,
    discountPercent,
    progress: {
      ...progress,
      crystalsSpent: progress.crystalsSpent + finalPrice,
      coupons: progress.coupons.map((item) =>
        coupon && item.id === coupon.id
          ? {
              ...item,
              used: true
            }
          : item
      ),
      purchasedPackages: {
        ...progress.purchasedPackages,
        [packageId]: purchased + 1
      }
    }
  };
}
