<template>
    <p>
        <button v-if="editMode === 'view'" type="button" class="btn btn-primary" @click="editMode = 'edit'">Edit</button>
        <button v-if="editMode === 'edit'" type="button" class="btn btn-primary" @click="editMode = 'view'">View</button>
    </p>
    <FieldGroup v-model="vals" v-model:errors="errors" :editMode="editMode">
        <HtmlField name="bio" />
        <MediaField name="image_id" />
        <RepeaterField name="items" subValuesType="simple">
            <template #default="{ index, subVal }">
                <input type="text" />
            </template>
        </RepeaterField>
    </FieldGroup>
    <pre>{{ vals }}</pre>
</template>

<script setup lang="ts">
    import { ref } from "vue";
    import { FieldGroup, HtmlField, MediaField, RepeaterField } from "vue-fields-ms";
    import type { EditMode } from "vue-fields-ms";

    const editMode = ref<EditMode>("view");
    const vals = ref({
        bio: "<p>Hello World</p>",
        image_id: null,
    });
    const errors = ref({});

</script>