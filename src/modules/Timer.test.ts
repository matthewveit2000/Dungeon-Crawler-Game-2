import { describe, it, expect } from 'vitest';
import { Timer } from './Timer';

describe('Timer', () => {
  it('starts at 5 minutes (300 seconds) by default', () => {
    const timer = new Timer();
    expect(timer.remainingSeconds).toBe(300);
  });

  it('formats time correctly', () => {
    const timer = new Timer(300);
    expect(timer.toDisplayString()).toBe('5:00');

    timer.update(1); // 299 seconds -> 4:59
    expect(timer.toDisplayString()).toBe('4:59');

    timer.update(290); // 9 seconds -> 0:09
    expect(timer.toDisplayString()).toBe('0:09');
  });

  it('deducts exact delta values per frame', () => {
    const timer = new Timer(300);
    timer.update(0.016);
    expect(timer.remainingSeconds).toBe(300 - 0.016);
  });

  it('stops exactly at 0 and does not go negative', () => {
    const timer = new Timer(5);
    timer.update(10);
    expect(timer.remainingSeconds).toBe(0);
    expect(timer.toDisplayString()).toBe('0:00');
  });

  it('allows overriding the time via setTime', () => {
    const timer = new Timer();
    timer.setTime(10);
    expect(timer.remainingSeconds).toBe(10);
    expect(timer.toDisplayString()).toBe('0:10');
  });

  it('fires the onZero callback exactly once when time runs out', () => {
    const timer = new Timer(5);
    let firedCount = 0;
    timer.setOnZeroCallback(() => {
      firedCount++;
    });

    timer.update(4);
    expect(firedCount).toBe(0);

    timer.update(2); // Goes to 0
    expect(firedCount).toBe(1);

    timer.update(1); // Already 0
    expect(firedCount).toBe(1);
  });

  it('fires the onZero callback exactly once when setTime(0) is called', () => {
    const timer = new Timer(5);
    let firedCount = 0;
    timer.setOnZeroCallback(() => {
      firedCount++;
    });

    timer.setTime(0);
    expect(firedCount).toBe(1);

    timer.setTime(0);
    expect(firedCount).toBe(1);
  });
});
