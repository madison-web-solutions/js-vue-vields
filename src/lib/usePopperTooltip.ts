import { ref } from 'vue';
import { createPopper } from '@popperjs/core/lib/popper-lite.js';
import preventOverflow from '@popperjs/core/lib/modifiers/preventOverflow.js';
import flip from '@popperjs/core/lib/modifiers/flip.js';
import type { Ref } from 'vue';
import type { Instance } from '@popperjs/core/lib/popper-lite.js';

const usePopperTooltip = (helpIconEle: Ref<HTMLElement | null>, tooltipEle: Ref<HTMLElement | null>) => {
    const tooltipOpen = ref<boolean>(false);
    let popper: Instance | null = null;
    const showTooltip = () => {
        if (helpIconEle.value && tooltipEle.value) {
            tooltipOpen.value = true;
            popper = createPopper(helpIconEle.value, tooltipEle.value, {
                placement: 'top',
                modifiers: [preventOverflow, flip],
            });
        }
    };
    const hideTooltip = () => {
        tooltipOpen.value = false;
        if (popper) {
            popper.destroy();
            popper = null;
        }
    };
    const toggleToolTip = () => tooltipOpen.value ? hideTooltip() : showTooltip();

    return { tooltipOpen, showTooltip, hideTooltip, toggleToolTip };
};

export default usePopperTooltip;
