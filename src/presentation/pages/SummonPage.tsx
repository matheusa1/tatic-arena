import { Button, Card, Col, List, Modal, Progress, Row, Space, Statistic, Table, Tag, Typography } from 'antd';
import { useState } from 'react';
import { BannerId, GachaPullCount, GachaResult } from '../../domain/entities/gacha';
import { GACHA_BANNERS } from '../../shared/constants';
import { formatDate, formatNumber } from '../../shared/formatters';
import { CharacterDetailsModal } from '../components/CharacterDetailsModal';
import { PageHeader } from '../components/PageHeader';
import { RarityTag } from '../components/RarityTag';
import { notifyAction, useGameStore } from '../hooks/useGameStore';

function BannerCard({
  bannerId,
  onSummon
}: {
  bannerId: BannerId;
  onSummon: (bannerId: BannerId, pulls: GachaPullCount) => void;
}) {
  const crystals = useGameStore((store) => store.crystals);
  const pity = useGameStore((store) => store.gacha.specialPity);
  const banner = GACHA_BANNERS[bannerId];
  const pityPercent = banner.pityThreshold ? Math.round((pity / banner.pityThreshold) * 100) : 0;

  return (
    <Card className="glass-card" title={banner.name}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Typography.Text>
          Custo: <strong>{banner.costPerPull}</strong> cristais por invocacao
        </Typography.Text>
        <Space wrap>
          {banner.rates.map((rate) => (
            <Tag key={rate.rarity}>
              {rate.rarity}: {rate.weight}%
            </Tag>
          ))}
        </Space>
        {banner.pityThreshold ? (
          <div>
            <Typography.Text type="secondary">
              Pity lendario: {pity}/{banner.pityThreshold}
            </Typography.Text>
            <Progress percent={pityPercent} showInfo={false} strokeColor="#f59e0b" />
          </div>
        ) : null}
        <Space>
          <Button type="primary" disabled={crystals < banner.costPerPull} onClick={() => onSummon(bannerId, 1)}>
            Invocar 1x
          </Button>
          <Button disabled={crystals < banner.costPerPull * 10} onClick={() => onSummon(bannerId, 10)}>
            Invocar 10x
          </Button>
          <Button disabled={crystals < banner.costPerPull * 100} onClick={() => onSummon(bannerId, 100)}>
            Invocar 100x
          </Button>
        </Space>
      </Space>
    </Card>
  );
}

export function SummonPage() {
  const crystals = useGameStore((store) => store.crystals);
  const history = useGameStore((store) => store.gacha.history);
  const performGacha = useGameStore((store) => store.performGacha);
  const [lastResults, setLastResults] = useState<GachaResult[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>();

  function handleSummon(bannerId: BannerId, pulls: GachaPullCount) {
    const result = performGacha(bannerId, pulls);
    notifyAction(result);

    if (result.ok) {
      setLastResults(result.results);
      setModalOpen(true);
    }
  }

  return (
    <>
      <PageHeader
        kicker="Gacha local"
        title="Invocacao"
        description="Use cristais ficticios para obter fragmentos. O banner especial possui pity: depois de 50 invocacoes sem lendario, a proxima garante raridade lendaria."
        extra={<Statistic title="Cristais" value={crystals} formatter={(value) => formatNumber(Number(value))} />}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <BannerCard bannerId="common" onSummon={handleSummon} />
        </Col>
        <Col xs={24} lg={12}>
          <BannerCard bannerId="special" onSummon={handleSummon} />
        </Col>
      </Row>

      <Card className="glass-card" title="Historico das ultimas 30 invocacoes" style={{ marginTop: 16 }}>
        <Table
          size="small"
          rowKey="id"
          pagination={{ pageSize: 8 }}
          dataSource={history}
          columns={[
            {
              title: 'Data',
              dataIndex: 'createdAt',
              render: (value: string) => formatDate(value)
            },
            {
              title: 'Banner',
              dataIndex: 'bannerId',
              render: (value: BannerId) => GACHA_BANNERS[value].name
            },
            {
              title: 'Personagem',
              dataIndex: 'characterName',
              render: (_, row) => (
                <Space wrap>
                  <Typography.Text>{row.characterName}</Typography.Text>
                  <Button size="small" onClick={() => setSelectedCharacterId(row.characterId)}>
                    Ver
                  </Button>
                </Space>
              )
            },
            {
              title: 'Raridade',
              dataIndex: 'rarity',
              render: (_, row) => <RarityTag rarity={row.rarity} />
            },
            {
              title: 'Fragmentos',
              dataIndex: 'fragments'
            },
            {
              title: 'Pity',
              dataIndex: 'guaranteedByPity',
              render: (value: boolean) => (value ? <Tag color="gold">Garantido</Tag> : '-')
            }
          ]}
        />
      </Card>

      <Modal
        title="Resultado da invocacao"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={<Button onClick={() => setModalOpen(false)}>Fechar</Button>}
      >
        <List
          style={{ maxHeight: 420, overflow: 'auto' }}
          dataSource={lastResults}
          renderItem={(item) => (
            <List.Item>
              <Space>
                <RarityTag rarity={item.rarity} />
                <Typography.Text strong>{item.characterName}</Typography.Text>
                <Typography.Text>{item.fragments} fragmentos</Typography.Text>
                {item.guaranteedByPity ? <Tag color="gold">pity</Tag> : null}
                <Button size="small" onClick={() => setSelectedCharacterId(item.characterId)}>
                  Ver
                </Button>
              </Space>
            </List.Item>
          )}
        />
      </Modal>
      <CharacterDetailsModal
        characterId={selectedCharacterId}
        open={Boolean(selectedCharacterId)}
        onClose={() => setSelectedCharacterId(undefined)}
      />
    </>
  );
}
