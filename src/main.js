import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import { loadFonts } from './plugins/webfontloader'

loadFonts()

const PROTECTED_ROUTES = [
  '/analyse-lot',
  '/broken-belly-test',
  '/guts-weight',
  '/lot-complete',
]

router.beforeEach((to, from, next) => {
  if (PROTECTED_ROUTES.includes(to.path) && !store.state.analyzing_lot) {
    next('/')
  } else {
    next()
  }
})

createApp(App)
  .use(router)
  .use(store)
  .use(vuetify)
  .mount('#app')
