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
    basicSkill: {
      name: 'Corte Incandescente',
      description: 'Orion aquece a lâmina até o fio ficar alaranjado e abre uma marca de brasa no alvo.',
      icon: 'strike',
      effectType: 'damage',
      effect: 'Dano de alvo único; o multiplicador cresce a cada nível da habilidade.'
    },
    specialSkill: {
      name: 'Investida Rubra',
      description: 'Ele avança em linha reta, deixa um rastro de fogo no chão e concentra todo o impacto no inimigo.',
      icon: 'blast',
      effectType: 'damage',
      effect: 'Dano alto em alvo único, liberado quando a carga especial fica completa.'
    },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.comum
  },
  {
    id: 'tide-mender',
    name: 'Mira das Mares',
    rarity: 'comum',
    element: 'água',
    class: 'suporte',
    baseStats: { health: 820, attack: 92, defense: 62, speed: 91 },
    basicSkill: {
      name: 'Toque de Corrente',
      description: 'Mira puxa uma corrente fina de água salgada que corta a guarda e desgasta o alvo aos poucos.',
      icon: 'strike',
      effectType: 'damage',
      effect: 'Dano de alvo único com escala pelo nível da habilidade básica.'
    },
    specialSkill: {
      name: 'Fonte Serena',
      description: 'Um círculo de água calma se abre sob o aliado mais ferido e fecha suas fissuras de energia.',
      icon: 'heal',
      effectType: 'heal',
      effect: 'Cura o aliado com menor vida; no modo manual também remove efeitos de controle.'
    },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.comum
  },
  {
    id: 'stone-warden',
    name: 'Taro Granito',
    rarity: 'comum',
    element: 'terra',
    class: 'defensor',
    baseStats: { health: 980, attack: 88, defense: 86, speed: 70 },
    basicSkill: {
      name: 'Pancada Firme',
      description: 'Taro finca os pés, gira o escudo de pedra e transforma o peso do corpo em um impacto curto.',
      icon: 'strike',
      effectType: 'damage',
      effect: 'Dano de alvo único; eficiente para manter pressão enquanto a defesa carrega.'
    },
    specialSkill: {
      name: 'Muralha Viva',
      description: 'Placas de granito sobem ao redor de Taro e absorvem golpes antes que atinjam a linha aliada.',
      icon: 'guard',
      effectType: 'guard',
      effect: 'Reduz dano recebido por 2 turnos, chegando a 3 em níveis altos; no manual também recupera vida.'
    },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.comum
  },
  {
    id: 'gale-runner',
    name: 'Nira Ventoforte',
    rarity: 'comum',
    element: 'vento',
    class: 'atacante',
    baseStats: { health: 700, attack: 116, defense: 48, speed: 116 },
    basicSkill: {
      name: 'Rajada Curta',
      description: 'Nira desaparece por um instante e reaparece com uma lâmina de vento atravessando a defesa.',
      icon: 'strike',
      effectType: 'damage',
      effect: 'Dano de alvo único com boa cadência graças à velocidade alta da personagem.'
    },
    specialSkill: {
      name: 'Danca do Vendaval',
      description: 'Ela circula o inimigo em passos leves e descarrega uma sequência de cortes no mesmo ponto.',
      icon: 'blast',
      effectType: 'damage',
      effect: 'Dano alto em alvo único, escalando com o nível da habilidade especial.'
    },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.comum
  },
  {
    id: 'dawn-lantern',
    name: 'Luma Alvorada',
    rarity: 'comum',
    element: 'luz',
    class: 'suporte',
    baseStats: { health: 780, attack: 86, defense: 58, speed: 102 },
    basicSkill: {
      name: 'Luz Pontual',
      description: 'Luma concentra um ponto de aurora na palma da mão e dispara um pulso preciso contra o alvo.',
      icon: 'blast',
      effectType: 'damage',
      effect: 'Dano de alvo único; mantém Luma contribuindo enquanto prepara a cura.'
    },
    specialSkill: {
      name: 'Claridade Amiga',
      description: 'A lanterna de Luma se abre em pétalas de luz e guia energia vital até o aliado mais ferido.',
      icon: 'heal',
      effectType: 'heal',
      effect: 'Cura o aliado com menor vida; no modo manual também limpa controle.'
    },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.comum
  },
  {
    id: 'dusk-vagrant',
    name: 'Varek Crepusculo',
    rarity: 'comum',
    element: 'sombra',
    class: 'controlador',
    baseStats: { health: 740, attack: 96, defense: 54, speed: 106 },
    basicSkill: {
      name: 'Marca Opaca',
      description: 'Varek deixa uma sombra presa ao alvo, que aperta como tinta fria quando ele tenta reagir.',
      icon: 'blast',
      effectType: 'damage',
      effect: 'Dano de alvo único com escala pelo nível da habilidade básica.'
    },
    specialSkill: {
      name: 'Passo Silente',
      description: 'Ele corta a distância sem ruído, rompe o ritmo do inimigo e deixa sua próxima ação instável.',
      icon: 'control',
      effectType: 'control',
      effect: 'Causa dano, aplica atraso de ação e reduz a velocidade do alvo.'
    },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.comum
  },
  {
    id: 'ignivar-duelist',
    name: 'Kael Ignivar',
    rarity: 'raro',
    element: 'fogo',
    class: 'atacante',
    baseStats: { health: 880, attack: 158, defense: 65, speed: 106 },
    basicSkill: {
      name: 'Lampejo Carmesim',
      description: 'Kael traça um arco vermelho no ar e transforma a faísca final em um corte de precisão.',
      icon: 'strike',
      effectType: 'damage',
      effect: 'Dano de alvo único com bom retorno em personagens focados em ataque.'
    },
    specialSkill: {
      name: 'Estrela Ardente',
      description: 'Uma estrela compacta cai sobre o adversário e explode em chamas densas ao tocar a armadura.',
      icon: 'blast',
      effectType: 'damage',
      effect: 'Dano alto em alvo único; recebe grande ganho ao evoluir para MAX e ULTRA MAX.'
    },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.raro
  },
  {
    id: 'river-sentinel',
    name: 'Selena Aguafria',
    rarity: 'raro',
    element: 'água',
    class: 'defensor',
    baseStats: { health: 1100, attack: 104, defense: 96, speed: 78 },
    basicSkill: {
      name: 'Lanca de Agua',
      description: 'Selena comprime água em uma lança curta que perfura a linha frontal com pressão constante.',
      icon: 'strike',
      effectType: 'damage',
      effect: 'Dano de alvo único; usa a habilidade básica para avançar a carga defensiva.'
    },
    specialSkill: {
      name: 'Couraca de Marfim',
      description: 'Camadas de espuma endurecida cobrem Selena e amortecem os próximos golpes recebidos.',
      icon: 'guard',
      effectType: 'guard',
      effect: 'Reduz dano recebido por 2 turnos, chegando a 3 em níveis altos; no manual também recupera vida.'
    },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.raro
  },
  {
    id: 'root-forger',
    name: 'Borin Raizferro',
    rarity: 'raro',
    element: 'terra',
    class: 'defensor',
    baseStats: { health: 1180, attack: 110, defense: 104, speed: 68 },
    basicSkill: {
      name: 'Martelo de Raiz',
      description: 'Borin ergue raízes ferruginosas do solo e as fecha sobre o inimigo como um martelo vivo.',
      icon: 'strike',
      effectType: 'damage',
      effect: 'Dano de alvo único com escala pelo nível da habilidade básica.'
    },
    specialSkill: {
      name: 'Pele de Rocha',
      description: 'Veios minerais atravessam sua pele e criam uma camada rígida para segurar a linha de frente.',
      icon: 'guard',
      effectType: 'guard',
      effect: 'Reduz dano recebido por 2 turnos, chegando a 3 em níveis altos; no manual também recupera vida.'
    },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.raro
  },
  {
    id: 'sky-harrier',
    name: 'Ayla Ventoclara',
    rarity: 'raro',
    element: 'vento',
    class: 'controlador',
    baseStats: { health: 840, attack: 118, defense: 60, speed: 130 },
    basicSkill: {
      name: 'Corte Ascendente',
      description: 'Ayla sobe em uma corrente de ar e desfere um corte de baixo para cima antes de pousar.',
      icon: 'strike',
      effectType: 'damage',
      effect: 'Dano de alvo único, favorecido pela alta velocidade da personagem.'
    },
    specialSkill: {
      name: 'Vertigem Alta',
      description: 'Ela prende o alvo em uma espiral aérea, bagunçando seu equilíbrio e atrasando a reação.',
      icon: 'control',
      effectType: 'control',
      effect: 'Causa dano, aplica perda de ação e reduz a velocidade do alvo.'
    },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.raro
  },
  {
    id: 'prism-votary',
    name: 'Solen Prismal',
    rarity: 'raro',
    element: 'luz',
    class: 'suporte',
    baseStats: { health: 920, attack: 102, defense: 72, speed: 110 },
    basicSkill: {
      name: 'Raio Prismal',
      description: 'Solen refrata luz em várias cores e concentra o feixe mais estável no ponto fraco do alvo.',
      icon: 'blast',
      effectType: 'damage',
      effect: 'Dano de alvo único com escala pelo nível da habilidade básica.'
    },
    specialSkill: {
      name: 'Voto Radiante',
      description: 'Um selo prismal envolve o aliado mais ferido, sela rachaduras e devolve estabilidade ao corpo.',
      icon: 'heal',
      effectType: 'heal',
      effect: 'Cura o aliado com menor vida; no modo manual também remove controle.'
    },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.raro
  },
  {
    id: 'veil-stalker',
    name: 'Noctra Veu',
    rarity: 'raro',
    element: 'sombra',
    class: 'atacante',
    baseStats: { health: 820, attack: 148, defense: 58, speed: 122 },
    basicSkill: {
      name: 'Fio Noturno',
      description: 'Noctra estica um fio de sombra entre os dedos e corta o alvo antes que ele veja a origem.',
      icon: 'strike',
      effectType: 'damage',
      effect: 'Dano de alvo único com boa sinergia com velocidade e ataque.'
    },
    specialSkill: {
      name: 'Eclipse Cortante',
      description: 'A arena escurece por um segundo e Noctra usa a abertura para desferir um golpe cirúrgico.',
      icon: 'blast',
      effectType: 'damage',
      effect: 'Dano alto em alvo único; ideal para finalizar inimigos já pressionados.'
    },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.raro
  },
  {
    id: 'highflame-vanguard',
    name: 'Ardan Chama Alta',
    rarity: 'épico',
    element: 'fogo',
    class: 'atacante',
    baseStats: { health: 1060, attack: 204, defense: 78, speed: 112 },
    basicSkill: {
      name: 'Arco Flamejante',
      description: 'Ardan curva a própria chama em arco e a dispara como uma lâmina larga contra a linha inimiga.',
      icon: 'blast',
      effectType: 'damage',
      effect: 'Dano de alvo único com base de ataque elevada.'
    },
    specialSkill: {
      name: 'Cometa Interior',
      description: 'Ele concentra fogo no peito, salta como um cometa e libera a explosão no ponto de impacto.',
      icon: 'blast',
      effectType: 'damage',
      effect: 'Dano muito alto em alvo único, com grande crescimento por nível de habilidade.'
    },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.épico
  },
  {
    id: 'coral-oracle',
    name: 'Lyra Coralina',
    rarity: 'épico',
    element: 'água',
    class: 'suporte',
    baseStats: { health: 1080, attack: 128, defense: 86, speed: 118 },
    basicSkill: {
      name: 'Eco de Coral',
      description: 'Lyra vibra um fragmento de coral e envia uma onda sonora que quebra a concentração do alvo.',
      icon: 'blast',
      effectType: 'damage',
      effect: 'Dano de alvo único; ajuda a carregar uma cura especial mais forte.'
    },
    specialSkill: {
      name: 'Cancao das Fontes',
      description: 'Sua canção chama fontes antigas que sobem pelo campo e recompõem o aliado mais ferido.',
      icon: 'heal',
      effectType: 'heal',
      effect: 'Cura forte no aliado com menor vida; no modo manual também remove controle.'
    },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.épico
  },
  {
    id: 'deepvale-colossus',
    name: 'Grom Valeprofundo',
    rarity: 'épico',
    element: 'terra',
    class: 'defensor',
    baseStats: { health: 1480, attack: 134, defense: 138, speed: 62 },
    basicSkill: {
      name: 'Quebra-Laje',
      description: 'Grom bate no chão e envia uma fratura reta que levanta lajes sob os pés do inimigo.',
      icon: 'strike',
      effectType: 'damage',
      effect: 'Dano de alvo único; mantém o defensor ativo enquanto prepara o bastião.'
    },
    specialSkill: {
      name: 'Bastiao Antigo',
      description: 'Runas esquecidas acendem em suas placas de pedra e transformam Grom em uma âncora defensiva.',
      icon: 'guard',
      effectType: 'guard',
      effect: 'Reduz bastante o dano recebido por vários turnos; no manual também recupera vida.'
    },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.épico
  },
  {
    id: 'serene-wing',
    name: 'Elys Asa Serena',
    rarity: 'épico',
    element: 'vento',
    class: 'controlador',
    baseStats: { health: 980, attack: 142, defense: 74, speed: 148 },
    basicSkill: {
      name: 'Pluma Rasante',
      description: 'Elys lança uma pluma cortante em voo baixo, rápida o suficiente para atravessar pequenas guardas.',
      icon: 'strike',
      effectType: 'damage',
      effect: 'Dano de alvo único com excelente frequência por causa da velocidade alta.'
    },
    specialSkill: {
      name: 'Olho do Ciclone',
      description: 'Um ciclone se fecha ao redor do alvo e prende seu tempo de reação no centro da tempestade.',
      icon: 'control',
      effectType: 'control',
      effect: 'Causa dano, reduz velocidade e força o alvo a perder a próxima ação.'
    },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.épico
  },
  {
    id: 'beacon-keeper',
    name: 'Ciro Farol',
    rarity: 'lendário',
    element: 'luz',
    class: 'invocador',
    baseStats: { health: 1360, attack: 214, defense: 104, speed: 132 },
    basicSkill: {
      name: 'Frota de Sinal',
      description: 'Ciro acende o farol e abre uma rota luminosa para navios etéreos cruzarem a linha inimiga.',
      icon: 'summon',
      effectType: 'summon',
      effect: 'Ataque básico de alvo único que invoca uma fragata aliada. Navios aliados atacam aleatoriamente após Ciro agir.'
    },
    specialSkill: {
      name: 'Couracado do Horizonte',
      description: 'O farol rasga o horizonte e convoca um navio de guerra dourado para liderar a frota.',
      icon: 'summon',
      effectType: 'summon',
      effect: 'Invoca um navio de guerra com ataque alto. Se a frota estiver cheia, reforca o couracado existente.'
    },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.lendário
  },
  {
    id: 'first-ray-aureon',
    name: 'Aureon Primeiro Raio',
    rarity: 'lendário',
    element: 'luz',
    class: 'atacante',
    baseStats: { health: 1320, attack: 260, defense: 96, speed: 134 },
    basicSkill: {
      name: 'Lamina Solar',
      description: 'Aureon condensa o primeiro raio do amanhecer em uma lâmina reta e quase impossível de desviar.',
      icon: 'strike',
      effectType: 'damage',
      effect: 'Dano de alvo único com alta precisão narrativa e forte escala por ataque.'
    },
    specialSkill: {
      name: 'Aurora Decisiva',
      description: 'O céu se abre em aurora e toda a luz cai sobre um único inimigo como sentença final.',
      icon: 'blast',
      effectType: 'damage',
      effect: 'Dano lendário em alvo único; uma das melhores habilidades para ascender a ULTRA MAX.'
    },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.lendário
  },
  {
    id: 'starless-nyxara',
    name: 'Nyxara Noite Estelar',
    rarity: 'lendário',
    element: 'sombra',
    class: 'controlador',
    baseStats: { health: 1220, attack: 196, defense: 92, speed: 152 },
    basicSkill: {
      name: 'Sinal Obscuro',
      description: 'Nyxara grava um símbolo sem luz no alvo e o faz colapsar em um pulso silencioso.',
      icon: 'blast',
      effectType: 'damage',
      effect: 'Dano de alvo único com escala pelo nível da habilidade básica.'
    },
    specialSkill: {
      name: 'Silencio das Orbitas',
      description: 'Órbitas vazias passam pelo campo e roubam do inimigo o compasso da próxima ação.',
      icon: 'control',
      effectType: 'control',
      effect: 'Causa dano, reduz velocidade e faz o alvo perder uma ação.'
    },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.lendário
  },
  {
    id: 'caldera-heart',
    name: 'Caldera Coracao Vulcanico',
    rarity: 'lendário',
    element: 'fogo',
    class: 'defensor',
    baseStats: { health: 1620, attack: 178, defense: 148, speed: 86 },
    basicSkill: {
      name: 'Punho Magmatico',
      description: 'Caldera fecha o punho em magma sólido e golpeia com o peso de uma rocha recém-expelida.',
      icon: 'strike',
      effectType: 'damage',
      effect: 'Dano de alvo único; acelera a rotação até o núcleo defensivo ficar pronto.'
    },
    specialSkill: {
      name: 'Nucleo Inabalavel',
      description: 'O coração vulcânico pulsa sob a armadura e transforma dano recebido em pressão contida.',
      icon: 'guard',
      effectType: 'guard',
      effect: 'Reduz drasticamente o dano recebido por vários turnos; no manual também recupera vida.'
    },
    requiredFragments: FRAGMENTS_REQUIRED_BY_RARITY.lendário
  },
  {
    id: 'storm-vairya',
    name: 'Veyra Tempestaria',
    rarity: 'lendário',
    element: 'vento',
    class: 'atacante',
    baseStats: { health: 1240, attack: 244, defense: 88, speed: 160 },
    basicSkill: {
      name: 'Corte de Trovao',
      description: 'Veyra cruza o campo em um clarão curto e deixa o trovão terminar o corte depois dela.',
      icon: 'strike',
      effectType: 'damage',
      effect: 'Dano de alvo único com altíssima frequência graças à velocidade lendária.'
    },
    specialSkill: {
      name: 'Tempestade Coroada',
      description: 'Nuvens circulam como uma coroa e descarregam toda a tempestade sobre um único inimigo.',
      icon: 'blast',
      effectType: 'damage',
      effect: 'Dano massivo em alvo único; escala muito bem com níveis de habilidade e ULTRA MAX.'
    },
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
  },
  {
    id: 'ciro-lighthouse-armada',
    characterId: 'beacon-keeper',
    name: 'Armada do Farol',
    description: 'Visual lendario de almirante luminoso para Ciro Farol, com navios cruzando o horizonte.',
    source: 'Dado da Sorte',
    visual: {
      primaryColor: '#0ea5e9',
      secondaryColor: '#facc15'
    }
  }
];

export const CHARACTER_SKIN_BY_ID = Object.fromEntries(
  CHARACTER_SKIN_CATALOG.map((skin) => [skin.id, skin])
);
