import {
  CrownOutlined,
  ExperimentOutlined,
  HeartOutlined,
  SkinOutlined,
  ThunderboltOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { Button, Modal, Progress, Select, Space, Statistic, Tag, Typography } from 'antd';
import type { CSSProperties } from 'react';
import {
  MAX_CHARACTER_LEVEL,
  MAX_PET_LEVEL,
  MAX_SKILL_LEVEL,
  MAX_WEAPON_LEVEL,
  PET_CATALOG,
  PET_BY_ID,
  SkillSlot,
  ULTRA_MAX_SKILL_LEVEL,
  ULTRA_MAX_SKILL_STAT_BONUS,
  ULTRA_SKILL_CORE_COST
} from '../../domain/entities/character';
import { CHARACTER_CATALOG, CHARACTER_SKIN_BY_ID, CHARACTER_SKIN_CATALOG } from '../../domain/entities/characters';
import {
  buildCharacterProfiles,
  canAscendSkillToUltraMax,
  canAssignPet,
  canLevelUpCharacter,
  canTrainPet,
  canUnlockCharacter,
  canUpgradeSkill,
  canUpgradeWeapon,
  getCharacterPower,
  getLevelUpCost,
  getPetAssignCost,
  getPetTrainingCost,
  getSkillUpgradeCost,
  getWeaponUpgradeCost,
  scaleStats
} from '../../domain/services/characterService';
import { formatNumber } from '../../shared/formatters';
import { notifyAction, useGameStore } from '../hooks/useGameStore';
import { RarityTag } from './RarityTag';
import { SkillSummary } from './SkillSummary';

type CharacterDetailsModalProps = {
  characterId?: string;
  open: boolean;
  onClose: () => void;
};

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

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

export function CharacterDetailsModal({ characterId, open, onClose }: CharacterDetailsModalProps) {
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
  const character = characterId
    ? buildCharacterProfiles(CHARACTER_CATALOG, roster).find((profile) => profile.id === characterId)
    : undefined;

  if (!character) {
    return null;
  }

  const stats = scaleStats(character.baseStats, character.level, character.stars, character);
  const power = getCharacterPower(character);
  const canUnlock = canUnlockCharacter(roster, CHARACTER_CATALOG, character.id);
  const isMaxLevel = character.level >= MAX_CHARACTER_LEVEL;
  const levelUpCost = getLevelUpCost(character.level);
  const canLevelUp = canLevelUpCharacter(roster, character.id, levelPotions);
  const weaponMaxed = character.weaponLevel >= MAX_WEAPON_LEVEL;
  const weaponCost = weaponMaxed ? 0 : getWeaponUpgradeCost(character.weaponLevel);
  const petMaxed = Boolean(character.pet && character.pet.level >= MAX_PET_LEVEL);
  const petTrainingCost = character.pet && !petMaxed ? getPetTrainingCost(character.pet.level) : 0;
  const nextPetId = PET_CATALOG.find((pet) => pet.id !== character.pet?.id)?.id ?? PET_CATALOG[0].id;
  const petAssignCost = getPetAssignCost(character.pet, nextPetId);
  const ownedSkinsForCharacter = CHARACTER_SKIN_CATALOG.filter(
    (skin) => skin.characterId === character.id && skinInventory.ownedSkinIds.includes(skin.id)
  );
  const fragmentPercent = Math.min(100, Math.round((character.fragments / character.requiredFragments) * 100));
  const pet = character.pet ? PET_BY_ID[character.pet.id] : undefined;
  const skin = character.equippedSkinId ? CHARACTER_SKIN_BY_ID[character.equippedSkinId] : undefined;
  const skinStyle = skin
    ? ({
        '--skin-primary': skin.visual.primaryColor,
        '--skin-secondary': skin.visual.secondaryColor
      } as CSSProperties)
    : undefined;

  return (
    <Modal
      className="character-detail-modal"
      title="Personagem"
      open={open}
      onCancel={onClose}
      width={920}
      footer={<Button onClick={onClose}>Fechar</Button>}
    >
      <div className={skin ? 'character-detail character-detail-skinned' : 'character-detail'} style={skinStyle}>
        <div className="character-detail-header">
          <div
            className={`character-avatar character-detail-avatar rarity-${character.rarity}`}
            style={
              skin
                ? {
                    background: `linear-gradient(135deg, ${skin.visual.primaryColor}, ${skin.visual.secondaryColor})`
                  }
                : undefined
            }
          >
            {initials(character.name)}
          </div>
          <div className="character-detail-heading">
            <Space wrap size={[4, 4]}>
              <RarityTag rarity={character.rarity} />
              <Tag>{character.element}</Tag>
              <Tag>{character.class}</Tag>
              {!character.unlocked ? <Tag color="red">BLOQUEADO</Tag> : null}
              {character.level >= MAX_CHARACTER_LEVEL ? <Tag color="gold">MAX</Tag> : null}
              {pet ? <Tag color="cyan">PET {pet.name} Nv. {character.pet?.level}</Tag> : null}
              {skin ? <Tag color="gold">SKIN {skin.name}</Tag> : null}
            </Space>
            <Typography.Title level={3} className="character-detail-title">
              {character.name}
            </Typography.Title>
            <Typography.Text type="secondary">
              Nv. {character.level}/{MAX_CHARACTER_LEVEL} · {character.stars} estrela(s) · Poder {formatNumber(power)}
            </Typography.Text>
          </div>
        </div>

        <div className="character-detail-stat-grid">
          <Statistic title="Vida" value={stats.health} />
          <Statistic title="Ataque" value={stats.attack} />
          <Statistic title="Defesa" value={stats.defense} />
          <Statistic title="Vel." value={stats.speed} />
        </div>

        <div className="character-detail-fragments">
          <Typography.Text type="secondary">
            Fragmentos: {character.fragments}/{character.requiredFragments}
          </Typography.Text>
          <Progress percent={fragmentPercent} showInfo={false} strokeColor="#d97706" />
        </div>

        <div className="character-detail-section">
          <Typography.Text strong>Habilidades</Typography.Text>
          <div className="character-detail-skill-list">
            <SkillSummary skill={character.basicSkill} levelLabel={skillLevelLabel(character.basicSkillLevel)} />
            <SkillSummary skill={character.specialSkill} levelLabel={skillLevelLabel(character.specialSkillLevel)} />
          </div>
        </div>

        <div className="character-detail-section">
          <Space wrap size={[16, 10]} className="character-detail-resources">
            <Statistic title="Moedas" value={coins} formatter={(value) => formatNumber(Number(value))} />
            <Statistic title="Pocoes" value={levelPotions} />
            <Statistic title="Nucleos Ultra" value={ultraCores} />
          </Space>
        </div>

        {!character.unlocked ? (
          <div className="character-detail-upgrade-panel">
            <Typography.Text type="secondary">Desbloqueie para liberar level, arma, habilidades, pet e visual.</Typography.Text>
            <Button
              block
              type="primary"
              disabled={!canUnlock}
              onClick={() => notifyAction(unlockCharacter(character.id))}
            >
              Desbloquear
            </Button>
          </div>
        ) : (
          <Space direction="vertical" size={10} className="character-detail-upgrade-panel">
            <div className="upgrade-track">
              <div>
                <Typography.Text strong>
                  Nivel {character.level}/{MAX_CHARACTER_LEVEL}
                </Typography.Text>
                <br />
                <Typography.Text type="secondary">
                  {isMaxLevel ? 'Nivel maximo' : `${levelUpCost} pocoes`}
                </Typography.Text>
              </div>
              <Button
                size="small"
                disabled={!canLevelUp}
                onClick={() => notifyAction(levelUpCharacter(character.id))}
              >
                {isMaxLevel ? 'MAX' : 'Upar'}
              </Button>
            </div>

            <div className="upgrade-track">
              <div>
                <Typography.Text strong>
                  Arma Nv. {character.weaponLevel}/{MAX_WEAPON_LEVEL}
                </Typography.Text>
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
              const cost = currentLevel >= MAX_SKILL_LEVEL ? 0 : getSkillUpgradeCost(currentLevel, slot);
              const icon =
                readyForUltra || ultraMaxed ? (
                  <CrownOutlined />
                ) : slot === 'basic' ? (
                  <ExperimentOutlined />
                ) : (
                  <ThunderboltOutlined />
                );
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
                  options={PET_CATALOG.map((petOption) => ({
                    value: petOption.id,
                    label: `${petOption.name} · ${petOption.role}`,
                    disabled:
                      character.pet?.id !== petOption.id && !canAssignPet(roster, character.id, petOption.id, coins)
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
                  onChange={(skinId) => notifyAction(equipSkin(character.id, skinId === 'default' ? undefined : skinId))}
                  options={[
                    { value: 'default', label: 'Visual padrao' },
                    ...ownedSkinsForCharacter.map((skinOption) => ({
                      value: skinOption.id,
                      label: skinOption.name
                    }))
                  ]}
                />
                <Button
                  block
                  size="small"
                  icon={<SkinOutlined />}
                  disabled={ownedSkinsForCharacter.length === 0}
                  onClick={() => {
                    const nextSkin = ownedSkinsForCharacter.find((skinOption) => skinOption.id !== character.equippedSkinId);
                    notifyAction(equipSkin(character.id, nextSkin?.id ?? ownedSkinsForCharacter[0]?.id));
                  }}
                >
                  Equipar skin
                </Button>
              </Space>
            </div>
          </Space>
        )}
      </div>
    </Modal>
  );
}
