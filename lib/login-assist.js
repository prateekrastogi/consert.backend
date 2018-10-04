'use strict'

const Recombee = require('recombee-api-client')
const app = require('../server/server')
const elasticsearch = require('elasticsearch')

module.exports = {
  recombeeLogin: function recombeeLogin () {
    return (app.get('env') === 'production') ? new Recombee.ApiClient('consertlive', 'Rm2nsWFEUhv3GgJrTzTL7YpSJcebeXuvZhU74TckFMog2W5XJUA1yhm93XSBdQYH', true) : new Recombee.ApiClient('conserttest', 'HhMPwtFL8VmsNqfymgYYP05Ax8KYSq3n7OuZwXrLNHjI2AZ3zXon9kxNyPMX9J77', true)
  },

  elasticLogin: function elasticLogin () {
    let config = {
      host: 'localhost:9201',
      log: 'trace'
    }
    if (app.get('env') === 'production') {
      config = {
        host: 'elastic-elasticsearch:9200'
      }
    }
    return new elasticsearch.Client(config)
  }
}
