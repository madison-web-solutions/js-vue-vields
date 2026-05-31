<template>
  <ExampleLayout title="Reusable Field-Group Components" :code="sources" :values="liveVals">
    <template #description>
      <p>
        This page is really about a <em>technique</em>, not a particular field: bundling a
        fixed set of sub-fields into a single reusable component, so the same shape can be
        dropped in anywhere it's needed. A postal address is just a convenient example. Here
        <code>AddressField</code> wraps <code>CompoundField</code> around six sub-fields
        (line 1/2, city, county, postcode, country) and exposes a few layout switches
        (<code>singleCol</code>, <code>border</code>).
      </p>
      <p class="mb-0">
        The same <code>AddressField</code> is reused three times below: once as a
        standalone Shipping Address, once as a Billing Address with the
        <code>singleCol</code> + <code>border</code> variant, and once inside a
        <code>RepeaterField</code> for a list of branch offices. The two source
        files are shown in tabs: the wrapper itself (<code>AddressField.vue</code>)
        and the page that uses it (<code>AddressesExample.vue</code>).
      </p>
    </template>
    <template #form>
      <AddressesExample ref="formRef" />
    </template>
  </ExampleLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import ExampleLayout from '../components/ExampleLayout.vue';
import AddressesExample from '../examples/AddressesExample.vue';
import addressesExampleCode from '../examples/AddressesExample.vue?raw';
import addressFieldCode from '../components/AddressField.vue?raw';

const sources = [
  { name: 'AddressField.vue', source: addressFieldCode },
  { name: 'AddressesExample.vue', source: addressesExampleCode },
];

const formRef = ref<InstanceType<typeof AddressesExample>>();

const liveVals = computed(() => formRef.value?.vals ?? {});
</script>
