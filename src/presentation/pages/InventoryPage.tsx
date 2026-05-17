import { ExperimentOutlined, GiftOutlined, StarOutlined, ThunderboltOutlined, TrophyOutlined, WalletOutlined } from '@ant-design/icons';
import { Button, Card, Col, Empty, Row, Space, Statistic, Tag, Typography } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { ChestOpenResult, ChestRewardTier, ChestRewardType } from '../../domain/entities/chest';
import type { ChestType } from '../../domain/entities/event';
import { CHARACTER_BY_ID, CHARACTER_SKIN_CATALOG } from '../../domain/entities/characters';
import { CHEST_DEFINITIONS } from '../../shared/constants';
import { describeReward, formatNumber } from '../../shared/formatters';
import { CharacterDetailsModal } from '../components/CharacterDetailsModal';
import { PageHeader } from '../components/PageHeader';
import { notifyAction, useGameStore } from '../hooks/useGameStore';

const CHEST_TYPES: ChestType[] = ['raro', 'épico', 'lendário'];

const REWARD_TYPE_ICON: Record<ChestRewardType, ReactNode> = {
  fragments: <StarOutlined />,
  item: <TrophyOutlined />,
  potions: <ExperimentOutlined />,
  crystals: <ThunderboltOutlined />,
  coins: <WalletOutlined />
};

const REWARD_TIER_COLOR: Record<ChestRewardTier, string> = {
  standard: 'default',
  rare: 'blue',
  epic: 'magenta',
  legendary: 'gold'
};

const REWARD_TIER_LABEL: Record<ChestRewardTier, string> = {
  standard: 'Comum',
  rare: 'Raro',
  epic: 'Epico',
  legendary: 'Lendario'
};

function getChestStyle(chestType: ChestType): CSSProperties {
  const definition = CHEST_DEFINITIONS[chestType];

  return {
    '--chest-accent': definition.accentColor,
    '--chest-glow': definition.glowColor
  } as CSSProperties;
}

function ChestRewardPanel({ result }: { result?: ChestOpenResult }) {
  if (!result) {
    return (
      <div className="chest-reward-empty">
        <Typography.Text type="secondary">Sem premio recente.</Typography.Text>
      </div>
    );
  }

  const fragment = result.reward.fragments?.[0];
  const targetCharacter = fragment?.characterId ? CHARACTER_BY_ID[fragment.characterId] : undefined;

  return (
    <div className={`chest-reward-panel chest-reward-${result.tier}`}>
      <div className="chest-reward-icon">{REWARD_TYPE_ICON[result.rewardType]}</div>
      <div className="chest-reward-content">
        <Space wrap>
          <Tag color={REWARD_TIER_COLOR[result.tier]}>{REWARD_TIER_LABEL[result.tier]}</Tag>
          <Tag>{CHEST_DEFINITIONS[result.chestType].name}</Tag>
        </Space>
        <Typography.Title level={4} className="chest-reward-title">
          {result.label}
        </Typography.Title>
        <Typography.Text>{describeReward(result.reward)}</Typography.Text>
        {targetCharacter ? (
          <Typography.Text type="secondary">
            Personagem alvo: {targetCharacter.name} ({targetCharacter.rarity})
          </Typography.Text>
        ) : null}
      </div>
    </div>
  );
}

