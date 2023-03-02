import { createApp } from "vue";
import App from './App.vue';
import { configureApp } from "@/main";

import "./scss/app.scss";

const app = createApp(App);
configureApp(app, {
    cssPrefix: 'demo-',
});

import router from "./router";
app.use(router);

app.mount("#app");
