import { Button, Card, Progress, Space, Statistic, Tag, Typography } from 'antd';
import type { CSSProperties, ReactNode } from 'react';
import {
  CharacterProfile,
  MAX_CHARACTER_LEVEL,
  MAX_SKILL_LEVEL,
  PET_BY_ID,
  ULTRA_MAX_SKILL_LEVEL
} from '../../domain/entities/character';
import { CHARACTER_SKIN_BY_ID } from '../../domain/entities/characters';
import { getCharacterPower, scaleStats } from '../../domain/services/characterService';
import { RarityTag } from './RarityTag';

type CharacterCardProps = {
  character: CharacterProfile;
  selected?: boolean;
  compact?: boolean;
  actionLabel?: string;
  actionDisabled?: boolean;
  onAction?: () => void;
  extraContent?: ReactNode;
};

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatSkillLevel(level: number) {
  if (level >= ULTRA_MAX_SKILL_LEVEL) {
    return 'ULTRA MAX';
  }

  if (level >= MAX_SKILL_LEVEL) {
    return 'MAX';
  }

  return `Nv. ${level}`;
}

export function CharacterCard({
  character,
  selected,
  compact,
  actionLabel,
  actionDisabled,
  onAction,
  extraContent
}: CharacterCardProps) {
  const fragmentPercent = Math.min(100, Math.round((character.fragments / character.requiredFragments) * 100));
  const stats = scaleStats(character.baseStats, character.level, character.stars, character);
  const pet = character.pet ? PET_BY_ID[character.pet.id] : undefined;
  const skin = character.equippedSkinId ? CHARACTER_SKIN_BY_ID[character.equippedSkinId] : undefined;
  const hasLegendarySkinAura = character.rarity === 'lendário' && Boolean(skin);
  const skinStyle = skin
    ? ({
        '--skin-primary': skin.visual.primaryColor,
        '--skin-secondary': skin.visual.secondaryColor
      } as CSSProperties)
    : undefined;
  const power = getCharacterPower(character);
  const ultraSkillCount = [character.basicSkillLevel, character.specialSkillLevel].filter(
    (level) => level >= ULTRA_MAX_SKILL_LEVEL
  ).length;

  return (
    <Card
      className={[
        'glass-card',
        'hero-card',
        skin ? 'hero-card-skinned' : '',
        hasLegendarySkinAura ? 'legendary-skin-aura' : ''
      ]
        .filter(Boolean)
        .join(' ')}
      bordered={!selected}
      style={skinStyle}
    >
      {hasLegendarySkinAura ? <span className="legendary-card-aura" aria-hidden="true" /> : null}
      <Space align="start" size={14} style={{ width: '100%' }}>
        <div
          className={`character-avatar rarity-${character.rarity}`}
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
        <div style={{ minWidth: 0, flex: 1 }}>
          <Space wrap size={[4, 4]}>
            <RarityTag rarity={character.rarity} />
            <Tag>{character.element}</Tag>
            <Tag>{character.class}</Tag>
            {selected ? <Tag color="green">NA EQUIPE</Tag> : null}
            {!character.unlocked ? <Tag color="red">BLOQUEADO</Tag> : null}
            {character.level >= MAX_CHARACTER_LEVEL ? <Tag color="gold">MAX</Tag> : null}
            {ultraSkillCount > 0 ? <Tag color="volcano">ULTRA MAX x{ultraSkillCount}</Tag> : null}
            {pet ? <Tag color="cyan">PET {pet.name} Nv. {character.pet?.level}</Tag> : null}
            {skin ? <Tag color="gold">SKIN {skin.name}</Tag> : null}
          </Space>
          <Typography.Title level={4} style={{ margin: '8px 0 2px' }}>
            {character.name}
          </Typography.Title>
          <Typography.Text type="secondary">
            Nv. {character.level}/{MAX_CHARACTER_LEVEL} · {character.stars} estrela(s) · Poder {power}
          </Typography.Text>
        </div>
      </Space>

      {!compact ? (
        <>
          <Space size="middle" style={{ width: '100%', marginTop: 18 }} wrap>
            <Statistic title="Vida" value={stats.health} />
            <Statistic title="Ataque" value={stats.attack} />
            <Statistic title="Defesa" value={stats.defense} />
            <Statistic title="Vel." value={stats.speed} />
          </Space>
          <Typography.Paragraph type="secondary" style={{ marginTop: 14, minHeight: 44 }}>
            <strong>
              {character.basicSkill.name} {formatSkillLevel(character.basicSkillLevel)}:
            </strong>{' '}
            {character.basicSkill.description}
            <br />
            <strong>
              {character.specialSkill.name} {formatSkillLevel(character.specialSkillLevel)}:
            </strong>{' '}
            {character.specialSkill.description}
          </Typography.Paragraph>
        </>
      ) : null}

      {extraContent ? <div className="character-upgrade-panel">{extraContent}</div> : null}

      <div style={{ marginTop: 14 }}>
        <Typography.Text type="secondary">
          Fragmentos: {character.fragments}/{character.requiredFragments}
        </Typography.Text>
        <Progress percent={fragmentPercent} showInfo={false} strokeColor="#d97706" />
      </div>

      {onAction && actionLabel ? (
        <Button block type={selected ? 'default' : 'primary'} disabled={actionDisabled} onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </Card>
  );
}
