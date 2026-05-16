import { DeleteOutlined, HolderOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { DragEvent } from 'react';
import { Alert, Button, Card, Empty, Space, Tag, Typography } from 'antd';
import type { CharacterProfile } from '../../domain/entities/character';
import { CHARACTER_CATALOG } from '../../domain/entities/characters';
import {
  MAX_TEAM_MEMBERS,
  getFormationEntries,
  getFormationSlotTurnRank,
  normalizeTeamFormation
} from '../../domain/entities/formation';
import { buildCharacterProfiles } from '../../domain/services/characterService';
import { PageHeader } from '../components/PageHeader';
import { RarityTag } from '../components/RarityTag';
import { notifyAction, useGameStore } from '../hooks/useGameStore';

const DRAG_CHARACTER_DATA = 'application/x-hero-character-id';

const SLOT_LABELS = [
  'Topo esquerdo',
  'Topo centro',
  'Topo direito',
  'Meio esquerdo',
  'Centro',
  'Meio direito',
  'Base esquerda',
  'Base centro',
  'Base direita'
];

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getCharacterDragId(event: DragEvent) {
  return event.dataTransfer.getData(DRAG_CHARACTER_DATA) || event.dataTransfer.getData('text/plain');
}

export function FormationPage() {
  const [draggingCharacterId, setDraggingCharacterId] = useState<string>();
  const [dragOverSlot, setDragOverSlot] = useState<number>();
  const roster = useGameStore((store) => store.roster);
  const formation = useGameStore((store) => store.formation);
  const team = useGameStore((store) => store.team);
  const assignTeamSlot = useGameStore((store) => store.assignTeamSlot);
  const profiles = buildCharacterProfiles(CHARACTER_CATALOG, roster).filter((character) => character.unlocked);
  const normalizedFormation = normalizeTeamFormation(formation, team);
  const formationEntries = getFormationEntries(normalizedFormation);
  const selectedCharacterIds = formationEntries.map((entry) => entry.characterId);
  const selectedCount = selectedCharacterIds.length;
  const turnOrder = formationEntries
    .map((entry) => profiles.find((character) => character.id === entry.characterId)?.name)
    .filter(Boolean)
    .join(' > ');

  function handleDragStart(event: DragEvent, characterId: string) {
    setDraggingCharacterId(characterId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(DRAG_CHARACTER_DATA, characterId);
    event.dataTransfer.setData('text/plain', characterId);
  }

  function handleDragEnd() {
    setDraggingCharacterId(undefined);
    setDragOverSlot(undefined);
  }

  function handleSlotDragOver(event: DragEvent, slot: number) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverSlot(slot);
  }

  function handleSlotDragLeave(slot: number) {
    setDragOverSlot((currentSlot) => (currentSlot === slot ? undefined : currentSlot));
  }

  function handleSlotDrop(event: DragEvent, slot: number) {
    event.preventDefault();
    const characterId = getCharacterDragId(event);

    setDraggingCharacterId(undefined);
    setDragOverSlot(undefined);

    if (!characterId) {
      return;
    }

    notifyAction(assignTeamSlot(slot, characterId));
  }

  function renderCharacterToken(character: CharacterProfile, selected: boolean, slot?: number) {
    const isDragging = draggingCharacterId === character.id;

    return (
      <div
        className={[
          'formation-character-token',
          slot !== undefined ? 'formation-character-token-slot' : '',
          selected ? 'formation-character-token-selected' : '',
          isDragging ? 'formation-character-token-dragging' : ''
        ]
          .filter(Boolean)
          .join(' ')}
        draggable
        onDragStart={(event) => handleDragStart(event, character.id)}
        onDragEnd={handleDragEnd}
      >
        <div className={`character-avatar formation-token-avatar rarity-${character.rarity}`}>{initials(character.name)}</div>
        <div className="formation-token-body">
          <Space wrap size={[4, 4]}>
            <RarityTag rarity={character.rarity} />
            <Tag>{character.element}</Tag>
            <Tag>{character.class}</Tag>
            {selected ? <Tag color="green">NA EQUIPE</Tag> : null}
          </Space>
          <Typography.Text strong className="formation-token-name">
            {character.name}
          </Typography.Text>
          <Typography.Text type="secondary" className="formation-token-meta">
            Nv. {character.level} · {character.stars} estrela(s)
          </Typography.Text>
        </div>
        <HolderOutlined className="formation-token-handle" />
        {slot !== undefined ? (
          <Button
            aria-label={`Remover ${character.name} da equipe`}
            className="formation-slot-clear"
            disabled={selectedCount <= 1}
            icon={<DeleteOutlined />}
            size="small"
            type="text"
            onClick={() => notifyAction(assignTeamSlot(slot))}
          />
        ) : null}
      </div>
    );
  }

  return (
    <>
      <PageHeader
        kicker="Equipe 3x3"
        title="Formacao"
        description="Posicione ate 3 personagens no grid. A prioridade vai da direita para a esquerda e, dentro da coluna, de cima para baixo."
      />
      <Alert
        showIcon
        type="info"
        message={`Selecionados: ${selectedCount}/${MAX_TEAM_MEMBERS}`}
        description={turnOrder ? `Ordem atual: ${turnOrder}` : 'A equipe precisa ter pelo menos 1 personagem.'}
        style={{ marginBottom: 16 }}
      />
      <Card className="glass-card" title="Grid de turnos" style={{ marginBottom: 16 }}>
        <div className="formation-builder">
          <div className="formation-grid" aria-label="Grid da equipe">
            {normalizedFormation.map((characterId, slot) => {
              const character = characterId ? profiles.find((profile) => profile.id === characterId) : undefined;
              const turn = getFormationSlotTurnRank(slot) + 1;
              const isDropTarget = dragOverSlot === slot;

              return (
                <div
                  className={['formation-slot', isDropTarget ? 'formation-slot-over' : ''].filter(Boolean).join(' ')}
                  key={slot}
                  onDragLeave={() => handleSlotDragLeave(slot)}
                  onDragOver={(event) => handleSlotDragOver(event, slot)}
                  onDrop={(event) => handleSlotDrop(event, slot)}
                >
                  <Space align="center" size={6} className="formation-slot-header">
                    <Tag color={character ? 'green' : 'default'}>#{turn}</Tag>
                    <Typography.Text strong>{SLOT_LABELS[slot]}</Typography.Text>
                  </Space>
                  {character ? (
                    renderCharacterToken(character, true, slot)
                  ) : (
                    <div className="formation-slot-empty">
                      <Typography.Text type="secondary">{isDropTarget ? 'Solte aqui' : 'Vazio'}</Typography.Text>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="formation-roster-panel">
            <Space direction="vertical" size={4} className="formation-roster-heading">
              <Typography.Text strong>Personagens</Typography.Text>
              <Typography.Text type="secondary">
                {selectedCount >= MAX_TEAM_MEMBERS ? 'Limite da equipe preenchido.' : `${MAX_TEAM_MEMBERS - selectedCount} vaga(s) aberta(s).`}
              </Typography.Text>
            </Space>
            {profiles.length === 0 ? (
              <Empty description="Nenhum personagem desbloqueado." />
            ) : (
              <div className="formation-roster-list">
                {profiles.map((character) => renderCharacterToken(character, selectedCharacterIds.includes(character.id)))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </>
  );
}
