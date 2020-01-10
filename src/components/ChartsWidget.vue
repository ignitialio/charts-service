<template>
  <div :id="'cw_' + id" class="chartwidget-layout">
    <apexchart ref="chart"
      v-if="chartOptions"
      v-show="series && series.length > 0"
      :width="width - 32" :height="height - 32"
      class="chartwidget-chart"
      :type="settings.type" :options="chartOptions" :series="series"></apexchart>
  </div>
</template>

<script>
import map from 'lodash/map'
import cloneDeep from 'lodash/cloneDeep'

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
      chartOptions: null,
      series: []
    }
  },
  methods: {
    /* -------------------------------------------------------------------------
      Compute series
       ------------------------------------------------------------------------- */
    async buildSeries(rawData) {
      let settings = this.settings

      try {
        let series = []
        let colors = []
        let categories = []

        if (settings.type === 'pie' ||
          settings.type === 'donut') { 
          for (let serie of settings.series) {
            this.computeCategories(serie)
          }
        } else {
          if (settings.series) {
            for (let serie of settings.series) {

              let serieData = this.$utils.getByPath(rawData, serie.path)

              if (serie.axis === 'Y') {
                colors.push(serie.color)

                series.push({
                  name: serie.name,
                  data: Array.isArray(serieData) ? serieData : [ serieData ]
                })
              } else if (serie.axis === 'X' && !settings.selfTrig) {
                categories = categories.concat(serieData || [])
              } else {
                categories = null
                colors.push(serie.color)
              }
            }

            if (categories) {
              this.chartOptions = {
                chart: {
                  id: this.id,
                  stacked: settings.type === 'bar'
                },
                xaxis: {
                  categories: categories,
                  labels: {
                    show: false
                  }
                },
                colors: colors,
                horizontal: settings.type === 'bar',
                dataLabels: {
                  enabled: false
                }
              }
            } else { // datetime X axis for realtime data
              this.chartOptions = {
                chart: {
                  id: this.id,
                  animations: {
                    enabled: true,
                    easing: 'linear',
                    dynamicAnimation: {
                      speed: 100
                    }
                  },
                  zoom: {
                    enabled: false
                  }
                },
                stroke: {
                  curve: 'smooth'
                },
                xaxis: {
                  type: 'datetime',
                  range: settings.timeWindow || 800000
                },
                dataLabels: {
                  enable: false
                },
                colors: colors,
                tooltip: {
                  x: {
                    format: 'HH:mm:ss'
                  }
                },
                grid: {
                  row: {
                    colors: ['#f3f3f3', 'transparent'],
                    opacity: 0.5
                  }
                },
                legend: {
                  position: 'top'
                }
              }
            }

            this.series = series

            console.log('BUILD SERIES', $j(this.series),
              this.chartOptions.xaxis.categories, this.series[0].data)
          }
        }
      } catch (err) {
        console.log(err)
      }
    },
    /* -------------------------------------------------------------------------
      Update series
       ------------------------------------------------------------------------- */
    updateSeries(data) {
      console.log('series update', data, this.chartOptions)
      if (!this.chartOptions) {
        this.buildSeries(data)
      }

      switch (this.settings.type) {
        case 'line':
          for (let i = 0; i < this.series.length; i++) {
            let serie = this.series[i]

            let value = this.$utils.getByPath(data, this.settings.series[i].path)

            console.log(this.settings.series[i].axis, this.settings.series[i].path, value)
            if (this.settings.series[i].axis === 'Y' && this.settings.selfTrig) {
              let item = {
                x: new Date().getTime(),
                y: value
              }

              serie.data.push(item)
              console.log($j(item))
              let last = serie.data[serie.data.length - 1]
              let first = serie.data[0]
              if (last.x - first.x > this.settings.timeWindow) {
                serie.data.shift()
              }

              // console.log(this.$refs.chart.chart)
              if (this.$refs.chart && this.$refs.chart.chart) {
                this.$refs.chart.chart.updateSeries(this.series)
              }
            }
          }
          break
      }
    },
    /* -------------------------------------------------------------------------
      Compute categories
       ------------------------------------------------------------------------- */
    computeCategories(serie) {
      let labels = []
      let series = []
      let colors = []

      try {
        if (serie.categories) {
          let rawData

          for (let category of serie.categories) {
            colors.push(category.color)
            labels.push(category.name)

            let count = this._countFromComparator(rawData,
              category.comparator, category.parameters)
            console.log(category.name, count, category.parameters)
            series.push(count)
          }

          this.chartOptions = {
            chart: {
              id: this.id
            },
            labels: labels,
            colors: colors
          }

          // console.log(JSON.stringify(this.chartOptions, null, 2))
          this.series = series
          // console.log(this.chartOptions.xaxis.categories.length, this.series[0].data.length)
        }
      } catch (err) {
        console.log(err)
      }
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

.chartwidget-chart {
  margin: 16px;
}
</style>
