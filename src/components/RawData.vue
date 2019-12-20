<template>
  <div :id="id" class="rawdata-layout">
    <ig-json-viewer :data="rawData"></ig-json-viewwer>
  </div>
</template>

<script>
export default {
  props: {
    instanceId: String
  },
  data: () => {
    return {
      id: 'rawdata_' + Math.random().toString(36).slice(2),
      rawData: null
    }
  },
  computed: {

  },
  methods: {
    handleData(data) {
      this.rawData = data
    }
  },
  mounted() {
    this._listeners = {
      onData: this.handleData.bind(this)
    }

    this.$ws.socket.on('service:event:charts:data:' + instanceId,
      this._listeners.onData)
  },
  beforeDestroy() {
    this.$ws.socket.off('service:event:charts:data:' + instanceId, 
      this._listeners.onData)
  }
}
</script>

<style>
.rawdata-layout {
  width: 100%;
  height: calc(100% - 0px);
}

.rawdata-configuration {
  width: 100%;
  height: calc(100% - 0px);
}

.rawdata-widget {
  width: 100%;
  height: calc(100% - 0px);
}
</style>
