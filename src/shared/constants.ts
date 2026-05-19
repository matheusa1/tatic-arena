import type { ChestDefinition } from '../domain/entities/chest';
import type { EventMilestone, EventPackage, LuckyDiceShopItem } from '../domain/entities/event';
import type { GachaBanner } from '../domain/entities/gacha';

export const STORAGE_KEY = 'heroes-tactics-arena:v1';
export const GAME_STATE_VERSION = 1;

export const EVENT_CONFIG = {
  name: 'Festival da Fortuna',
  startDate: '2026-05-01T00:00:00-03:00',
  endDate: '2026-06-30T23:59:59-03:00'
};

export const LUCKY_DICE_CONFIG = {
  name: 'Dado da Sorte',
  paidRollCost: 120,
  pointsPerFace: 20
};

export const GACHA_BANNERS: Record<GachaBanner['id'], GachaBanner> = {
  common: {
    id: 'common',
    name: 'Banner Comum',
    costPerPull: 100,
    fragmentAmount: 10,
    rates: [
      { rarity: 'comum', weight: 60 },
      { rarity: 'raro', weight: 30 },
      { rarity: 'épico', weight: 9 },
      { rarity: 'lendário', weight: 1 }
    ]
  },
  special: {
    id: 'special',
    name: 'Banner Especial',
    costPerPull: 300,
    fragmentAmount: 10,
    pityThreshold: 50,
    rates: [
      { rarity: 'raro', weight: 50 },
      { rarity: 'épico', weight: 40 },
      { rarity: 'lendário', weight: 10 }
    ]
  }
};

export const CHEST_DEFINITIONS: Record<ChestDefinition['type'], ChestDefinition> = {
  raro: {
    type: 'raro',
    name: 'Bau Raro',
    shortName: 'Raro',
    description: 'Recompensas de progresso com chance de fragmentos e recursos extras.',
    accentColor: '#2563eb',
    glowColor: 'rgba(37, 99, 235, 0.34)',
    lootTable: [
      {
        rewardType: 'fragments',
        label: 'Fragmentos raros',
        weight: 34,
        tier: 'rare',
        reward: { fragments: [{ rarity: 'raro', amount: 12 }] }
      },
      {
        rewardType: 'potions',
        label: 'Pocoes de nivel',
        weight: 24,
        reward: { levelPotions: 18 }
      },
      {
        rewardType: 'coins',
        label: 'Moedas',
        weight: 22,
        reward: { coins: 3500 }
      },
      {
        rewardType: 'crystals',
        label: 'Cristais',
        weight: 14,
        tier: 'rare',
        reward: { crystals: 180 }
      },
      {
        rewardType: 'item',
        label: 'Nucleo Ultra',
        weight: 6,
        tier: 'epic',
        reward: { ultraCores: 1 }
      }
    ]
  },
  épico: {
    type: 'épico',
    name: 'Bau Epico',
    shortName: 'Epico',
    description: 'Um bau superior com premios maiores e fragmentos epicos frequentes.',
    accentColor: '#a21caf',
    glowColor: 'rgba(162, 28, 175, 0.36)',
    lootTable: [
      {
        rewardType: 'fragments',
        label: 'Fragmentos epicos',
        weight: 32,
        tier: 'epic',
        reward: { fragments: [{ rarity: 'épico', amount: 14 }] }
      },
      {
        rewardType: 'fragments',
        label: 'Fragmentos lendarios',
        weight: 8,
        tier: 'legendary',
        reward: { fragments: [{ rarity: 'lendário', amount: 5 }] }
      },
      {
        rewardType: 'potions',
        label: 'Pocoes de nivel',
        weight: 20,
        tier: 'rare',
        reward: { levelPotions: 36 }
      },
      {
        rewardType: 'coins',
        label: 'Moedas',
        weight: 18,
        tier: 'rare',
        reward: { coins: 8000 }
      },
      {
        rewardType: 'crystals',
        label: 'Cristais',
        weight: 14,
        tier: 'epic',
        reward: { crystals: 420 }
      },
      {
        rewardType: 'item',
        label: 'Nucleo Ultra',
        weight: 8,
        tier: 'epic',
        reward: { ultraCores: 1 }
      }
    ]
  },
  lendário: {
    type: 'lendário',
    name: 'Bau Lendario',
    shortName: 'Lendario',
    description: 'Premios altos, fragmentos lendarios e a melhor chance de item raro.',
    accentColor: '#d97706',
    glowColor: 'rgba(217, 119, 6, 0.42)',
    lootTable: [
      {
        rewardType: 'fragments',
        label: 'Fragmentos lendarios',
        weight: 38,
        tier: 'legendary',
        reward: { fragments: [{ rarity: 'lendário', amount: 18 }] }
      },
      {
        rewardType: 'fragments',
        label: 'Fragmentos epicos',
        weight: 12,
        tier: 'epic',
        reward: { fragments: [{ rarity: 'épico', amount: 30 }] }
      },
      {
        rewardType: 'item',
        label: 'Nucleos Ultra',
        weight: 16,
        tier: 'legendary',
        reward: { ultraCores: 2 }
      },
      {
        rewardType: 'crystals',
        label: 'Cristais',
        weight: 14,
        tier: 'legendary',
        reward: { crystals: 900 }
      },
      {
        rewardType: 'coins',
        label: 'Moedas',
        weight: 12,
        tier: 'epic',
        reward: { coins: 18000 }
      },
      {
        rewardType: 'potions',
        label: 'Pocoes de nivel',
        weight: 8,
        tier: 'epic',
        reward: { levelPotions: 80 }
      }
    ]
  }
};

