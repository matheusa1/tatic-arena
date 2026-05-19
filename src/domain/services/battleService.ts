import {
  BattleEncounterType,
  BattleActionType,
  BattleCharacterInput,
  BattleReport,
  BattleReward,
  BattleTeam,
  Combatant,
  InteractiveBattleState,
  MinionRole
} from '../entities/battle';
import { RARITY_ORDER } from '../entities/character';
import { MAX_SUMMONED_MINIONS, ULTRA_BOSS_REWARD } from '../entities/boss';
import {
  MAX_TEAM_MEMBERS,
  getDefaultFormationSlot,
  getFormationSlotTurnRank,
  isFormationSlot
} from '../entities/formation';
import { createId, defaultRng, pickOne, Rng } from '../../shared/random';
import { getSkillEffectMultiplier, scaleStats } from './characterService';

const CIRO_FAROL_ID = 'beacon-keeper';
const CIRO_SHIP_ID = 'ciro-farol-frigate';
const CIRO_WARSHIP_ID = 'ciro-farol-warship';
const CIRO_SHIP_NAMES = ['Fragata do Farol I', 'Fragata do Farol II', 'Fragata do Farol III'];

type BattleLogMode = 'append' | 'prepend';

export function calculateBasicDamage(attack: number, defense: number, multiplier = 1) {
  return Math.max(1, Math.round(attack * multiplier - defense * 0.45));
}

function getBattleInputTurnRank(input: BattleCharacterInput, index: number) {
  return input.formationSlot !== undefined && isFormationSlot(input.formationSlot)
    ? getFormationSlotTurnRank(input.formationSlot)
    : index;
}

function orderBattleInputs(team: BattleCharacterInput[]) {
  return team
    .map((unit, index) => ({ unit, index }))
    .sort((a, b) => getBattleInputTurnRank(a.unit, a.index) - getBattleInputTurnRank(b.unit, b.index))
    .map(({ unit }) => unit);
}

function inputOccupiesSlot(input: BattleCharacterInput) {
  return input.occupiesSlot ?? input.combatRole !== 'minion';
}

function toCombatant(
  input: BattleCharacterInput,
  team: BattleTeam,
  instanceIndex: number,
  turnPosition: number,
  occupiesSlot: boolean
): Combatant {
  const progression = {
    weaponLevel: input.weaponLevel ?? 1,
    basicSkillLevel: input.basicSkillLevel ?? 1,
    specialSkillLevel: input.specialSkillLevel ?? 1,
    pet: input.pet
  };
  const stats = scaleStats(input.baseStats, input.level, input.stars, progression);
  const inputFormationSlot = input.formationSlot;
  const defaultFormationIndex = turnPosition >= 0 ? turnPosition : instanceIndex;
  const formationSlot = inputFormationSlot !== undefined && isFormationSlot(inputFormationSlot)
    ? inputFormationSlot
    : getDefaultFormationSlot(defaultFormationIndex);

  return {
    instanceId: `${team}-${input.id}-${instanceIndex}`,
    characterId: input.id,
    name: input.name,
    rarity: input.rarity,
    element: input.element,
    class: input.class,
    team,
    maxHealth: stats.health,
    currentHealth: stats.health,
    attack: stats.attack,
    defense: stats.defense,
    speed: stats.speed,
    weaponLevel: progression.weaponLevel,
    basicSkillLevel: progression.basicSkillLevel,
    specialSkillLevel: progression.specialSkillLevel,
    pet: progression.pet,
    equippedSkinId: input.equippedSkinId,
    formationSlot,
    turnPosition,
    occupiesSlot,
    actionCount: 0,
    defenseBuffTurns: 0,
    skipTurns: 0,
    combatRole: input.combatRole,
    minionRole: input.minionRole,
    summonedById: input.summonedById,
    basicOnly: input.basicOnly
  };
}

function toCombatants(inputs: BattleCharacterInput[], team: BattleTeam) {
  let nextTurnPosition = 0;

  return orderBattleInputs(inputs).map((unit, instanceIndex) => {
    const occupiesSlot = inputOccupiesSlot(unit);
    const turnPosition = occupiesSlot ? nextTurnPosition : -1;

    if (occupiesSlot) {
      nextTurnPosition += 1;
    }

    return toCombatant(unit, team, instanceIndex, turnPosition, occupiesSlot);
  });
}

function alive(team: Combatant[]) {
  return team.filter((unit) => unit.currentHealth > 0);
}

function compareCombatantsBySpeed(a: Combatant, b: Combatant) {
  if (b.speed !== a.speed) return b.speed - a.speed;
  return RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity];
}

function getCombatantByInstanceId(battle: InteractiveBattleState, instanceId: string) {
  return [...battle.playerTeam, ...battle.enemyTeam].find((unit) => unit.instanceId === instanceId);
}

function getPositionActor(team: Combatant[], position: number) {
  return team.find((unit) => unit.occupiesSlot && unit.turnPosition === position && unit.currentHealth > 0);
}

