import { describe, test, expect } from 'vitest';
import {
  copyMessageBag,
  sliceMessageBag,
  spliceMessageBag,
  messageBagToString,
} from '../src/lib/message-bag';

describe('copyMessageBag', () => {
  test('produces an independent copy', () => {
    const bag = { a: ['x'], b: ['y', 'z'] };
    const copy = copyMessageBag(bag);
    expect(copy).toEqual(bag);

    copy.a.push('mutated');
    expect(bag.a).toEqual(['x']); // original arrays untouched
  });

  test('returns a new, independent empty bag for an empty input', () => {
    const bag = {};
    const copy = copyMessageBag(bag);
    expect(copy).toEqual({});
    expect(copy).not.toBe(bag);
  });
});

describe('sliceMessageBag', () => {
  test('returns a full copy for an empty prefix', () => {
    const bag = { a: ['x'], 'a.b': ['y'] };
    expect(sliceMessageBag(bag, '')).toEqual(bag);
  });

  test('extracts the sub-bag and strips the prefix', () => {
    const bag = { foo: ['a'], 'foo.bar': ['b'], 'foo.bar.baz': ['c'], other: ['d'] };
    expect(sliceMessageBag(bag, 'foo')).toEqual({ '': ['a'], bar: ['b'], 'bar.baz': ['c'] });
  });

  test('does not match keys that merely start with the prefix string', () => {
    expect(sliceMessageBag({ foobar: ['x'] }, 'foo')).toEqual({});
  });

  test('returns an empty bag when the input is empty', () => {
    expect(sliceMessageBag({}, 'foo')).toEqual({});
    expect(sliceMessageBag({}, '')).toEqual({});
  });

  test('returns an empty bag when no keys match the prefix', () => {
    expect(sliceMessageBag({ foo: ['a'], bar: ['b'] }, 'baz')).toEqual({});
  });
});

describe('spliceMessageBag', () => {
  test('returns a copy of the sub-bag for an empty prefix', () => {
    expect(spliceMessageBag({ a: ['x'] }, '', { b: ['y'] })).toEqual({ b: ['y'] });
  });

  test('replaces messages under the prefix and preserves the rest', () => {
    const bag = { foo: ['old'], 'foo.bar': ['oldbar'], other: ['keep'] };
    const result = spliceMessageBag(bag, 'foo', { '': ['new'], baz: ['newbaz'] });
    expect(result).toEqual({ other: ['keep'], foo: ['new'], 'foo.baz': ['newbaz'] });
  });

  test('is the inverse of sliceMessageBag', () => {
    const bag = { foo: ['a'], 'foo.bar': ['b'], other: ['c'] };
    const sliced = sliceMessageBag(bag, 'foo');
    expect(spliceMessageBag(bag, 'foo', sliced)).toEqual(bag);
  });

  test('splices a sub-bag into an empty bag', () => {
    expect(spliceMessageBag({}, 'foo', { '': ['x'], bar: ['y'] }))
      .toEqual({ foo: ['x'], 'foo.bar': ['y'] });
  });

  test('clears the sub-bag when the replacement is empty', () => {
    const bag = { foo: ['old'], 'foo.bar': ['oldbar'], other: ['keep'] };
    expect(spliceMessageBag(bag, 'foo', {})).toEqual({ other: ['keep'] });
  });

  test('returns an empty bag for an empty bag and empty replacement', () => {
    expect(spliceMessageBag({}, 'foo', {})).toEqual({});
    expect(spliceMessageBag({}, '', {})).toEqual({});
  });
});

describe('messageBagToString', () => {
  test('renders one line per entry', () => {
    expect(messageBagToString({ a: ['x', 'y'], b: ['z'] })).toBe('a: x, y\nb: z');
  });

  test('returns an empty string for an empty bag', () => {
    expect(messageBagToString({})).toBe('');
  });

  test('renders an entry with no messages as "key: "', () => {
    expect(messageBagToString({ a: [] })).toBe('a: ');
  });
});
