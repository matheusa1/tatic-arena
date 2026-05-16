import { Button, Card, Col, Modal, Progress, Row, Space, Statistic, Typography } from 'antd';
import { CHARACTER_CATALOG, CHARACTER_SKIN_CATALOG } from '../../domain/entities/characters';
import { buildCharacterProfiles, getCharacterPower } from '../../domain/services/characterService';
import { getClaimableMilestones } from '../../domain/services/eventService';
import { EVENT_CONFIG, EVENT_MILESTONES } from '../../shared/constants';
import { formatNumber } from '../../shared/formatters';
import { CharacterCard } from '../components/CharacterCard';
import { PageHeader } from '../components/PageHeader';
import { useGameStore } from '../hooks/useGameStore';

export function DashboardPage() {
  const state = useGameStore();
  const resetGame = useGameStore((store) => store.resetGame);
  const profiles = buildCharacterProfiles(CHARACTER_CATALOG, state.roster);
  const unlockedCount = profiles.filter((character) => character.unlocked).length;
  const teamProfiles = state.team
    .map((id) => profiles.find((character) => character.id === id))
    .filter((character): character is NonNullable<typeof character> => Boolean(character));
  const teamPower = teamProfiles.reduce((total, character) => total + getCharacterPower(character), 0);
  const activePets = profiles.filter((character) => character.pet).length;
  const ownedSkinCount = state.skinInventory.ownedSkinIds.length;
  const nextMilestone = EVENT_MILESTONES.find(
    (milestone) => !state.event.claimedMilestoneIds.includes(milestone.id)
  );
  const maxMilestone = EVENT_MILESTONES[EVENT_MILESTONES.length - 1].crystalsRequired;
  const eventProgress = Math.min(100, Math.round((state.event.crystalsSpent / maxMilestone) * 100));
  const claimableCount = getClaimableMilestones(state.event).length;

  return (
    <>
      <PageHeader
        kicker="Conta local"
        title="Dashboard"
        description="Progresso salvo no navegador. Cristais e moedas sao ficticios e distribuidos apenas para testes do MVP."
        extra={
          <Button
            danger
            onClick={() =>
              Modal.confirm({
                title: 'Resetar conta local?',
                content: 'Isso apaga o progresso salvo neste navegador.',
                okText: 'Resetar',
                cancelText: 'Cancelar',
                onOk: resetGame
              })
            }
          >
            Resetar progresso
          </Button>
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-card metric-card">
            <Statistic title="Moedas comuns" value={state.coins} formatter={(value) => formatNumber(Number(value))} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-card metric-card">
            <Statistic title="Cristais ficticios" value={state.crystals} formatter={(value) => formatNumber(Number(value))} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-card metric-card">
            <Statistic title="Pocoes de nivel" value={state.levelPotions} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-card metric-card">
            <Statistic title="Personagens" value={`${unlockedCount}/${profiles.length}`} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card className="glass-card" title={EVENT_CONFIG.name}>
            <Typography.Text type="secondary">
              Gasto acumulado: {formatNumber(state.event.crystalsSpent)} cristais
            </Typography.Text>
            <Progress percent={eventProgress} strokeColor="#d97706" />
            <Space direction="vertical" size={2}>
              <Typography.Text>
                Proximo marco:{' '}
                {nextMilestone ? `${formatNumber(nextMilestone.crystalsRequired)} cristais` : 'todos os marcos completos'}
              </Typography.Text>
              <Typography.Text type="secondary">
                Recompensas disponiveis para resgate: {claimableCount}
              </Typography.Text>
              <Typography.Text type="secondary">
                Evento mockado: {new Date(EVENT_CONFIG.startDate).toLocaleDateString('pt-BR')} ate{' '}
                {new Date(EVENT_CONFIG.endDate).toLocaleDateString('pt-BR')}
              </Typography.Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card className="glass-card" title="Inventario rapido">
            <Space direction="vertical">
              <Typography.Text>Baus raros: {state.chests.raro}</Typography.Text>
              <Typography.Text>Baus epicos: {state.chests.épico}</Typography.Text>
              <Typography.Text>Baus lendarios: {state.chests.lendário}</Typography.Text>
              <Typography.Text>Nucleos Ultra: {state.ultraCores}</Typography.Text>
              <Typography.Text>Pontos do dado: {formatNumber(state.event.luckyDicePoints)}</Typography.Text>
              <Typography.Text>Skins: {ownedSkinCount}/{CHARACTER_SKIN_CATALOG.length}</Typography.Text>
              <Typography.Text>Poder da equipe: {formatNumber(teamPower)}</Typography.Text>
              <Typography.Text>Pets vinculados: {activePets}</Typography.Text>
              <Typography.Text>Cupons ativos: {state.event.coupons.filter((coupon) => !coupon.used).length}</Typography.Text>
            </Space>
          </Card>
        </Col>
      </Row>

      <Typography.Title level={3} style={{ marginTop: 24 }}>
        Equipe atual
      </Typography.Title>
      <Row gutter={[16, 16]}>
        {teamProfiles.map((character) => (
          <Col xs={24} md={8} key={character.id}>
            <CharacterCard character={character} selected compact />
          </Col>
        ))}
      </Row>
    </>
  );
}
