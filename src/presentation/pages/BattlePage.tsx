import {
  AimOutlined,
  CrownOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { Alert, Button, Card, Col, Empty, Progress, Row, Space, Tag, Typography } from 'antd';
import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { BattleActionType, BattleCharacterInput, BattleReport, Combatant, InteractiveBattleState } from '../../domain/entities/battle';
import { MINION_ROLE_LABEL, ULTRA_BOSS, ULTRA_BOSS_DROP_NAME, createUltraBossEnemyTeam } from '../../domain/entities/boss';
import { CHARACTER_CATALOG, CHARACTER_SKIN_BY_ID } from '../../domain/entities/characters';
import {
  CharacterProfile,
  MAX_SKILL_LEVEL,
  PET_BY_ID,
  ULTRA_MAX_SKILL_LEVEL,
  ULTRA_MAX_SKILL_STAT_BONUS
} from '../../domain/entities/character';
import {
  FORMATION_TURN_ORDER,
  getFormationEntries
} from '../../domain/entities/formation';
import {
  canUseSpecial,
  createInteractiveBattle,
  getActivePlayerActor,
  getActiveTurnActor,
  performEnemyBattleAction,
  performPlayerBattleAction,
  toBattleReport
} from '../../domain/services/battleService';
import { buildCharacterProfiles, scaleStats } from '../../domain/services/characterService';
import { formatNumber } from '../../shared/formatters';
import { CharacterCard } from '../components/CharacterCard';
import { CharacterDetailsModal } from '../components/CharacterDetailsModal';
import { PageHeader } from '../components/PageHeader';
import { notifyAction, useGameStore } from '../hooks/useGameStore';

type BattleAnimation = {
  id: number;
  actorId: string;
  targetId?: string;
  action: BattleActionType;
};

type TeamFormationProfile = {
  character: CharacterProfile;
  formationSlot: number;
};

const ENEMY_TURN_DELAY_MS = 1400;
const ENEMY_TURN_PROGRESS_TICK_MS = 80;

function toBattleInput({ character, formationSlot }: TeamFormationProfile): BattleCharacterInput {
  return {
    id: character.id,
    name: character.name,
    rarity: character.rarity,
    element: character.element,
    class: character.class,
    level: character.level,
    stars: character.stars,
    baseStats: character.baseStats,
    weaponLevel: character.weaponLevel,
    basicSkillLevel: character.basicSkillLevel,
    specialSkillLevel: character.specialSkillLevel,
    pet: character.pet,
    equippedSkinId: character.equippedSkinId,
    formationSlot
  };
}

function createEnemyTeam(): BattleCharacterInput[] {
  const candidates = CHARACTER_CATALOG.filter((character) => character.rarity === 'comum' || character.rarity === 'raro');

  return candidates.slice(3, 6).map((character, index) => ({
    id: character.id,
    name: `Eco de ${character.name}`,
    rarity: character.rarity,
    element: character.element,
    class: character.class,
    level: 1,
    stars: 1,
    baseStats: {
      health: Math.round(character.baseStats.health * 0.86),
      attack: Math.round(character.baseStats.attack * 0.86),
      defense: Math.round(character.baseStats.defense * 0.84),
      speed: Math.round(character.baseStats.speed * 0.92)
    },
    formationSlot: FORMATION_TURN_ORDER[index]
  }));
}

function firstAlive(units: Combatant[]) {
  return units.find((unit) => unit.currentHealth > 0);
}

function healthPercent(unit: Combatant) {
  return Math.max(0, Math.round((unit.currentHealth / unit.maxHealth) * 100));
}

function formatBattleReward(report: BattleReport) {
  if (!report.reward) {
    return undefined;
  }

  const parts = [
    `${formatNumber(report.reward.coins)} moedas`,
    `${formatNumber(report.reward.crystals)} cristais`,
    `${formatNumber(report.reward.levelPotions)} pocoes`
  ];

  if (report.reward.ultraCores) {
    parts.push(`${report.reward.ultraCores} ${ULTRA_BOSS_DROP_NAME}`);
  }

  return parts.join(' + ');
}

function actionNeedsTarget(action: BattleActionType, actor: Combatant) {
  return action === 'basic' || (action === 'special' && (actor.class === 'atacante' || actor.class === 'controlador'));
}

function specialDescription(actor: Combatant | undefined) {
  if (!actor) return 'Habilidade';
  if (actor.class === 'atacante') return 'Especial: dano alto em um inimigo.';
  if (actor.class === 'defensor') return 'Especial: cura leve e defesa reforcada.';
  if (actor.class === 'suporte') return 'Especial: cura o aliado mais ferido e limpa controle.';
  if (actor.class === 'invocador') return 'Especial: invoca ou reforca minions para proteger o boss.';
  return 'Especial: dano, atraso e controle em um inimigo.';
}

function getDamagedEnemyId(before: InteractiveBattleState, after: InteractiveBattleState) {
  return after.enemyTeam.find((unit) => {
    const previous = before.enemyTeam.find((candidate) => candidate.instanceId === unit.instanceId);

    return previous && unit.currentHealth < previous.currentHealth;
  })?.instanceId;
}

function combatSkillLevelLabel(level: number) {
  if (level >= ULTRA_MAX_SKILL_LEVEL) {
    return 'UM';
  }

  if (level >= MAX_SKILL_LEVEL) {
    return 'MAX';
  }

  return String(level);
}

function CombatantCard({
  unit,
  selected,
  selectable,
  animationRole,
  onInspect,
  onSelect
}: {
  unit: Combatant;
  selected: boolean;
  selectable: boolean;
  animationRole?: 'attack' | 'skill' | 'guard' | 'hit';
  onInspect?: () => void;
  onSelect: () => void;
}) {
  const dead = unit.currentHealth <= 0;
  const hp = healthPercent(unit);
  const skin = unit.equippedSkinId ? CHARACTER_SKIN_BY_ID[unit.equippedSkinId] : undefined;
  const hasLegendarySkinAura = unit.rarity === 'lendário' && Boolean(skin);
  const isBoss = unit.combatRole === 'boss' || unit.characterId === ULTRA_BOSS.id;
  const isMinion = unit.combatRole === 'minion';
  const selectedColor = isBoss ? '#f97316' : isMinion ? '#22c55e' : skin?.visual.primaryColor ?? '#f59e0b';
  const skinStyle = skin
    ? ({
        '--skin-primary': skin.visual.primaryColor,
        '--skin-secondary': skin.visual.secondaryColor
      } as CSSProperties)
    : undefined;
  const cardClassName = [
    'glass-card',
    'combatant-card',
    skin ? 'combatant-card-skinned' : '',
    hasLegendarySkinAura ? 'legendary-skin-aura' : '',
    isBoss ? 'combatant-card-boss' : '',
    isMinion ? `combatant-card-minion combatant-card-minion-${unit.minionRole ?? 'generic'}` : '',
    animationRole ? `combatant-card-${animationRole}` : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Card
      className={cardClassName}
      size="small"
      onClick={selectable && !dead ? onSelect : undefined}
      style={{
        cursor: selectable && !dead ? 'pointer' : 'default',
        opacity: dead ? 0.5 : 1,
        borderColor: selected ? selectedColor : undefined,
        boxShadow: selected
          ? isBoss
            ? `0 0 0 2px ${selectedColor}, 0 0 38px rgba(249, 115, 22, 0.42), 0 22px 52px rgba(127, 29, 29, 0.24)`
            : `0 0 0 2px ${selectedColor}`
          : undefined,
        ...skinStyle
      }}
    >
      {hasLegendarySkinAura ? <span className="legendary-card-aura" aria-hidden="true" /> : null}
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {isBoss ? (
          <div className="boss-combatant-header">
            <div className="boss-combatant-sigil">
              <CrownOutlined />
            </div>
            <div className="boss-combatant-title">
              <Typography.Text className="boss-combatant-eyebrow">Boss raid</Typography.Text>
              <Typography.Text className="boss-combatant-name">{unit.name}</Typography.Text>
            </div>
            <Tag color="volcano">AMEAÇA</Tag>
          </div>
        ) : null}
        <Space wrap size={[4, 4]}>
          <Tag color={unit.team === 'player' ? 'green' : 'red'}>{unit.team === 'player' ? 'Aliado' : 'Inimigo'}</Tag>
          {isBoss ? <Tag color="gold">BOSS</Tag> : null}
          {isMinion ? <Tag color="green">MINION {unit.minionRole ? MINION_ROLE_LABEL[unit.minionRole] : ''}</Tag> : null}
          {isMinion ? <Tag color="lime">Protege boss</Tag> : null}
          <Tag>{unit.element}</Tag>
          <Tag>{unit.class}</Tag>
          <Tag color="geekblue">Posicao {unit.turnPosition + 1}</Tag>
          <Tag>Arma {unit.weaponLevel}</Tag>
          {unit.pet ? <Tag color="cyan">Pet {PET_BY_ID[unit.pet.id]?.name ?? unit.pet.id}</Tag> : null}
          {skin ? <Tag color="gold">{skin.name}</Tag> : null}
          {unit.defenseBuffTurns > 0 ? <Tag color="blue">Guarda {unit.defenseBuffTurns}</Tag> : null}
          {unit.skipTurns > 0 ? <Tag color="purple">Controle</Tag> : null}
        </Space>
        {!isBoss ? <Typography.Text strong>{unit.name}</Typography.Text> : null}
        <Progress
          percent={hp}
          size="small"
          status={hp <= 25 ? 'exception' : 'active'}
          format={() => `${unit.currentHealth}/${unit.maxHealth}`}
        />
        <Space wrap size={[8, 4]}>
          <Typography.Text type="secondary">ATQ {unit.attack}</Typography.Text>
          <Typography.Text type="secondary">DEF {unit.defense}</Typography.Text>
          <Typography.Text type="secondary">VEL {unit.speed}</Typography.Text>
          <Typography.Text type="secondary">
            HAB {combatSkillLevelLabel(unit.basicSkillLevel)}/{combatSkillLevelLabel(unit.specialSkillLevel)}
          </Typography.Text>
          <Typography.Text type={canUseSpecial(unit) ? 'success' : 'secondary'}>
            {unit.basicOnly ? 'Ataque basico' : `Energia ${Math.min(2, unit.actionCount)}/2`}
          </Typography.Text>
        </Space>
        {onInspect ? (
          <Button
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onInspect();
            }}
          >
            Ver personagem
          </Button>
        ) : null}
      </Space>
    </Card>
  );
}