export const EVENT_MILESTONES: EventMilestone[] = [
  {
    id: 'spent-500',
    crystalsRequired: 500,
    reward: { fragments: [{ rarity: 'raro', amount: 10 }], levelPotions: 10 }
  },
  {
    id: 'spent-1000',
    crystalsRequired: 1000,
    reward: { fragments: [{ rarity: 'raro', amount: 20 }], levelPotions: 20 }
  },
  {
    id: 'spent-3000',
    crystalsRequired: 3000,
    reward: { fragments: [{ rarity: 'épico', amount: 20 }], chests: { raro: 1 } }
  },
  {
    id: 'spent-8000',
    crystalsRequired: 8000,
    reward: { fragments: [{ rarity: 'épico', amount: 40 }], chests: { épico: 1 } }
  },
  {
    id: 'spent-12500',
    crystalsRequired: 12500,
    reward: { fragments: [{ rarity: 'épico', amount: 60 }], chests: { épico: 2 } }
  },
  {
    id: 'spent-20000',
    crystalsRequired: 20000,
    reward: { fragments: [{ rarity: 'lendário', amount: 40 }], chests: { lendário: 1 } }
  },
  {
    id: 'spent-35000',
    crystalsRequired: 35000,
    reward: { fragments: [{ rarity: 'lendário', amount: 80 }], chests: { lendário: 2 } }
  }
];

export const EVENT_PACKAGES: EventPackage[] = [
  {
    id: 'rare-fragment-pack',
    name: 'Pacote de Fragmentos Raros',
    description: 'Fragmentos para acelerar novos recrutas raros.',
    baseCrystalPrice: 480,
    reward: { fragments: [{ rarity: 'raro', amount: 30 }] }
  },
  {
    id: 'epic-fragment-pack',
    name: 'Pacote de Fragmentos Epicos',
    description: 'Um impulso direto para herois epicos.',
    baseCrystalPrice: 1200,
    reward: { fragments: [{ rarity: 'épico', amount: 30 }] }
  },
  {
    id: 'potion-pack',
    name: 'Pacote de Pocoes',
    description: 'Pocoes para subir o nivel dos personagens.',
    baseCrystalPrice: 260,
    reward: { levelPotions: 35 }
  },
  {
    id: 'coin-pack',
    name: 'Pacote de Moedas',
    description: 'Moedas comuns para testes de progressao.',
    baseCrystalPrice: 220,
    reward: { coins: 6000 }
  },
  {
    id: 'legendary-fragment-limited',
    name: 'Fragmentos Lendarios Limitados',
    description: 'Oferta limitada do festival para personagens lendarios.',
    baseCrystalPrice: 2400,
    reward: { fragments: [{ rarity: 'lendário', amount: 25 }] },
    limit: 1
  }
];

export const LUCKY_DICE_SHOP_ITEMS: LuckyDiceShopItem[] = [
  {
    id: 'skin-aureon-solar-regalia',
    name: 'Skin Regalia Solar',
    description: 'Visual lendario exclusivo para Aureon Primeiro Raio.',
    pointCost: 900,
    reward: { skins: [{ skinId: 'aureon-solar-regalia' }] },
    limit: 1
  },
  {
    id: 'skin-nyxara-void-empress',
    name: 'Skin Imperatriz do Vazio',
    description: 'Visual lendario exclusivo para Nyxara Noite Estelar.',
    pointCost: 900,
    reward: { skins: [{ skinId: 'nyxara-void-empress' }] },
    limit: 1
  },
  {
    id: 'skin-caldera-obsidian-core',
    name: 'Skin Nucleo Obsidiana',
    description: 'Visual lendario exclusivo para Caldera Coracao Vulcanico.',
    pointCost: 900,
    reward: { skins: [{ skinId: 'caldera-obsidian-core' }] },
    limit: 1
  },
  {
    id: 'skin-ciro-lighthouse-armada',
    name: 'Skin Armada do Farol',
    description: 'Visual lendario exclusivo para Ciro Farol.',
    pointCost: 900,
    reward: { skins: [{ skinId: 'ciro-lighthouse-armada' }] },
    limit: 1
  },
  {
    id: 'dice-legendary-fragments',
    name: 'Fragmentos Lendarios',
    description: 'Fragmentos extras para acelerar lendarios fora das skins.',
    pointCost: 360,
    reward: { fragments: [{ rarity: 'lendário', amount: 12 }] },
    limit: 3
  },
  {
    id: 'dice-ultra-core',
    name: 'Nucleo Ultra Lendario',
    description: 'Material raro para ascender habilidades no MAX.',
    pointCost: 650,
    reward: { ultraCores: 1 },
    limit: 2
  },
  {
    id: 'dice-epic-chest',
    name: 'Bau Epico',
    description: 'Recompensa de inventario para guardar recursos do evento.',
    pointCost: 320,
    reward: { chests: { épico: 1 } },
    limit: 4
  }
];
