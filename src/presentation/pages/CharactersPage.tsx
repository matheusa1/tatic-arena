import {
  ClearOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { Button, Card, Col, Empty, Input, Row, Segmented, Select, Space, Statistic, Typography } from 'antd';
import { useState } from 'react';
import { CHARACTER_CATALOG } from '../../domain/entities/characters';
import {
  CharacterClass,
  ElementType,
  Rarity,
  RARITY_ORDER
} from '../../domain/entities/character';
import {
  buildCharacterProfiles
} from '../../domain/services/characterService';
import { formatNumber } from '../../shared/formatters';
import { CharacterCard } from '../components/CharacterCard';
import { CharacterDetailsModal } from '../components/CharacterDetailsModal';
import { PageHeader } from '../components/PageHeader';
import { useGameStore } from '../hooks/useGameStore';

type Filter = 'todos' | 'desbloqueados' | 'bloqueados';
type FilterValue<T extends string> = T | 'todos';

const rarityOptions = Array.from(new Set(CHARACTER_CATALOG.map((character) => character.rarity)));
const elementOptions = Array.from(new Set(CHARACTER_CATALOG.map((character) => character.element)));
const classOptions = Array.from(new Set(CHARACTER_CATALOG.map((character) => character.class)));

export function CharactersPage() {
  const [filter, setFilter] = useState<Filter>('todos');
  const [search, setSearch] = useState('');
  const [rarityFilter, setRarityFilter] = useState<FilterValue<Rarity>>('todos');
  const [elementFilter, setElementFilter] = useState<FilterValue<ElementType>>('todos');
  const [classFilter, setClassFilter] = useState<FilterValue<CharacterClass>>('todos');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>();
  const roster = useGameStore((store) => store.roster);
  const coins = useGameStore((store) => store.coins);
  const levelPotions = useGameStore((store) => store.levelPotions);
  const ultraCores = useGameStore((store) => store.ultraCores);
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const hasActiveFilters =
    filter !== 'todos' ||
    normalizedSearch.length > 0 ||
    rarityFilter !== 'todos' ||
    elementFilter !== 'todos' ||
    classFilter !== 'todos';
  const profiles = buildCharacterProfiles(CHARACTER_CATALOG, roster)
    .filter((character) => {
      if (filter === 'desbloqueados') return character.unlocked;
      if (filter === 'bloqueados') return !character.unlocked;
      return true;
    })
    .filter((character) => {
      if (rarityFilter !== 'todos' && character.rarity !== rarityFilter) return false;
      if (elementFilter !== 'todos' && character.element !== elementFilter) return false;
      if (classFilter !== 'todos' && character.class !== classFilter) return false;
      if (normalizedSearch.length > 0) {
        return character.name.toLocaleLowerCase().includes(normalizedSearch);
      }

      return true;
    })
    .sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity] || a.name.localeCompare(b.name));

  function clearFilters() {
    setFilter('todos');
    setSearch('');
    setRarityFilter('todos');
    setElementFilter('todos');
    setClassFilter('todos');
  }

  return (
    <>
      <PageHeader
        kicker="Colecao"
        title="Personagens"
        description="Colete fragmentos em invocacoes, sorteios e recompensas do festival. Habilidades no MAX podem ascender para ULTRA MAX com o Nucleo Ultra Lendario do boss."
      />
      <Card className="glass-card" style={{ marginBottom: 16 }}>
        <Space wrap size={[12, 12]} style={{ width: '100%' }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Buscar personagem"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ width: 240 }}
          />
          <Segmented
            value={filter}
            onChange={(value) => setFilter(value as Filter)}
            options={[
              { label: 'Todos', value: 'todos' },
              { label: 'Desbloqueados', value: 'desbloqueados' },
              { label: 'Bloqueados', value: 'bloqueados' }
            ]}
          />
          <Select
            value={rarityFilter}
            onChange={(value) => setRarityFilter(value)}
            style={{ minWidth: 140 }}
            options={[
              { label: 'Raridade', value: 'todos' },
              ...rarityOptions.map((rarity) => ({ label: rarity, value: rarity }))
            ]}
          />
          <Select
            value={elementFilter}
            onChange={(value) => setElementFilter(value)}
            style={{ minWidth: 140 }}
            options={[
              { label: 'Elemento', value: 'todos' },
              ...elementOptions.map((element) => ({ label: element, value: element }))
            ]}
          />
          <Select
            value={classFilter}
            onChange={(value) => setClassFilter(value)}
            style={{ minWidth: 150 }}
            options={[
              { label: 'Classe', value: 'todos' },
              ...classOptions.map((characterClass) => ({ label: characterClass, value: characterClass }))
            ]}
          />
          <Button icon={<ClearOutlined />} disabled={!hasActiveFilters} onClick={clearFilters}>
            Limpar
          </Button>
          <Statistic title="Moedas" value={coins} formatter={(value) => formatNumber(Number(value))} />
          <Statistic title="Pocoes" value={levelPotions} />
          <Statistic title="Nucleos Ultra" value={ultraCores} />
        </Space>
      </Card>
      <Row gutter={[16, 16]}>
        {profiles.map((character) => (
          <Col xs={24} md={12} xl={8} key={character.id}>
            <CharacterCard
              character={character}
              actionLabel="Ver personagem"
              onAction={() => setSelectedCharacterId(character.id)}
            />
          </Col>
        ))}
      </Row>
      {profiles.length === 0 ? (
        <Card className="glass-card">
          <Empty description="Nenhum personagem encontrado." />
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
