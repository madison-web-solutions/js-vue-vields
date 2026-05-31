import { describe, test, expect } from 'vitest';
import type { FormValue, Loose } from '../src/types';
import {
  mergeLoose,
  isArrayKey,
  coerceToArrayKey,
  coerceToString,
  coerceToNumber,
  coerceToBoolean,
  coerceToBooleansNativeMap,
  coerceToScalarFormValue,
  coerceToKeyListFormValue,
  coerceToRepeaterFormValue,
  coerceToCompoundFormValue,
  coerceToFormValue,
  copyCompoundFormValue,
  copyRepeaterFormValue,
  copyKeyListFormValue,
  copyFormValue,
  valueAtPath,
  valueAt,
  setValueAt,
  arrayInsert,
  arrayAppend,
  arrayRemove,
  arrayMove,
  arraySwap,
} from '../src/lib/type-utils';

describe('mergeLoose', () => {
  test('overrides defaults with provided values', () => {
    expect(mergeLoose({ a: 1, b: 2 }, { b: 20 })).toEqual({ a: 1, b: 20 });
  });

  test('falls back to the default for null/undefined overrides', () => {
    expect(mergeLoose({ a: 1, b: 2 }, { b: null })).toEqual({ a: 1, b: 2 });
    expect(mergeLoose({ a: 1, b: 2 }, { b: undefined })).toEqual({ a: 1, b: 2 });
  });

  test('keeps a falsy-but-defined override such as 0 or false', () => {
    expect(mergeLoose({ a: 1 }, { a: 0 })).toEqual({ a: 0 });
    expect(mergeLoose({ flag: true }, { flag: false })).toEqual({ flag: false });
  });

  test('ignores override keys not present in defaults', () => {
    expect(mergeLoose({ a: 1 }, { a: 2, z: 9 } as unknown as Loose<{ a: number }>)).toEqual({ a: 2 });
  });
});

describe('isArrayKey', () => {
  test('accepts non-negative integers and their string forms', () => {
    expect(isArrayKey(0)).toBe(true);
    expect(isArrayKey(5)).toBe(true);
    expect(isArrayKey('0')).toBe(true);
    expect(isArrayKey('5')).toBe(true);
  });

  test('rejects negatives, non-integers, and malformed strings', () => {
    expect(isArrayKey(-1)).toBe(false);
    expect(isArrayKey(1.5)).toBe(false);
    expect(isArrayKey('-1')).toBe(false);
    expect(isArrayKey('1.5')).toBe(false);
    expect(isArrayKey('05')).toBe(false);
    expect(isArrayKey('abc')).toBe(false);
    expect(isArrayKey(null)).toBe(false);
    expect(isArrayKey(true)).toBe(false);
  });
});

describe('coerceToArrayKey', () => {
  test('returns the numeric index for valid keys', () => {
    expect(coerceToArrayKey(0)).toBe(0);
    expect(coerceToArrayKey(5)).toBe(5);
    expect(coerceToArrayKey('7')).toBe(7);
  });

  test('returns undefined for invalid keys', () => {
    expect(coerceToArrayKey(-1)).toBeUndefined();
    expect(coerceToArrayKey(1.5)).toBeUndefined();
    expect(coerceToArrayKey('1.5')).toBeUndefined();
    expect(coerceToArrayKey('abc')).toBeUndefined();
    expect(coerceToArrayKey(null)).toBeUndefined();
  });
});

describe('coerceToString', () => {
  test('stringifies truthy values', () => {
    expect(coerceToString('hi')).toBe('hi');
    expect(coerceToString(42)).toBe('42');
    expect(coerceToString(true)).toBe('true');
  });

  test('returns empty string for falsy values (including 0 and false)', () => {
    expect(coerceToString(null)).toBe('');
    expect(coerceToString(undefined)).toBe('');
    expect(coerceToString('')).toBe('');
    expect(coerceToString(0)).toBe('');
    expect(coerceToString(false)).toBe('');
  });
});

describe('coerceToNumber', () => {
  test('returns numbers as-is and parses numeric strings', () => {
    expect(coerceToNumber(5)).toBe(5);
    expect(coerceToNumber('3.14')).toBe(3.14);
    expect(coerceToNumber('10px')).toBe(10); // parseFloat takes the leading number
  });

  test('returns null for non-numeric input', () => {
    expect(coerceToNumber('abc')).toBeNull();
    expect(coerceToNumber('')).toBeNull();
    expect(coerceToNumber(null)).toBeNull();
    expect(coerceToNumber(true)).toBeNull();
    expect(coerceToNumber({})).toBeNull();
  });
});

