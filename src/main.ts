import { defineAsyncComponent } from 'vue';

import type { CompoundFormValue, RepeaterFormValue, FormValue, Path } from '@/lib/util';
import type { MessageBag } from '@/lib/MessageBag';
import type { Choosable, ChoicesProvider, SearchResultPage } from '@/lib/search';
import type { BooleansMap, KeysList } from '@/lib/field';
import { sliceMessageBag, spliceMessageBag } from '@/lib/MessageBag';
import { getUniqueKey, coerceToCompoundFormValue, coerceToRepeaterFormValue, coerceToArrayKey, copyCompoundFormValue, copyRepeaterFormValue, coerceToBoolean, reindexErrors, symbols } from '@/lib/util';
import { commonProps, useFormField, useHasChoices, useHasChoicesSingle, useHasChoicesMultiple } from '@/lib/field';
import TextField from "@/components/TextField.vue";
import CheckboxField from "@/components/CheckboxField.vue";
import CheckboxesField from "@/components/CheckboxesField.vue";
import CurrencyField from '@/components/CurrencyField.vue';
import DateField from '@/components/DateField.vue';
import NumberField from "@/components/NumberField.vue";
import ToggleField from "@/components/ToggleField.vue";
import RepeaterField from "@/components/RepeaterField.vue";
import RepeaterRow from "@/components/RepeaterRow.vue";
import RadioField from '@/components/RadioField.vue';
import SearchField from '@/components/SearchField.vue';
import SelectField from '@/components/SelectField.vue';
import FlexibleContentField from '@/components/FlexibleContentField.vue';
import FieldWrapper from '@/components/FieldWrapper.vue';
import FieldGroup from '@/components/FieldGroup.vue';

const HtmlField = defineAsyncComponent(() => import('@/components/HtmlField.vue'));

export type { CompoundFormValue, RepeaterFormValue, FormValue, MessageBag, BooleansMap, KeysList, Choosable, SearchResultPage, ChoicesProvider, Path };
export { commonProps, useFormField, useHasChoices, useHasChoicesSingle, useHasChoicesMultiple }
export { sliceMessageBag, spliceMessageBag }
export { getUniqueKey, coerceToCompoundFormValue, coerceToRepeaterFormValue, coerceToArrayKey, copyCompoundFormValue, copyRepeaterFormValue, coerceToBoolean, reindexErrors, symbols };
export { TextField, CheckboxField, CheckboxesField, CurrencyField, DateField, NumberField, ToggleField, RepeaterField, RepeaterRow, RadioField, SearchField, SelectField, HtmlField, FlexibleContentField, FieldWrapper, FieldGroup };
