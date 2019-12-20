const fs = require('fs')
const path = require('path')
const YAML = require('yaml')

function envBrowseAndReplace(config) {
  for (let prop in config) {
    if (typeof config[prop] !== 'string' && typeof config[prop] !== 'number') {
      config[prop] = envBrowseAndReplace(config[prop])
    } else {
      if (typeof config[prop] === 'string') {
        let envVarMatch = config[prop].match(/env\((.*?)\)/)
        if (envVarMatch) {
          config[prop] = process.env[envVarMatch[1]]
        }
      }
    }
  }

  return config
}

let generatedConfigPath = path.join(process.cwd(), 'server', 'config', 'generated', 'config.json')
if (fs.existsSync(generatedConfigPath)) {
  let config = JSON.parse(fs.readFileSync(generatedConfigPath, 'utf8'))
  config = envBrowseAndReplace(config)
  console.log('WARNING: using YAML configuration')
  module.exports = config
  return
}

console.log('WARNING: generated file [' + generatedConfigPath + '] does not exist. switch to env config')

// REDIS configuration
// -----------------------------------------------------------------------------
const IIOS_REDIS_PORT = process.env.IIOS_REDIS_PORT ? parseInt(process.env.IIOS_REDIS_PORT) : 6379
const IIOS_REDIS_DB = process.env.IIOS_REDIS_DB ? parseInt(process.env.IIOS_REDIS_DB) : 0
const IIOS_REDIS_ACCESSDB = process.env.IIOS_REDIS_ACCESSDB || 1
let IIOS_REDIS_SENTINELS

if (process.env.IIOS_REDIS_SENTINELS) {
  IIOS_REDIS_SENTINELS = []
  let sentinels = process.env.IIOS_REDIS_SENTINELS.split(',')
  for (let s of sentinels) {
    IIOS_REDIS_SENTINELS.push({ host: s.split(':')[0], port: s.split(':')[1] })
  }
}

