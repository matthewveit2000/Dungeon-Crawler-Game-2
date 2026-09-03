import { describe, it, expect, vi } from 'vitest';
import { Player } from './Player';
import { InputManager } from '../engine/InputManager';

describe('Phase 20: Health, Damage, & Stats Framework', () => {
  const createPlayer = (health = 100) => {
    const input = new InputManager();
    return new Player('p1', 0, 0, input, { health });
  };

  it('initializes with max health from config', () => {
    const player = createPlayer();
    expect(player.maxHealth).toBe(100);
    expect(player.health).toBe(100);
    expect(player.isAlive).toBe(true);
  });

  it('reduces health accurately when taking damage', () => {
    const player = createPlayer(100);
    const taken = player.takeDamage(25);

    expect(taken).toBe(25);
    expect(player.health).toBe(75);
    expect(player.isAlive).toBe(true);
  });

  it('does not reduce health below zero', () => {
    const player = createPlayer(50);
    const taken = player.takeDamage(80);

    expect(taken).toBe(50);
    expect(player.health).toBe(0);
    expect(player.isAlive).toBe(false);
  });

  it('triggers die() and death callback when health reaches zero', () => {
    const player = createPlayer(30);
    const onDeath = vi.fn();
    player.setOnDeathCallback(onDeath);

    player.takeDamage(30);

    expect(player.health).toBe(0);
    expect(onDeath).toHaveBeenCalledOnce();
  });

  it('supports healing without exceeding max health', () => {
    const player = createPlayer(100);
    player.takeDamage(40);
    expect(player.health).toBe(60);

    const healed = player.heal(25);
    expect(healed).toBe(25);
    expect(player.health).toBe(85);

    const overHeal = player.heal(50);
    expect(overHeal).toBe(15);
    expect(player.health).toBe(100);
  });
});
