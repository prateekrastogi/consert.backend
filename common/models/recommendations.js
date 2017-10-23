'use strict'

const recombeeClient = require('../../lib/login-assist').recombeeLogin()
const recombeeRqs = require('recombee-api-client').requests

module.exports = function (recommendations) {
  /**
   * gets the recommendation based on genreItems
   * @param {array} genres List of genres for which to get recommendations
   * @param {Function(Error, array)} callback
   */

  recommendations.getGenreBasedRecommendations = function (genres, options) {
    var recommendations
    console.log(JSON.stringify(options.accessToken))
    // TODO
    return new Promise((resolve, reject) => resolve(recommendations))
  }
}
