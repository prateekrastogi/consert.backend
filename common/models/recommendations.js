'use strict'

const recombeeClient = require('../../lib/login-assist').recombeeLogin()
const recombeeRqs = require('recombee-api-client').requests

module.exports = function (recommendations) {
  /**
   * gets the recommendation based on genreItems
   * @param {array} genres List of genres for which to get recommendations
   * @param {string} browserId Unique identity of user's browser
   * @param {Function(Error, array)} callback
   */

  recommendations.getGenreBasedRecommendations = function (genres, browserId, options) {
    var recommendations
    console.log(JSON.stringify(JSON.stringify(options)))
    // TODO
    return new Promise((resolve, reject) => resolve(recommendations))
  }
}
