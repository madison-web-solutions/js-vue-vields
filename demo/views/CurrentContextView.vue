<template>
  <ExampleLayout title="Reading the Current Context" :code="sources" :values="liveVals">
    <template #description>
      <p>
        Sometimes you want to write a component that will be dropped <em>inside</em> a
        <code>FieldGroup</code> or <code>RepeaterField</code> but doesn't own the data
        itself — a live preview, a summary, a conditional hint. The
        <code>getCurrentValue(path?)</code> and <code>getCurrentErrors(path?)</code>
        helpers let such a component read the value/errors its surrounding container
        provides, as reactive <code>ComputedRef</code>s.
      </p>
      <p class="mb-0">
        <code>path</code> is a dotted string relative to the current context
        (<code>'email'</code>, <code>'address.city'</code>); omit it for the whole
        context value / error bag. Below, a single prop-less
        <code>PersonCard.vue</code> is reused unchanged inside a <code>FieldGroup</code>
        and inside each <code>RepeaterField</code> row — each instance reads whatever
        surrounds it.
      </p>
    </template>
    <template #form>
      <CurrentContextExample ref="formRef" />
    </template>
  </ExampleLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import ExampleLayout from '../components/ExampleLayout.vue';
import CurrentContextExample from '../examples/CurrentContextExample.vue';
import personCardCode from '../components/PersonCard.vue?raw';
import currentContextExampleCode from '../examples/CurrentContextExample.vue?raw';

const sources = [
  { name: 'PersonCard.vue', source: personCardCode },
  { name: 'CurrentContextExample.vue', source: currentContextExampleCode },
];

const formRef = ref<InstanceType<typeof CurrentContextExample>>();

const liveVals = computed(() => formRef.value?.vals ?? {});
</script>
