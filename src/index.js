import Charts from './components/Charts.vue'
import ChartsWidget from './components/ChartsWidget.vue'
import RawData from './components/RawData.vue'

// function to be called when service loaded into web app:
// naming rule: iios_<service_unique_name>
//
global.iios_charts = function(Vue) {
  // Warning: component name must be globally unique in your host app
  Vue.component('charts', Charts)
  Vue.component('charts-widget', ChartsWidget)
  Vue.component('charts-raw-data', RawData)

  let register = () => {
    // EXEAMPLE
    Vue.prototype.$services.emit('app:menu:add', [
      {
        path: '/service-charts',
        title: 'Charts',
        svgIcon: '$$service(charts)/assets/charts-64.png',
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
