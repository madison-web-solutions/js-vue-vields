<template>
    <SelectField :choices="countries" fieldTypeSlug="country" />
</template>

<script setup lang="ts">
// The root element of a component automatically inherits all non-prop attributes (including event listeners)
// Since the root element here is a SelectField, this means that the SelectField will automatically receive
// the value, errors, label etc, and will pass on the update events.
// So all we have to do here is supply the overriden specific settings, choices and fieldTypeSlug
import { SelectField } from '@/main';

const countries = [
    {key: 'GB', label: 'United Kingdom'},
    {key: 'FR', label: 'France'},
];
</script>
