import { describe, it, expect } from 'vitest';
import { HealthOverlay } from './HealthOverlay';

describe('HealthOverlay', () => {
  it('displays formatted initial health', () => {
    const overlay = new HealthOverlay({ initialHealth: 100, maxHealth: 100 });
    expect(overlay.displayedText).toContain('100');
  });

  it('updates text when health changes', () => {
    const overlay = new HealthOverlay({ initialHealth: 100, maxHealth: 100 });
    overlay.updateHealth(75, 100);
    expect(overlay.displayedText).toBe('HP: 75/100');
  });

  it('clamps display to zero when health drops to zero', () => {
    const overlay = new HealthOverlay({ initialHealth: 100, maxHealth: 100 });
    overlay.updateHealth(0, 100);
    expect(overlay.displayedText).toBe('HP: 0/100');
  });
});
