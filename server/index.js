const Service = require('@ignitial/iio-services').Service
const utils = require('@ignitial/iio-services').utils
const config = require('./config')

class ChartsInstance {
  constructor(id) {
    this._id = id
  }

  // process data for display
  // ***************************************************************************
  process(data) {
    /* @_GET_ */
    return new Promise((resolve, reject) => {
      this._pushEvent('data:' + this._id, data)
      resolve()
    })
  }
}

class Charts extends Service {
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

        this._instances[id] = new ChartsInstance(id)
        let methods = utils.getMethods(this._instances[id])

        for (let method of methods) {
          this[method + '_' + id] = this._instances[id][method]
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