function getTurnPositionCount(...teams: Combatant[][]) {
  const maxTurnPosition = Math.max(
    MAX_TEAM_MEMBERS - 1,
    ...teams.flatMap((team) => team.filter((unit) => unit.occupiesSlot).map((unit) => unit.turnPosition))
  );

  return maxTurnPosition + 1;
}

function getBattleTurnPositionCount(battle: InteractiveBattleState) {
  return getTurnPositionCount(battle.playerTeam, battle.enemyTeam);
}

function buildTurnQueueForPosition(battle: InteractiveBattleState, position: number) {
  return [
    getPositionActor(battle.playerTeam, position),
    getPositionActor(battle.enemyTeam, position)
  ]
    .filter((unit): unit is Combatant => Boolean(unit))
    .sort(compareCombatantsBySpeed)
    .map((unit) => unit.instanceId);
}

function refillTurnQueue(battle: InteractiveBattleState, startPosition: number) {
  const turnPositionCount = getBattleTurnPositionCount(battle);

  for (let offset = 0; offset < turnPositionCount; offset += 1) {
    const position = (startPosition + offset) % turnPositionCount;
    const turnQueue = buildTurnQueueForPosition(battle, position);

    if (turnQueue.length > 0) {
      battle.turnPosition = position;
      battle.turnQueue = turnQueue;
      return;
    }
  }

  battle.turnQueue = [];
}

function syncTurnQueue(battle: InteractiveBattleState) {
  battle.turnQueue = battle.turnQueue.filter((instanceId) => {
    const unit = getCombatantByInstanceId(battle, instanceId);
    return Boolean(unit && unit.currentHealth > 0);
  });

  if (battle.turnQueue.length === 0) {
    refillTurnQueue(battle, battle.turnPosition);
  }
}

function advanceTurnQueue(battle: InteractiveBattleState, actor: Combatant) {
  battle.turnQueue = battle.turnQueue.filter((instanceId) => instanceId !== actor.instanceId);

  if (battle.turnQueue.some((instanceId) => (getCombatantByInstanceId(battle, instanceId)?.currentHealth ?? 0) > 0)) {
    syncTurnQueue(battle);
    return;
  }

  refillTurnQueue(battle, (battle.turnPosition + 1) % getBattleTurnPositionCount(battle));
}

export function getActiveTurnActor(battle: InteractiveBattleState) {
  const queuedActor = battle.turnQueue
    .map((instanceId) => getCombatantByInstanceId(battle, instanceId))
    .find((unit): unit is Combatant => Boolean(unit && unit.currentHealth > 0));

  if (queuedActor) {
    return queuedActor;
  }

  const turnPositionCount = getBattleTurnPositionCount(battle);

  for (let offset = 0; offset < turnPositionCount; offset += 1) {
    const position = (battle.turnPosition + offset) % turnPositionCount;
    const turnQueue = buildTurnQueueForPosition(battle, position);
    const actor = turnQueue
      .map((instanceId) => getCombatantByInstanceId(battle, instanceId))
      .find((unit): unit is Combatant => Boolean(unit && unit.currentHealth > 0));

    if (actor) {
      return actor;
    }
  }

  return undefined;
}

export function getActivePlayerActor(battle: InteractiveBattleState) {
  const actor = getActiveTurnActor(battle);
  return actor?.team === 'player' ? actor : undefined;
}

function cloneCombatant(unit: Combatant): Combatant {
  return { ...unit };
}

function cloneInteractiveBattle(battle: InteractiveBattleState): InteractiveBattleState {
  return {
    ...battle,
    logs: [...battle.logs],
    turnQueue: [...battle.turnQueue],
    playerTeam: battle.playerTeam.map(cloneCombatant),
    enemyTeam: battle.enemyTeam.map(cloneCombatant)
  };
}

function selectTarget(targets: Combatant[], rng: Rng) {
  return pickOne(alive(targets), rng);
}

function getSpecialGuardTurns(skillLevel: number) {
  return skillLevel >= 6 ? 3 : 2;
}

function getControlSpeedMultiplier(skillLevel: number) {
  return Math.max(0.78, 0.9 - Math.max(0, skillLevel - 1) * 0.01);
}

function applyDamage(target: Combatant, damage: number) {
  const reducedDamage = target.defenseBuffTurns > 0 ? Math.ceil(damage * 0.55) : damage;
  target.currentHealth = Math.max(0, target.currentHealth - reducedDamage);
  return reducedDamage;
}

function addBattleLog(logs: string[], line: string, mode: BattleLogMode) {
  if (mode === 'prepend') {
    logs.unshift(line);
    return;
  }

  logs.push(line);
}

const MINION_PROTECTION_PRIORITY: Record<MinionRole, number> = {
  tanker: 0,
  controlador: 1,
  dps: 2,
  couracado: 2,
  navio: 3
};

function getSummonedMinions(allies: Combatant[], summoner: Combatant) {
  return allies.filter((unit) => unit.combatRole === 'minion' && unit.summonedById === summoner.characterId);
}

function isCiroShip(unit: Combatant) {
  return unit.characterId === CIRO_SHIP_ID || unit.characterId === CIRO_WARSHIP_ID;
}

