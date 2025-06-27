<template>
  <component :is="iconComponent" class="vfm-icon" :class="icon" />
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import PlusIcon from '../icons/plus.svg';
import MinusIcon from '../icons/minus.svg';
import XIcon from '../icons/x.svg';
import MoveIcon from '../icons/move.svg';
import SearchIcon from '../icons/search.svg';

const props = defineProps<{ icon: IconName }>();

const iconMap = {
  plus: PlusIcon,
  minus: MinusIcon,
  x: XIcon,
  move: MoveIcon,
  search: SearchIcon,
};

type IconName = keyof typeof iconMap;

const iconComponent = computed(() => iconMap[props.icon]);
</script>