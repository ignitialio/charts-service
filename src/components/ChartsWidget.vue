<template>
  <div :id="'cw_' + id" class="chartwidget-layout">
  </div>
</template>

<script>
import Chartkick from "chartkick"
import Chart from 'chart.js'
import map from 'lodash/map'
import cloneDeep from 'lodash/cloneDeep'

// Chartkick
Chartkick.use(Chart)

export default {
  props: {
    id: String,
    width: Number,
    height: Number,
    settings: null,
    instanceId: String
  },
  data: () => {
    return {
      // series: null
    }
  },
  methods: {
    /* -------------------------------------------------------------------------
      Chart initial build
       ------------------------------------------------------------------------- */
    async buildChart() {
      let settings = this.settings
      this.series = []

      for (let serie of this.settings.series) {
        this.series.push({
          name: serie.name,
          data: {}
        })
      }

      this.chart = new Chartkick.LineChart('cw_' + this.id, this.series, this.series)
    },
    /* -------------------------------------------------------------------------
      Update series
       ------------------------------------------------------------------------- */
    updateSeries(data) {
      if (!this.chart) {
        this.buildChart()
      }

      for (let i = 0; i < this.settings.series.length; i++) {
        let serieConfig = this.settings.series[i]
        for (let j = 0; j < this.series.length; j++) {
          let serie = this.series[j]
          if (serieConfig.name === serie.name) {
            let x = this.$utils.getByPath(data, serieConfig.xpath)
            let y = this.$utils.getByPath(data, serieConfig.ypath)

            serie.data[x] = y
console.log(serie.name, x, y)
            if (this.settings.timeWindow) {
              let tValues = Object.keys(serie.data).sort()
              let first = new Date(tValues[0]).getTime()
              let last = new Date(x).getTime()
              if (x - first > this.settings.timeWindow) {
                serie.data[first] = undefined
                delete serie.data[first]
              }
            }
          }
        }
      }
console.log(this.chart)
      this.chart.updateData(this.series)
    }
  },
  async mounted() {
    this._listeners = {
      onData: this.updateSeries.bind(this)
    }

    let bb = this.$el.getBoundingClientRect()
    let width = this.width || (bb.width - 16)
    let height = this.height || (bb.height - 40)
    let domRoot = await this.$utils.waitForDOMReady('#cw_' + this.id)
    console.log('width', width + 'px', 'height', height + 'px')
    domRoot.style('width', width + 'px')
      .style('height', height + 'px')

    this.$ws.socket.on('service:event:charts:data:' + this.instanceId,
      this._listeners.onData)
  },
  beforeDestroy() {
    clearInterval(this.updateTimer)
    this.$ws.socket.off('service:event:charts:data:' + this.instanceId,
      this._listeners.onData)
  }
}
</script>

<style scoped>
.chartwidget-layout {
}
</style>