describe('coerceToBoolean', () => {
  test('returns booleans as-is', () => {
    expect(coerceToBoolean(true)).toBe(true);
    expect(coerceToBoolean(false)).toBe(false);
  });

  test('recognises truthy and falsy strings (case-insensitive)', () => {
    for (const s of ['true', 'YES', 'on', 't', 'Y', '1']) expect(coerceToBoolean(s)).toBe(true);
    for (const s of ['false', 'no', 'OFF', 'f', 'N', '0']) expect(coerceToBoolean(s)).toBe(false);
  });

  test('maps 1 and 0 but not other numbers', () => {
    expect(coerceToBoolean(1)).toBe(true);
    expect(coerceToBoolean(0)).toBe(false);
    expect(coerceToBoolean(2)).toBeNull();
  });

  test('returns null for unrecognised input', () => {
    expect(coerceToBoolean('maybe')).toBeNull();
    expect(coerceToBoolean(null)).toBeNull();
    expect(coerceToBoolean({})).toBeNull();
  });
});

describe('coerceToBooleansNativeMap', () => {
  test('wraps a single string or number as { value: true }', () => {
    expect(Object.fromEntries(coerceToBooleansNativeMap('a'))).toEqual({ a: true });
    expect(Object.fromEntries(coerceToBooleansNativeMap(5))).toEqual({ 5: true });
  });

  test('maps array members to true', () => {
    expect(Object.fromEntries(coerceToBooleansNativeMap(['a', 'b']))).toEqual({ a: true, b: true });
  });

  test('maps object entries to coerced booleans', () => {
    expect(Object.fromEntries(coerceToBooleansNativeMap({ a: true, b: false, c: 1, d: 0 })))
      .toEqual({ a: true, b: false, c: true, d: false });
  });

  test('returns an empty map for null/undefined', () => {
    expect(coerceToBooleansNativeMap(null).size).toBe(0);
    expect(coerceToBooleansNativeMap(undefined).size).toBe(0);
  });
});

describe('coerceToScalarFormValue', () => {
  test('passes through scalars and undefined', () => {
    expect(coerceToScalarFormValue(5)).toBe(5);
    expect(coerceToScalarFormValue('hi')).toBe('hi');
    expect(coerceToScalarFormValue(true)).toBe(true);
    expect(coerceToScalarFormValue(undefined)).toBeUndefined();
  });

  test('maps null to null and JSON-stringifies other objects', () => {
    expect(coerceToScalarFormValue(null)).toBeNull();
    expect(coerceToScalarFormValue({ a: 1 })).toBe('{"a":1}');
    expect(coerceToScalarFormValue([1, 2])).toBe('[1,2]');
  });
});

describe('coerceToKeyListFormValue', () => {
  test('wraps a single key', () => {
    expect(coerceToKeyListFormValue('a')).toEqual(['a']);
    expect(coerceToKeyListFormValue(5)).toEqual([5]);
  });

  test('dedupes an array of keys', () => {
    expect(coerceToKeyListFormValue(['a', 'b', 'a'])).toEqual(['a', 'b']);
    expect(coerceToKeyListFormValue([1, 2, 2])).toEqual([1, 2]);
  });

  test('takes the truthy keys from an object map', () => {
    expect(coerceToKeyListFormValue({ a: true, b: false, c: 1 })).toEqual(['a', 'c']);
  });

  test('returns an empty array for null/undefined/boolean', () => {
    expect(coerceToKeyListFormValue(null)).toEqual([]);
    expect(coerceToKeyListFormValue(undefined)).toEqual([]);
    expect(coerceToKeyListFormValue(true)).toEqual([]);
  });
});

describe('coerceToRepeaterFormValue', () => {
  test('maps array items recursively', () => {
    expect(coerceToRepeaterFormValue([1, 'a', { x: 1 }])).toEqual([1, 'a', { x: 1 }]);
  });

  test('returns an empty array for non-arrays', () => {
    expect(coerceToRepeaterFormValue(null)).toEqual([]);
    expect(coerceToRepeaterFormValue('x')).toEqual([]);
    expect(coerceToRepeaterFormValue({ a: 1 })).toEqual([]);
  });
});

