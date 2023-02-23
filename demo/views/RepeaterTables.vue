<template>
    <div class="container">
        <div class="row">
            <div class="col-8 overflow-hidden">
                <FieldGroup v-model="vals" v-model:errors="errors">
                    <div class="row g-3 mb-4">
                        <RepeaterTableField :labelSettings="{prefix: 'Lovely'}" label="Pets" name="pets" :cols="[{name: 'name'}, {name: 'type'}, {name: 'attributes'}]" class="col-12">
                            <template #name>
                                <TextField name="name" />
                            </template>
                            <template #type>
                                <SelectField name="type" choices="cat,dog,fish" />
                            </template>
                            <template #attributes>
                                <CheckboxesField name="attributes" choices="cute,stupid,fat" />
                            </template>
                        </RepeaterTableField>

                        <RepeaterField :labelSettings="{prefix: 'Lovely'}" label="Pets" name="pets" class="col-12">
                            <div class="row">
                                <TextField label="Name" name="name" class="col-md-4" />
                                <SelectField label="Type" name="type" choices="cat,dog,fish" class="col-md-4" />
                                <CheckboxesField label="Attributes" name="attributes" choices="cute,stupid,fat" class="col-md-4" />
                            </div>
                        </RepeaterField>
                    </div>
                </FieldGroup>
            </div>
            <div class="col-4">
                <pre>{{ vals }}</pre>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, provide } from "vue";
import AltFieldWrapper from "../components/AltFieldWrapper.vue";
import { FieldGroup, CheckboxesField, TextField, SelectField, RepeaterField, RepeaterTableField, symbols } from "@/main";

const vals = ref({
    pets: [
        {name: 'Gary', type: 'cat'},
        {name: 'Waffles', type: 'cat'}
    ],
});

const errors = ref({
    "pets.0": ['Cats should not be called Gary'],
});

provide(symbols.fieldWrapperComponent, AltFieldWrapper);

</script>
