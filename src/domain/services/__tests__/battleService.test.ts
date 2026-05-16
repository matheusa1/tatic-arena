import { describe, expect, it } from 'vitest';
import { createUltraBossEnemyTeam } from '../../entities/boss';
import { CHARACTER_CATALOG } from '../../entities/characters';
import {
  advanceBattleToNextPlayerTurn,
  calculateBasicDamage,
  createInteractiveBattle,
  getActivePlayerActor,
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
});
