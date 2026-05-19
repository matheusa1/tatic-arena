import { describe, expect, it } from 'vitest';
import { MAX_SUMMONED_MINIONS, createUltraBossEnemyTeam } from '../../entities/boss';
import { ULTRA_MAX_SKILL_LEVEL } from '../../entities/character';
import { CHARACTER_CATALOG } from '../../entities/characters';
import {
  advanceBattleToNextPlayerTurn,
  calculateBasicDamage,
  canUseSpecial,
  createInteractiveBattle,
  getActivePlayerActor,
  getActiveTurnActor,
  performEnemyBattleAction,
  performPlayerBattleAction,
  runAutoBattle
} from '../battleService';

describe('battleService', () => {
  it('calculates basic damage using attack and defense', () => {
    expect(calculateBasicDamage(100, 40)).toBe(82);
    expect(calculateBasicDamage(10, 200)).toBe(1);
  });

  it('runs a basic battle and produces logs', () => {
    const player = CHARACTER_CATALOG.slice(0, 3).map((character) => ({
      id: character.id,
      name: character.name,
      rarity: character.rarity,
      element: character.element,
      class: character.class,
      level: 1,
      stars: 1,
      baseStats: character.baseStats
    }));
    const enemy = CHARACTER_CATALOG.slice(3, 6).map((character) => ({
      id: character.id,
      name: character.name,
      rarity: character.rarity,
      element: character.element,
      class: character.class,
      level: 1,
      stars: 1,
      baseStats: {
        health: Math.round(character.baseStats.health * 0.75),
        attack: Math.round(character.baseStats.attack * 0.75),
        defense: Math.round(character.baseStats.defense * 0.75),
        speed: Math.round(character.baseStats.speed * 0.75)
      }
    }));

    const report = runAutoBattle({ playerTeam: player, enemyTeam: enemy, rng: () => 0 });

    expect(report.turns).toBeGreaterThan(0);
    expect(report.logs.length).toBeGreaterThan(0);
  });

  it('rewards crystals on standard victories', () => {
    const player = CHARACTER_CATALOG.slice(0, 3).map((character) => ({
      id: character.id,
      name: character.name,
      rarity: character.rarity,
      element: character.element,
      class: character.class,
      level: 10,
      stars: 5,
      baseStats: {
        health: character.baseStats.health * 6,
        attack: character.baseStats.attack * 6,
        defense: character.baseStats.defense * 6,
        speed: character.baseStats.speed * 2
      }
    }));
    const enemy = CHARACTER_CATALOG.slice(3, 6).map((character) => ({
      id: character.id,
      name: character.name,
      rarity: character.rarity,
      element: character.element,
      class: character.class,
      level: 1,
      stars: 1,
      baseStats: {
        health: Math.round(character.baseStats.health * 0.3),
        attack: Math.round(character.baseStats.attack * 0.3),
        defense: Math.round(character.baseStats.defense * 0.3),
        speed: Math.round(character.baseStats.speed * 0.3)
      }
    }));
    const report = runAutoBattle({ playerTeam: player, enemyTeam: enemy, rng: () => 0 });

    expect(report.winner).toBe('player');
    expect(report.reward?.crystals).toBeGreaterThan(0);
  });

  it('advances enemy turns until the next manual player action', () => {
    const player = CHARACTER_CATALOG.slice(0, 1).map((character) => ({
      id: character.id,
      name: character.name,
      rarity: character.rarity,
      element: character.element,
      class: character.class,
      level: 1,
      stars: 1,
      baseStats: character.baseStats
    }));
    const enemy = CHARACTER_CATALOG.slice(3, 4).map((character) => ({
      id: character.id,
      name: character.name,
      rarity: character.rarity,
      element: character.element,
      class: character.class,
      level: 1,
      stars: 1,
      baseStats: character.baseStats
    }));
    const battle = createInteractiveBattle({ playerTeam: player, enemyTeam: enemy });
    const readyBattle = advanceBattleToNextPlayerTurn(battle, () => 0);
    const actor = readyBattle.playerTeam[0];
    const target = readyBattle.enemyTeam[0];

    expect(readyBattle.turns).toBe(1);
    expect(readyBattle.playerTeam[0].currentHealth).toBeLessThan(player[0].baseStats.health);

    const next = performPlayerBattleAction({
      battle: readyBattle,
      actorInstanceId: actor.instanceId,
      targetInstanceId: target.instanceId,
      action: 'basic',
      rng: () => 0
    });

    expect(next.turns).toBe(2);
    expect(next.enemyTeam[0].currentHealth).toBeLessThan(target.currentHealth);
    expect(next.logs.length).toBeGreaterThan(readyBattle.logs.length);
  });

  it('resolves one enemy turn at a time before returning control to the player', () => {
    const player = [
      {
        id: 'player',
        name: 'Aliado',
        rarity: 'comum' as const,
        element: 'fogo' as const,
        class: 'atacante' as const,
        level: 1,
        stars: 1,
        baseStats: { health: 1000, attack: 20, defense: 10, speed: 10 }
      }
    ];
    const enemy = [
      {
        id: 'enemy',
        name: 'Inimigo',
        rarity: 'comum' as const,
        element: 'terra' as const,
        class: 'atacante' as const,
        level: 1,
        stars: 1,
        baseStats: { health: 1000, attack: 100, defense: 10, speed: 50 }
      }
    ];
    const battle = createInteractiveBattle({ playerTeam: player, enemyTeam: enemy });

    expect(getActiveTurnActor(battle)?.team).toBe('enemy');

    const result = performEnemyBattleAction({ battle, rng: () => 0 });

    expect(result.performed).toBe(true);
    expect(result.action).toBe('basic');
    expect(result.actorInstanceId).toBe(battle.enemyTeam[0].instanceId);
    expect(result.targetInstanceId).toBe(battle.playerTeam[0].instanceId);
    expect(result.battle.turns).toBe(1);
    expect(result.battle.playerTeam[0].currentHealth).toBeLessThan(player[0].baseStats.health);
    expect(getActiveTurnActor(result.battle)?.team).toBe('player');
  });

  it('uses formation slots as the three team positions for manual turns', () => {
    const player = [
      {
        id: 'a',
        name: 'A',
        rarity: 'comum' as const,
        element: 'fogo' as const,
        class: 'atacante' as const,
        level: 1,
        stars: 1,
        formationSlot: 4,
        baseStats: { health: 1000, attack: 20, defense: 10, speed: 10 }
      },
      {
        id: 'b',
        name: 'B',
        rarity: 'comum' as const,
        element: 'fogo' as const,
        class: 'atacante' as const,
        level: 1,
        stars: 1,
        formationSlot: 1,
        baseStats: { health: 1000, attack: 20, defense: 10, speed: 10 }
      },
      {
        id: 'c',
        name: 'C',
        rarity: 'comum' as const,
        element: 'fogo' as const,
        class: 'atacante' as const,
        level: 1,
        stars: 1,
        formationSlot: 8,
        baseStats: { health: 1000, attack: 20, defense: 10, speed: 10 }
      }
    ];
    const enemy = [
      {
        id: 'enemy',
        name: 'Alvo',
        rarity: 'comum' as const,
        element: 'terra' as const,
        class: 'defensor' as const,
        level: 1,
        stars: 1,
        baseStats: { health: 10000, attack: 1, defense: 1, speed: 1 }
      }
    ];
    const battle = createInteractiveBattle({ playerTeam: player, enemyTeam: enemy });

    expect(getActivePlayerActor(battle)?.name).toBe('C');

    const afterC = performPlayerBattleAction({
      battle,
      actorInstanceId: getActivePlayerActor(battle)!.instanceId,
      targetInstanceId: battle.enemyTeam[0].instanceId,
      action: 'basic',
      rng: () => 0
    });
    const readyAfterC = advanceBattleToNextPlayerTurn(afterC, () => 0);

    expect(getActivePlayerActor(readyAfterC)?.name).toBe('B');

    const afterB = performPlayerBattleAction({
      battle: readyAfterC,
      actorInstanceId: getActivePlayerActor(readyAfterC)!.instanceId,
      targetInstanceId: readyAfterC.enemyTeam[0].instanceId,
      action: 'basic',
      rng: () => 0
    });
    const readyAfterB = advanceBattleToNextPlayerTurn(afterB, () => 0);

    expect(getActivePlayerActor(readyAfterB)?.name).toBe('A');
  });

  it('runs one position per side per iteration and skips missing enemy positions', () => {
    const player = ['A', 'B', 'C'].map((name) => ({
      id: name.toLowerCase(),
      name,
      rarity: 'comum' as const,
      element: 'fogo' as const,
      class: 'atacante' as const,
      level: 1,
      stars: 1,
      baseStats: { health: 10000, attack: 1, defense: 1, speed: 10 }
    }));
    const enemy = [
      {
        id: 'd',
        name: 'D',
        rarity: 'comum' as const,
        element: 'terra' as const,
        class: 'atacante' as const,
        level: 1,
        stars: 1,
        baseStats: { health: 10000, attack: 1, defense: 1, speed: 20 }
      }
    ];
    const report = runAutoBattle({ playerTeam: player, enemyTeam: enemy, rng: () => 0 });
    const firstCycleActors = report.logs.slice(0, 4).map((line) => line.split(' ')[0]);

    expect(firstCycleActors).toEqual(['D', 'A', 'B', 'C']);
  });

  it('lets ultra boss minions take damage while protecting the boss', () => {
    const player = [
      {
        id: 'player',
        name: 'Campeao',
        rarity: 'lendário' as const,
        element: 'luz' as const,
        class: 'atacante' as const,
        level: 30,
        stars: 6,
        baseStats: { health: 5000, attack: 900, defense: 500, speed: 500 },
        weaponLevel: 20,
        basicSkillLevel: 10,
        specialSkillLevel: 10
      }
    ];
    const battle = createInteractiveBattle({
      playerTeam: player,
      enemyTeam: createUltraBossEnemyTeam(),
      encounterType: 'ultra-boss'
    });
    const actor = getActivePlayerActor(battle)!;
    const boss = battle.enemyTeam.find((unit) => unit.combatRole === 'boss')!;
    const protectingMinion = battle.enemyTeam.find((unit) => unit.combatRole === 'minion' && unit.minionRole === 'tanker')!;

    const next = performPlayerBattleAction({
      battle,
      actorInstanceId: actor.instanceId,
      targetInstanceId: boss.instanceId,
      action: 'basic',
      rng: () => 0
    });
    const nextBoss = next.enemyTeam.find((unit) => unit.instanceId === boss.instanceId)!;
    const nextProtectingMinion = next.enemyTeam.find((unit) => unit.instanceId === protectingMinion.instanceId)!;

    expect(nextBoss.currentHealth).toBe(boss.currentHealth);
    expect(nextProtectingMinion.currentHealth).toBeLessThan(protectingMinion.currentHealth);
    expect(next.logs[0]).toContain('entrou na frente');
  });

  it('keeps summoned minions on basic attacks only', () => {
    const battle = createInteractiveBattle({
      playerTeam: [
        {
          id: 'player',
          name: 'Aliado',
          rarity: 'comum' as const,
          element: 'fogo' as const,
          class: 'atacante' as const,
          level: 1,
          stars: 1,
          baseStats: { health: 1000, attack: 20, defense: 10, speed: 10 }
        }
      ],
      enemyTeam: createUltraBossEnemyTeam(),
      encounterType: 'ultra-boss'
    });
    const minion = battle.enemyTeam.find((unit) => unit.combatRole === 'minion')!;
    const boss = battle.enemyTeam.find((unit) => unit.combatRole === 'boss')!;

    minion.actionCount = 2;
    boss.actionCount = 2;

    expect(minion.basicOnly).toBe(true);
    expect(canUseSpecial(minion)).toBe(false);
    expect(boss.class).toBe('invocador');
    expect(canUseSpecial(boss)).toBe(true);
  });

  it('turns Ciro Farol into a legendary ship summoner', () => {
    const ciro = CHARACTER_CATALOG.find((character) => character.id === 'beacon-keeper')!;

    expect(ciro.rarity).toBe('lendário');
    expect(ciro.class).toBe('invocador');
    expect(ciro.basicSkill.effectType).toBe('summon');
    expect(ciro.specialSkill.effectType).toBe('summon');
  });

  it('summons ships on Ciro basic attacks and lets allied minions act immediately', () => {
    const ciro = CHARACTER_CATALOG.find((character) => character.id === 'beacon-keeper')!;
    const battle = createInteractiveBattle({
      playerTeam: [
        {
          id: ciro.id,
          name: ciro.name,
          rarity: ciro.rarity,
          element: ciro.element,
          class: ciro.class,
          level: 1,
          stars: 1,
          baseStats: ciro.baseStats
        }
      ],
      enemyTeam: [
        {
          id: 'target',
          name: 'Alvo',
          rarity: 'comum' as const,
          element: 'terra' as const,
          class: 'defensor' as const,
          level: 1,
          stars: 1,
          baseStats: { health: 2000, attack: 1, defense: 10, speed: 1 }
        }
      ]
    });
    const actor = getActivePlayerActor(battle)!;
    const target = battle.enemyTeam[0];

    const next = performPlayerBattleAction({
      battle,
      actorInstanceId: actor.instanceId,
      targetInstanceId: target.instanceId,
      action: 'basic',
      rng: () => 0
    });
    const ships = next.playerTeam.filter((unit) => unit.combatRole === 'minion' && unit.summonedById === ciro.id);

    expect(ships).toHaveLength(1);
    expect(ships[0].name).toContain('Fragata do Farol');
    expect(ships[0].occupiesSlot).toBe(false);
    expect(ships[0].basicOnly).toBe(true);
    expect(next.turns).toBe(2);
    expect(next.enemyTeam[0].currentHealth).toBeLessThan(target.currentHealth);
    expect(next.logs[0]).toContain('atacou aleatoriamente');
  });

  it('summons a high-attack warship with Ciro special', () => {
    const ciro = CHARACTER_CATALOG.find((character) => character.id === 'beacon-keeper')!;
    const battle = createInteractiveBattle({
      playerTeam: [
        {
          id: ciro.id,
          name: ciro.name,
          rarity: ciro.rarity,
          element: ciro.element,
          class: ciro.class,
          level: 1,
          stars: 1,
          baseStats: ciro.baseStats,
          specialSkillLevel: 4
        }
      ],
      enemyTeam: [
        {
          id: 'target',
          name: 'Alvo',
          rarity: 'comum' as const,
          element: 'terra' as const,
          class: 'defensor' as const,
          level: 1,
          stars: 1,
          baseStats: { health: 2400, attack: 1, defense: 10, speed: 1 }
        }
      ]
    });
    const actor = getActivePlayerActor(battle)!;
    actor.actionCount = 2;

    const next = performPlayerBattleAction({
      battle,
      actorInstanceId: actor.instanceId,
      action: 'special',
      rng: () => 0
    });
    const warship = next.playerTeam.find((unit) => unit.characterId === 'ciro-farol-warship')!;

    expect(warship).toBeDefined();
    expect(warship.name).toBe('Couracado do Horizonte');
    expect(warship.minionRole).toBe('couracado');
    expect(warship.attack).toBeGreaterThan(actor.attack);
    expect(next.turns).toBe(2);
    expect(next.logs.some((line) => line.includes('Couracado do Horizonte'))).toBe(true);
  });

  it('keeps ultra boss summons out of character turn slots and caps them at three', () => {
    const battle = createInteractiveBattle({
      playerTeam: [
        {
          id: 'player',
          name: 'Aliado',
          rarity: 'comum' as const,
          element: 'fogo' as const,
          class: 'atacante' as const,
          level: 1,
          stars: 1,
          baseStats: { health: 1000, attack: 20, defense: 10, speed: 10 }
        }
      ],
      enemyTeam: createUltraBossEnemyTeam(),
      encounterType: 'ultra-boss'
    });
    const minions = battle.enemyTeam.filter((unit) => unit.combatRole === 'minion');
    const boss = battle.enemyTeam.find((unit) => unit.combatRole === 'boss')!;
    const minionIds = new Set(minions.map((unit) => unit.instanceId));

    expect(minions).toHaveLength(MAX_SUMMONED_MINIONS);
    expect(minions.every((unit) => !unit.occupiesSlot && unit.turnPosition === -1)).toBe(true);
    expect(battle.turnQueue.some((instanceId) => minionIds.has(instanceId))).toBe(false);
    expect(boss.occupiesSlot).toBe(true);
  });

  it('marks ultra boss encounters and drops an ultra core on victory', () => {
    const player = CHARACTER_CATALOG.slice(0, 3).map((character) => ({
      id: character.id,
      name: character.name,
      rarity: character.rarity,
      element: character.element,
      class: character.class,
      level: 30,
      stars: 6,
      baseStats: {
        health: character.baseStats.health * 12,
        attack: character.baseStats.attack * 12,
        defense: character.baseStats.defense * 12,
        speed: character.baseStats.speed * 2
      },
      weaponLevel: 20,
      basicSkillLevel: 10,
      specialSkillLevel: 10
    }));
    const report = runAutoBattle({
      playerTeam: player,
      enemyTeam: createUltraBossEnemyTeam(),
      encounterType: 'ultra-boss',
      rng: () => 0
    });

    expect(report.encounterType).toBe('ultra-boss');
    expect(report.winner).toBe('player');
    expect(report.reward?.crystals).toBeGreaterThan(0);
    expect(report.reward?.ultraCores).toBe(1);
  });

  it('keeps the ultra boss fight meaningful for maximized legendary characters', () => {
    const player = CHARACTER_CATALOG.filter((character) => character.rarity === 'lendário')
      .slice(0, 3)
      .map((character) => ({
        id: character.id,
        name: character.name,
        rarity: character.rarity,
        element: character.element,
        class: character.class,
        level: 30,
        stars: 6,
        baseStats: character.baseStats,
        weaponLevel: 20,
        basicSkillLevel: ULTRA_MAX_SKILL_LEVEL,
        specialSkillLevel: ULTRA_MAX_SKILL_LEVEL
      }));
    const report = runAutoBattle({
      playerTeam: player,
      enemyTeam: createUltraBossEnemyTeam(),
      encounterType: 'ultra-boss',
      rng: () => 0
    });

    expect(report.winner).toBe('player');
    expect(report.turns).toBeGreaterThan(10);
    expect(report.turns).toBeLessThan(120);
    expect(report.playerTeam.some((unit) => unit.currentHealth < unit.maxHealth)).toBe(true);
  });
});