export function InventoryPage() {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>();
  const [selectedChestType, setSelectedChestType] = useState<ChestType>('raro');
  const [openingChestType, setOpeningChestType] = useState<ChestType>();
  const [lastChestResult, setLastChestResult] = useState<ChestOpenResult>();
  const openingTimerRef = useRef<number | undefined>(undefined);
  const state = useGameStore();
  const equipSkin = useGameStore((store) => store.equipSkin);
  const openChest = useGameStore((store) => store.openChest);
  const ownedSkinIds = new Set(state.skinInventory.ownedSkinIds);
  const ownedSkins = CHARACTER_SKIN_CATALOG.filter((skin) => ownedSkinIds.has(skin.id));
  const activeCoupons = state.event.coupons.filter((coupon) => !coupon.used);
  const selectedDefinition = CHEST_DEFINITIONS[selectedChestType];
  const selectedChestCount = state.chests[selectedChestType];
  const totalChests = useMemo(
    () => CHEST_TYPES.reduce((total, chestType) => total + state.chests[chestType], 0),
    [state.chests]
  );
  const isOpeningSelectedChest = openingChestType === selectedChestType;

  useEffect(() => {
    return () => {
      if (openingTimerRef.current) {
        window.clearTimeout(openingTimerRef.current);
      }
    };
  }, []);

  function handleOpenChest(chestType: ChestType) {
    if (openingChestType) {
      return;
    }

    if (state.chests[chestType] <= 0) {
      notifyAction({ ok: false, message: 'Nenhum bau desse tipo disponivel.' });
      return;
    }

    setSelectedChestType(chestType);
    setLastChestResult(undefined);
    setOpeningChestType(chestType);

    openingTimerRef.current = window.setTimeout(() => {
      const result = openChest(chestType);
      notifyAction(result);

      if (result.ok) {
        setLastChestResult(result.result);
      }

      setOpeningChestType(undefined);
      openingTimerRef.current = undefined;
    }, 1800);
  }

  return (
    <>
      <PageHeader
        kicker="Conta local"
        title="Inventario"
        description="Recursos, baus, pontos de evento, cupons e skins obtidas ficam centralizados aqui."
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-card metric-card">
            <Statistic title="Moedas" value={state.coins} formatter={(value) => formatNumber(Number(value))} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-card metric-card">
            <Statistic title="Cristais" value={state.crystals} formatter={(value) => formatNumber(Number(value))} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-card metric-card">
            <Statistic title="Pocoes" value={state.levelPotions} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-card metric-card">
            <Statistic title="Pontos do dado" value={state.event.luckyDicePoints} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={10}>
          <Card className="glass-card" title="Itens">
            <Space direction="vertical" size={10}>
              <Typography.Text>Baus disponiveis: {totalChests}</Typography.Text>
              <Typography.Text>Nucleos Ultra: {state.ultraCores}</Typography.Text>
              <Typography.Text>Skins obtidas: {ownedSkins.length}/{CHARACTER_SKIN_CATALOG.length}</Typography.Text>
              <Typography.Text>Cupons ativos: {activeCoupons.length}</Typography.Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card className="glass-card" title="Cupons">
            {activeCoupons.length === 0 ? (
              <Typography.Text type="secondary">Nenhum cupom ativo.</Typography.Text>
            ) : (
              <Space wrap>
                {activeCoupons.map((coupon) => (
                  <Tag color="gold" key={coupon.id}>
                    {coupon.discountPercent}% ate {new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}
                  </Tag>
                ))}
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      <Typography.Title level={3} style={{ marginTop: 24 }}>
        Baus
      </Typography.Title>
      <Row gutter={[16, 16]} align="stretch">
        <Col xs={24} xl={8}>
          <div className="chest-selector-grid">
            {CHEST_TYPES.map((chestType) => {
              const definition = CHEST_DEFINITIONS[chestType];
              const selected = selectedChestType === chestType;
              const opening = openingChestType === chestType;

              return (
                <button
                  type="button"
                  key={chestType}
                  className={`chest-selector ${selected ? 'chest-selector-selected' : ''}`}
                  style={getChestStyle(chestType)}
                  onClick={() => setSelectedChestType(chestType)}
                >
                  <span className="chest-selector-mark">
                    <GiftOutlined />
                  </span>
                  <span className="chest-selector-body">
                    <span className="chest-selector-title">{definition.name}</span>
                    <span className="chest-selector-description">{definition.description}</span>
                  </span>
                  <span className="chest-selector-count">{state.chests[chestType]}</span>
                  {opening ? <span className="chest-selector-pulse" /> : null}
                </button>
              );
            })}
          </div>
        </Col>
        <Col xs={24} xl={9}>
          <Card className="glass-card chest-opening-card" style={getChestStyle(selectedChestType)}>
            <div className={`chest-stage ${isOpeningSelectedChest ? 'chest-stage-opening' : ''}`}>
              <div className="chest-glow" />
              <div className="chest-visual" aria-hidden="true">
                <div className="chest-lid" />
                <div className="chest-lock">
                  <GiftOutlined />
                </div>
                <div className="chest-body" />
              </div>
              <Typography.Title level={3} className="chest-stage-title">
                {selectedDefinition.name}
              </Typography.Title>
              <Typography.Text type="secondary">{selectedChestCount} disponivel(is)</Typography.Text>
              {isOpeningSelectedChest ? (
                <div className="chest-suspense">
                  <span />
                  <span />
                  <span />
                </div>
              ) : null}
              <Button
                type="primary"
                size="large"
                icon={<GiftOutlined />}
                disabled={Boolean(openingChestType) || selectedChestCount <= 0}
                onClick={() => handleOpenChest(selectedChestType)}
              >
                Abrir bau
              </Button>
            </div>
          </Card>
        </Col>
        <Col xs={24} xl={7}>
          <Card className="glass-card" title="Premio">
            <ChestRewardPanel result={lastChestResult} />
          </Card>
        </Col>
      </Row>

      <Card className="glass-card chest-loot-card" title={`Possiveis premios - ${selectedDefinition.name}`} style={{ marginTop: 16 }}>
        <div className="chest-loot-grid">
          {selectedDefinition.lootTable.map((entry) => (
            <div className="chest-loot-row" key={`${selectedChestType}-${entry.label}`}>
              <span className="chest-loot-icon">{REWARD_TYPE_ICON[entry.rewardType]}</span>
              <span className="chest-loot-label">{entry.label}</span>
              <Tag color={REWARD_TIER_COLOR[entry.tier ?? 'standard']}>{entry.weight}%</Tag>
            </div>
          ))}
        </div>
      </Card>

      <Typography.Title level={3} style={{ marginTop: 24 }}>
        Skins
      </Typography.Title>
      <Row gutter={[16, 16]}>
        {CHARACTER_SKIN_CATALOG.map((skin) => {
          const owned = ownedSkinIds.has(skin.id);
          const target = CHARACTER_BY_ID[skin.characterId];
          const character = state.roster[skin.characterId];
          const equipped = character?.equippedSkinId === skin.id;
          const canEquip = owned && character?.unlocked && !equipped;

          return (
            <Col xs={24} md={12} xl={8} key={skin.id}>
              <Card className="glass-card" title={skin.name}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div
                    className="skin-swatch"
                    style={{
                      background: `linear-gradient(135deg, ${skin.visual.primaryColor}, ${skin.visual.secondaryColor})`
                    }}
                  >
                    {skin.source}
                  </div>
                  <Typography.Text>{target?.name ?? skin.characterId}</Typography.Text>
                  <Typography.Paragraph type="secondary">{skin.description}</Typography.Paragraph>
                  <Space wrap>
                    {owned ? <Tag color="green">Obtida</Tag> : <Tag>Bloqueada</Tag>}
                    {equipped ? <Tag color="gold">Equipada</Tag> : null}
                    {!character?.unlocked ? <Tag color="red">Personagem bloqueado</Tag> : null}
                  </Space>
                  <Button block type="primary" disabled={!canEquip} onClick={() => notifyAction(equipSkin(skin.characterId, skin.id))}>
                    Equipar
                  </Button>
                  <Button block disabled={!target || !character} onClick={() => setSelectedCharacterId(skin.characterId)}>
                    Ver personagem
                  </Button>
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>
      {CHARACTER_SKIN_CATALOG.length === 0 ? (
        <Card className="glass-card">
          <Empty description="Nenhuma skin cadastrada." />
        </Card>
      ) : null}
      <CharacterDetailsModal
        characterId={selectedCharacterId}
        open={Boolean(selectedCharacterId)}
        onClose={() => setSelectedCharacterId(undefined)}
      />
    </>
  );
}
