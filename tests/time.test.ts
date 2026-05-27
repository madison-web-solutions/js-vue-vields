import { describe, test, expect } from 'vitest';
import { timeParse, timeSplit, timeFormat } from '../src/lib/time';

// 14:30:00 = 14*3600 + 30*60 = 52200 seconds since midnight
const T_14_30 = 52200;

describe('timeParse', () => {
  test('returns undefined for null or empty input', () => {
    expect(timeParse(null)).toBeUndefined();
    expect(timeParse(undefined)).toBeUndefined();
    expect(timeParse('')).toBeUndefined();
  });

  test('parses HH:MM and HHMM forms', () => {
    expect(timeParse('14:30')).toBe(T_14_30);
    expect(timeParse('1430')).toBe(T_14_30);
  });

  test('parses HH:MM:SS', () => {
    expect(timeParse('14:30:15')).toBe(T_14_30 + 15);
  });

  test('accepts single-digit hours and minutes', () => {
    expect(timeParse('9:5')).toBe(9 * 3600 + 5 * 60);
  });

  test('normalises whitespace and . , separators to colons', () => {
    expect(timeParse('14.30')).toBe(T_14_30);
    expect(timeParse('14,30')).toBe(T_14_30);
    expect(timeParse('  14:30  ')).toBe(T_14_30);
  });

  test('does not range-check the result', () => {
    expect(timeParse('25:00')).toBe(25 * 3600);
  });

  test('returns undefined for unparseable input', () => {
    expect(timeParse('abc')).toBeUndefined();
    expect(timeParse('99')).toBeUndefined();
    expect(timeParse('14:30:')).toBeUndefined();
  });
});

describe('timeSplit', () => {
  test('splits seconds into [hours, mins, secs]', () => {
    expect(timeSplit(T_14_30)).toEqual([14, 30, 0]);
    expect(timeSplit(T_14_30 + 15)).toEqual([14, 30, 15]);
    expect(timeSplit(0)).toEqual([0, 0, 0]);
  });

  test('wraps values onto a 24-hour clock', () => {
    expect(timeSplit(86400)).toEqual([0, 0, 0]); // exactly 24h → midnight
    expect(timeSplit(90000)).toEqual([1, 0, 0]); // 25:00 → 01:00
  });

  test('wraps negative inputs around midnight', () => {
    expect(timeSplit(-60)).toEqual([23, 59, 0]);
  });
});

describe('timeFormat', () => {
  test('formats HH:MM with zero padding', () => {
    expect(timeFormat(14, 30)).toBe('14:30');
    expect(timeFormat(9, 5)).toBe('09:05');
  });

  test('includes seconds when provided', () => {
    expect(timeFormat(9, 5, 3)).toBe('09:05:03');
    expect(timeFormat(0, 0, 0)).toBe('00:00:00');
  });

  test('omits seconds when null or undefined', () => {
    expect(timeFormat(1, 2, null)).toBe('01:02');
    expect(timeFormat(1, 2, undefined)).toBe('01:02');
  });
});