describe('coerceToCompoundFormValue', () => {
  test('coerces object entries recursively', () => {
    expect(coerceToCompoundFormValue({ a: 1, b: 'x', c: { d: 2 } })).toEqual({ a: 1, b: 'x', c: { d: 2 } });
  });

  test('returns an empty object for null or scalars', () => {
    expect(coerceToCompoundFormValue(null)).toEqual({});
    expect(coerceToCompoundFormValue(5)).toEqual({});
    expect(coerceToCompoundFormValue('x')).toEqual({});
  });

  test('treats an array as an index-keyed object', () => {
    expect(coerceToCompoundFormValue([10, 20])).toEqual({ 0: 10, 1: 20 });
  });
});

describe('coerceToFormValue', () => {
  test('passes through scalars, undefined and null', () => {
    expect(coerceToFormValue(5)).toBe(5);
    expect(coerceToFormValue('x')).toBe('x');
    expect(coerceToFormValue(true)).toBe(true);
    expect(coerceToFormValue(undefined)).toBeUndefined();
    expect(coerceToFormValue(null)).toBeNull();
  });

  test('recursively coerces nested arrays and objects', () => {
    expect(coerceToFormValue({ a: [1, { b: 2 }] })).toEqual({ a: [1, { b: 2 }] });
  });
});

describe('copyKeyListFormValue', () => {
  test('returns an independent copy', () => {
    const orig = ['a', 'b'];
    const copy = copyKeyListFormValue(orig);
    expect(copy).toEqual(['a', 'b']);
    expect(copy).not.toBe(orig);
    copy.push('c');
    expect(orig).toEqual(['a', 'b']);
  });
});

describe('copyCompoundFormValue / copyRepeaterFormValue / copyFormValue', () => {
  test('copyCompoundFormValue deep-copies nested structures', () => {
    const orig = { a: { b: 1 }, list: ['x', 'y'] };
    const copy = copyCompoundFormValue(orig) as { a: { b: number } };
    expect(copy).toEqual(orig);
    copy.a.b = 99;
    expect(orig.a.b).toBe(1);
  });

  test('copyRepeaterFormValue deep-copies each row', () => {
    const orig: FormValue = [{ a: 1 }, { a: 2 }];
    const copy = copyRepeaterFormValue(orig as { a: number }[]) as { a: number }[];
    copy[0].a = 99;
    expect((orig as { a: number }[])[0].a).toBe(1);
  });

  test('copyFormValue deep-copies a nested compound value', () => {
    const orig = { a: { b: 1 }, items: [{ x: 1 }] };
    const copy = copyFormValue(orig) as { a: { b: number }; items: { x: number }[] };
    copy.a.b = 99;
    copy.items[0].x = 99;
    expect(orig.a.b).toBe(1);
    expect(orig.items[0].x).toBe(1);
  });

  test('copyFormValue copies an array of scalars (a key list)', () => {
    const orig = ['a', 'b'];
    const copy = copyFormValue(orig) as string[];
    expect(copy).toEqual(['a', 'b']);
    expect(copy).not.toBe(orig);
  });

  test('copyFormValue returns null and scalars unchanged', () => {
    expect(copyFormValue(null)).toBeNull();
    expect(copyFormValue(5)).toBe(5);
    expect(copyFormValue('x')).toBe('x');
  });
});

describe('valueAtPath', () => {
  test('returns the whole value for an empty path', () => {
    const v = { a: 1 };
    expect(valueAtPath(v, [])).toBe(v);
  });

  test('walks object keys and array indices', () => {
    const v = { a: { b: ['x', 'y'] }, items: [{ name: 'Ada' }] };
    expect(valueAtPath(v, ['a', 'b', 1])).toBe('y');
    expect(valueAtPath(v, ['items', 0, 'name'])).toBe('Ada');
    expect(valueAtPath(v, ['items', '0', 'name'])).toBe('Ada');
  });

  test('returns undefined for a missing or non-traversable segment', () => {
    expect(valueAtPath({ a: 1 }, ['b'])).toBeUndefined();
    expect(valueAtPath({ a: 1 }, ['a', 'b'])).toBeUndefined();
    expect(valueAtPath(null, ['a'])).toBeUndefined();
    expect(valueAtPath([1, 2], ['x'])).toBeUndefined();
    expect(valueAtPath([1, 2], [5])).toBeUndefined();
  });
});