function getCiroShips(allies: Combatant[], actor: Combatant) {
  return getSummonedMinions(allies, actor).filter(isCiroShip);
}

function getCiroShipStats(actor: Combatant, kind: 'frigate' | 'warship') {
  const isWarship = kind === 'warship';

  return {
    maxHealth: Math.max(1, Math.round(actor.maxHealth * (isWarship ? 0.52 : 0.34))),
    attack: Math.max(1, Math.round(actor.attack * (isWarship ? 1.28 : 0.62))),
    defense: Math.max(1, Math.round(actor.defense * (isWarship ? 0.72 : 0.52))),
    speed: Math.max(20, Math.round(actor.speed * (isWarship ? 0.86 : 0.94)))
  };
}

function configureCiroShip(unit: Combatant, actor: Combatant, kind: 'frigate' | 'warship', ordinal: number) {
  const stats = getCiroShipStats(actor, kind);
  const isWarship = kind === 'warship';

  unit.characterId = isWarship ? CIRO_WARSHIP_ID : CIRO_SHIP_ID;
  unit.name = isWarship ? 'Couracado do Horizonte' : (CIRO_SHIP_NAMES[ordinal - 1] ?? `Fragata do Farol ${ordinal}`);
  unit.rarity = actor.rarity;
  unit.element = actor.element;
  unit.class = 'atacante';
  unit.team = actor.team;
  unit.maxHealth = stats.maxHealth;
  unit.currentHealth = stats.maxHealth;
  unit.attack = stats.attack;
  unit.defense = stats.defense;
  unit.speed = stats.speed;
  unit.weaponLevel = actor.weaponLevel;
  unit.basicSkillLevel = kind === 'warship' ? actor.specialSkillLevel : actor.basicSkillLevel;
  unit.specialSkillLevel = 1;
  unit.pet = undefined;
  unit.equippedSkinId = undefined;
  unit.formationSlot = actor.formationSlot;
  unit.turnPosition = -1;
  unit.occupiesSlot = false;
  unit.actionCount = 0;
  unit.defenseBuffTurns = 0;
  unit.skipTurns = 0;
  unit.combatRole = 'minion';
  unit.minionRole = isWarship ? 'couracado' : 'navio';
  unit.summonedById = actor.characterId;
  unit.basicOnly = true;
}

function createCiroShip(actor: Combatant, allies: Combatant[], kind: 'frigate' | 'warship') {
  const ships = getCiroShips(allies, actor);
  const ordinal = ships.length + 1;
  const stats = getCiroShipStats(actor, kind);
  const isWarship = kind === 'warship';

  return {
    instanceId: `${actor.team}-${actor.characterId}-${isWarship ? 'warship' : 'ship'}-${ordinal}`,
    characterId: isWarship ? CIRO_WARSHIP_ID : CIRO_SHIP_ID,
    name: isWarship ? 'Couracado do Horizonte' : (CIRO_SHIP_NAMES[ordinal - 1] ?? `Fragata do Farol ${ordinal}`),
    rarity: actor.rarity,
    element: actor.element,
    class: 'atacante',
    team: actor.team,
    maxHealth: stats.maxHealth,
    currentHealth: stats.maxHealth,
    attack: stats.attack,
    defense: stats.defense,
    speed: stats.speed,
    weaponLevel: actor.weaponLevel,
    basicSkillLevel: kind === 'warship' ? actor.specialSkillLevel : actor.basicSkillLevel,
    specialSkillLevel: 1,
    formationSlot: actor.formationSlot,
    turnPosition: -1,
    occupiesSlot: false,
    actionCount: 0,
    defenseBuffTurns: 0,
    skipTurns: 0,
    combatRole: 'minion',
    minionRole: isWarship ? 'couracado' : 'navio',
    summonedById: actor.characterId,
    basicOnly: true
  } satisfies Combatant;
}

function summonCiroShip(actor: Combatant, allies: Combatant[], kind: 'frigate' | 'warship') {
  if (actor.characterId !== CIRO_FAROL_ID || actor.combatRole === 'minion') {
    return undefined;
  }

  const ships = getCiroShips(allies, actor);
  const aliveShips = alive(ships);
  const isWarship = kind === 'warship';

  if (isWarship) {
    const activeWarship = aliveShips.find((ship) => ship.characterId === CIRO_WARSHIP_ID);

    if (activeWarship) {
      activeWarship.currentHealth = Math.min(activeWarship.maxHealth, activeWarship.currentHealth + Math.round(activeWarship.maxHealth * 0.36));
      activeWarship.defenseBuffTurns = Math.max(activeWarship.defenseBuffTurns, 1);
      return `${actor.name} reforcou ${activeWarship.name} para manter o navio de guerra na linha de fogo.`;
    }
  }

  const reusableShip =
    ships.find((ship) => ship.currentHealth <= 0 && (isWarship || ship.characterId === CIRO_SHIP_ID)) ??
    (isWarship && ships.length >= MAX_SUMMONED_MINIONS ? ships.find((ship) => ship.characterId === CIRO_SHIP_ID) : undefined);

  if (reusableShip) {
    const ordinal = Math.max(1, ships.indexOf(reusableShip) + 1);
    configureCiroShip(reusableShip, actor, kind, ordinal);
    return `${actor.name} invocou ${reusableShip.name} para comandar a frota.`;
  }

  if (ships.length < MAX_SUMMONED_MINIONS) {
    const ship = createCiroShip(actor, allies, kind);
    allies.push(ship);
    return `${actor.name} invocou ${ship.name} para a frota.`;
  }

  if (aliveShips.length > 0) {
    aliveShips.forEach((ship) => {
      ship.currentHealth = Math.min(ship.maxHealth, ship.currentHealth + Math.round(ship.maxHealth * 0.2));
      ship.defenseBuffTurns = Math.max(ship.defenseBuffTurns, ship.minionRole === 'couracado' ? 2 : 1);
    });
    return `${actor.name} manteve a frota no limite e reforcou os navios ativos.`;
  }

  return `${actor.name} tentou invocar navios, mas a rota do farol foi bloqueada.`;
}

