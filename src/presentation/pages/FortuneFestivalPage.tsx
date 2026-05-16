import { Button, Card, Col, List, Progress, Row, Select, Space, Statistic, Tabs, Tag, Typography } from 'antd';
import { useState } from 'react';
import {
  calculateDiscountedPrice,
  canUseFreeDraw,
  canUseFreeLuckyDiceRoll,
  getAvailableCoupons,
  getClaimableMilestones
} from '../../domain/services/eventService';
import { CHARACTER_BY_ID, CHARACTER_SKIN_BY_ID } from '../../domain/entities/characters';
import { EVENT_CONFIG, EVENT_MILESTONES, EVENT_PACKAGES, LUCKY_DICE_CONFIG, LUCKY_DICE_SHOP_ITEMS } from '../../shared/constants';
import { describeReward, formatDate, formatNumber } from '../../shared/formatters';
import { PageHeader } from '../components/PageHeader';
import { notifyAction, useGameStore } from '../hooks/useGameStore';

export function FortuneFestivalPage() {
  const state = useGameStore();
  const claimEventMilestone = useGameStore((store) => store.claimEventMilestone);
  const drawFortune = useGameStore((store) => store.drawFortune);
  const rollLuckyDice = useGameStore((store) => store.rollLuckyDice);
  const exchangeLuckyDiceItem = useGameStore((store) => store.exchangeLuckyDiceItem);
  const buyEventPackage = useGameStore((store) => store.buyEventPackage);
  const [couponByPackage, setCouponByPackage] = useState<Record<string, string | undefined>>({});
  const maxMilestone = EVENT_MILESTONES[EVENT_MILESTONES.length - 1].crystalsRequired;
  const progressPercent = Math.min(100, Math.round((state.event.crystalsSpent / maxMilestone) * 100));
  const claimable = getClaimableMilestones(state.event);
  const availableCoupons = getAvailableCoupons(state.event);
  const freeAvailable = canUseFreeDraw(state.event);
  const freeDiceAvailable = canUseFreeLuckyDiceRoll(state.event);

  return (
    <>
      <PageHeader
        kicker="Evento temporario"
        title={EVENT_CONFIG.name}
        description="Evento local com gasto acumulado, sorteio diario, Dado da Sorte com pontos de troca e loja com cupons."
      />

      <Tabs
        items={[
          {
            key: 'spend',
            label: 'Gasto acumulado',
            children: (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Card className="glass-card">
                  <Statistic
                    title="Cristais gastos durante o evento"
                    value={state.event.crystalsSpent}
                    formatter={(value) => formatNumber(Number(value))}
                  />
                  <Progress percent={progressPercent} strokeColor="#d97706" />
                  <Typography.Text type="secondary">
                    Recompensas liberadas para resgate: {claimable.length}
                  </Typography.Text>
                </Card>
                <Row gutter={[16, 16]}>
                  {EVENT_MILESTONES.map((milestone) => {
                    const claimed = state.event.claimedMilestoneIds.includes(milestone.id);
                    const unlocked = state.event.crystalsSpent >= milestone.crystalsRequired;
                    return (
                      <Col xs={24} md={12} xl={8} key={milestone.id}>
                        <Card className="glass-card" title={`${formatNumber(milestone.crystalsRequired)} cristais`}>
                          <Typography.Paragraph>{describeReward(milestone.reward)}</Typography.Paragraph>
                          <Space>
                            {claimed ? <Tag color="green">Resgatado</Tag> : null}
                            {!claimed && unlocked ? <Tag color="gold">Liberado</Tag> : null}
                            {!unlocked ? <Tag>Bloqueado</Tag> : null}
                          </Space>
                          <Button
                            block
                            type="primary"
                            disabled={!unlocked || claimed}
                            style={{ marginTop: 16 }}
                            onClick={() => notifyAction(claimEventMilestone(milestone.id))}
                          >
                            Resgatar
                          </Button>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              </Space>
            )
          },
          {
            key: 'draw',
            label: 'Sorteio da Fortuna',
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={8}>
                  <Card className="glass-card" title="Sorteio">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Statistic
                        title="Premio acumulado local"
                        value={state.event.fortunePrizePool}
                        suffix="cristais"
                      />
                      <Button
                        block
                        type="primary"
                        disabled={!freeAvailable}
                        onClick={() => notifyAction(drawFortune(false))}
                      >
                        Usar tentativa gratis diaria
                      </Button>
                      <Button block disabled={state.crystals < 50} onClick={() => notifyAction(drawFortune(true))}>
                        Tentar por 50 cristais
                      </Button>
                      <Typography.Text type="secondary">
                        Cada tentativa adiciona 10 cristais ao premio acumulado local.
                      </Typography.Text>
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} lg={16}>
                  <Card className="glass-card" title="Historico de sorteios">
                    <List
                      dataSource={state.event.drawHistory}
                      locale={{ emptyText: 'Nenhum sorteio ainda.' }}
                      renderItem={(item) => (
                        <List.Item>
                          <Space wrap>
                            <Tag color={item.paidWithCrystals ? 'orange' : 'green'}>
                              {item.paidWithCrystals ? 'Pago' : 'Gratis'}
                            </Tag>
                            <Typography.Text strong>{item.label}</Typography.Text>
                            <Typography.Text type="secondary">{describeReward(item.reward)}</Typography.Text>
                            <Typography.Text type="secondary">{formatDate(item.createdAt)}</Typography.Text>
                          </Space>
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
              </Row>
            )
          },
          {
            key: 'dice',
            label: LUCKY_DICE_CONFIG.name,
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={8}>
                  <Card className="glass-card" title="Rolagem">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div className="dice-face">{state.event.luckyDiceRollHistory[0]?.face ?? '?'}</div>
                      <Statistic
                        title="Pontos de troca"
                        value={state.event.luckyDicePoints}
                        formatter={(value) => formatNumber(Number(value))}
                      />
                      <Button
                        block
                        type="primary"
                        disabled={!freeDiceAvailable}
                        onClick={() => notifyAction(rollLuckyDice(false))}
                      >
                        Rolar gratis hoje
                      </Button>
                      <Button
                        block
                        disabled={state.crystals < LUCKY_DICE_CONFIG.paidRollCost}
                        onClick={() => notifyAction(rollLuckyDice(true))}
                      >
                        Rolar por {formatNumber(LUCKY_DICE_CONFIG.paidRollCost)} cristais
                      </Button>
                      <Typography.Text type="secondary">
                        O resultado do dado vira pontos para trocar por skins e itens do evento.
                      </Typography.Text>
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} lg={16}>
                  <Card className="glass-card" title="Historico do dado">
                    <List
                      dataSource={state.event.luckyDiceRollHistory}
                      locale={{ emptyText: 'Nenhuma rolagem ainda.' }}
                      renderItem={(item) => (
                        <List.Item>
                          <Space wrap>
                            <Tag color={item.paidWithCrystals ? 'orange' : 'green'}>
                              {item.paidWithCrystals ? 'Pago' : 'Gratis'}
                            </Tag>
                            <Tag color="gold">Dado {item.face}</Tag>
                            <Typography.Text strong>+{item.points} pontos</Typography.Text>
                            <Typography.Text type="secondary">{describeReward(item.reward)}</Typography.Text>
                            <Typography.Text type="secondary">{formatDate(item.createdAt)}</Typography.Text>
                          </Space>
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
              </Row>
            )
          },
          {
            key: 'dice-shop',
            label: 'Trocas por pontos',
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24}>
                  <Card className="glass-card">
                    <Space wrap>
                      <Statistic
                        title="Pontos do Dado da Sorte"
                        value={state.event.luckyDicePoints}
                        formatter={(value) => formatNumber(Number(value))}
                      />
                      <Typography.Text type="secondary">
                        Skins sao cosmeticas e ficam salvas no inventario.
                      </Typography.Text>
                    </Space>
                  </Card>
                </Col>
                {LUCKY_DICE_SHOP_ITEMS.map((shopItem) => {
                  const exchanged = state.event.exchangedDiceItems[shopItem.id] ?? 0;
                  const limitReached = shopItem.limit !== undefined && exchanged >= shopItem.limit;
                  const skinId = shopItem.reward.skins?.[0]?.skinId;
                  const skin = skinId ? CHARACTER_SKIN_BY_ID[skinId] : undefined;
                  const targetCharacter = skin ? CHARACTER_BY_ID[skin.characterId] : undefined;
                  const alreadyOwned = Boolean(skinId && state.skinInventory.ownedSkinIds.includes(skinId));
                  const disabled = state.event.luckyDicePoints < shopItem.pointCost || limitReached || alreadyOwned;

                  return (
                    <Col xs={24} md={12} xl={8} key={shopItem.id}>
                      <Card className="glass-card" title={shopItem.name}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {skin ? (
                            <div
                              className="skin-swatch"
                              style={{
                                background: `linear-gradient(135deg, ${skin.visual.primaryColor}, ${skin.visual.secondaryColor})`
                              }}
                            >
                              {skin.name}
                            </div>
                          ) : null}
                          <Typography.Paragraph type="secondary">{shopItem.description}</Typography.Paragraph>
                          {targetCharacter ? (
                            <Typography.Text>Personagem: {targetCharacter.name}</Typography.Text>
                          ) : null}
                          <Typography.Text>{describeReward(shopItem.reward)}</Typography.Text>
                          <Typography.Text>
                            Custo: <strong>{formatNumber(shopItem.pointCost)}</strong> pontos
                          </Typography.Text>
                          {shopItem.limit ? (
                            <Typography.Text type="secondary">
                              Limite: {exchanged}/{shopItem.limit}
                            </Typography.Text>
                          ) : null}
                          <Space wrap>
                            {alreadyOwned ? <Tag color="green">No inventario</Tag> : null}
                            {limitReached ? <Tag color="gold">Limite atingido</Tag> : null}
                          </Space>
                          <Button
                            block
                            type="primary"
                            disabled={disabled}
                            onClick={() => notifyAction(exchangeLuckyDiceItem(shopItem.id))}
                          >
                            Trocar
                          </Button>
                        </Space>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            )
          },
          {
            key: 'shop',
            label: 'Loja com desconto',
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24}>
                  <Card className="glass-card" title="Cupons disponiveis">
                    {availableCoupons.length === 0 ? (
                      <Typography.Text type="secondary">Nenhum cupom ativo. Ganhe cupons no Sorteio da Fortuna.</Typography.Text>
                    ) : (
                      <Space wrap>
                        {availableCoupons.map((coupon) => (
                          <Tag color="gold" key={coupon.id}>
                            {coupon.discountPercent}% ate {new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}
                          </Tag>
                        ))}
                      </Space>
                    )}
                  </Card>
                </Col>
                {EVENT_PACKAGES.map((eventPackage) => {
                  const selectedCoupon = availableCoupons.find((coupon) => coupon.id === couponByPackage[eventPackage.id]);
                  const finalPrice = calculateDiscountedPrice(
                    eventPackage.baseCrystalPrice,
                    selectedCoupon?.discountPercent ?? 0
                  );
                  const purchased = state.event.purchasedPackages[eventPackage.id] ?? 0;
                  const limitReached = eventPackage.limit !== undefined && purchased >= eventPackage.limit;

                  return (
                    <Col xs={24} md={12} xl={8} key={eventPackage.id}>
                      <Card className="glass-card" title={eventPackage.name}>
                        <Typography.Paragraph type="secondary">{eventPackage.description}</Typography.Paragraph>
                        <Typography.Paragraph>{describeReward(eventPackage.reward)}</Typography.Paragraph>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Select
                            allowClear
                            placeholder="Selecionar cupom"
                            value={couponByPackage[eventPackage.id]}
                            onChange={(value) =>
                              setCouponByPackage((current) => ({
                                ...current,
                                [eventPackage.id]: value
                              }))
                            }
                            options={availableCoupons.map((coupon) => ({
                              value: coupon.id,
                              label: `${coupon.discountPercent}% de desconto`
                            }))}
                            style={{ width: '100%' }}
                          />
                          <Typography.Text>
                            Preco: <strong>{formatNumber(finalPrice)}</strong> cristais{' '}
                            {selectedCoupon ? <Tag color="gold">-{selectedCoupon.discountPercent}%</Tag> : null}
                          </Typography.Text>
                          {eventPackage.limit ? (
                            <Typography.Text type="secondary">
                              Limite: {purchased}/{eventPackage.limit}
                            </Typography.Text>
                          ) : null}
                          <Button
                            block
                            type="primary"
                            disabled={state.crystals < finalPrice || limitReached}
                            onClick={() => {
                              notifyAction(buyEventPackage(eventPackage.id, couponByPackage[eventPackage.id]));
                              setCouponByPackage((current) => ({ ...current, [eventPackage.id]: undefined }));
                            }}
                          >
                            Comprar
                          </Button>
                        </Space>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            )
          }
        ]}
      />
    </>
  );
}
