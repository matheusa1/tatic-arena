import { Tag } from 'antd';
import { RARITY_COLORS, Rarity } from '../../domain/entities/character';

export function RarityTag({ rarity }: { rarity: Rarity }) {
  return <Tag color={RARITY_COLORS[rarity]}>{rarity.toUpperCase()}</Tag>;
}
