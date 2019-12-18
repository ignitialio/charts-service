<template>
  <div :id="id" class="charts-layout">
    <ig-form class="charts-configuration"
      v-if="!!settings && !!schema && !widgetMode" :root="settings"
      v-model="settings" :schema="schema"></ig-form>

    <chart-widget v-if="widgetMode" :settings="settings" class="charts-widget"/>
  </div>
</template>

<script>
export default {
  props: {
    widgetMode: {
      type: Boolean,
      default: false
    }
  },
  data: () => {
    return {
      id: 'charts_' + Math.random().toString(36).slice(2),
      settings: {
        type: 'line',
        selfTrig: false,
        interval: 1000,
        series: []
      },
      schema: null
    }
  },
  computed: {

  },
  methods: {
  },
  mounted() {
    // dev
    // refresh service UI on hot reload
    this.$services.once('service:up', service => {
      if (service.name === 'charts') {
        localStorage.setItem('HR_PATH', '/service-charts')
        window.location.reload()
      }
    })

    this.$services.waitForService('charts').then(async chartsService => {
      try {
        this.schema = this.$services.servicesDico.charts.options.schema
      } catch (err) {
        console.log(err)
      }
    }).catch(err => console.log(err))
  },
  beforeDestroy() {

  }
}
</script>

<style>
.charts-layout {
  width: 100%;
  height: calc(100% - 0px);
}

.charts-configuration {
  width: 100%;
  height: calc(100% - 0px);
}

.charts-widget {
  width: 100%;
  height: calc(100% - 0px);
}
</style>
