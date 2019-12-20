<template>
  <div :id="id" class="charts-layout">
    <ig-form class="charts-configuration"
      v-if="!!settings && !!schema && !widgetMode" :root="settings"
      v-model="settings" :schema="schema"></ig-form>

    <chart-widget v-if="widgetMode && !settings.rawVizualisation"
      :instanceId="blockSettings.instance"
      :settings="settings" class="charts-widget"/>

    <charts-raw-data v-if="settings.rawVizualisation" class="charts-widget"
      :instanceId="blockSettings.instance"/>
  </div>
</template>

<script>
export default {
  props: {
    blockSettings: {
      type: Object,
      required: true
    },
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
        timeWindow: 80000,
        rawVizualisation: false,
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
