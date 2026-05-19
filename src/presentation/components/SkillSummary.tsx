import {
  AimOutlined,
  DeploymentUnitOutlined,
  ExperimentOutlined,
  HeartOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { Tag, Typography } from 'antd';
import type { ReactNode } from 'react';
import type { Skill, SkillEffectType, SkillIcon } from '../../domain/entities/character';

type SkillSummaryProps = {
  skill: Skill;
  levelLabel: string;
};

const EFFECT_LABEL: Record<SkillEffectType, string> = {
  damage: 'Dano',
  heal: 'Cura',
  guard: 'Defesa',
  control: 'Controle',
  summon: 'Invocacao'
};

const EFFECT_TAG_COLOR: Record<SkillEffectType, string> = {
  damage: 'volcano',
  heal: 'green',
  guard: 'blue',
  control: 'purple',
  summon: 'cyan'
};

function renderSkillIcon(icon: SkillIcon): ReactNode {
  if (icon === 'blast') return <ThunderboltOutlined />;
  if (icon === 'heal') return <HeartOutlined />;
  if (icon === 'guard') return <SafetyCertificateOutlined />;
  if (icon === 'control') return <ExperimentOutlined />;
  if (icon === 'summon') return <DeploymentUnitOutlined />;

  return <AimOutlined />;
}

export function SkillSummary({ skill, levelLabel }: SkillSummaryProps) {
  return (
    <div className={`skill-summary skill-summary-${skill.effectType}`}>
      <div className="skill-summary-icon" aria-hidden="true">
        {renderSkillIcon(skill.icon)}
      </div>
      <div className="skill-summary-content">
        <div className="skill-summary-heading">
          <Typography.Text strong className="skill-summary-name">
            {skill.name}
          </Typography.Text>
          <Tag color={EFFECT_TAG_COLOR[skill.effectType]}>{EFFECT_LABEL[skill.effectType]}</Tag>
          <Tag>{levelLabel}</Tag>
        </div>
        <Typography.Paragraph type="secondary" className="skill-summary-description">
          {skill.description}
        </Typography.Paragraph>
        <Typography.Text type="secondary" className="skill-summary-effect">
          <strong>Efeito:</strong> {skill.effect}
        </Typography.Text>
      </div>
    </div>
  );
}
