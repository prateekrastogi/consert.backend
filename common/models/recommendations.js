'use strict'

const recombeeClient = require('../../lib/login-assist').recombeeLogin()
const recombeeRqs = require('recombee-api-client').requests

module.exports = function (recommendations) {
  /**
   * get the recommendation based on filters
   * @param {object} filters for recommendations
   * @param {object} express http request object
   * @param {Function(Error, array)} callback
   */

  recommendations.getRecommendations = function (filter, req, options) {
    var recommendations
    console.log(JSON.stringify(req.headers.cookie))
    console.log(JSON.stringify(options))
    // TODO
    return new Promise((resolve, reject) => resolve(recommendations))
  }
}
