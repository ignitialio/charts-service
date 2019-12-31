<template>
  <div :id="id" class="charts-layout">
    <ig-form class="charts-configuration"
      v-if="!!settings && !!schema && options" :root="settings"
      v-model="settings" :schema="schema"
      @input="handleSettings"></ig-form>

    <chart-widget v-if="!options && !settings.rawVizualisation"
      :instanceId="node.instance"
      :settings="settings" class="charts-widget"/>

    <charts-raw-data v-if="!options && settings.rawVizualisation" class="charts-widget"
      :instanceId="node.instance"/>
  </div>
</template>

<script>
export default {
  props: {
    /* used when destination for worklows */
    node: {
      type: Object
    },
    options: {
      type: Object
    }
  },
  watch: {
    options: {
      handler: function(val) {
        this.settings = JSON.parse(JSON.stringify(this.options))
      },
      deep: true
    }
  },
  data: () => {
    return {
      id: 'charts_' + Math.random().toString(36).slice(2),
      settings: {
        type: 'line',
        selfTrig: false,
        period: 1000,
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
    _preset() {
      this.$services.waitForService('charts').then(chartsService => {
        chartsService.workflowNodePreset(this.node).catch(err => console.log(err))
      }).catch(err => console.log(err))
    },
    handleSettings(val) {
      console.log('CHARTS', $j(val))
      this.$emit('update:options', val)
      this._preset()
    }
  },
  mounted() {
    if (this.options) {
      this.settings = JSON.parse(JSON.stringify(this.options))
    } else {
      this.$emit('update:options', this.settings)
    }

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
        this._preset()
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
