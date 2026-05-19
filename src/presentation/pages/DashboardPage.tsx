import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Input, Modal, Progress, Row, Space, Statistic, Typography } from 'antd';
import { useState } from 'react';
import { CHARACTER_CATALOG, CHARACTER_SKIN_CATALOG } from '../../domain/entities/characters';
import { buildCharacterProfiles, getCharacterPower } from '../../domain/services/characterService';
import { getClaimableMilestones } from '../../domain/services/eventService';
import { EVENT_CONFIG, EVENT_MILESTONES } from '../../shared/constants';
import { formatNumber } from '../../shared/formatters';
import { CharacterCard } from '../components/CharacterCard';
import { CharacterDetailsModal } from '../components/CharacterDetailsModal';
import { PageHeader } from '../components/PageHeader';
import { notifyAction, useGameStore } from '../hooks/useGameStore';

type SaveModalMode = 'export' | 'import';

export function DashboardPage() {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>();
  const [saveModalMode, setSaveModalMode] = useState<SaveModalMode>();
  const [saveText, setSaveText] = useState('');
  const state = useGameStore();
  const resetGame = useGameStore((store) => store.resetGame);
  const exportSave = useGameStore((store) => store.exportSave);
  const importSave = useGameStore((store) => store.importSave);
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
  const saveTextLength = saveModalMode === 'export' ? saveText.length : 0;

  function openExportModal() {
    setSaveText(exportSave());
    setSaveModalMode('export');
  }

  function openImportModal() {
    setSaveText('');
    setSaveModalMode('import');
  }

  function closeSaveModal() {
    setSaveModalMode(undefined);
    setSaveText('');
  }

  function handleImportSave() {
    const result = importSave(saveText);
    notifyAction(result);

    if (result.ok) {
      closeSaveModal();
    }
  }

  return (
    <>
      <PageHeader
        kicker="Conta local"
        title="Dashboard"
        description="Progresso salvo no navegador. Cristais e moedas sao ficticios e distribuidos apenas para testes do MVP."
        extra={
          <Space wrap>
            <Button icon={<DownloadOutlined />} onClick={openExportModal}>
              Exportar save
            </Button>
            <Button icon={<UploadOutlined />} onClick={openImportModal}>
              Importar save
            </Button>
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
          </Space>
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
            <CharacterCard
              character={character}
              selected
              compact
              actionLabel="Ver personagem"
              onAction={() => setSelectedCharacterId(character.id)}
            />
          </Col>
        ))}
      </Row>
      <CharacterDetailsModal
        characterId={selectedCharacterId}
        open={Boolean(selectedCharacterId)}
        onClose={() => setSelectedCharacterId(undefined)}
      />
      <Modal
        title={saveModalMode === 'export' ? 'Exportar save' : 'Importar save'}
        open={Boolean(saveModalMode)}
        onCancel={closeSaveModal}
        okText={saveModalMode === 'export' ? 'Fechar' : 'Importar'}
        cancelText="Cancelar"
        onOk={saveModalMode === 'export' ? closeSaveModal : handleImportSave}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {saveModalMode === 'export' ? (
            <Typography.Text type="secondary">
              Copie este texto para guardar ou transferir o progresso. Tamanho: {formatNumber(saveTextLength)} caracteres.
            </Typography.Text>
          ) : (
            <Typography.Text type="secondary">
              Cole aqui um save exportado. O progresso atual sera substituido depois da importacao.
            </Typography.Text>
          )}
          <Input.TextArea
            rows={10}
            value={saveText}
            readOnly={saveModalMode === 'export'}
            onChange={(event) => setSaveText(event.target.value)}
          />
        </Space>
      </Modal>
    </>
  );
}
