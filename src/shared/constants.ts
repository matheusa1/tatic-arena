import { GachaBanner } from '../domain/entities/gacha';
import { EventMilestone, EventPackage, LuckyDiceShopItem } from '../domain/entities/event';

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