// Main configuration structure
// -----------------------------------------------------------------------------
module.exports = {
  /* service name */
  name: process.env.IIOS_SERVICE_NAME || 'charts',
  /* service namesapce */
  namespace: process.env.IIOS_NAMESPACE || 'ignitialio',
  /* heartbeat */
  heartbeatPeriod: 5000,
  /* PUB/SUB/KV connector */
  connector: {
    /* redis server connection */
    redis: {
      /* encoder to be used for packing/unpacking raw messages */
      encoder: process.env.IIOS_ENCODER || 'bson',
      master: process.env.IIOS_REDIS_MASTER || 'mymaster',
      sentinels: IIOS_REDIS_SENTINELS,
      host: process.env.IIOS_REDIS_HOST,
      port: IIOS_REDIS_PORT,
      db: IIOS_REDIS_DB
    },
  },
  /* access control: if present, acces control enabled */
  accesscontrol: {
    /* access control namespace */
    namespace: process.env.IIOS_NAMESPACE || 'ignitialio',
    /* grants for current service: auto-fill */
    grants: {
      __privileged__: {
        'create:any': [ '*' ],
        'read:any': [ '*' ],
        'update:any': [ '*' ],
        'delete:any': [ '*' ]
      },
      admin: {
        'create:any': [ '*' ],
        'read:any': [ '*' ],
        'update:any': [ '*' ],
        'delete:any': [ '*' ]
      },
      user: {
        'read:any': [ '*' ],
        'update:any': [ '*' ],
        'delete:any': [ '*' ]
      },
      anonymous: {
        'read:any': [ '*' ]
      }
    },
    /* connector configuration: optional, default same as global connector, but
       on DB 1 */
    connector: {
      /* redis server connection */
      redis: {
        encoder: process.env.IIOS_ENCODER || 'bson',
        master: process.env.IIOS_REDIS_MASTER || 'mymaster',
        sentinels: IIOS_REDIS_SENTINELS,
        host: process.env.IIOS_REDIS_HOST,
        port: IIOS_REDIS_PORT,
        db: IIOS_REDIS_ACCESSDB
      }
    }
  },
  /* HTTP server declaration */
  server: {
    /* server host */
    host: process.env.IIOS_SERVER_HOST,
    /* server port */
    port: process.env.IIOS_SERVER_PORT,
    /* path to statically serve (at least one asset for icons for example) */
    path: process.env.IIOS_SERVER_PATH_TO_SERVE || './dist',
    /* indicates that service is behind an HTTPS proxy */
    https: false,
  },
  /* options published through discovery mechanism */
  publicOptions: {
    /* declares component injection */
    uiComponentInjection: true,
    /* service description */
    description: {
      /* service icon */
      icon: 'assets/charts-64.png',
      /* Internationalization: see Ignitial.io Web App */
      i18n: {
        'Charts': [ 'Graphiques' ],
        'Charts data visualization':  [
          'Visualisation de données'
        ]
      },
      /* eventually any other data */
      title: 'Charts',
      info: 'Charts data visualization'
    },
    /* can be an worflow (Chaman) block */
    workflow: {
      types: [ 'Destination' ],
      hasWidget: true,
      isMultinstance: true,
      inputs: [
        {
          name: 'dataIn',
          type: 'rpc',
          method: 'process'
        }
      ]
    },
    /* configuration data schema */
    schema: {
      title: 'Configuration',
      type: 'object',
      _meta: {
        type: null,
        i18n: {
          'Configuration': [ 'Configuration', 'Configuración' ]
        }
      },
      properties: {
        type: {
          title: 'Chart type',
          type: 'string',
          enum: [
            'bar', 'bubble', 'column', 'heatmap', 'line', /* 'mixed', */ 'pie'
          ],
          _meta: {
            type: 'enum',
            component: {
              name: 'ig-image-based-picker',
              properties: {
                imageBasePath: '$$service(charts)/assets/thumbnails/charts-',
                imageType: 'jpg'
              }
            },
            i18n: {
              'Chart type': [ 'Type de graphique', 'Tipó de grafico' ]
            }
          }
        },
        selfTrig: {
          title: 'Self trig',
          type: 'boolean',
          default: false,
          _meta: {
            type: null,
            i18n: {
              'Self trig': [ 'Auto-déclenchement', 'Auto-disparador' ]
            }
          }
        },
        interval: {
          title: 'Interval (ms)',
          type: 'number',
          default: 1000,
          _meta: {
            type: null,
            showIf: {
              jsonpath: '$.selfTrig',
              condition: 'eq',
              value: true
            },
            i18n: {
              'Interval (ms)': [ 'Intervallle (ms)', 'Intervalo (ms)' ]
            }
          }
        },
        timeWindow: {
          title: 'Time window (ms)',
          type: 'number',
          default: 80000,
          _meta: {
            type: null,
            showIf: {
              jsonpath: '$.selfTrig',
              condition: 'eq',
              value: true
            },
            i18n: {
              'Time window (ms)': [
                'Fenêtre temporelle (ms)',
                'Ventana de tiempo (ms)'
              ]
            }
          }
        },
        rawVizualisation: {
          title: 'Raw vizualisation',
          type: 'boolean',
          default: false,
          _meta: {
            type: null,
            i18n: {
              'Raw vizualisation': [ 'Visualisation brute', 'Visualización en bruto' ]
            }
          }
        },
        series: {
          title: 'Series',
          type: 'array',
          items: {
            title: 'Serie',
            type: 'object',
            properties: {
              name: {
                type: 'string',
                title: 'Name',
                default: '',
                _meta: {
                  type: null,
                  i18n: {
                    'Name': [ 'Nom', 'Nombre' ]
                  },
                  showIf: [
                    {
                      jsonpath: '$.type',
                      condition: 'eq',
                      value: 'mixed'
                    },
                    {
                      operator: '||'
                    },
                    {
                      jsonpath: '$.type',
                      condition: 'eq',
                      value: 'column'
                    },
                    {
                      operator: '||'
                    },
                    {
                      jsonpath: '$.type',
                      condition: 'eq',
                      value: 'bar'
                    },
                    {
                      operator: '||'
                    },
                    {
                      jsonpath: '$.type',
                      condition: 'eq',
                      value: 'line'
                    }
                  ]
                }
              },
              color: {
                title: 'Color',
                type: 'string',
                _meta: {
                  type: 'color',
                  default: 'deepskyblue',
                  i18n: {
                    'Color': [ 'Couleur', 'Color' ]
                  },
                  showIf: [
                    {
                      jsonpath: '$.type',
                      condition: 'eq',
                      value: 'mixed'
                    },
                    {
                      operator: '||'
                    },
                    {
                      jsonpath: '$.type',
                      condition: 'eq',
                      value: 'column'
                    },
                    {
                      operator: '||'
                    },
                    {
                      jsonpath: '$.type',
                      condition: 'eq',
                      value: 'bar'
                    },
                    {
                      operator: '||'
                    },
                    {
                      jsonpath: '$.type',
                      condition: 'eq',
                      value: 'line'
                    }
                  ]
                }
              },
              axis: {
                type: 'string',
                title: 'Axis',
                enum: [ 'X', 'Y' ],
                _meta: {
                  type: 'enum',
                  default: 'X',
                  i18n: {
                    'Axis': [ 'Axe', 'Eje' ]
                  },
                  showIf: [
                    {
                      jsonpath: '$.type',
                      condition: 'eq',
                      value: 'mixed'
                    },
                    {
                      operator: '||'
                    },
                    {
                      jsonpath: '$.type',
                      condition: 'eq',
                      value: 'column'
                    },
                    {
                      operator: '||'
                    },
                    {
                      jsonpath: '$.type',
                      condition: 'eq',
                      value: 'bar'
                    },
                    {
                      operator: '||'
                    },
                    {
                      jsonpath: '$.type',
                      condition: 'eq',
                      value: 'line'
                    }
                  ]
                }
              },
              path: {
                type: 'string',
                title: 'Data path',
                default: '',
                _meta: {
                  type: null,
                  selection: {
                    provider: 'ig-json-picker',
                    event: 'selection:jsonpath'
                  },
                  i18n: {
                    'Data path': [ 'Chemin des données', 'Ruta de datos' ]
                  }
                }
              },
              categories: {
                title: 'Categories',
                type: 'array',
                items: {
                  title: 'Category',
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      title: 'Name',
                      default: '',
                      _meta: {
                        type: null,
                        i18n: {
                          'Name': [ 'Nom', 'Nombre' ]
                        }
                      }
                    },
                    color: {
                      title: 'Color',
                      type: 'string',
                      default: 'deepskyblue',
                      _meta: {
                        type: 'color',
                        i18n: {
                          'Color': [ 'Couleur', 'Color' ]
                        }
                      }
                    },
                    comparator: {
                      type: 'string',
                      title: 'Comparator',
                      enum: [ '<', '<=', '=', '>=', '>', '<=...<', '<=...=<', '<...=<', '<...<'],
                      _meta: {
                        type: 'enum',
                        i18n: {
                          'Comparator': [ 'Comparateur', 'Comparateur' ]
                        }
                      }
                    },
                    parameters: {
                      title: 'Parameters',
                      type: 'string',
                      default: '',
                      _meta: {
                        type: null,
                        i18n: {
                          'Parameters': [ 'Paramètres', 'Parametros' ]
                        }
                      }
                    }
                  },
                  _meta: {
                    type: null,
                    i18n: {
                      'Category': [ 'Catégorie', 'Categoria' ]
                    }
                  }
                },
                _meta: {
                  type: null,
                  i18n: {
                    'Categories': [ 'Catégories', 'Categorias' ]
                  },
                  showIf: {
                    jsonpath: '$.type',
                    condition: 'eq',
                    value: 'pie'
                  }
                }
              }
            },
            _meta: {
              type: null,
              i18n: {
                'Serie': [ 'Série', 'Seria' ]
              }
            }
          },
          _meta: {
            type: null,
            i18n: {
              'Series': [ 'Séries', 'Serias' ]
            }
          }
        }
      }
    }
  }
}
