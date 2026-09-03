import { describe, it, expect } from 'vitest';
import { Weapon } from './Weapon';
import { Entity } from '../engine/Entity';
import weaponsPack from '../packs/Weapons.json';

class DummyTarget extends Entity {
  constructor(id: string, x: number, y: number, width = 16, height = 16) {
    super(id, x, y, { width, height, color: 0xffffff });
    this.health = 50;
    this.maxHealth = 50;
  }
  public override update(): void {}
}

describe('Weapon & Combat System (Tier 2)', () => {
  it('instantiates weapon from Tier 3 data pack', () => {
    const sword = new Weapon('sword');
    expect(sword.id).toBe('sword');
    expect(sword.name).toBe(weaponsPack.weapons.sword.name);
    expect(sword.damage).toBe(weaponsPack.weapons.sword.damage);
    expect(sword.type).toBe('melee');
    expect(sword.canAttack()).toBe(true);
  });

  it('enforces attack cooldown between attacks', () => {
    const sword = new Weapon('sword');
    expect(sword.canAttack()).toBe(true);

    sword.attack(0, 0, 10, 0, { targets: [] });
    expect(sword.canAttack()).toBe(false);

    sword.update(sword.cooldown / 2);
    expect(sword.canAttack()).toBe(false);

    sword.update(sword.cooldown / 2 + 0.01);
    expect(sword.canAttack()).toBe(true);
  });

  it('performs melee attack and deals damage to targets in forward hitbox', () => {
    const sword = new Weapon('sword');
    // Target is positioned in front of origin
    const targetInRange = new DummyTarget('target-1', 30, 0);
    const targetBehind = new DummyTarget('target-2', -30, 0);

    const result = sword.attack(0, 0, 50, 0, {
      targets: [targetInRange, targetBehind],
    });

    expect(result.hits).toBe(1);
    expect(targetInRange.health).toBe(50 - sword.damage);
    expect(targetBehind.health).toBe(50); // Untouched
  });

  it('performs ranged attack by creating and spawning a Projectile', () => {
    const bow = new Weapon('bow');
    let spawnedProjectile: any = null;

    const result = bow.attack(0, 0, 100, 0, {
      targets: [],
      onSpawnProjectile: (proj) => {
        spawnedProjectile = proj;
      },
    });

    expect(result.type).toBe('ranged');
    expect(spawnedProjectile).not.toBeNull();
    expect(spawnedProjectile.damage).toBe(bow.damage);
  });
});
