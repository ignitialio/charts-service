import VueApexCharts from 'vue-apexcharts'

import Charts from './components/Charts.vue'
import ChartPicker from './components/ChartPicker.vue'

// function to be called when service loaded into web app:
// naming rule: iios_<service_unique_name>
//
global.iios_charts = function(Vue) {
  // Warning: component name must be globally unique in your host app
  Vue.component('charts', Charts)
  // other components
  Vue.component('chart-picker', ChartPicker)
  // apexcharts
  Vue.component('apexchart', VueApexCharts)

  let register = () => {
    // EXEAMPLE
    Vue.prototype.$services.emit('app:menu:add', [
      {
        path: '/service-charts',
        title: 'Charts',
        svgIcon: '$$service(charts)/assets/charts.svg',
        section: 'Services',
        anonymousAccess: true,
        hideIfLogged: false,
        route: {
          name: 'Charts',
          path: '/service-charts',
          component: Charts
        }
      }
    ])

    let onServiceDestroy = () => {
      Vue.prototype.$services.emit('app:menu:remove', [{
        path: '/service-charts'
      }])

      Vue.prototype.$services.emit('service:destroy:charts:done')
    }

    Vue.prototype.$services.once('service:destroy:charts', onServiceDestroy)
  }

  if (Vue.prototype.$services.appReady) {
    register()
  } else {
    Vue.prototype.$services.once('app:ready', register)
  }
}