describe('valueAt (single-key read)', () => {
  test('a string reads an object property; a number reads an array index', () => {
    expect(valueAt({ name: 'Ada', age: 3 }, 'name')).toBe('Ada');
    expect(valueAt(['a', 'b', 'c'], 1)).toBe('b');
  });

  test('a missing key / out-of-range index reads undefined', () => {
    expect(valueAt({ a: 1 }, 'b')).toBeUndefined();
    expect(valueAt(['a'], 5)).toBeUndefined();
  });

  test('a type mismatch (string↔array, number↔object, into a scalar) reads undefined', () => {
    expect(valueAt(['a', 'b'], 'name')).toBeUndefined(); // string into array
    expect(valueAt({ 0: 'a' }, 0)).toBeUndefined(); // number into object
    expect(valueAt('scalar', 'length')).toBeUndefined();
    expect(valueAt(null, 'x')).toBeUndefined();
  });
});

describe('setValueAt (single-key immutable write)', () => {
  test('sets an object property without mutating the original', () => {
    const orig = { a: 1, b: 2 };
    const next = setValueAt(orig, 'b', 99) as typeof orig;
    expect(next).toEqual({ a: 1, b: 99 });
    expect(orig.b).toBe(2);
    expect(next).not.toBe(orig);
  });

  test('sets an in-range array index, copying the array', () => {
    const orig = ['a', 'b', 'c'];
    const next = setValueAt(orig, 1, 'B') as string[];
    expect(next).toEqual(['a', 'B', 'c']);
    expect(orig[1]).toBe('b');
    expect(next).not.toBe(orig);
  });

  test('materialises a fresh object when the container is null/undefined (string key)', () => {
    expect(setValueAt(null, 'a', 1)).toEqual({ a: 1 });
    expect(setValueAt(undefined, 'a', 1)).toEqual({ a: 1 });
  });

  test('ignores an out-of-range array index (the repeater stale-update guard)', () => {
    const orig = [{ name: 'Ada' }];
    expect(setValueAt(orig, 3, { name: 'Zed' })).toBe(orig);
    expect(setValueAt(orig, -1, { name: 'Zed' })).toBe(orig);
  });

  test('a type mismatch on a non-null container is a no-op (not a clobber)', () => {
    const arr = ['a', 'b'];
    expect(setValueAt(arr, 'name', 'x')).toBe(arr); // string key into array → unchanged
    const num = 7;
    expect(setValueAt(num, 'name', 'x')).toBe(num); // string key into scalar → unchanged
    expect(setValueAt({ a: 1 }, 0, 'x')).toEqual({ a: 1 }); // number key into object → unchanged
  });
});

describe('array operations', () => {
  test('arrayInsert inserts at an index and clamps out-of-range', () => {
    expect(arrayInsert(['a', 'b'], 1, 'x')).toEqual(['a', 'x', 'b']);
    expect(arrayInsert(['a', 'b'], 0, 'x')).toEqual(['x', 'a', 'b']);
    expect(arrayInsert(['a', 'b'], 99, 'x')).toEqual(['a', 'b', 'x']);
    expect(arrayInsert(['a', 'b'], -5, 'x')).toEqual(['x', 'a', 'b']);
  });

  test('arrayAppend appends', () => {
    expect(arrayAppend(['a'], 'b')).toEqual(['a', 'b']);
  });

  test('arrayRemove removes at an index; out-of-range is a no-op copy', () => {
    expect(arrayRemove(['a', 'b', 'c'], 1)).toEqual(['a', 'c']);
    const orig = ['a', 'b'];
    expect(arrayRemove(orig, 5)).toEqual(['a', 'b']);
    expect(arrayRemove(orig, 5)).not.toBe(orig);
  });

  test('arrayMove reorders; out-of-range/equal is a no-op copy', () => {
    expect(arrayMove(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(arrayMove(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
    expect(arrayMove(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'b', 'c']);
    expect(arrayMove(['a', 'b', 'c'], 1, 9)).toEqual(['a', 'b', 'c']);
  });

  test('arraySwap swaps two items; out-of-range/equal is a no-op copy', () => {
    expect(arraySwap(['a', 'b', 'c'], 0, 2)).toEqual(['c', 'b', 'a']);
    expect(arraySwap(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'b', 'c']);
    expect(arraySwap(['a', 'b', 'c'], 0, 9)).toEqual(['a', 'b', 'c']);
  });

  test('array operations never mutate the input', () => {
    const orig = ['a', 'b', 'c'];
    arrayInsert(orig, 1, 'x');
    arrayAppend(orig, 'x');
    arrayRemove(orig, 0);
    arrayMove(orig, 0, 2);
    arraySwap(orig, 0, 2);
    expect(orig).toEqual(['a', 'b', 'c']);
  });
});
