import Vue from 'vue'
import Charts from '../src/components/Charts.vue'

Vue.config.productionTip = false

new Vue({
  render: h => h(Charts),
}).$mount('#app')