function getBossProtector(target: Combatant, enemies: Combatant[]) {
  if (target.combatRole !== 'boss') {
    return undefined;
  }

  return alive(enemies)
    .filter((unit) => unit.combatRole === 'minion' && unit.summonedById === target.characterId)
    .sort((a, b) => {
      const aPriority = a.minionRole ? MINION_PROTECTION_PRIORITY[a.minionRole] : 99;
      const bPriority = b.minionRole ? MINION_PROTECTION_PRIORITY[b.minionRole] : 99;

      if (aPriority !== bPriority) return aPriority - bPriority;
      return b.currentHealth / b.maxHealth - a.currentHealth / a.maxHealth;
    })[0];
}

function resolveProtectedTarget(target: Combatant, enemies: Combatant[]) {
  const protector = getBossProtector(target, enemies);

  return {
    target: protector ?? target,
    protectedTarget: protector ? target : undefined
  };
}

function reinforceSummons(actor: Combatant, allies: Combatant[]) {
  const minions = getSummonedMinions(allies, actor);
  const aliveMinions = alive(minions);
  const fallenMinions = minions.filter((minion) => minion.currentHealth <= 0);

  if (fallenMinions.length > 0) {
    const reviveCount = aliveMinions.length === 0 ? fallenMinions.length : Math.min(2, fallenMinions.length);
    const revived = fallenMinions.slice(0, reviveCount);

    revived.forEach((minion) => {
      minion.currentHealth = Math.max(1, Math.round(minion.maxHealth * 0.62));
      minion.actionCount = 0;
      minion.skipTurns = 0;
      minion.defenseBuffTurns = minion.minionRole === 'tanker' ? 1 : 0;
    });

    return `${actor.name} invocou ${revived.map((minion) => minion.name).join(', ')} para recompor a linha de frente.`;
  }

  if (aliveMinions.length > 0) {
    aliveMinions.forEach((minion) => {
      minion.currentHealth = Math.min(minion.maxHealth, minion.currentHealth + Math.round(minion.maxHealth * 0.28));
      minion.defenseBuffTurns = Math.max(minion.defenseBuffTurns, minion.minionRole === 'tanker' ? 2 : 1);
    });
    return `${actor.name} reforcou os minions invocados e manteve o boss protegido.`;
  }

  return `${actor.name} tentou invocar reforcos, mas a conexao foi quebrada.`;
}

function applyBasicAttackSideEffects(actor: Combatant, target: Combatant) {
  if (actor.basicOnly && actor.minionRole === 'controlador') {
    target.speed = Math.max(20, Math.round(target.speed * 0.94));
    return ' e reduziu a velocidade';
  }

  return '';
}

function performSummonedMinionTurns(
  actor: Combatant,
  allies: Combatant[],
  enemies: Combatant[],
  logs: string[],
  rng: Rng,
  logMode: BattleLogMode
) {
  if (actor.team !== 'player' || actor.combatRole === 'minion') {
    return 0;
  }

  const minions = alive(getSummonedMinions(allies, actor)).sort(compareCombatantsBySpeed);
  let turns = 0;

  for (const minion of minions) {
    if (alive(enemies).length === 0) {
      break;
    }

    turns += 1;

    if (minion.skipTurns > 0) {
      minion.skipTurns -= 1;
      addBattleLog(logs, `${minion.name} perdeu a acao por controle.`, logMode);
      tickBuffs([minion]);
      continue;
    }

    const selectedTarget = selectTarget(enemies, rng);

    if (!selectedTarget) {
      turns -= 1;
      break;
    }

    minion.actionCount += 1;
    const { target, protectedTarget } = resolveProtectedTarget(selectedTarget, enemies);
    const damage = applyDamage(
      target,
      calculateBasicDamage(minion.attack, target.defense, getSkillEffectMultiplier(minion.basicSkillLevel))
    );
    const sideEffect = applyBasicAttackSideEffects(minion, target);
    const targetDescription = protectedTarget
      ? `${protectedTarget.name}, mas ${target.name} entrou na frente`
      : target.name;
    addBattleLog(
      logs,
      `${minion.name} atacou aleatoriamente ${targetDescription} e causou ${damage} de dano${sideEffect}.`,
      logMode
    );
    tickBuffs([minion]);
  }

  return turns;
}

