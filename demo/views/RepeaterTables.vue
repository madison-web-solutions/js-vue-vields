<template>
    <div class="container">
        <div class="row">
            <div class="col-8 overflow-hidden">
                <FieldGroup v-model="vals" v-model:errors="errors">

                    <p>Using a &lt;RepeaterTableField&gt;</p>
                    <RepeaterTableField :labelSettings="{prefix: 'Lovely'}" label="Pets" name="pets" :cols="[{name: 'name'}, {name: 'attributes'}, {name: 'type'}]" class="mb-3">
                        <template #name>
                            <TextField name="name" />
                        </template>
                        <template #attributes>
                            <CheckboxesField name="attributes" choices="cute,stupid,fat" />
                        </template>
                        <template #type>
                            <SelectField name="type" choices="cat,dog,fish" />
                        </template>
                    </RepeaterTableField>

                    <hr />

                    <p>Using a &lt;RepeaterField&gt; in the standard row layout</p>
                    <RepeaterField :labelSettings="{prefix: 'Lovely'}" label="Pets" name="pets" class="mb-3">
                        <div class="row">
                            <TextField label="Name" name="name" class="col-md-4" />
                            <CheckboxesField label="Attributes" name="attributes" choices="cute,stupid,fat" class="col-md-4" />
                            <SelectField label="Type" name="type" choices="cat,dog,fish" class="col-md-4" />
                        </div>
                    </RepeaterField>

                    <hr />

                    <p>Using a &lt;RepeaterField&gt; with horizontalFlow and 'col-6' css class applied to each item.</p>
                    <RepeaterField label="Pets" name="pets" class="mb-3" colCssClass="col-6" :horizontalFlow="true">
                        <div class="row">
                            <TextField label="Name" name="name" class="col-md-4" />
                            <CheckboxesField label="Attributes" name="attributes" choices="cute,stupid,fat" class="col-md-4" />
                            <SelectField label="Type" name="type" choices="cat,dog,fish" class="col-md-4" />
                        </div>
                    </RepeaterField>

                    <hr />

                    <p>Using a completely custom layout via the &lt;FieldArray&gt; component.</p>
                    <table class="table mb-3">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>&nbsp;</th>
                            </tr>
                        </thead>
                        <tbody>
                            <FieldArray name="pets">
                                <template #default="{ rowVals, rowErrors, deleteRow }">
                                    <tr>
                                        <td><TextField name="name" /></td>
                                        <td><SelectField name="type" choices="cat,dog,fish" /></td>
                                        <td><button class="btn btn-outline-danger" @click="deleteRow">Delete</button></td>
                                    </tr>
                                    <tr v-if="rowErrors && rowErrors.length">
                                        <td colspan="3">{{ rowErrors }}</td>
                                    </tr>
                                </template>
                                <template #afterLoop="{ appendRow }">
                                    <tr>
                                        <td colspan="3"><button class="btn btn-outline-primary" @click="appendRow">New Pet</button></td>
                                    </tr>
                                </template>
                            </FieldArray>
                        </tbody>
                    </table>
                </FieldGroup>
            </div>
            <div class="col-4">
                <pre>{{ vals }}</pre>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { MessageBag } from '@/main';
import { computed, ref, provide } from "vue";
import AltFieldWrapper from "../components/AltFieldWrapper.vue";
import { FieldGroup, FieldArray, CheckboxesField, TextField, SelectField, RepeaterField, RepeaterTableField, symbols, sliceMessageBag, spliceMessageBag } from "@/main";

const vals = ref({
    pets: [
        {name: 'Gary', type: 'cat'},
        {name: 'Waffles', type: 'cat'}
    ],
});

const errors = ref<MessageBag>({
    "pets.0": ['Cats should not be called Gary'],
    "pets.1.type": ['What even is a Cat?'],
});

provide(symbols.fieldWrapperComponent, AltFieldWrapper);

</script>
