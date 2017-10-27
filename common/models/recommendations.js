'use strict'

const recombeeClient = require('../../lib/login-assist').recombeeLogin()
const recombeeRqs = require('recombee-api-client').requests

module.exports = function (recommendations) {
  /**
   * get the recommendation based on filters
   * @param {object} filters for recommendations
   * @param {object} express http request object
   * @param {object} options object to get accessToken, thus, always, non-fabricated authenticated user object
   */

  recommendations.getRecommendations = function (filter, req, options) {
    var recommendations
    console.log(JSON.stringify(req.headers.cookie))
    console.log(JSON.stringify(options))
    // TODO
    return new Promise((resolve, reject) => resolve(recommendations))
  }

  /**
   * Registers the user's interaction with recommended item
   * @param {string} itemId Item Id of the item interacted with
   * @param {string} action The type of interaction action performed on that item by that user
   * @param {object} express http request object
   * @param {object} options object to get accessToken, thus, always, non-fabricated authenticated user object
   */

  recommendations.logUserItemInteraction = function (itemId, action, req, options) {
    // TODO
    return new Promise()
  }
}