function healLowestAlly(allies: Combatant[], amount: number) {
  const candidates = alive(allies).sort(
    (a, b) => a.currentHealth / a.maxHealth - b.currentHealth / b.maxHealth
  );
  const target = candidates[0];

  if (!target) {
    return undefined;
  }

  const before = target.currentHealth;
  target.currentHealth = Math.min(target.maxHealth, target.currentHealth + amount);

  return {
    target,
    amount: target.currentHealth - before
  };
}

function performAction(actor: Combatant, allies: Combatant[], enemies: Combatant[], logs: string[], rng: Rng) {
  if (actor.skipTurns > 0) {
    actor.skipTurns -= 1;
    logs.push(`${actor.name} perdeu a acao por controle.`);
    return 0;
  }

  actor.actionCount += 1;
  const useSpecial = !actor.basicOnly && actor.actionCount % 3 === 0;

  if (!useSpecial) {
    const summonLog = summonCiroShip(actor, allies, 'frigate');
    const selectedTarget = selectTarget(enemies, rng);
    const { target, protectedTarget } = resolveProtectedTarget(selectedTarget, enemies);
    const damage = applyDamage(
      target,
      calculateBasicDamage(actor.attack, target.defense, getSkillEffectMultiplier(actor.basicSkillLevel))
    );
    const sideEffect = applyBasicAttackSideEffects(actor, target);
    const targetDescription = protectedTarget
      ? `${protectedTarget.name}, mas ${target.name} entrou na frente`
      : target.name;
    if (summonLog) {
      logs.push(summonLog);
    }
    logs.push(`${actor.name} atacou ${targetDescription} e causou ${damage} de dano${sideEffect}.`);
    return performSummonedMinionTurns(actor, allies, enemies, logs, rng, 'append');
  }

  if (actor.class === 'atacante') {
    const selectedTarget = selectTarget(enemies, rng);
    const { target, protectedTarget } = resolveProtectedTarget(selectedTarget, enemies);
    const damage = applyDamage(
      target,
      calculateBasicDamage(actor.attack, target.defense, 1.75 * getSkillEffectMultiplier(actor.specialSkillLevel))
    );
    const targetDescription = protectedTarget
      ? `${protectedTarget.name}, mas ${target.name} absorveu o impacto`
      : target.name;
    logs.push(`${actor.name} usou especial ofensiva em ${targetDescription} e causou ${damage} de dano.`);
    return performSummonedMinionTurns(actor, allies, enemies, logs, rng, 'append');
  }

  if (actor.class === 'defensor') {
    actor.defenseBuffTurns = getSpecialGuardTurns(actor.specialSkillLevel);
    logs.push(`${actor.name} ativou postura defensiva e reduzira dano recebido.`);
    return 0;
  }

  if (actor.class === 'suporte') {
    const heal = healLowestAlly(allies, Math.round(actor.attack * 1.35 * getSkillEffectMultiplier(actor.specialSkillLevel)));
    if (heal) {
      logs.push(`${actor.name} curou ${heal.target.name} em ${heal.amount} de vida.`);
    }
    return 0;
  }

  if (actor.class === 'invocador') {
    logs.push(summonCiroShip(actor, allies, 'warship') ?? reinforceSummons(actor, allies));
    return performSummonedMinionTurns(actor, allies, enemies, logs, rng, 'append');
  }

  const selectedTarget = selectTarget(enemies, rng);
  const { target, protectedTarget } = resolveProtectedTarget(selectedTarget, enemies);
  const damage = applyDamage(
    target,
    calculateBasicDamage(actor.attack, target.defense, 0.85 * getSkillEffectMultiplier(actor.specialSkillLevel))
  );
  target.skipTurns += 1;
  target.speed = Math.max(20, Math.round(target.speed * getControlSpeedMultiplier(actor.specialSkillLevel)));
  const targetDescription = protectedTarget
    ? `${protectedTarget.name}, mas ${target.name} recebeu o controle`
    : target.name;
  logs.push(`${actor.name} controlou ${targetDescription}, causou ${damage} de dano e atrasou a proxima acao.`);
  return performSummonedMinionTurns(actor, allies, enemies, logs, rng, 'append');
}

function tickBuffs(units: Combatant[]) {
  units.forEach((unit) => {
    if (unit.defenseBuffTurns > 0) {
      unit.defenseBuffTurns -= 1;
    }
  });
}

function createReward(turns: number, encounterType: BattleEncounterType): BattleReward {
  if (encounterType === 'ultra-boss') {
    return {
      ...ULTRA_BOSS_REWARD,
      coins: Math.max(18000, ULTRA_BOSS_REWARD.coins - turns * 80),
      crystals: Math.max(300, ULTRA_BOSS_REWARD.crystals - turns * 4)
    };
  }

  return {
    coins: Math.max(600, 1400 - turns * 12),
    crystals: Math.max(25, 120 - turns * 2),
    levelPotions: Math.max(2, 8 - Math.floor(turns / 12))
  };
}

