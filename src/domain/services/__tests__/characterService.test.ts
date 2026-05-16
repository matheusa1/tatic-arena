import { describe, expect, it } from 'vitest';
import { MAX_SKILL_LEVEL, ULTRA_MAX_SKILL_LEVEL } from '../../entities/character';
import { CHARACTER_CATALOG, CHARACTER_SKIN_CATALOG } from '../../entities/characters';
import {
  assignPet,
  applyFragments,
  ascendSkillToUltraMax,
  canLevelUpCharacter,
  createInitialRoster,
  equipSkin,
  getCharacterPower,
  getSkillEffectMultiplier,
  getLevelUpCost,
  levelUpCharacter,
  scaleStats,
  trainPet,
  upgradeSkill,
  upgradeWeapon
} from '../characterService';

describe('characterService', () => {
  it('unlocks a character when enough fragments are collected', () => {
    const roster = createInitialRoster(CHARACTER_CATALOG, []);
    const rareCharacter = CHARACTER_CATALOG.find((character) => character.rarity === 'raro')!;

    const result = applyFragments(roster, CHARACTER_CATALOG, rareCharacter.id, 40);

    expect(result.unlockedNow).toBe(true);
    expect(result.roster[rareCharacter.id].unlocked).toBe(true);
    expect(result.roster[rareCharacter.id].fragments).toBe(40);
  });

  it('levels up an unlocked character and spends level potions', () => {
    const roster = createInitialRoster(CHARACTER_CATALOG, ['ember-squire']);
    const result = levelUpCharacter(roster, 'ember-squire', 3);

    expect(result.leveled).toBe(true);
    expect(result.potionsSpent).toBe(1);
    expect(result.roster['ember-squire'].level).toBe(2);
  });

  it('blocks level up when the character is locked or potions are missing', () => {
    const roster = createInitialRoster(CHARACTER_CATALOG, []);

    expect(canLevelUpCharacter(roster, 'ember-squire', 10)).toBe(false);
    expect(levelUpCharacter(roster, 'ember-squire', 10).leveled).toBe(false);

    const unlockedRoster = createInitialRoster(CHARACTER_CATALOG, ['ember-squire']);
    expect(getLevelUpCost(unlockedRoster['ember-squire'].level)).toBe(1);
    expect(canLevelUpCharacter(unlockedRoster, 'ember-squire', 0)).toBe(false);
  });

  it('upgrades weapons and skills with coins', () => {
    const roster = createInitialRoster(CHARACTER_CATALOG, ['ember-squire']);
    const weaponResult = upgradeWeapon(roster, 'ember-squire', 1000);
    const skillResult = upgradeSkill(weaponResult.roster, 'ember-squire', 'special', 1000);

    expect(weaponResult.upgraded).toBe(true);
    expect(weaponResult.coinsSpent).toBeGreaterThan(0);
    expect(weaponResult.roster['ember-squire'].weaponLevel).toBe(2);
    expect(skillResult.upgraded).toBe(true);
    expect(skillResult.roster['ember-squire'].specialSkillLevel).toBe(2);
  });

  it('ascends maxed skills to ultra max with a legendary core', () => {
    const roster = createInitialRoster(CHARACTER_CATALOG, ['ember-squire']);
    const maxedRoster = {
      ...roster,
      'ember-squire': {
        ...roster['ember-squire'],
        basicSkillLevel: MAX_SKILL_LEVEL
      }
    };
    const beforeStats = scaleStats(CHARACTER_CATALOG[0].baseStats, 1, 1, maxedRoster['ember-squire']);
    const result = ascendSkillToUltraMax(maxedRoster, 'ember-squire', 'basic', 1);
    const afterStats = scaleStats(CHARACTER_CATALOG[0].baseStats, 1, 1, result.roster['ember-squire']);

    expect(result.ascended).toBe(true);
    expect(result.coresSpent).toBe(1);
    expect(result.roster['ember-squire'].basicSkillLevel).toBe(ULTRA_MAX_SKILL_LEVEL);
    expect(afterStats.attack).toBeGreaterThan(beforeStats.attack);
    expect(getSkillEffectMultiplier(ULTRA_MAX_SKILL_LEVEL)).toBeGreaterThan(getSkillEffectMultiplier(MAX_SKILL_LEVEL));
  });

  it('assigns and trains pets while increasing character power', () => {
    const roster = createInitialRoster(CHARACTER_CATALOG, ['ember-squire']);
    const profile = {
      ...CHARACTER_CATALOG[0],
      ...roster['ember-squire']
    };
    const powerBefore = getCharacterPower(profile);
    const assigned = assignPet(roster, 'ember-squire', 'ember-wisp', 1000);
    const trained = trainPet(assigned.roster, 'ember-squire', 1000);
    const upgradedProfile = {
      ...CHARACTER_CATALOG[0],
      ...trained.roster['ember-squire']
    };
    const stats = scaleStats(
      CHARACTER_CATALOG[0].baseStats,
      upgradedProfile.level,
      upgradedProfile.stars,
      upgradedProfile
    );

    expect(assigned.assigned).toBe(true);
    expect(trained.trained).toBe(true);
    expect(trained.roster['ember-squire'].pet?.level).toBe(2);
    expect(stats.attack).toBeGreaterThan(CHARACTER_CATALOG[0].baseStats.attack);
    expect(getCharacterPower(upgradedProfile)).toBeGreaterThan(powerBefore);
  });

  it('equips owned skins only on the matching unlocked character', () => {
    const roster = createInitialRoster(CHARACTER_CATALOG, ['first-ray-aureon']);
    const equipped = equipSkin(
      roster,
      CHARACTER_SKIN_CATALOG,
      'first-ray-aureon',
      'aureon-solar-regalia',
      ['aureon-solar-regalia']
    );
    const blocked = equipSkin(
      equipped.roster,
      CHARACTER_SKIN_CATALOG,
      'first-ray-aureon',
      'nyxara-void-empress',
      ['aureon-solar-regalia', 'nyxara-void-empress']
    );

    expect(equipped.equipped).toBe(true);
    expect(equipped.roster['first-ray-aureon'].equippedSkinId).toBe('aureon-solar-regalia');
    expect(blocked.equipped).toBe(false);
    expect(blocked.roster['first-ray-aureon'].equippedSkinId).toBe('aureon-solar-regalia');
  });
});