function VictoryConfetti({ active }: { active: boolean }) {
  if (!active) {
    return null;
  }

  const colors = ['#f59e0b', '#ef4444', '#22c55e', '#06b6d4', '#8b5cf6', '#f97316'];
  const particles = Array.from({ length: 64 }, (_, index) => ({
    id: index,
    left: `${(index * 19) % 100}%`,
    color: colors[index % colors.length],
    delay: `${(index % 14) * 0.045}s`,
    duration: `${1.7 + (index % 9) * 0.12}s`,
    width: `${7 + (index % 4) * 3}px`,
    height: `${10 + (index % 5) * 4}px`
  }));

  return (
    <div className="victory-confetti" aria-hidden="true">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="victory-confetti-piece"
          style={{
            left: particle.left,
            width: particle.width,
            height: particle.height,
            backgroundColor: particle.color,
            animationDelay: particle.delay,
            animationDuration: particle.duration
          }}
        />
      ))}
    </div>
  );
}

function UltraBossCard({
  disabled,
  ultraCores,
  onStart
}: {
  disabled: boolean;
  ultraCores: number;
  onStart: () => void;
}) {
  const bossStats = scaleStats(
    ULTRA_BOSS.baseStats,
    ULTRA_BOSS.level,
    ULTRA_BOSS.stars,
    {
      weaponLevel: ULTRA_BOSS.weaponLevel ?? 1,
      basicSkillLevel: ULTRA_BOSS.basicSkillLevel ?? 1,
      specialSkillLevel: ULTRA_BOSS.specialSkillLevel ?? 1
    }
  );

  return (
    <Card className="ultra-boss-card">
      <div className="ultra-boss-layout">
        <div className="ultra-boss-portrait" aria-hidden="true">
          <div className="ultra-boss-crown">
            <span />
            <span />
            <span />
          </div>
          <div className="ultra-boss-mask">
            <span />
            <span />
          </div>
          <div className="ultra-boss-core" />
          <div className="ultra-boss-blades">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="ultra-boss-content">
          <Space wrap size={[6, 6]}>
            <Tag color="gold">BOSS LENDARIO</Tag>
            <Tag color="volcano">RAID ULTRA</Tag>
            <Tag color="green">INVOCADOR</Tag>
            <Tag color="purple">SOMBRA</Tag>
            <Tag color="cyan">DROP GARANTIDO</Tag>
          </Space>
          <Typography.Title level={2} className="ultra-boss-name">
            {ULTRA_BOSS.name}
          </Typography.Title>
          <Typography.Text className="ultra-boss-subtitle">Arconte invocador do ULTRA MAX</Typography.Text>
          <Typography.Paragraph className="ultra-boss-copy">
            Um boss de fim de jogo feito para equipes no limite. Erebus causa pouco dano direto, mas mantem
            minions na frente dele: tanker, DPS e controlador absorvem golpes enquanto estiverem vivos.
          </Typography.Paragraph>

          <div className="ultra-boss-stat-grid">
            <div>
              <span>VIDA</span>
              <strong>{bossStats.health}</strong>
            </div>
            <div>
              <span>ATQ</span>
              <strong>{bossStats.attack}</strong>
            </div>
            <div>
              <span>DEF</span>
              <strong>{bossStats.defense}</strong>
            </div>
            <div>
              <span>VEL</span>
              <strong>{bossStats.speed}</strong>
            </div>
          </div>

          <div className="ultra-boss-drop">
            <div className="ultra-drop-icon">UM</div>
            <div>
              <Typography.Text strong>{ULTRA_BOSS_DROP_NAME}</Typography.Text>
              <br />
              <Typography.Text>
                Ascende uma habilidade MAX para ULTRA MAX e libera +
                {Math.round(ULTRA_MAX_SKILL_STAT_BONUS * 100)}% em todos os status.
              </Typography.Text>
            </div>
          </div>

          <Space wrap className="ultra-boss-actions">
            <Button type="primary" size="large" icon={<CrownOutlined />} onClick={onStart} disabled={disabled}>
              Desafiar boss
            </Button>
            <Typography.Text className="ultra-boss-inventory">No inventario: {ultraCores}</Typography.Text>
          </Space>
        </div>
      </div>
    </Card>
  );
}

