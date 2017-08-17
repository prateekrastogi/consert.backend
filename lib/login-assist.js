'use strict'

const Recombee = require('recombee-api-client')

module.exports = {
  recombeeLogin: function recombeeLogin () {
    return new Recombee.ApiClient('consertlive', 'Rm2nsWFEUhv3GgJrTzTL7YpSJcebeXuvZhU74TckFMog2W5XJUA1yhm93XSBdQYH')
  }
}
