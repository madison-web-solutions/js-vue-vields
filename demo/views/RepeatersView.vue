<template>
  <ExampleLayout title="Repeater Variants" :code="repeatersCode" :values="liveVals">
    <template #description>
      <p class="mb-0">
        Four different ways to edit the same array of items. All four components below
        are bound to <code>vals.people</code> via a shared <code>FieldGroup</code>, so
        editing any one of them updates the others (and the Live Values panel) in real
        time. This separates the <em>layout</em> (rows / cards / table / custom) from
        the underlying <em>data model</em>.
      </p>
    </template>
    <template #form>
      <RepeatersExample ref="formRef" />
    </template>
  </ExampleLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import ExampleLayout from '../components/ExampleLayout.vue';
import RepeatersExample from '../examples/RepeatersExample.vue';
import repeatersCode from '../examples/RepeatersExample.vue?raw';

const formRef = ref<InstanceType<typeof RepeatersExample>>();

const liveVals = computed(() => formRef.value?.vals ?? {});
</script>
