import progressionPack from '../packs/Progression.json';

export interface LevelUpResult {
  leveledUp: boolean;
  newLevel: number;
  levelsGained: number;
}

export type AttributeKey = 'strength' | 'vitality' | 'agility';
export type SkillKey = 'whirlwind' | 'stoneSkin' | 'swiftness';

export interface ProgressionBonusStats {
  bonusDamage: number;
  bonusHealth: number;
  bonusDefense: number;
  speedMultiplier: number;
  whirlwindRank: number;
}

/**
 * ProgressionManager — handles player experience, exponential leveling thresholds,
 * dual point pools (Attribute & Skill points), and point allocations.
 *
 * Tier 2. Pure game logic with no renderer dependency.
 */
export class ProgressionManager {
  public level = 1;
  public currentXP = 0;
  public attributePoints = 0;
  public skillPoints = 0;

  public attributes: Record<AttributeKey, number> = {
    strength: 0,
    vitality: 0,
    agility: 0,
  };

  public skills: Record<SkillKey, number> = {
    whirlwind: 0,
    stoneSkin: 0,
    swiftness: 0,
  };

  public get xpToNextLevel(): number {
    return Math.floor(progressionPack.baseXP * Math.pow(this.level, progressionPack.exponent));
  }

  public addXP(amount: number): LevelUpResult {
    this.currentXP += amount;
    let levelsGained = 0;

    while (this.currentXP >= this.xpToNextLevel) {
      this.currentXP -= this.xpToNextLevel;
      this.level++;
      levelsGained++;
    }

    if (levelsGained > 0) {
      this.attributePoints += levelsGained;
      this.skillPoints += levelsGained;
    }

    return {
      leveledUp: levelsGained > 0,
      newLevel: this.level,
      levelsGained,
    };
  }

  public allocateAttribute(name: AttributeKey): boolean {
    if (this.attributePoints <= 0) return false;
    if (this.attributes[name] === undefined) return false;

    this.attributePoints--;
    this.attributes[name]++;
    return true;
  }

  public allocateSkill(name: SkillKey): boolean {
    if (this.skillPoints <= 0) return false;
    if (this.skills[name] === undefined) return false;

    const maxRank =
      (progressionPack.skills as Record<string, { maxRank: number }>)[name]?.maxRank ?? 3;
    if (this.skills[name] >= maxRank) return false;

    this.skillPoints--;
    this.skills[name]++;
    return true;
  }

  public getBonusStats(): ProgressionBonusStats {
    const strengthBonus =
      this.attributes.strength * (progressionPack.attributes.strength.damagePerPoint ?? 2);
    const vitalityBonus =
      this.attributes.vitality * (progressionPack.attributes.vitality.healthPerPoint ?? 15);
    const agilityBonus =
      this.attributes.agility * (progressionPack.attributes.agility.speedPerPoint ?? 5);

    const stoneSkinBonus = this.skills.stoneSkin * 5;
    const swiftnessMultiplier = 1 + this.skills.swiftness * 0.1 + agilityBonus / 100;

    return {
      bonusDamage: strengthBonus,
      bonusHealth: vitalityBonus,
      bonusDefense: stoneSkinBonus,
      speedMultiplier: swiftnessMultiplier,
      whirlwindRank: this.skills.whirlwind,
    };
  }
}