function resolveWinner(battle: InteractiveBattleState): BattleTeam | 'draw' | undefined {
  const playerAlive = alive(battle.playerTeam).length;
  const enemyAlive = alive(battle.enemyTeam).length;

  if (playerAlive > 0 && enemyAlive === 0) return 'player';
  if (enemyAlive > 0 && playerAlive === 0) return 'enemy';
  if (battle.turns >= 120) return 'draw';
  return undefined;
}

function finishIfNeeded(battle: InteractiveBattleState): InteractiveBattleState {
  const winner = resolveWinner(battle);

  if (!winner || battle.status === 'finished') {
    return battle;
  }

  const reward = winner === 'player' ? createReward(battle.turns, battle.encounterType) : undefined;

  return {
    ...battle,
    status: 'finished',
    winner,
    reward,
    logs: [
      `${winner === 'player' ? 'Vitoria' : winner === 'enemy' ? 'Derrota' : 'Empate'} em ${battle.turns} turno(s).`,
      ...battle.logs
    ]
  };
}

export function canUseSpecial(actor: Combatant) {
  return !actor.basicOnly && actor.actionCount >= 2;
}

function chargeSpecial(actor: Combatant) {
  actor.actionCount = Math.min(2, actor.actionCount + 1);
}

function requiresTarget(action: BattleActionType, actor: Combatant) {
  return action === 'basic' || (action === 'special' && (actor.class === 'atacante' || actor.class === 'controlador'));
}

function performManualAction({
  actor,
  allies,
  enemies,
  action,
  targetInstanceId,
  logs,
  rng,
  onExtraTurn
}: {
  actor: Combatant;
  allies: Combatant[];
  enemies: Combatant[];
  action: BattleActionType;
  targetInstanceId?: string;
  logs: string[];
  rng: Rng;
  onExtraTurn?: () => void;
}) {
  if (actor.skipTurns > 0) {
    actor.skipTurns -= 1;
    logs.unshift(`${actor.name} perdeu a acao por controle.`);
    return true;
  }

  if (action === 'special' && !canUseSpecial(actor)) {
    logs.unshift(`${actor.name} ainda esta carregando a habilidade.`);
    return false;
  }

  const target = targetInstanceId
    ? enemies.find((unit) => unit.instanceId === targetInstanceId && unit.currentHealth > 0)
    : undefined;

  if (requiresTarget(action, actor) && !target) {
    logs.unshift('Selecione um alvo valido.');
    return false;
  }

  if (action === 'guard') {
    actor.defenseBuffTurns = Math.max(actor.defenseBuffTurns, 2);
    chargeSpecial(actor);
    logs.unshift(`${actor.name} assumiu guarda e reduzira o proximo dano recebido.`);
    return true;
  }

  if (action === 'basic' && target) {
    const summonLog = summonCiroShip(actor, allies, 'frigate');
    const resolved = resolveProtectedTarget(target, enemies);
    const damage = applyDamage(
      resolved.target,
      calculateBasicDamage(actor.attack, resolved.target.defense, getSkillEffectMultiplier(actor.basicSkillLevel))
    );
    const sideEffect = applyBasicAttackSideEffects(actor, resolved.target);
    chargeSpecial(actor);
    const targetDescription = resolved.protectedTarget
      ? `${resolved.protectedTarget.name}, mas ${resolved.target.name} entrou na frente`
      : resolved.target.name;
    if (summonLog) {
      logs.unshift(summonLog);
    }
    logs.unshift(`${actor.name} atacou ${targetDescription} e causou ${damage} de dano${sideEffect}.`);
    const extraTurns = performSummonedMinionTurns(actor, allies, enemies, logs, rng, 'prepend');
    for (let turn = 0; turn < extraTurns; turn += 1) {
      onExtraTurn?.();
    }
    return true;
  }

  actor.actionCount = 0;

  if (actor.class === 'atacante' && target) {
    const resolved = resolveProtectedTarget(target, enemies);
    const damage = applyDamage(
      resolved.target,
      calculateBasicDamage(actor.attack, resolved.target.defense, 1.95 * getSkillEffectMultiplier(actor.specialSkillLevel))
    );
    const targetDescription = resolved.protectedTarget
      ? `${resolved.protectedTarget.name}, mas ${resolved.target.name} absorveu o impacto`
      : resolved.target.name;
    logs.unshift(`${actor.name} detonou a habilidade ofensiva em ${targetDescription} e causou ${damage} de dano.`);
    const extraTurns = performSummonedMinionTurns(actor, allies, enemies, logs, rng, 'prepend');
    for (let turn = 0; turn < extraTurns; turn += 1) {
      onExtraTurn?.();
    }
    return true;
  }

  if (actor.class === 'defensor') {
    const recovered = Math.min(
      Math.round(actor.maxHealth * (0.12 + Math.max(0, actor.specialSkillLevel - 1) * 0.012)),
      actor.maxHealth - actor.currentHealth
    );
    actor.currentHealth += recovered;
    actor.defenseBuffTurns = getSpecialGuardTurns(actor.specialSkillLevel) + 1;
    logs.unshift(`${actor.name} ergueu bastiao, recuperou ${recovered} de vida e reforcou a defesa.`);
    return true;
  }

  if (actor.class === 'suporte') {
    const heal = healLowestAlly(allies, Math.round(actor.attack * 1.65 * getSkillEffectMultiplier(actor.specialSkillLevel)));

    if (heal) {
      heal.target.skipTurns = 0;
      logs.unshift(`${actor.name} canalizou suporte em ${heal.target.name}, curando ${heal.amount} e limpando controle.`);
    }
    return true;
  }

  if (actor.class === 'invocador') {
    logs.unshift(summonCiroShip(actor, allies, 'warship') ?? reinforceSummons(actor, allies));
    const extraTurns = performSummonedMinionTurns(actor, allies, enemies, logs, rng, 'prepend');
    for (let turn = 0; turn < extraTurns; turn += 1) {
      onExtraTurn?.();
    }
    return true;
  }

  if (target) {
    const resolved = resolveProtectedTarget(target, enemies);
    const damage = applyDamage(
      resolved.target,
      calculateBasicDamage(actor.attack, resolved.target.defense, 1.05 * getSkillEffectMultiplier(actor.specialSkillLevel))
    );
    resolved.target.skipTurns += 1;
    resolved.target.speed = Math.max(20, Math.round(resolved.target.speed * getControlSpeedMultiplier(actor.specialSkillLevel)));
    const targetDescription = resolved.protectedTarget
      ? `${resolved.protectedTarget.name}, mas ${resolved.target.name} recebeu o controle`
      : resolved.target.name;
    logs.unshift(`${actor.name} travou ${targetDescription}, causou ${damage} de dano e atrasou a proxima acao.`);
    const extraTurns = performSummonedMinionTurns(actor, allies, enemies, logs, rng, 'prepend');
    for (let turn = 0; turn < extraTurns; turn += 1) {
      onExtraTurn?.();
    }
  }

  return true;
}

