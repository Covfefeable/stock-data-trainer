import { createApp } from 'vue'
import './main.less'
import App from './App'
import router from './router'
import { createPinia } from 'pinia'
import createAntiDebug from './utils/anti-debug'

createApp(App).use(router).use(createPinia()).use(createAntiDebug).mount('#app')
