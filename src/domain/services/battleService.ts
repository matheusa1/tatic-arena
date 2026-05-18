import {
  BattleEncounterType,
  BattleActionType,
  BattleCharacterInput,
  BattleReport,
  BattleReward,
  BattleTeam,
  Combatant,
  InteractiveBattleState
} from '../entities/battle';
import { RARITY_ORDER } from '../entities/character';
import { ULTRA_BOSS_REWARD } from '../entities/boss';
import {
  MAX_TEAM_MEMBERS,
  getDefaultFormationSlot,
  getFormationSlotTurnRank,
  isFormationSlot
} from '../entities/formation';
import { createId, defaultRng, pickOne, Rng } from '../../shared/random';
import { getSkillEffectMultiplier, scaleStats } from './characterService';

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

function toCombatant(input: BattleCharacterInput, team: BattleTeam, index: number): Combatant {
  const progression = {
    weaponLevel: input.weaponLevel ?? 1,
    basicSkillLevel: input.basicSkillLevel ?? 1,
    specialSkillLevel: input.specialSkillLevel ?? 1,
    pet: input.pet
  };
  const stats = scaleStats(input.baseStats, input.level, input.stars, progression);
  const inputFormationSlot = input.formationSlot;
  const formationSlot = inputFormationSlot !== undefined && isFormationSlot(inputFormationSlot)
    ? inputFormationSlot
    : getDefaultFormationSlot(index);

  return {
    instanceId: `${team}-${input.id}-${index}`,
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
    turnPosition: index,
    actionCount: 0,
    defenseBuffTurns: 0,
    skipTurns: 0,
    combatRole: input.combatRole,
    minionRole: input.minionRole,
    summonedById: input.summonedById,
    basicOnly: input.basicOnly
  };
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
  return team.find((unit) => unit.turnPosition === position && unit.currentHealth > 0);
}

function getTurnPositionCount(...teams: Combatant[][]) {
  const maxTurnPosition = Math.max(
    MAX_TEAM_MEMBERS - 1,
    ...teams.flatMap((team) => team.map((unit) => unit.turnPosition))
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

const MINION_PROTECTION_PRIORITY = {
  tanker: 0,
  controlador: 1,
  dps: 2
};

function getSummonedMinions(allies: Combatant[], summoner: Combatant) {
  return allies.filter((unit) => unit.combatRole === 'minion' && unit.summonedById === summoner.characterId);
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
    return;
  }

  actor.actionCount += 1;
  const useSpecial = !actor.basicOnly && actor.actionCount % 3 === 0;

  if (!useSpecial) {
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
    logs.push(`${actor.name} atacou ${targetDescription} e causou ${damage} de dano${sideEffect}.`);
    return;
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
    return;
  }

  if (actor.class === 'defensor') {
    actor.defenseBuffTurns = getSpecialGuardTurns(actor.specialSkillLevel);
    logs.push(`${actor.name} ativou postura defensiva e reduzira dano recebido.`);
    return;
  }

  if (actor.class === 'suporte') {
    const heal = healLowestAlly(allies, Math.round(actor.attack * 1.35 * getSkillEffectMultiplier(actor.specialSkillLevel)));
    if (heal) {
      logs.push(`${actor.name} curou ${heal.target.name} em ${heal.amount} de vida.`);
    }
    return;
  }

  if (actor.class === 'invocador') {
    logs.push(reinforceSummons(actor, allies));
    return;
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
  rng
}: {
  actor: Combatant;
  allies: Combatant[];
  enemies: Combatant[];
  action: BattleActionType;
  targetInstanceId?: string;
  logs: string[];
  rng: Rng;
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
    logs.unshift(`${actor.name} atacou ${targetDescription} e causou ${damage} de dano${sideEffect}.`);
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
    logs.unshift(reinforceSummons(actor, allies));
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
    rng
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
    playerTeam: orderBattleInputs(playerTeam).map((unit, index) => toCombatant(unit, 'player', index)),
    enemyTeam: orderBattleInputs(enemyTeam).map((unit, index) => toCombatant(unit, 'enemy', index)),
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
    rng
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
  const playerCombatants = orderBattleInputs(playerTeam).map((unit, index) => toCombatant(unit, 'player', index));
  const enemyCombatants = orderBattleInputs(enemyTeam).map((unit, index) => toCombatant(unit, 'enemy', index));
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
        performAction(actor, allies, enemies, logs, rng);
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
