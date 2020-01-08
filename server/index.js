const Gateway = require('@ignitial/iio-services').Gateway
const utils = require('@ignitial/iio-services').utils
const config = require('./config')

class ChartsInstance {
  constructor(id, service) {
    this._id = id

    this.interval = null
    this._service = service
    // grants et when preset and needed for service method call
    this.grants = null
  }

  _preset(period) {
    return new Promise((resolve, reject) => {
      if (this.interval) {
        clearInterval(this.interval)
        this.interval = null
      }

      this.interval = setInterval(() => {
        this._service.callEventuallyBoundMethod.apply(this._service,
          [ 'process_' + this._id, this.grants ])
      }, period)

      resolve()
    })
  }

  _clearPreset() {
    return new Promise((resolve, reject) => {
      clearInterval(this.interval)
      resolve()
    })
  }

  // process data for display
  // ***************************************************************************
  process(data) {
    /* @_GET_ */
    return new Promise((resolve, reject) => {
      // this instance one, since bind to it when instance added and method mapped
      this._service._pushEvent('charts:data:' + this._id, data || {})
      console.log(new Date(), 'charts:data:' + this._id, 'data process call with data', data)
      resolve()
    })
  }
}

class Charts extends Gateway {
  constructor(options) {
    super(options)

    this._instances = {}
  }

  addInstance(id) {
    /* @_POST_ */
    return new Promise((resolve, reject) => {
      try {
        if (this._instances[id]) {
          delete this._instances[id]
        }

        // passes service to instance as well !
        this._instances[id] = new ChartsInstance(id, this)
        let methods = utils.getMethods(this._instances[id])

        for (let method of methods) {
          this[method + '_' + id] = this._instances[id][method].bind(this._instances[id])
        }

        resolve()
      } catch (err) {
        reject(err)
      }
    })
  }

  removeInstance(id) {
    /* @_DELETE_ */
    return new Promise((resolve, reject) => {
      delete this._instances[id]

      resolve()
    })
  }

  workflowNodePreset(node, grants) {
    return new Promise((resolve, reject) => {
      utils.waitForPropertyInit(this._instances, node.instance).then(instance => {
        // sets grants for further use
        instance.grants = grants
        if (node.options.period) {
          instance._preset(node.options.period).then(() => {
            resolve()
          }).catch(err => reject(err))
        } else {
          resolve()
        }
      }).catch(err => reject(err))
    })
  }

  workflowNodeClearPreset(node) {
    return new Promise((resolve, reject) => {
      if (this._instances[node.instance]) {
        if (node.options.period) {
          this._instances[node.instance]._clearPreset(node.options.period).then(() => {
            resolve()
          }).catch(err => reject(err))
        } else {
          resolve()
        }
      } else {
        reject(new Error('missing instance'))
      }
    })
  }

  getInstances() {
    /* @_GET_ */
    return new Promise((resolve, reject) => {
      resolve(Object.keys(this._instances))
    })
  }

  getMethods(instanceId) {
    /* @_GET_ */
    return new Promise((resolve, reject) => {
      resolve(utils.getMethods(this).filter(e => e.match(instanceId)))
    })
  }
}

// instantiate service with its configuration
const charts = new Charts(config)

charts._init().then(() => {
  console.log('service [' + charts.name + '] initialization done with options ',
    charts._options)
}).catch(err => {
  console.error('initialization failed', err)
  process.exit(1)
})
