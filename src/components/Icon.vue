<template>
  <component :is="iconComponent" class="vfm-icon" :class="{'vfm-icon-spin': spin}" />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { iconMap } from '../lib/icons';
import type { IconName } from '../types';

const props = defineProps<{ icon: IconName }>();
const iconComponent = computed(() => iconMap[props.icon]);

const spin = computed(() => {
  return ['loaderCircle'].includes(props.icon);
});

</script>
