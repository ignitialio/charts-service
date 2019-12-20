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
    value: Object,
    width: Number,
    height: Number
  },
  data: () => {
    return {
      settings: null,
      chartOptions: null,
      series: []
    }
  },
  watch: {
    value: {
      handler: function(val) {
        this.reinitialize()
      },
      deep: true
    }
  },
  methods: {
    /* -------------------------------------------------------------------------
       Reinitialize
       ------------------------------------------------------------------------- */
    async reinitialize() {
      clearInterval(this.updateTimer)

      await this.$utils.waitForProperty(this, '$services')

      this.series = []

      this.$utils.waitForProperty(this, 'etl', 5000).then(() => {
        this.updateRawData(true) // emit ETL object

        if (this.settings.realtime) {
          this.activateRealtime()
        } else {
          this.buildSeries()
        }
      }).catch(err => console.log(err))
    },
    /* -------------------------------------------------------------------------
       Activate real time update
       ------------------------------------------------------------------------- */
    async activateRealtime() {
      if (this.settings.updateInterval) {
        if (this.settings.eventDriven) {
          this.listeners = {
            handleData: this.updateSeriesWithOverflowControl.bind(this)
          }
        } else {
          await this.buildSeries() // build series data for further use

          if (this.updateTimer) {
            clearInterval(this.updateTimer)
          }

          this.updateTimer = setInterval(this.updateSeries,
            this.settings.updateInterval)
        }
      }
    },
    /* -------------------------------------------------------------------------
      Update data
      -------------------------------------------------------------------------- */
    updateRawData(emitETL = false) {
      return new Promise((resolve, reject) => {

      })
    },
    /* -------------------------------------------------------------------------
      Compute series
       ------------------------------------------------------------------------- */
    async buildSeries(data) {
      let settings = this.settings

      try {
        let series = []
        let colors = []
        let categories = []
        let rawData = data || await this.updateRawData()

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
                  data: serieData || []
                })

              } else if (serie.axis === 'X') {
                categories = categories.concat(serieData || [])
              } else {
                categories = null
                colors.push(serie.color)

                series.push({ name: serie.name, data: [] })
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
            // console.log('BUILD SERIES', this.chartOptions.xaxis.categories.length, this.series[0].data.length)
          }
        }
      } catch (err) {
        console.log(err)
      }
    },
    /* -------------------------------------------------------------------------
      Update series
       ------------------------------------------------------------------------- */
    async updateSeriesWithOverflowControl(data) {
      let now = Date.now()
      if (this.updateSeriesTimestamp) {
        let delta = now - this.updateSeriesTimestamp
        this.updateSeriesTimestamp = now
        if (delta < 500) return
      } else {
        this.updateSeriesTimestamp = now
      }

      this.updateSeries(data)
    },
    /* -------------------------------------------------------------------------
      Update series
       ------------------------------------------------------------------------- */
    async updateSeries(data) {
      data = data || await this.updateRawData()

      if (!this.chartOptions) {
        this.buildSeries(data)
      }

      switch (this.settings.type) {
        case 'line':
          for (let i = 0; i < this.series.length; i++) {
            let serie = this.series[i]

            let value = this.$utils.getByPath(data, this.settings.series[i].path)

            let item = {
              x: new Date().getTime(),
              y: value
            }
            // console.log(data, this.settings.sinkConfig[i].path, item)
            serie.data.push(item)
            // console.log(this.$refs.chart.chart)
            if (this.$refs.chart && this.$refs.chart.chart) {
              this.$refs.chart.chart.updateSeries(this.series)
            }
          }
          break
      }
    },
    /* -------------------------------------------------------------------------
      Compute categories
       ------------------------------------------------------------------------- */
    async computeCategories(serie) {
      let labels = []
      let series = []
      let colors = []

      try {
        if (serie.categories) {
          let rawData

          switch (this.settings.sinkType) {
            case 'assets':
              let projection = { name: 1 }
              projection[serie.path] = 1

              let dataService = await this.$modules.waitForService('data')
              rawData = await dataService.assets.findInGroups({
                groups: [ this.settings.sink._id ],
                projection: projection
              })

              rawData = map(rawData,
                  e => { return this.$utils.getByPath(e, serie.path) })
              break
          }

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
    this.settings = cloneDeep(this.value)

    let domRoot = await this.$utils.waitForDOMReady('#' + this.id)
    // console.log('width', this.width + 'px', 'height', this.height + 'px')
    domRoot.style('width', this.width + 'px')
      .style('height', this.height + 'px')
  },
  beforeDestroy() {
    clearInterval(this.updateTimer)
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
