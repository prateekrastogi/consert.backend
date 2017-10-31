'use strict'

const recombeeClient = require('../../lib/login-assist').recombeeLogin()
const recombeeRqs = require('recombee-api-client').requests
const cookie = require('cookie')
const Rx = require('rxjs')

module.exports = function (recommendations) {
  /**
   * get the recommendation based on filters
   * @param {object} filters for recommendations
   * @param {object} express http request object
   * @param {object} options object to get accessToken, thus, always, non-fabricated authenticated user object
   */

  recommendations.getRecommendations = function (filter, req, options) {
    const userId = getRecombeeUser(req, options)
    var recommendations
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

  function getRecombeeUser (req, options) {
    const browserId = cookie.parse(req.headers.cookie).browserId
    const clientId = cookie.parse(req.headers.cookie).clientId
    const userId = options.accessToken.userId

    if (clientId) {
      userId ? console.log('do something') : console.log('do something else')
    } else {
      userId ? console.log(`only userid is present ${userId}`) : false
    }
  }
}
