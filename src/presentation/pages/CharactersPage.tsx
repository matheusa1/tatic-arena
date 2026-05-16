import {
  ClearOutlined,
  CrownOutlined,
  ExperimentOutlined,
  HeartOutlined,
  SearchOutlined,
  SkinOutlined,
  ThunderboltOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { Button, Card, Col, Empty, Input, Row, Segmented, Select, Space, Statistic, Typography } from 'antd';
import { useState } from 'react';
import { CHARACTER_CATALOG, CHARACTER_SKIN_CATALOG } from '../../domain/entities/characters';
import {
  CharacterClass,
  ElementType,
  MAX_CHARACTER_LEVEL,
  MAX_PET_LEVEL,
  MAX_SKILL_LEVEL,
  ULTRA_MAX_SKILL_LEVEL,
  ULTRA_MAX_SKILL_STAT_BONUS,
  ULTRA_SKILL_CORE_COST,
  MAX_WEAPON_LEVEL,
  PET_CATALOG,
  Rarity,
  RARITY_ORDER,
  SkillSlot
} from '../../domain/entities/character';
import {
  buildCharacterProfiles,
  canAscendSkillToUltraMax,
  canAssignPet,
  canLevelUpCharacter,
  canTrainPet,
  canUnlockCharacter,
  canUpgradeSkill,
  canUpgradeWeapon,
  getLevelUpCost,
  getPetAssignCost,
  getPetTrainingCost,
  getSkillUpgradeCost,
  getWeaponUpgradeCost
} from '../../domain/services/characterService';
import { formatNumber } from '../../shared/formatters';
import { CharacterCard } from '../components/CharacterCard';
import { PageHeader } from '../components/PageHeader';
import { notifyAction, useGameStore } from '../hooks/useGameStore';

type Filter = 'todos' | 'desbloqueados' | 'bloqueados';
type FilterValue<T extends string> = T | 'todos';

const rarityOptions = Array.from(new Set(CHARACTER_CATALOG.map((character) => character.rarity)));
const elementOptions = Array.from(new Set(CHARACTER_CATALOG.map((character) => character.element)));
const classOptions = Array.from(new Set(CHARACTER_CATALOG.map((character) => character.class)));

function skillLabel(slot: SkillSlot) {
  return slot === 'basic' ? 'Basica' : 'Especial';
}

function skillLevelLabel(level: number) {
  if (level >= ULTRA_MAX_SKILL_LEVEL) {
    return 'ULTRA MAX';
  }

  if (level >= MAX_SKILL_LEVEL) {
    return 'MAX';
  }

  return `Nv. ${level}/${MAX_SKILL_LEVEL}`;
}

export function CharactersPage() {
  const [filter, setFilter] = useState<Filter>('todos');
  const [search, setSearch] = useState('');
  const [rarityFilter, setRarityFilter] = useState<FilterValue<Rarity>>('todos');
  const [elementFilter, setElementFilter] = useState<FilterValue<ElementType>>('todos');
  const [classFilter, setClassFilter] = useState<FilterValue<CharacterClass>>('todos');
  const roster = useGameStore((store) => store.roster);
  const skinInventory = useGameStore((store) => store.skinInventory);
  const coins = useGameStore((store) => store.coins);
  const levelPotions = useGameStore((store) => store.levelPotions);
  const ultraCores = useGameStore((store) => store.ultraCores);
  const unlockCharacter = useGameStore((store) => store.unlockCharacter);
  const levelUpCharacter = useGameStore((store) => store.levelUpCharacter);
  const upgradeWeapon = useGameStore((store) => store.upgradeWeapon);
  const upgradeSkill = useGameStore((store) => store.upgradeSkill);
  const assignPet = useGameStore((store) => store.assignPet);
  const trainPet = useGameStore((store) => store.trainPet);
  const equipSkin = useGameStore((store) => store.equipSkin);
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
        {profiles.map((character) => {
          const canUnlock = canUnlockCharacter(roster, CHARACTER_CATALOG, character.id);
          const isMaxLevel = character.level >= MAX_CHARACTER_LEVEL;
          const levelUpCost = getLevelUpCost(character.level);
          const canLevelUp = canLevelUpCharacter(roster, character.id, levelPotions);
          const weaponMaxed = character.weaponLevel >= MAX_WEAPON_LEVEL;
          const weaponCost = weaponMaxed ? 0 : getWeaponUpgradeCost(character.weaponLevel);
          const basicSkillMaxed = character.basicSkillLevel >= MAX_SKILL_LEVEL;
          const specialSkillMaxed = character.specialSkillLevel >= MAX_SKILL_LEVEL;
          const basicSkillCost = basicSkillMaxed ? 0 : getSkillUpgradeCost(character.basicSkillLevel, 'basic');
          const specialSkillCost = specialSkillMaxed ? 0 : getSkillUpgradeCost(character.specialSkillLevel, 'special');
          const petMaxed = Boolean(character.pet && character.pet.level >= MAX_PET_LEVEL);
          const petTrainingCost = character.pet && !petMaxed ? getPetTrainingCost(character.pet.level) : 0;
          const nextPetId = PET_CATALOG.find((pet) => pet.id !== character.pet?.id)?.id ?? PET_CATALOG[0].id;
          const petAssignCost = getPetAssignCost(character.pet, nextPetId);
          const ownedSkinsForCharacter = CHARACTER_SKIN_CATALOG.filter(
            (skin) => skin.characterId === character.id && skinInventory.ownedSkinIds.includes(skin.id)
          );
          const actionLabel = character.unlocked
            ? isMaxLevel
              ? 'Nivel maximo'
              : `Upar (${levelUpCost} pocoes)`
            : 'Desbloquear';

          return (
            <Col xs={24} md={12} xl={8} key={character.id}>
              <CharacterCard
                character={character}
                actionLabel={actionLabel}
                actionDisabled={character.unlocked ? !canLevelUp : !canUnlock}
                onAction={
                  character.unlocked
                    ? () => {
                        notifyAction(levelUpCharacter(character.id));
                      }
                    : () => {
                        notifyAction(unlockCharacter(character.id));
                      }
                }
                extraContent={
                  character.unlocked ? (
                    <Space direction="vertical" size={10} style={{ width: '100%' }}>
                      <div className="upgrade-track">
                        <div>
                          <Typography.Text strong>Arma Nv. {character.weaponLevel}/{MAX_WEAPON_LEVEL}</Typography.Text>
                          <br />
                          <Typography.Text type="secondary">
                            {weaponMaxed ? 'Bonus maximo' : `${formatNumber(weaponCost)} moedas`}
                          </Typography.Text>
                        </div>
                        <Button
                          size="small"
                          icon={<ToolOutlined />}
                          disabled={!canUpgradeWeapon(roster, character.id, coins)}
                          onClick={() => notifyAction(upgradeWeapon(character.id))}
                        >
                          Upar
                        </Button>
                      </div>

                      {(['basic', 'special'] as SkillSlot[]).map((slot) => {
                        const currentLevel = slot === 'basic' ? character.basicSkillLevel : character.specialSkillLevel;
                        const ultraMaxed = currentLevel >= ULTRA_MAX_SKILL_LEVEL;
                        const readyForUltra = currentLevel >= MAX_SKILL_LEVEL && !ultraMaxed;
                        const cost = slot === 'basic' ? basicSkillCost : specialSkillCost;
                        const icon = readyForUltra || ultraMaxed ? <CrownOutlined /> : slot === 'basic' ? <ExperimentOutlined /> : <ThunderboltOutlined />;
                        const canUpgrade = readyForUltra
                          ? canAscendSkillToUltraMax(roster, character.id, slot, ultraCores)
                          : canUpgradeSkill(roster, character.id, slot, coins);

                        return (
                          <div className="upgrade-track" key={slot}>
                            <div>
                              <Typography.Text strong>
                                {skillLabel(slot)} {skillLevelLabel(currentLevel)}
                              </Typography.Text>
                              <br />
                              <Typography.Text type="secondary">
                                {ultraMaxed
                                  ? `Bonus Ultra: +${Math.round(ULTRA_MAX_SKILL_STAT_BONUS * 100)}% status`
                                  : readyForUltra
                                    ? `${ULTRA_SKILL_CORE_COST} Nucleo Ultra Lendario`
                                    : `${formatNumber(cost)} moedas`}
                              </Typography.Text>
                            </div>
                            <Button
                              size="small"
                              icon={icon}
                              disabled={!canUpgrade}
                              onClick={() => notifyAction(upgradeSkill(character.id, slot))}
                            >
                              {ultraMaxed ? 'ULTRA MAX' : readyForUltra ? 'Ultra' : 'Upar'}
                            </Button>
                          </div>
                        );
                      })}

                      <div className="pet-control">
                        <Space direction="vertical" size={6} style={{ width: '100%' }}>
                          <Typography.Text strong>
                            Pet {character.pet ? `Nv. ${character.pet.level}/${MAX_PET_LEVEL}` : 'sem vinculo'}
                          </Typography.Text>
                          <Typography.Text type="secondary">
                            {character.pet
                              ? `Vinculo ${character.pet.bond}/100 · trocar custa ${formatNumber(petAssignCost)} moedas`
                              : `Vincular custa ${formatNumber(petAssignCost)} moedas`}
                          </Typography.Text>
                          <Select
                            value={character.pet?.id}
                            placeholder="Escolher pet"
                            style={{ width: '100%' }}
                            onChange={(petId) => notifyAction(assignPet(character.id, petId))}
                            options={PET_CATALOG.map((pet) => ({
                              value: pet.id,
                              label: `${pet.name} · ${pet.role}`,
                              disabled: character.pet?.id !== pet.id && !canAssignPet(roster, character.id, pet.id, coins)
                            }))}
                          />
                          <Button
                            block
                            size="small"
                            icon={<HeartOutlined />}
                            disabled={!canTrainPet(roster, character.id, coins)}
                            onClick={() => notifyAction(trainPet(character.id))}
                          >
                            {character.pet
                              ? petMaxed
                                ? 'Pet maximo'
                                : `Treinar (${formatNumber(petTrainingCost)} moedas)`
                              : 'Vincule um pet'}
                          </Button>
                        </Space>
                      </div>

                      <div className="skin-control">
                        <Space direction="vertical" size={6} style={{ width: '100%' }}>
                          <Typography.Text strong>Visual</Typography.Text>
                          <Typography.Text type="secondary">
                            {ownedSkinsForCharacter.length > 0
                              ? 'Skins obtidas no Dado da Sorte.'
                              : 'Nenhuma skin no inventario para este personagem.'}
                          </Typography.Text>
                          <Select
                            value={character.equippedSkinId ?? 'default'}
                            disabled={ownedSkinsForCharacter.length === 0 && !character.equippedSkinId}
                            style={{ width: '100%' }}
                            onChange={(skinId) =>
                              notifyAction(equipSkin(character.id, skinId === 'default' ? undefined : skinId))
                            }
                            options={[
                              { value: 'default', label: 'Visual padrao' },
                              ...ownedSkinsForCharacter.map((skin) => ({
                                value: skin.id,
                                label: skin.name
                              }))
                            ]}
                          />
                          <Button
                            block
                            size="small"
                            icon={<SkinOutlined />}
                            disabled={ownedSkinsForCharacter.length === 0}
                            onClick={() => {
                              const nextSkin = ownedSkinsForCharacter.find(
                                (skin) => skin.id !== character.equippedSkinId
                              );
                              notifyAction(equipSkin(character.id, nextSkin?.id ?? ownedSkinsForCharacter[0]?.id));
                            }}
                          >
                            Equipar skin
                          </Button>
                        </Space>
                      </div>
                    </Space>
                  ) : (
                    <Typography.Text type="secondary">
                      Desbloqueie para liberar arma, habilidades e pet.
                    </Typography.Text>
                  )
                }
              />
            </Col>
          );
        })}
      </Row>
      {profiles.length === 0 ? (
        <Card className="glass-card">
          <Empty description="Nenhum personagem encontrado." />
        </Card>
      ) : null}
    </>
  );
}
