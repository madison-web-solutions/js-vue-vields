<template>
    <p>
        <button v-if="editMode === 'view'" type="button" class="btn btn-primary" @click="editMode = 'edit'">Edit</button>
        <button v-if="editMode === 'edit'" type="button" class="btn btn-primary" @click="editMode = 'view'">View</button>
    </p>
    <FieldGroup v-model="vals" v-model:errors="errors" :editMode="editMode">
        <HtmlField name="bio" />
        <MediaField name="image_id" />
    </FieldGroup>
    <pre>{{ vals }}</pre>
</template>

<script setup lang="ts">
    import { ref } from "vue";
    import { FieldGroup, HtmlField, MediaField } from "vue-fields-ms";

    const editMode = ref<EditMode>("view");
    const vals = ref({
        bio: "<p>Hello World</p>",
        image_id: null,
    });
    const errors = ref({});

</script>