function chooseEnemyTarget(playerTeam: Combatant[], rng: Rng) {
  const wounded = alive(playerTeam).sort(
    (a, b) => a.currentHealth / a.maxHealth - b.currentHealth / b.maxHealth
  );

  return wounded[0] ?? selectTarget(playerTeam, rng);
}

export type EnemyTurnResolution = {
  battle: InteractiveBattleState;
  performed: boolean;
  actorInstanceId?: string;
  targetInstanceId?: string;
  action?: BattleActionType;
};

function performEnemyQueuedTurn(battle: InteractiveBattleState, actor: Combatant, rng: Rng): EnemyTurnResolution {
  const result: EnemyTurnResolution = {
    battle,
    performed: false,
    actorInstanceId: actor.instanceId
  };

  if (alive(battle.playerTeam).length === 0) {
    return {
      ...result,
      battle: finishIfNeeded(battle)
    };
  }

  battle.turns += 1;
  const action: BattleActionType = canUseSpecial(actor) ? 'special' : 'basic';
  const target = requiresTarget(action, actor) ? chooseEnemyTarget(battle.playerTeam, rng) : undefined;
  const controlled = actor.skipTurns > 0;
  const actionDone = performManualAction({
    actor,
    allies: battle.enemyTeam,
    enemies: battle.playerTeam,
    action,
    targetInstanceId: target?.instanceId,
    logs: battle.logs,
    rng,
    onExtraTurn: () => {
      battle.turns += 1;
    }
  });

  if (!actionDone) {
    battle.turns -= 1;
    return {
      ...result,
      action,
      targetInstanceId: target?.instanceId,
      battle: finishIfNeeded(battle)
    };
  }

  advanceTurnQueue(battle, actor);
  tickBuffs([actor]);

  return {
    battle: finishIfNeeded(battle),
    performed: true,
    actorInstanceId: actor.instanceId,
    targetInstanceId: controlled ? undefined : target?.instanceId,
    action
  };
}

export function advanceBattleToNextPlayerTurn(battle: InteractiveBattleState, rng: Rng = defaultRng) {
  const next = cloneInteractiveBattle(battle);

  while (next.status === 'active' && next.turns < 120) {
    syncTurnQueue(next);
    const actor = getActiveTurnActor(next);

    if (!actor) {
      return finishIfNeeded(next);
    }

    if (actor.team === 'player') {
      return next;
    }

    performEnemyQueuedTurn(next, actor, rng);
  }

  return finishIfNeeded(next);
}

export function performEnemyBattleAction({
  battle,
  rng = defaultRng
}: {
  battle: InteractiveBattleState;
  rng?: Rng;
}): EnemyTurnResolution {
  const next = cloneInteractiveBattle(battle);

  if (next.status === 'finished') {
    return {
      battle: next,
      performed: false
    };
  }

  syncTurnQueue(next);
  const actor = getActiveTurnActor(next);

  if (!actor) {
    return {
      battle: finishIfNeeded(next),
      performed: false
    };
  }

  if (actor.team !== 'enemy') {
    return {
      battle: next,
      performed: false,
      actorInstanceId: actor.instanceId
    };
  }

  return performEnemyQueuedTurn(next, actor, rng);
}

