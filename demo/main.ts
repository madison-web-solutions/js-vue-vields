import { createApp } from "vue";
import App from './App.vue';
import { vueFieldsMsPlugin } from 'vue-fields-ms';

import "./scss/app.scss";

const app = createApp(App);
app.use(vueFieldsMsPlugin, {
    registerFieldComponents: false,
    cssPrefix: 'demo-',
});

import router from "./router";
app.use(router);

app.mount("#app");
