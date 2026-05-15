import { createApp } from 'vue'
import App from './App.vue'
import { vueFieldsMsPlugin, type VueFieldsMsPluginOptions } from 'vue-fields-ms'
import { choicesProvider, linksProvider, mediaProvider, passwordStrengthProvider } from './providers'

import './scss/app.scss'

const app = createApp(App)

const vfmOpts: VueFieldsMsPluginOptions = {
  choicesProvider,
  linksProvider,
  mediaProvider,
  passwordStrengthProvider,
  config: {
    'textArea.numRows': 4,
    'currency.currencyCode': 'GBP',
    'currency.showCurrency': false,
    'media.supportCropCenter': true,
  },
}

app.use(vueFieldsMsPlugin, vfmOpts)
app.mount('#app')