export function createInteractiveBattle({
  playerTeam,
  enemyTeam,
  encounterType = 'standard',
  now = new Date()
}: {
  playerTeam: BattleCharacterInput[];
  enemyTeam: BattleCharacterInput[];
  encounterType?: BattleEncounterType;
  now?: Date;
}): InteractiveBattleState {
  const battle: InteractiveBattleState = {
    id: createId('manual-battle', now),
    encounterType,
    createdAt: now.toISOString(),
    status: 'active',
    turns: 0,
    logs: [
      encounterType === 'ultra-boss'
        ? 'Erebus Prime entrou em campo e invocou uma linha de minions para proteger o Nucleo Ultra Lendario.'
        : 'Encontro iniciado. A formacao define o proximo aliado a agir.'
    ],
    playerTeam: toCombatants(playerTeam, 'player'),
    enemyTeam: toCombatants(enemyTeam, 'enemy'),
    turnPosition: 0,
    turnQueue: []
  };

  refillTurnQueue(battle, 0);
  return battle;
}

export function performPlayerBattleAction({
  battle,
  actorInstanceId,
  action,
  targetInstanceId,
  rng = defaultRng
}: {
  battle: InteractiveBattleState;
  actorInstanceId: string;
  action: BattleActionType;
  targetInstanceId?: string;
  rng?: Rng;
}) {
  if (battle.status === 'finished') {
    return battle;
  }

  const next = cloneInteractiveBattle(battle);
  syncTurnQueue(next);
  const actor = getActiveTurnActor(next);

  if (!actor) {
    next.logs.unshift('Escolha um aliado vivo para agir.');
    return next;
  }

  if (actor.team !== 'player') {
    next.logs.unshift(`E turno de ${actor.name}.`);
    return next;
  }

  if (actor.instanceId !== actorInstanceId) {
    next.logs.unshift(`E turno de ${actor.name}.`);
    return next;
  }

  next.turns += 1;
  const actionDone = performManualAction({
    actor,
    allies: next.playerTeam,
    enemies: next.enemyTeam,
    action,
    targetInstanceId,
    logs: next.logs,
    rng,
    onExtraTurn: () => {
      next.turns += 1;
    }
  });

  if (!actionDone) {
    next.turns -= 1;
    return next;
  }

  advanceTurnQueue(next, actor);
  tickBuffs([actor]);

  return finishIfNeeded(next);
}

export function toBattleReport(battle: InteractiveBattleState): BattleReport {
  return {
    id: battle.id,
    encounterType: battle.encounterType,
    createdAt: battle.createdAt,
    winner: battle.winner ?? 'draw',
    turns: battle.turns,
    logs: battle.logs,
    playerTeam: battle.playerTeam,
    enemyTeam: battle.enemyTeam,
    reward: battle.reward
  };
}

export function runAutoBattle({
  playerTeam,
  enemyTeam,
  encounterType = 'standard',
  rng = defaultRng,
  now = new Date()
}: {
  playerTeam: BattleCharacterInput[];
  enemyTeam: BattleCharacterInput[];
  encounterType?: BattleEncounterType;
  rng?: Rng;
  now?: Date;
}): BattleReport {
  const playerCombatants = toCombatants(playerTeam, 'player');
  const enemyCombatants = toCombatants(enemyTeam, 'enemy');
  const logs: string[] = [];
  let turns = 0;
  const turnPositionCount = getTurnPositionCount(playerCombatants, enemyCombatants);

  while (alive(playerCombatants).length > 0 && alive(enemyCombatants).length > 0 && turns < 120) {
    for (let position = 0; position < turnPositionCount; position += 1) {
      const turnOrder = [
        getPositionActor(playerCombatants, position),
        getPositionActor(enemyCombatants, position)
      ]
        .filter((unit): unit is Combatant => Boolean(unit))
        .sort(compareCombatantsBySpeed);

      for (const actor of turnOrder) {
        if (actor.currentHealth <= 0) continue;
        const allies = actor.team === 'player' ? playerCombatants : enemyCombatants;
        const enemies = actor.team === 'player' ? enemyCombatants : playerCombatants;

        if (alive(enemies).length === 0) break;

        turns += 1;
        turns += performAction(actor, allies, enemies, logs, rng);
        tickBuffs([actor]);

        if (alive(enemies).length === 0) break;
        if (turns >= 120) break;
      }

      if (alive(playerCombatants).length === 0 || alive(enemyCombatants).length === 0) break;
      if (turns >= 120) break;
    }
  }

  const playerAlive = alive(playerCombatants).length;
  const enemyAlive = alive(enemyCombatants).length;
  const winner: BattleTeam | 'draw' = playerAlive > 0 && enemyAlive === 0 ? 'player' : enemyAlive > 0 && playerAlive === 0 ? 'enemy' : 'draw';

  return {
    id: createId('battle', now),
    encounterType,
    createdAt: now.toISOString(),
    winner,
    turns,
    logs,
    playerTeam: playerCombatants,
    enemyTeam: enemyCombatants,
    reward: winner === 'player' ? createReward(turns, encounterType) : undefined
  };
}
