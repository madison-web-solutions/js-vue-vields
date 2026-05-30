import { createApp } from 'vue'
import App from './App.vue'
import { vueFieldsMsPlugin, type VueFieldsMsPluginOptions } from 'vue-fields-ms'
import { choicesProvider, linksProvider, mediaProvider, uploadProvider, passwordStrengthProvider } from './providers'
import { router } from './router'

import './scss/app.scss'

const app = createApp(App)

const vfmOpts: VueFieldsMsPluginOptions = {
  choicesProvider,
  linksProvider,
  mediaProvider,
  uploadProvider,
  passwordStrengthProvider,
  config: {
    'textArea.numRows': 4,
    'currency.currencyCode': 'GBP',
    'currency.showCurrency': false,
    'media.supportCropCenter': true,
  },
}

app.use(router)
app.use(vueFieldsMsPlugin, vfmOpts)
app.mount('#app')
