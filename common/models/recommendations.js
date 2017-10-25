'use strict'

const recombeeClient = require('../../lib/login-assist').recombeeLogin()
const recombeeRqs = require('recombee-api-client').requests

module.exports = function (recommendations) {
  /**
   * gets the recommendation based on genreItems
   * @param {array} genres List of genres for which to get recommendations
   * @param {object} express http request object
   * @param {Function(Error, array)} callback
   */

  recommendations.getGenreBasedRecommendations = function (genres, req, options) {
    var recommendations
    console.log(JSON.stringify(req.headers.cookie))
    console.log(JSON.stringify(options))
    // TODO
    return new Promise((resolve, reject) => resolve(recommendations))
  }
}
