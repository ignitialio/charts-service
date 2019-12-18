<template>
  <div v-if="restKey" class="chartpicker-layout">
    <img v-for="(ctype, index) in chartTypes" :key="index"
      class="chartpicker-thumbnail"
      :src="$utils.fileUrl(url(ctype))"
      @click="handleType(ctype)"
      :class="{ 'selected': type === ctype}"
      :title="ctype"/>
  </div>
</template>

<script>
import _ from 'lodash'

export default {
  props: {
    value: String
  },
  data: () => {
    return {
      type: null,
      chartTypes: [ 'bar', 'bubble', 'column', 'heatmap', 'line', /* 'mixed', */ 'pie' ],
      restKey: null
    }
  },
  methods: {
    url(type) {
      return '$$service(charts)/assets/thumbnails/charts-' + type + '.jpg'
    },
    handleType(type) {
      this.$emit('input', type)
      this.$services.emit('selection:chart', type)
    }
  },
  mounted() {
  }
}
</script>

<style scoped>
.chartpicker-layout {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  justify-content: center;
}

.chartpicker-thumbnail {
  width: 80px;
  height: 80px;
  margin: 4px;
  padding: 2px;
  border: 1px solid rgba(0, 0, 0, 0);
}

.chartpicker-thumbnail:hover {
  border: 1px solid orange;
}

.theme--dark .chartpicker-thumbnail:hover {
  border: 1px solid slategrey;
}

.chartpicker-thumbnail.selected {
  border: 1px solid dodgerblue;
}

.theme--dark .chartpicker-thumbnail.selected {
  border: 1px solid peru;
}
</style>
