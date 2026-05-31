<template>
  <ExampleLayout title="Conditional Logic" :code="conditionalCode" :values="liveVals">
    <template #description>
      <p class="mb-2">
        Showing and hiding fields, and making props react to other fields. There's no
        dedicated "conditional" API &mdash; the form model is a plain reactive object, so you
        use ordinary Vue: a <code>v-if</code> reading off the bound values, and props bound to
        expressions or computeds.
      </p>
      <p class="mb-0">
        The one thing worth remembering is repeater rows: a row doesn't share the top-level
        <code>vals</code>, so reach for its values via the default slot &mdash;
        <code>&lt;template #default="{ subVals }"&gt;</code> &mdash; and drive the per-row
        conditions off <code>subVals</code>. Note that hiding a field with <code>v-if</code>
        does not clear its value from the model (watch the Live Values panel).
      </p>
    </template>
    <template #form>
      <ConditionalExample ref="formRef" />
    </template>
  </ExampleLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import ExampleLayout from '../components/ExampleLayout.vue';
import ConditionalExample from '../examples/ConditionalExample.vue';
import conditionalCode from '../examples/ConditionalExample.vue?raw';

const formRef = ref<InstanceType<typeof ConditionalExample>>();

const liveVals = computed(() => formRef.value?.vals ?? {});
</script>
