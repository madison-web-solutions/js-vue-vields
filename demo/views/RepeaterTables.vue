<template>
  <div class="container">
    <div class="row">
      <div class="col-8 overflow-hidden">
        <FieldGroup v-model="vals" v-model:errors="errors">
          <p>Using a &lt;RepeaterTableField&gt;</p>
          <RepeaterTableField
            :labelSettings="{ prefix: 'Lovely' }"
            label="Pets"
            name="pets"
            :cols="[{ name: 'name' }, { name: 'attributes' }, { name: 'type' }]"
            class="mb-3"
          >
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
          <RepeaterField
            :labelSettings="{ prefix: 'Lovely' }"
            label="Pets"
            name="pets"
            class="mb-3"
          >
            <div class="row">
              <TextField label="Name" name="name" class="col-md-4" />
              <CheckboxesField
                label="Attributes"
                name="attributes"
                choices="cute,stupid,fat"
                class="col-md-4"
              />
              <SelectField
                label="Type"
                name="type"
                choices="cat,dog,fish"
                class="col-md-4"
              />
            </div>
          </RepeaterField>

          <hr />

          <p>
            Using a &lt;RepeaterField&gt; with horizontalFlow and 'col-6' css
            class applied to each item.
          </p>
          <RepeaterField
            label="Pets"
            name="pets"
            class="mb-3"
            colCssClass="col-6"
            :horizontalFlow="true"
          >
            <div class="row">
              <TextField label="Name" name="name" class="col-md-4" />
              <CheckboxesField
                label="Attributes"
                name="attributes"
                choices="cute,stupid,fat"
                class="col-md-4"
              />
              <SelectField
                label="Type"
                name="type"
                choices="cat,dog,fish"
                class="col-md-4"
              />
            </div>
          </RepeaterField>

          <hr />

          <p>
            Using a completely custom layout via the &lt;FieldArray&gt;
            component.
          </p>
          <table class="table mb-3">
            <FieldArray name="pets" :config="{ 'textArea.numRows': 2 }">
              <template #beforeLoop>
                <thead>
                  <tr>
                    <th>Index</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>&nbsp;</th>
                  </tr>
                </thead>
              </template>
              <template #default="{ loopItems }">
                <tbody>
                  <FieldArrayItem v-for="item in loopItems" :index="item.index">
                    <FieldGroup>
                      <tr>
                        <td :rowspan="item.showRowErrors ? 2 : 1" >{{ item.index }} {{ item.isFirst ? '(first)' : '' }}{{ item.isLast ? '(last)' : '' }}</td>
                        <td><TextAreaField name="name" /></td>
                        <td>
                          <SelectField name="type" choices="cat,dog,fish" />
                        </td>
                        <td>
                          <button
                            class="btn btn-outline-danger"
                            @click="item.deleteRow"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                      <tr v-if="item.showRowErrors">
                        <td colspan="3">{{ item.rowErrors }}</td>
                      </tr>
                    </FieldGroup>
                  </FieldArrayItem>
                </tbody>
              </template>
              <template #afterLoop="{ appendRow }">
                <tfoot>
                  <tr>
                    <td colspan="3">
                      <button
                        class="btn btn-outline-primary"
                        @click="appendRow"
                      >
                        New Pet
                      </button>
                    </td>
                  </tr>
                </tfoot>
              </template>
            </FieldArray>
          </table>

          <p>Array Field</p>
          <RepeaterField name="dates" subValuesType="simple">
            <template #default="{ index }">
              <div class="row">
                <div class="col-auto">{{ index + 1 }}</div>
                <DateField class="col" />
              </div>
            </template>
          </RepeaterField>

          <p>Repeater Table inside a Repeater</p>
          <RepeaterField
            label="Seasons"
            name="seasons"
            class="mb-3"
            colCssClass="col-6"
            :horizontalFlow="true"
            appendLabel="Add Season"
          >
            <div class="row">
              <TextField label="Name" name="name" class="mb-2" />
              <RepeaterTableField
                label="Dates"
                name="dates"
                :cols="[{ name: 'start_date' }, { name: 'end_date' }]"
              >
                <template #start_date>
                  <DateField name="start_date" />
                </template>
                <template #end_date>
                  <DateField name="end_date" />
                </template>
              </RepeaterTableField>
            </div>
          </RepeaterField>
        </FieldGroup>
      </div>
      <div class="col-4">
        <pre>{{ vals }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MessageBag } from "vue-fields-ms";
import { ref, provide } from "vue";
import AltFieldWrapper from "../components/AltFieldWrapper.vue";
import {
  DateField,
  FieldGroup,
  FieldArray,
  CheckboxesField,
  TextField,
  TextAreaField,
  SelectField,
  RepeaterField,
  RepeaterTableField,
  symbols,
  FieldArrayItem,
} from "vue-fields-ms";

const vals = ref({
  pets: [
    { name: "Gary", type: "cat" },
    { name: "Waffles", type: "cat" },
  ],
  dates: ["2023-03-01", null, "2022-10-23"],
  seasons: [
    {
      name: "Winter",
      dates: [
        { start_date: "2024-01-01", end_date: "2024-01-31" },
        { start_date: "2024-02-01", end_date: "2024-02-28" },
      ],
    },
    {
      name: "Summer",
      dates: [
        { start_date: "2024-06-01", end_date: "2024-06-30" },
        { start_date: "2024-07-01", end_date: "2024-07-31" },
      ],
    },
  ],
});

const errors = ref<MessageBag>({
  "pets.0": ["Cats should not be called Gary"],
  "pets.1.type": ["What even is a Cat?"],
});

provide(symbols.fieldWrapperComponent, AltFieldWrapper);
</script>
