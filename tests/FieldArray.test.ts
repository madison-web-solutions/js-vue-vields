import { describe, test, expect } from 'vitest';
import { defineComponent, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import type { MessageBag } from '../src/types';
import FieldArray from '../src/components/FieldArray.vue';
import TextField from '../src/components/TextField.vue';

// FieldArray is the renderless repeater consumers use to build a custom repeater field. Generic
// repeater behaviour (append/delete/move/min/max/reindex/disabled/view) is covered for FieldArray
// in repeater-behaviors.test.ts via a custom host. These tests cover what is unique to FieldArray:
// its slot API (beforeLoop / default loopItems / afterLoop) and its renderless nature.
//
// beforeLoop/afterLoop slot props are bound to `slot`; the default slot destructures { loopItems }.

const mountFA = (opts: {
  value?: unknown[];
  errors?: MessageBag;
  props?: Record<string, unknown>;
  beforeLoop?: string;
  defaultSlot?: string;
  afterLoop?: string;
}) => {
  const value = ref<unknown[]>(opts.value ? [...opts.value] : []);
  const errors = ref<MessageBag>(opts.errors ?? {});
  const Parent = defineComponent({
    components: { FieldArray, TextField },
    setup: () => ({ value, errors, props: opts.props ?? {} }),
    template: `
      <FieldArray v-model="value" v-model:errors="errors" v-bind="props">
        ${opts.beforeLoop ? `<template #beforeLoop="slot">${opts.beforeLoop}</template>` : ''}
        <template #default="{ loopItems, isMoving, movingIndex }">${opts.defaultSlot ?? ''}</template>
        ${opts.afterLoop ? `<template #afterLoop="slot">${opts.afterLoop}</template>` : ''}
      </FieldArray>
    `,
  });
  return { value, errors, wrapper: mount(Parent) };
};

describe('FieldArray', () => {
  test('is renderless: ignores the label prop and outputs only slot content', () => {
    const { wrapper } = mountFA({
      props: { label: 'Ignored' },
      beforeLoop: `<span class="marker">before</span>`,
    });
    expect(wrapper.find('label').exists()).toBe(false);
    expect(wrapper.find('.marker').text()).toBe('before');
  });

  test('beforeLoop slot exposes canAddRow and appendRow', async () => {
    const { value, wrapper } = mountFA({
      value: ['a'],
      beforeLoop: `<button class="bl-append" v-if="slot.canAddRow" @click="slot.appendRow"></button>`,
    });
    expect(wrapper.find('.bl-append').exists()).toBe(true);
    await wrapper.find('.bl-append').trigger('click');
    expect(value.value.length).toBe(2);
  });

  test('afterLoop slot exposes insertRowAt', async () => {
    const { value, wrapper } = mountFA({
      value: ['a', 'b'],
      afterLoop: `<button class="al-insert" @click="slot.insertRowAt(0)"></button>`,
    });
    await wrapper.find('.al-insert').trigger('click');
    expect(value.value.length).toBe(3);
    expect(value.value[1]).toBe('a'); // new blank row inserted at 0, pushing 'a' to index 1
  });

  test('a slot deleteRowAt removes the row at that index', async () => {
    const { value, wrapper } = mountFA({
      value: ['a', 'b', 'c'],
      beforeLoop: `<button class="bl-del" @click="slot.deleteRowAt(1)"></button>`,
    });
    await wrapper.find('.bl-del').trigger('click');
    expect(value.value).toEqual(['a', 'c']);
  });

  test('canAddRow reflects the max prop', () => {
    const beforeLoop = `<span class="add" v-if="slot.canAddRow">yes</span>`;
    expect(mountFA({ value: ['a', 'b'], props: { max: 2 }, beforeLoop }).wrapper.find('.add').exists()).toBe(false);
    expect(mountFA({ value: ['a'], props: { max: 2 }, beforeLoop }).wrapper.find('.add').exists()).toBe(true);
  });

  test('loopItems expose index, isFirst and isLast', () => {
    const { wrapper } = mountFA({
      value: ['a', 'b', 'c'],
      defaultSlot: `<div v-for="item in loopItems" :key="item.index" class="r" :data-first="item.isFirst" :data-last="item.isLast"></div>`,
    });
    const rows = wrapper.findAll('.r');
    expect(rows[0].attributes('data-first')).toBe('true');
    expect(rows[0].attributes('data-last')).toBe('false');
    expect(rows[2].attributes('data-first')).toBe('false');
    expect(rows[2].attributes('data-last')).toBe('true');
  });

  test('loopItems expose the row value', () => {
    const { wrapper } = mountFA({
      value: ['x', 'y'],
      defaultSlot: `<div v-for="item in loopItems" :key="item.index" class="r">{{ item.rowVals }}</div>`,
    });
    const rows = wrapper.findAll('.r');
    expect(rows[0].text()).toBe('x');
    expect(rows[1].text()).toBe('y');
  });

  test('loopItems expose per-row errors', async () => {
    const { wrapper } = mountFA({
      value: ['a', 'b'],
      errors: { '1': ['Row one is bad'] },
      defaultSlot: `<div v-for="item in loopItems" :key="item.index" class="r"><span v-if="item.showRowErrors" class="err">{{ item.rowErrors.join(',') }}</span></div>`,
    });
    await nextTick();
    const rows = wrapper.findAll('.r');
    expect(rows[0].find('.err').exists()).toBe(false);
    expect(rows[1].find('.err').text()).toBe('Row one is bad');
  });

  test('the default slot exposes isMoving and movingIndex through a move cycle', async () => {
    const { value, wrapper } = mountFA({
      value: ['a', 'b', 'c'],
      defaultSlot: `
        <div v-for="item in loopItems" :key="item.index" class="r">
          <button class="mv" @click="item.startMove"></button>
          <span v-if="item.index === movingIndex" class="moving"></span>
          <span v-if="isMoving" class="target" @click="item.completeMoveAfter"></span>
        </div>`,
    });
    // Nothing moving initially
    expect(wrapper.find('.target').exists()).toBe(false);
    expect(wrapper.find('.moving').exists()).toBe(false);

    // Start moving row 0 → isMoving true, movingIndex 0
    await wrapper.findAll('.mv')[0].trigger('click');
    expect(wrapper.findAll('.target').length).toBe(3);
    expect(wrapper.findAll('.moving').length).toBe(1);

    // Drop after the last row → reorders and exits move mode
    await wrapper.findAll('.target')[2].trigger('click');
    expect(value.value).toEqual(['b', 'c', 'a']);
    expect(wrapper.find('.target').exists()).toBe(false);
  });

  test('a child field bound by item.index reads and writes its row value', async () => {
    const { value, wrapper } = mountFA({
      value: ['a', 'b', 'c'],
      defaultSlot: `<div v-for="item in loopItems" :key="item.index" class="r"><TextField :index="item.index" /></div>`,
    });
    const inputs = wrapper.findAll('input');
    expect((inputs[1].element as HTMLInputElement).value).toBe('b');

    await inputs[1].setValue('B');
    expect(value.value).toEqual(['a', 'B', 'c']);
  });
});
