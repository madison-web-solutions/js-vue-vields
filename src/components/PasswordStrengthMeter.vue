<template>
  <div v-if="strength != null" class="progress">
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
import { symbols } from "../main";

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

const provider = inject(symbols.passwordStrengthProvider, undefined);

const strength = ref<number | undefined>(undefined);

watchEffect(() => {
  if (provider && provider.value && props.password) {
    provider.value.check(props.password).then((newStrength: number) => {
      strength.value = newStrength;
    });
  } else {
    strength.value = undefined;
  }
});

const passwordOk = computed((): boolean => {
  return strength.value != null && strength.value > props.okStrength;
});

const percent = computed((): number => {
  if (provider && provider.value && strength.value != null) {
    return Math.max(
      0,
      Math.min((100 * strength.value) / provider.value.maxStrength),
    );
  } else {
    return 0;
  }
});
</script>
