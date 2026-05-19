export type Rarity = 'comum' | 'raro' | 'épico' | 'lendário';
export type ElementType = 'fogo' | 'água' | 'terra' | 'vento' | 'luz' | 'sombra';
export type CharacterClass = 'atacante' | 'defensor' | 'suporte' | 'controlador' | 'invocador';

export type StatBlock = {
  health: number;
  attack: number;
  defense: number;
  speed: number;
};

export type Skill = {
  name: string;
  description: string;
  icon: SkillIcon;
  effectType: SkillEffectType;
  effect: string;
};

export type SkillIcon = 'strike' | 'blast' | 'heal' | 'guard' | 'control' | 'summon';
export type SkillEffectType = 'damage' | 'heal' | 'guard' | 'control' | 'summon';
export type SkillSlot = 'basic' | 'special';
export type PetRole = 'ataque' | 'defesa' | 'suporte' | 'velocidade';
export type PetStatGrowth = Partial<Record<keyof StatBlock, number>>;

export type PetTemplate = {
  id: string;
  name: string;
  role: PetRole;
  description: string;
  statGrowth: PetStatGrowth;
};

export type CharacterSkinTemplate = {
  id: string;
  characterId: string;
  name: string;
  description: string;
  source: string;
  visual: {
    primaryColor: string;
    secondaryColor: string;
  };
};

export type CharacterPet = {
  id: string;
  level: number;
  bond: number;
};

export type CharacterTemplate = {
  id: string;
  name: string;
  rarity: Rarity;
  element: ElementType;
  class: CharacterClass;
  baseStats: StatBlock;
  basicSkill: Skill;
  specialSkill: Skill;
  requiredFragments: number;
};

export type PlayerCharacter = {
  id: string;
  level: number;
  stars: number;
  unlocked: boolean;
  fragments: number;
  weaponLevel: number;
  basicSkillLevel: number;
  specialSkillLevel: number;
  pet?: CharacterPet;
  equippedSkinId?: string;
};

export type CharacterProfile = CharacterTemplate & PlayerCharacter;
export type CharacterProgression = Pick<
  PlayerCharacter,
  'weaponLevel' | 'basicSkillLevel' | 'specialSkillLevel' | 'pet'
>;

export const MAX_CHARACTER_LEVEL = 30;
export const MAX_WEAPON_LEVEL = 20;
export const MAX_SKILL_LEVEL = 10;
export const ULTRA_MAX_SKILL_LEVEL = 11;
export const ULTRA_SKILL_CORE_COST = 1;
export const ULTRA_MAX_SKILL_STAT_BONUS = 0.18;
export const ULTRA_MAX_SKILL_EFFECT_MULTIPLIER = 2.15;
export const MAX_PET_LEVEL = 15;
export const MAX_PET_BOND = 100;

export const PET_CATALOG: PetTemplate[] = [
  {
    id: 'ember-wisp',
    name: 'Fagulha',
    role: 'ataque',
    description: 'Aumenta ataque e da um pequeno impulso de velocidade.',
    statGrowth: { attack: 0.018, speed: 0.004 }
  },
  {
    id: 'iron-shell',
    name: 'Cascoferro',
    role: 'defesa',
    description: 'Fortalece vida e defesa para linhas de frente.',
    statGrowth: { health: 0.014, defense: 0.018 }
  },
  {
    id: 'tide-orb',
    name: 'Marola',
    role: 'suporte',
    description: 'Aumenta vida e ataque para melhorar curas e utilidade.',
    statGrowth: { health: 0.012, attack: 0.01 }
  },
  {
    id: 'gale-spark',
    name: 'Brisa',
    role: 'velocidade',
    description: 'Eleva velocidade e ataque para turnos mais frequentes.',
    statGrowth: { speed: 0.012, attack: 0.008 }
  }
];

export const PET_BY_ID = Object.fromEntries(PET_CATALOG.map((pet) => [pet.id, pet]));

export const FRAGMENTS_REQUIRED_BY_RARITY: Record<Rarity, number> = {
  comum: 20,
  raro: 40,
  épico: 80,
  lendário: 120
};

export const RARITY_ORDER: Record<Rarity, number> = {
  comum: 1,
  raro: 2,
  épico: 3,
  lendário: 4
};

export const RARITY_COLORS: Record<Rarity, string> = {
  comum: 'default',
  raro: 'blue',
  épico: 'magenta',
  lendário: 'gold'
};
