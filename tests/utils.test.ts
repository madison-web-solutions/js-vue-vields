import { describe, test, expect } from 'vitest';
import { clamp, reindexErrors, startCase, valueAtPath } from '../src/lib/utils';

describe('clamp', () => {
  test('constrains within both bounds', () => {
    expect(clamp(0, 10, 5)).toBe(5);
    expect(clamp(0, 10, -3)).toBe(0);
    expect(clamp(0, 10, 15)).toBe(10);
  });

  test('ignores a null/undefined bound', () => {
    expect(clamp(null, 10, 15)).toBe(10);
    expect(clamp(0, null, -3)).toBe(0);
    expect(clamp(null, null, 42)).toBe(42);
    expect(clamp(undefined, undefined, 7)).toBe(7);
  });
});

describe('reindexErrors', () => {
  test('remaps the leading array index of each path', () => {
    expect(reindexErrors({ '0.x': ['a'] }, (i) => i + 1)).toEqual({ '1.x': ['a'] });
  });

  test('drops errors whose index maps to undefined', () => {
    const errors = { '0.name': ['a'], '1.name': ['b'], title: ['c'] };
    const result = reindexErrors(errors, (i) => (i === 0 ? undefined : i - 1));
    expect(result).toEqual({ '0.name': ['b'], title: ['c'] });
  });

  test('leaves paths that do not begin with an array index unchanged', () => {
    expect(reindexErrors({ title: ['a'], 'meta.x': ['b'] }, (i) => i + 1))
      .toEqual({ title: ['a'], 'meta.x': ['b'] });
  });

  test('reindexes a bare index key with no sub-path', () => {
    expect(reindexErrors({ '2': ['e'] }, (i) => i * 10)).toEqual({ '20': ['e'] });
  });
});

describe('startCase', () => {
  test('capitalises words and converts underscores to spaces', () => {
    expect(startCase('hello_world')).toBe('Hello World');
  });

  test('lower-cases the remainder of each word and trims', () => {
    expect(startCase('  FOO bar  ')).toBe('Foo Bar');
  });

  test('does not split camelCase', () => {
    expect(startCase('camelCase')).toBe('Camelcase');
  });

  test('coerces non-string input', () => {
    expect(startCase(42)).toBe('42');
  });
});

describe('valueAtPath', () => {
  test('returns the value itself for an empty path', () => {
    expect(valueAtPath({ a: 1 }, [])).toEqual({ a: 1 });
  });

  test('reads a deeply nested object value', () => {
    expect(valueAtPath({ a: { b: { c: 5 } } }, ['a', 'b', 'c'])).toBe(5);
  });

  test('reads an array element by numeric or string index', () => {
    expect(valueAtPath([10, 20, 30], [1])).toBe(20);
    expect(valueAtPath([10, 20, 30], ['2'])).toBe(30);
  });

  test('returns undefined for a missing key', () => {
    expect(valueAtPath({ a: 1 }, ['b'])).toBeUndefined();
  });

  test('returns undefined when a segment along the path is null', () => {
    expect(valueAtPath({ a: null }, ['a', 'b'])).toBeUndefined();
  });

  test('returns undefined for a non-index key into an array', () => {
    expect(valueAtPath([1, 2], ['x'])).toBeUndefined();
  });

  test('does not follow inherited properties', () => {
    expect(valueAtPath({}, ['toString'])).toBeUndefined();
  });
});
