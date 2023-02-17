import { createApp } from "vue";
import App from './App.vue';
import { configureApp } from "@/main";

import css from './scss/app.scss';
// I don't know what's going on here, but if I just import the css module, and don't
// 'use' it anywhere in the script, the page renders without any styles.
// Just accessing the variable, as below, seems to make it work... no idea why
// In the project built from the Vite init script, I don't seem to need this.
css;

const app = createApp(App);
configureApp(app, {
    cssPrefix: 'demo-',
});

import router from "./router";
app.use(router);

app.mount("#app");
