import { Button, Card, Col, Empty, Row, Space, Statistic, Tag, Typography } from 'antd';
import { CHARACTER_BY_ID, CHARACTER_SKIN_CATALOG } from '../../domain/entities/characters';
import { formatNumber } from '../../shared/formatters';
import { PageHeader } from '../components/PageHeader';
import { notifyAction, useGameStore } from '../hooks/useGameStore';

export function InventoryPage() {
  const state = useGameStore();
  const equipSkin = useGameStore((store) => store.equipSkin);
  const ownedSkinIds = new Set(state.skinInventory.ownedSkinIds);
  const ownedSkins = CHARACTER_SKIN_CATALOG.filter((skin) => ownedSkinIds.has(skin.id));
  const activeCoupons = state.event.coupons.filter((coupon) => !coupon.used);

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
              <Typography.Text>Baus raros: {state.chests.raro}</Typography.Text>
              <Typography.Text>Baus epicos: {state.chests.épico}</Typography.Text>
              <Typography.Text>Baus lendarios: {state.chests.lendário}</Typography.Text>
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
    </>
  );
}
