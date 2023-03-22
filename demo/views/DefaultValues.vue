<template>
    <div class="container">
        <div class="row">
            <div class="col-8 overflow-hidden mb-5">
                <FieldGroup v-model="vals" v-model:errors="errors">
                    <RepeaterTableField :default="defaultPets" :labelSettings="{prefix: 'Lovely'}" label="Pets" name="pets" :cols="[{name: 'name'}, {name: 'attributes'}, {name: 'type'}]" class="mb-3">
                        <template #name>
                            <TextField name="name" />
                        </template>
                        <template #attributes>
                            <CheckboxesField :default="['stupid']" name="attributes" choices="cute,stupid,fat" />
                        </template>
                        <template #type>
                            <SelectField name="type" choices="cat,dog,fish" />
                        </template>
                    </RepeaterTableField>

                    <p>Array Field</p>
                    <RepeaterField :default="defaultDates" name="dates" subValuesType="simple">
                        <template #default="{ index }">
                            <div class="row">
                                <div class="col-auto">{{ index + 1 }}</div>
                                <DateField :default="defaultDate" class="col" />
                            </div>
                        </template>
                    </RepeaterField>

                    <TokensField label="Cats" name="cats" :searchable="true" directory="cats" />
                </FieldGroup>
            </div>
            <div class="col-4">
                <pre>{{ vals }}</pre>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { DateField, FieldGroup, CheckboxesField, TextField, SelectField, RepeaterField, RepeaterTableField, TokensField } from "vue-fields-ms";

const vals = ref({cats: [2,3]});
const errors = ref({});

const defaultPets = [
    {name: 'Gary', type: 'cat'},
    {name: 'Waffles', type: 'cat'}
];

const defaultDates = ['2023-03-01', null, '2022-10-23'];

const defaultDate = '1981-10-20';

</script>
