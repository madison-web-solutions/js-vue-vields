import type { Ref, PropType } from 'vue';
import { computed, ref, watch } from 'vue';

type UseHasMaxCharsPropRefs = {
    max?: Ref<number | undefined>,
};

export const useHasMaxChars = (modelValue: Ref<string>, props: UseHasMaxCharsPropRefs) => {

    const max = computed((): number | undefined => {
        if (props.max && typeof(props.max.value) == 'number' && props.max.value >= 0) {
            return Math.floor(props.max.value);
        } else {
            return undefined;
        }
    });

    const remainingChars = computed((): number | undefined => {
        if (max.value == null) {
            return undefined;
        }
        return max.value - modelValue.value.length;
    });

    const showRemainingChars = ref(false);
    let remainingCharsTimeout: number | null = null;
    watch (remainingChars, () => {
        if (max.value != null) {
            showRemainingChars.value = true;
            remainingCharsTimeout == null || window.clearTimeout(remainingCharsTimeout);
            remainingCharsTimeout = window.setTimeout(() => showRemainingChars.value = false, 1000);
        }
    });

    return { max, remainingChars, showRemainingChars };

};
