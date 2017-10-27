'use strict'

const Recombee = require('recombee-api-client')
const app = require('../server/server')

module.exports = {
  recombeeLogin: function recombeeLogin () {
    return (app.get('env') === 'production') ? new Recombee.ApiClient('consertlive', 'Rm2nsWFEUhv3GgJrTzTL7YpSJcebeXuvZhU74TckFMog2W5XJUA1yhm93XSBdQYH') : new Recombee.ApiClient('conserttest', 'FonzsaJ7HbuKyB8hEYVQ1hY9Brcc0HkmgUWyeMQdKWZ7VADKWBTboEUisk8Wh1Du')
  }
}
