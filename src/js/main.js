import Vue from 'vue'
import router from '@/router'
import '%/app.scss'
import db from '@/db'
import filters from '@/filters'
import VueSweetalert2 from 'vue-sweetalert2'
import VueScrollTo from 'vue-scrollto'
import navigation from '@/components/Navigation.vue'
import VueMoment from 'vue-moment'

window._ = require('lodash')

var appSettings = {
  'name': 'negi3002',
  'version': '0.2.1'
}

let load = function () {
  Vue.config.productionTip = false
  Vue.prototype.$appSettings = appSettings

  // Load Database before everything else
  let loadDatabase = db({ dbname: appSettings.name })

  // After database is loaded
  loadDatabase.then(() => {
    // Vue Filters
    Vue.filter('currency', filters.currency)
    Vue.filter('date', filters.date)

    // Vue Moment
    Vue.use(VueMoment)

    // Vue SweetAlert2
    Vue.use(VueSweetalert2)

    // Vue ScrollTo
    Vue.use(VueScrollTo)

    /* eslint-disable no-new */
    window.app = new Vue({
      router,
      components: { navigation },
      template: "<div id='app'><navigation/><transition name='fade'><router-view/></transition></div>"
    }).$mount('#app')
  })
}

if (typeof cordova !== 'undefined') {
  // If cordova is defined, wait for deviceready
  document.addEventListener('deviceready', function () {
    load()
  }, {}, true)
} else {
  // If cordova is undefined, immediately load
  load()
}
