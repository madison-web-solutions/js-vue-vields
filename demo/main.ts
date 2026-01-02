import { createApp } from "vue";
import App from "./App.vue";
import { vueFieldsMsPlugin, type VueFieldsMsPluginOptions } from "vue-fields-ms";

import "./scss/app.scss";

const app = createApp(App);

// Set up vue-fields-ms
const vfmOpts: VueFieldsMsPluginOptions = {
    config: {
        'textArea.numRows': 3,
        'currency.currencyCode': 'GBP',
        'currency.showCurrency': false,
    }
};
app.use(vueFieldsMsPlugin, vfmOpts);

/*
import router from "./router";
app.use(router);
*/

app.mount("#app");
