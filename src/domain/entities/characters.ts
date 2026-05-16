import {
  CharacterSkinTemplate,
  CharacterTemplate,
  FRAGMENTS_REQUIRED_BY_RARITY
} from './character';

export const INITIAL_CHARACTER_IDS = ['ember-squire', 'tide-mender', 'stone-warden'];

export const CHARACTER_CATALOG: CharacterTemplate[] = [
  {
    id: 'ember-squire',
    name: 'Brasa Orion',
    rarity: 'comum',
    element: 'fogo',
    class: 'atacante',
    baseStats: { health: 760, attack: 128, defense: 52, speed: 96 },
    basicSkill: { name: 'Corte Incandescente', description: 'Golpe simples com dano de fogo.' },
    specialSkill: { name: 'Investida Rubra', description: 'Ataque concentrado com dano ampliado.' },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.comum
  },
  {
    id: 'tide-mender',
    name: 'Mira das Mares',
    rarity: 'comum',
    element: 'água',
    class: 'suporte',
    baseStats: { health: 820, attack: 92, defense: 62, speed: 91 },
    basicSkill: { name: 'Toque de Corrente', description: 'Ataque leve que desgasta o alvo.' },
    specialSkill: { name: 'Fonte Serena', description: 'Restaura vida do aliado mais ferido.' },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.comum
  },
  {
    id: 'stone-warden',
    name: 'Taro Granito',
    rarity: 'comum',
    element: 'terra',
    class: 'defensor',
    baseStats: { health: 980, attack: 88, defense: 86, speed: 70 },
    basicSkill: { name: 'Pancada Firme', description: 'Ataque direto com impacto pesado.' },
    specialSkill: { name: 'Muralha Viva', description: 'Reduz dano recebido por alguns turnos.' },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.comum
  },
  {
    id: 'gale-runner',
    name: 'Nira Ventoforte',
    rarity: 'comum',
    element: 'vento',
    class: 'atacante',
    baseStats: { health: 700, attack: 116, defense: 48, speed: 116 },
    basicSkill: { name: 'Rajada Curta', description: 'Corte veloz contra um inimigo.' },
    specialSkill: { name: 'Danca do Vendaval', description: 'Ataque agil de dano ampliado.' },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.comum
  },
  {
    id: 'dawn-lantern',
    name: 'Luma Alvorada',
    rarity: 'comum',
    element: 'luz',
    class: 'suporte',
    baseStats: { health: 780, attack: 86, defense: 58, speed: 102 },
    basicSkill: { name: 'Luz Pontual', description: 'Pulso luminoso contra o alvo.' },
    specialSkill: { name: 'Claridade Amiga', description: 'Cura o aliado com menor vida.' },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.comum
  },
  {
    id: 'dusk-vagrant',
    name: 'Varek Crepusculo',
    rarity: 'comum',
    element: 'sombra',
    class: 'controlador',
    baseStats: { health: 740, attack: 96, defense: 54, speed: 106 },
    basicSkill: { name: 'Marca Opaca', description: 'Ataque sombrio de baixa intensidade.' },
    specialSkill: { name: 'Passo Silente', description: 'Atrasa a proxima acao de um inimigo.' },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.comum
  },
  {
    id: 'ignivar-duelist',
    name: 'Kael Ignivar',
    rarity: 'raro',
    element: 'fogo',
    class: 'atacante',
    baseStats: { health: 880, attack: 158, defense: 65, speed: 106 },
    basicSkill: { name: 'Lampejo Carmesim', description: 'Causa dano consistente de fogo.' },
    specialSkill: { name: 'Estrela Ardente', description: 'Dispara um ataque de alto impacto.' },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.raro
  },
  {
    id: 'river-sentinel',
    name: 'Selena Aguafria',
    rarity: 'raro',
    element: 'água',
    class: 'defensor',
    baseStats: { health: 1100, attack: 104, defense: 96, speed: 78 },
    basicSkill: { name: 'Lanca de Agua', description: 'Ataque direto com pressao de corrente.' },
    specialSkill: { name: 'Couraca de Marfim', description: 'Aumenta a resistencia temporariamente.' },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.raro
  },
  {
    id: 'root-forger',
    name: 'Borin Raizferro',
    rarity: 'raro',
    element: 'terra',
    class: 'defensor',
    baseStats: { health: 1180, attack: 110, defense: 104, speed: 68 },
    basicSkill: { name: 'Martelo de Raiz', description: 'Ataque pesado contra um inimigo.' },
    specialSkill: { name: 'Pele de Rocha', description: 'Reduz dano recebido por rodadas curtas.' },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.raro
  },
  {
    id: 'sky-harrier',
    name: 'Ayla Ventoclara',
    rarity: 'raro',
    element: 'vento',
    class: 'controlador',
    baseStats: { health: 840, attack: 118, defense: 60, speed: 130 },
    basicSkill: { name: 'Corte Ascendente', description: 'Golpe rapido contra um alvo.' },
    specialSkill: { name: 'Vertigem Alta', description: 'Pode fazer o inimigo perder a acao.' },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.raro
  },
  {
    id: 'prism-votary',
    name: 'Solen Prismal',
    rarity: 'raro',
    element: 'luz',
    class: 'suporte',
    baseStats: { health: 920, attack: 102, defense: 72, speed: 110 },
    basicSkill: { name: 'Raio Prismal', description: 'Pulso luminoso contra um inimigo.' },
    specialSkill: { name: 'Voto Radiante', description: 'Cura e estabiliza um aliado.' },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.raro
  },
  {
    id: 'veil-stalker',
    name: 'Noctra Veu',
    rarity: 'raro',
    element: 'sombra',
    class: 'atacante',
    baseStats: { health: 820, attack: 148, defense: 58, speed: 122 },
    basicSkill: { name: 'Fio Noturno', description: 'Ataque rapido de sombra.' },
    specialSkill: { name: 'Eclipse Cortante', description: 'Dano alto contra um inimigo vulneravel.' },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.raro
  },
  {
    id: 'highflame-vanguard',
    name: 'Ardan Chama Alta',
    rarity: 'épico',
    element: 'fogo',
    class: 'atacante',
    baseStats: { health: 1060, attack: 204, defense: 78, speed: 112 },
    basicSkill: { name: 'Arco Flamejante', description: 'Ataque com dano elevado.' },
    specialSkill: { name: 'Cometa Interior', description: 'Dano especial muito acima do normal.' },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.épico
  },
  {
    id: 'coral-oracle',
    name: 'Lyra Coralina',
    rarity: 'épico',
    element: 'água',
    class: 'suporte',
    baseStats: { health: 1080, attack: 128, defense: 86, speed: 118 },
    basicSkill: { name: 'Eco de Coral', description: 'Ataque leve de energia marinha.' },
    specialSkill: { name: 'Cancao das Fontes', description: 'Cura forte no aliado mais ferido.' },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.épico
  },
  {
    id: 'deepvale-colossus',
    name: 'Grom Valeprofundo',
    rarity: 'épico',
    element: 'terra',
    class: 'defensor',
    baseStats: { health: 1480, attack: 134, defense: 138, speed: 62 },
    basicSkill: { name: 'Quebra-Laje', description: 'Golpe pesado de terra.' },
    specialSkill: { name: 'Bastiao Antigo', description: 'Recebe grande reducao de dano.' },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.épico
  },
  {
    id: 'serene-wing',
    name: 'Elys Asa Serena',
    rarity: 'épico',
    element: 'vento',
    class: 'controlador',
    baseStats: { health: 980, attack: 142, defense: 74, speed: 148 },
    basicSkill: { name: 'Pluma Rasante', description: 'Ataque veloz de vento.' },
    specialSkill: { name: 'Olho do Ciclone', description: 'Reduz velocidade e pode pular turno.' },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.épico
  },
  {
    id: 'beacon-keeper',
    name: 'Ciro Farol',
    rarity: 'épico',
    element: 'luz',
    class: 'suporte',
    baseStats: { health: 1120, attack: 132, defense: 82, speed: 124 },
    basicSkill: { name: 'Centelha Guia', description: 'Ataque luminoso preciso.' },
    specialSkill: { name: 'Farol de Retorno', description: 'Cura grande em aliado ferido.' },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.épico
  },
  {
    id: 'first-ray-aureon',
    name: 'Aureon Primeiro Raio',
    rarity: 'lendário',
    element: 'luz',
    class: 'atacante',
    baseStats: { health: 1320, attack: 260, defense: 96, speed: 134 },
    basicSkill: { name: 'Lamina Solar', description: 'Ataque luminoso de alta precisao.' },
    specialSkill: { name: 'Aurora Decisiva', description: 'Dano lendario contra um inimigo.' },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.lendário
  },
  {
    id: 'starless-nyxara',
    name: 'Nyxara Noite Estelar',
    rarity: 'lendário',
    element: 'sombra',
    class: 'controlador',
    baseStats: { health: 1220, attack: 196, defense: 92, speed: 152 },
    basicSkill: { name: 'Sinal Obscuro', description: 'Ataque sombrio concentrado.' },
    specialSkill: { name: 'Silencio das Orbitas', description: 'Interrompe o ritmo de um inimigo.' },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.lendário
  },
  {
    id: 'caldera-heart',
    name: 'Caldera Coracao Vulcanico',
    rarity: 'lendário',
    element: 'fogo',
    class: 'defensor',
    baseStats: { health: 1620, attack: 178, defense: 148, speed: 86 },
    basicSkill: { name: 'Punho Magmatico', description: 'Golpe robusto de fogo.' },
    specialSkill: { name: 'Nucleo Inabalavel', description: 'Reduz dano recebido drasticamente.' },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.lendário
  },
  {
    id: 'storm-vairya',
    name: 'Veyra Tempestaria',
    rarity: 'lendário',
    element: 'vento',
    class: 'atacante',
    baseStats: { health: 1240, attack: 244, defense: 88, speed: 160 },
    basicSkill: { name: 'Corte de Trovao', description: 'Ataque muito veloz.' },
    specialSkill: { name: 'Tempestade Coroada', description: 'Dano massivo contra um alvo.' },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.lendário
  }
];

