<template>
    <div class="container">
        <h1>Demo App</h1>
        <div class="row">
            <div class="col-8">
                <FieldGroup v-model="vals">
                    <div class="row g-3">
                        <TextField label="First Name" name="first_name" class="col-md-6" />
                        <TextField label="Last Name" name="last_name" class="col-md-6" />
                        <TextAreaField label="Summary" name="summary" :rows="3" class="col-12" />
                        <RepeaterField label="Pets" name="pets" class="col-12">
                            <div class="row">
                                <TextField label="Name" name="name" class="col-md-6" />
                                <SelectField label="Type" name="type" choices="cat,dog,fish" class="col-md-6" />
                            </div>
                        </RepeaterField>
                        <NumberField label="Age" name="age" :min="0" class="col-md-6" />
                        <CurrencyField label="Salary" name="salary" currencyCode="GBP" class="col-md-6" />
                        <hr />
                        <p v-if="! showingDescription">
                            <button type="button" class="btn btn-primary" @click="showingDescription = true">Show Description</button>
                        </p>
                        <HtmlField v-if="showingDescription" label="Description" name="description" class="col-12" />
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
import { ref } from "vue";
import { FieldGroup, CheckboxField, CheckboxesField, TextField, SelectField, HtmlField, CurrencyField, NumberField, ToggleField, RepeaterField, SearchField, RadioField } from "@/main";
import TextAreaField from "@/components/TextAreaField.vue";

const vals = ref({
    first_name: 'Jane',
    last_name: 'Doe',
    summary: "A wonderful person.\nKind and caring.",
    pets: [
        {name: 'Gary', type: 'cat'},
        {name: 'Waffles', type: 'cat'}
    ],
    age: 40,
    salary: 4200000,
    description: '<h3>Hobbies</h3><ul><li>Trampolining</li><li>Knitting</li></ul>',
});

const showingDescription = ref<boolean>(false);

</script>