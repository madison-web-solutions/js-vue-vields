import { createRouter, createWebHistory } from "vue-router";
import Home from "./views/Home.vue";
import CustomFields from "./views/CustomFields.vue";
import RepeaterTables from "./views/RepeaterTables.vue";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: "/",
            name: "home",
            component: Home,
        },
        {
            path: "/custom-fields",
            component: CustomFields,
        },
        {
            path: "/repeater-tables",
            component: RepeaterTables,
        }
    ],
});

export default router;