export const CHARACTER_BY_ID = Object.fromEntries(
  CHARACTER_CATALOG.map((character) => [character.id, character])
);

export const CHARACTER_SKIN_CATALOG: CharacterSkinTemplate[] = [
  {
    id: 'aureon-solar-regalia',
    characterId: 'first-ray-aureon',
    name: 'Regalia Solar',
    description: 'Armadura cerimonial de luz pura para Aureon Primeiro Raio.',
    source: 'Dado da Sorte',
    visual: {
      primaryColor: '#f59e0b',
      secondaryColor: '#fef3c7'
    }
  },
  {
    id: 'nyxara-void-empress',
    characterId: 'starless-nyxara',
    name: 'Imperatriz do Vazio',
    description: 'Manto astral sombrio que cobre Nyxara com orbitas sem estrelas.',
    source: 'Dado da Sorte',
    visual: {
      primaryColor: '#4c1d95',
      secondaryColor: '#22d3ee'
    }
  },
  {
    id: 'caldera-obsidian-core',
    characterId: 'caldera-heart',
    name: 'Nucleo Obsidiana',
    description: 'Couraca vulcanica negra para Caldera Coracao Vulcanico.',
    source: 'Dado da Sorte',
    visual: {
      primaryColor: '#111827',
      secondaryColor: '#f97316'
    }
  }
];

export const CHARACTER_SKIN_BY_ID = Object.fromEntries(
  CHARACTER_SKIN_CATALOG.map((skin) => [skin.id, skin])
);