function BattleResult({ report, showLog = true }: { report: BattleReport; showLog?: boolean }) {
  const rewardDescription = formatBattleReward(report);

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={showLog ? 8 : 24}>
        <Card className="glass-card" title="Resultado">
          <Space direction="vertical">
            <Tag color={report.winner === 'player' ? 'green' : report.winner === 'enemy' ? 'red' : 'gold'}>
              {report.winner === 'player' ? 'Vitoria' : report.winner === 'enemy' ? 'Derrota' : 'Empate'}
            </Tag>
            <Typography.Text>Turnos: {report.turns}</Typography.Text>
            {rewardDescription ? <Typography.Text>Recompensa: {rewardDescription}</Typography.Text> : null}
          </Space>
        </Card>
      </Col>
      {showLog ? (
        <Col xs={24} lg={16}>
          <Card className="glass-card" title="Log de combate">
            <div className="battle-log">
              {report.logs.map((line, index) => (
                <p key={`${line}-${index}`}>{line}</p>
              ))}
            </div>
          </Card>
        </Col>
      ) : null}
    </Row>
  );
}

export function BattlePage() {
  const roster = useGameStore((store) => store.roster);
  const formation = useGameStore((store) => store.formation);
  const team = useGameStore((store) => store.team);
  const ultraCores = useGameStore((store) => store.ultraCores);
  const lastBattle = useGameStore((store) => store.lastBattle);
  const startBattle = useGameStore((store) => store.startBattle);
  const completeBattle = useGameStore((store) => store.completeBattle);
  const [battle, setBattle] = useState<InteractiveBattleState>();
  const [selectedTargetId, setSelectedTargetId] = useState<string>();
  const [selectedAction, setSelectedAction] = useState<BattleActionType>('basic');
  const [battleAnimation, setBattleAnimation] = useState<BattleAnimation>();
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>();
  const [enemyTurnProgress, setEnemyTurnProgress] = useState(0);
  const profiles = buildCharacterProfiles(CHARACTER_CATALOG, roster);
  const teamProfiles = useMemo(
    () =>
      getFormationEntries(formation, team)
        .map((entry) => {
          const character = profiles.find((profile) => profile.id === entry.characterId);

          return character ? { character, formationSlot: entry.slot } : undefined;
        })
        .filter((entry): entry is TeamFormationProfile => Boolean(entry)),
    [formation, profiles, team]
  );
  const activeActor = battle ? getActiveTurnActor(battle) : undefined;
  const activeEnemy = activeActor?.team === 'enemy' ? activeActor : undefined;
  const enemyTurnActive = Boolean(activeEnemy);
  const selectedActor = battle ? getActivePlayerActor(battle) : undefined;
  const selectedTarget = battle?.enemyTeam.find((unit) => unit.instanceId === selectedTargetId && unit.currentHealth > 0);
  const queuedTurnActors = battle
    ? battle.turnQueue
        .map((instanceId) => [...battle.playerTeam, ...battle.enemyTeam].find((unit) => unit.instanceId === instanceId))
        .filter((unit): unit is Combatant => Boolean(unit && unit.currentHealth > 0))
    : [];
  const hasSummonerBoss = Boolean(battle?.enemyTeam.some((unit) => unit.combatRole === 'boss'));
  const enemyMinions = battle?.enemyTeam.filter((unit) => unit.combatRole === 'minion') ?? [];
  const enemyBosses = battle?.enemyTeam.filter((unit) => unit.combatRole === 'boss') ?? [];
  const regularEnemies = battle?.enemyTeam.filter((unit) => unit.combatRole !== 'minion' && unit.combatRole !== 'boss') ?? [];
  const targetRequired = selectedActor ? actionNeedsTarget(selectedAction, selectedActor) : false;
  const specialReady = selectedActor ? canUseSpecial(selectedActor) : false;
  const canExecute =
    battle?.status === 'active' &&
    Boolean(selectedActor) &&
    !enemyTurnActive &&
    (selectedAction !== 'special' || specialReady) &&
    (!targetRequired || Boolean(selectedTarget));

  function syncSelection(nextBattle: InteractiveBattleState) {
    setSelectedTargetId(firstAlive(nextBattle.enemyTeam)?.instanceId);
    setSelectedAction('basic');
  }

  function triggerBattleAnimation(animation: Omit<BattleAnimation, 'id'>) {
    const nextAnimation = {
      ...animation,
      id: Date.now()
    };

    setBattleAnimation(nextAnimation);
    window.setTimeout(() => {
      setBattleAnimation((current) => (current?.id === nextAnimation.id ? undefined : current));
    }, 720);
  }

  function startManualBattle() {
    const playerTeam = teamProfiles.filter((entry) => entry.character.unlocked).map(toBattleInput);

    if (playerTeam.length === 0) {
      notifyAction({ ok: false, message: 'Monte uma equipe antes de iniciar a batalha.' });
      return;
    }

    const nextBattle = createInteractiveBattle({
      playerTeam,
      enemyTeam: createEnemyTeam()
    });
    setSelectedCharacterId(undefined);
    setBattle(nextBattle);
    syncSelection(nextBattle);
    finishManualBattle(nextBattle);
  }

  function startBossBattle() {
    const playerTeam = teamProfiles.filter((entry) => entry.character.unlocked).map(toBattleInput);

    if (playerTeam.length === 0) {
      notifyAction({ ok: false, message: 'Monte uma equipe antes de desafiar o boss.' });
      return;
    }

    const nextBattle = createInteractiveBattle({
      playerTeam,
      enemyTeam: createUltraBossEnemyTeam(),
      encounterType: 'ultra-boss'
    });
    setSelectedCharacterId(undefined);
    setBattle(nextBattle);
    syncSelection(nextBattle);
    finishManualBattle(nextBattle);
  }

  function runAutomaticBattle() {
    setSelectedCharacterId(undefined);
    setBattle(undefined);
    notifyAction(startBattle());
  }

  function finishManualBattle(nextBattle: InteractiveBattleState) {
    if (nextBattle.status !== 'finished') {
      return;
    }

    notifyAction(completeBattle(toBattleReport(nextBattle)));
  }

  function executeAction() {
    if (!battle || !selectedActor) {
      notifyAction({ ok: false, message: 'Escolha um aliado para agir.' });
      return;
    }

    if (selectedAction === 'special' && !specialReady) {
      notifyAction({ ok: false, message: 'A habilidade ainda esta carregando.' });
      return;
    }

    if (targetRequired && !selectedTarget) {
      notifyAction({ ok: false, message: 'Escolha um alvo inimigo.' });
      return;
    }

    const nextBattle = performPlayerBattleAction({
      battle,
      actorInstanceId: selectedActor.instanceId,
      action: selectedAction,
      targetInstanceId: selectedTarget?.instanceId
    });
    const damagedEnemyId = getDamagedEnemyId(battle, nextBattle);

    triggerBattleAnimation({
      actorId: selectedActor.instanceId,
      targetId: targetRequired ? damagedEnemyId ?? selectedTarget?.instanceId : undefined,
      action: selectedAction
    });
    setBattle(nextBattle);
    syncSelection(nextBattle);
    finishManualBattle(nextBattle);
  }

  useEffect(() => {
    if (!battle || battle.status !== 'active') {
      setEnemyTurnProgress(0);
      return;
    }

    const enemyActor = getActiveTurnActor(battle);

    if (!enemyActor || enemyActor.team !== 'enemy') {
      setEnemyTurnProgress(0);
      return;
    }

    const startedAt = Date.now();
    setEnemyTurnProgress(0);

    const progressTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setEnemyTurnProgress(Math.min(100, Math.round((elapsed / ENEMY_TURN_DELAY_MS) * 100)));
    }, ENEMY_TURN_PROGRESS_TICK_MS);

    const actionTimer = window.setTimeout(() => {
      const result = performEnemyBattleAction({ battle });

      if (result.performed && result.actorInstanceId && result.action) {
        triggerBattleAnimation({
          actorId: result.actorInstanceId,
          targetId: result.targetInstanceId,
          action: result.action
        });
      }

      setBattle(result.battle);
      syncSelection(result.battle);
      finishManualBattle(result.battle);
      setEnemyTurnProgress(0);
    }, ENEMY_TURN_DELAY_MS);

    return () => {
      window.clearInterval(progressTimer);
      window.clearTimeout(actionTimer);
    };
  }, [battle]);

  function getAnimationRole(unit: Combatant): 'attack' | 'skill' | 'guard' | 'hit' | undefined {
    if (unit.instanceId === battleAnimation?.targetId) {
      return 'hit';
    }

    if (unit.instanceId !== battleAnimation?.actorId) {
      return undefined;
    }

    if (battleAnimation.action === 'guard') {
      return 'guard';
    }

    if (battleAnimation.action === 'special') {
      return 'skill';
    }

    return 'attack';
  }

  function renderEnemyCombatantCard(unit: Combatant) {
    return (
      <CombatantCard
        key={unit.instanceId}
        unit={unit}
        selectable={Boolean(battle?.status === 'active' && !enemyTurnActive)}
        selected={unit.instanceId === activeEnemy?.instanceId || (!activeEnemy && unit.instanceId === selectedTargetId)}
        animationRole={getAnimationRole(unit)}
        onSelect={() => setSelectedTargetId(unit.instanceId)}
      />
    );
  }

  const currentReport = battle?.status === 'finished' ? toBattleReport(battle) : undefined;

  return (
    <>
      <VictoryConfetti active={currentReport?.winner === 'player'} />
      <PageHeader
        kicker="Turnos manuais"
        title="Batalha"
        description="A formacao 3x3 define o aliado da vez. Vitorias concedem moedas, cristais e pocoes para manter a progressao."
        extra={
          <Space wrap>
            <Button type="primary" size="large" icon={<PlayCircleOutlined />} onClick={startManualBattle}>
              Novo encontro
            </Button>
            <Button size="large" icon={<ReloadOutlined />} onClick={runAutomaticBattle}>
              Resolver auto
            </Button>
          </Space>
        }
      />

      {!battle ? (
        <>
          <UltraBossCard
            disabled={teamProfiles.length === 0}
            ultraCores={ultraCores}
            onStart={startBossBattle}
          />

          <Typography.Title level={3}>Sua equipe</Typography.Title>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            {teamProfiles.map((entry) => (
              <Col xs={24} md={8} key={entry.character.id}>
                <CharacterCard
                  character={entry.character}
                  compact
                  selected
                  actionLabel="Ver personagem"
                  onAction={() => setSelectedCharacterId(entry.character.id)}
                />
              </Col>
            ))}
          </Row>

          {!lastBattle ? (
            <Card className="glass-card">
              <Empty description="Nenhuma batalha executada ainda." />
            </Card>
          ) : (
            <BattleResult report={lastBattle} />
          )}
        </>
      ) : (
        <>
          <Alert
            showIcon
            type={battle.status === 'finished' ? 'success' : 'info'}
            message={
              battle.status === 'finished'
                ? battle.winner === 'player'
                  ? 'Vitoria registrada'
                  : battle.winner === 'enemy'
                    ? 'Derrota registrada'
                    : 'Empate registrado'
                : activeEnemy
                  ? 'Turno inimigo'
                : battle.encounterType === 'ultra-boss'
                  ? 'Boss Ultra Max em andamento'
                  : 'Escolha sua jogada'
            }
            description={
              battle.status === 'finished'
                ? 'Inicie um novo encontro para lutar novamente.'
                : activeEnemy
                  ? `${activeEnemy.name} esta preparando a acao.`
                : selectedActor
                  ? `${selectedActor.name} pronto para agir. ${specialDescription(selectedActor)}`
                  : 'Escolha um aliado vivo.'
            }
            style={{ marginBottom: 16 }}
          />

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={10}>
              <Card className="glass-card" title="Aliados">
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {battle.playerTeam.map((unit) => (
                    <CombatantCard
                      key={unit.instanceId}
                      unit={unit}
                      selectable={false}
                      selected={unit.instanceId === selectedActor?.instanceId}
                      animationRole={getAnimationRole(unit)}
                      onInspect={
                        battle.status === 'finished' ? () => setSelectedCharacterId(unit.characterId) : undefined
                      }
                      onSelect={() => undefined}
                    />
                  ))}
                </Space>
              </Card>
            </Col>

            <Col xs={24} lg={4}>
              <Card className="glass-card" title="Acao">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Typography.Text strong>{activeActor ? `Turno de ${activeActor.name}` : 'Fila vazia'}</Typography.Text>
                  {queuedTurnActors.length > 0 ? (
                    <Space wrap size={[4, 4]}>
                      {queuedTurnActors.map((unit, index) => (
                        <Tag key={unit.instanceId} color={unit.team === 'player' ? 'green' : 'red'}>
                          {index === 0 ? 'Agora' : 'Depois'}: {unit.name}
                        </Tag>
                      ))}
                    </Space>
                  ) : null}
                  {activeEnemy ? (
                    <>
                      <Progress percent={enemyTurnProgress} size="small" status="active" showInfo={false} />
                      <Typography.Text type="secondary">Inimigo executando...</Typography.Text>
                    </>
                  ) : null}
                  <Button
                    block
                    icon={<AimOutlined />}
                    type={selectedAction === 'basic' ? 'primary' : 'default'}
                    onClick={() => setSelectedAction('basic')}
                    disabled={battle.status === 'finished' || enemyTurnActive}
                  >
                    Ataque
                  </Button>
                  <Button
                    block
                    icon={<ThunderboltOutlined />}
                    type={selectedAction === 'special' ? 'primary' : 'default'}
                    onClick={() => setSelectedAction('special')}
                    disabled={battle.status === 'finished' || enemyTurnActive || !specialReady}
                  >
                    Habilidade
                  </Button>
                  <Button
                    block
                    icon={<SafetyCertificateOutlined />}
                    type={selectedAction === 'guard' ? 'primary' : 'default'}
                    onClick={() => setSelectedAction('guard')}
                    disabled={battle.status === 'finished' || enemyTurnActive}
                  >
                    Guarda
                  </Button>
                  <Button block type="primary" onClick={executeAction} disabled={!canExecute}>
                    Executar
                  </Button>
                </Space>
              </Card>
            </Col>

            <Col xs={24} lg={10}>
              <Card className="glass-card" title="Inimigos">
                {hasSummonerBoss ? (
                  <div className="summoner-enemy-stage">
                    <div className="summoner-minion-frontline">
                      {enemyMinions.map(renderEnemyCombatantCard)}
                    </div>
                    <div className="summoner-boss-backline">
                      {[...enemyBosses, ...regularEnemies].map(renderEnemyCombatantCard)}
                    </div>
                  </div>
                ) : (
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {battle.enemyTeam.map(renderEnemyCombatantCard)}
                  </Space>
                )}
              </Card>
            </Col>
          </Row>

          <Card className="glass-card" title="Log de combate" style={{ marginTop: 16 }}>
            <div className="battle-log">
              {battle.logs.map((line, index) => (
                <p key={`${line}-${index}`}>{line}</p>
              ))}
            </div>
          </Card>

          {currentReport ? (
            <div style={{ marginTop: 16 }}>
              <BattleResult report={currentReport} showLog={false} />
            </div>
          ) : null}
        </>
      )}
      {!battle ? (
        <CharacterDetailsModal
          characterId={selectedCharacterId}
          open={Boolean(selectedCharacterId)}
          onClose={() => setSelectedCharacterId(undefined)}
        />
      ) : null}
      {battle?.status === 'finished' ? (
        <CharacterDetailsModal
          characterId={selectedCharacterId}
          open={Boolean(selectedCharacterId)}
          onClose={() => setSelectedCharacterId(undefined)}
        />
      ) : null}
    </>
  );
}
