<template>
  <div v-if="strength != null" class="progress" :data-strength="strength">
    <div
      class="progress-bar"
      :class="{ 'bg-success': passwordOk, 'bg-danger': !passwordOk }"
      role="progressbar"
      :style="'width: ' + percent + '%'"
      :aria-valuenow="percent"
      aria-valuemin="0"
      aria-valuemax="100"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, watchEffect } from "vue";
import injectionSymbols from "../lib/injection-symbols";
import { clamp } from "../lib/utils";

const props = defineProps({
  password: {
    type: String,
    default: "",
  },
  okStrength: {
    type: Number,
    default: 3,
  },
});

const provider = inject(injectionSymbols.passwordStrengthProvider, undefined);

const strength = ref<number | undefined>(undefined);

watchEffect(async () => {
  if (! provider || ! props.password) {
    strength.value = undefined;
    return;
  }
  strength.value = await provider.check(props.password);
});

const passwordOk = computed((): boolean => {
  return strength.value != null && strength.value > props.okStrength;
});

const percent = computed((): number => {
  if (provider && strength.value != null) {
    return clamp(0, 100, 100 * strength.value / provider.maxStrength);
  } else {
    return 0;
  }
});
</script>
