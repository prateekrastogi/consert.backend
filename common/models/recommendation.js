'use strict'

const recommendationDelegate = require('../../lib/recommendation-delegate')
const cookie = require('cookie')

module.exports = function (recommendation) {
  /**
    @param {req}:  http request object
    @param {options}: options object to get accessToken, thus, always, non-fabricated authenticated user object
   */

  recommendation.getRecommmendations = function (context = {}, req, options) {
    const userId = getUniqueUserId(req, options)

    const recommendationPromise = recommendationDelegate.getRecommmendations({userId, ...context})
      .toPromise()

    return new Promise((resolve, reject) => resolve(recommendationPromise))
  }

  recommendation.putUserProperties = function (req, options) {
    const browserId = cookie.parse(req.headers.cookie).browserId
    const clientId = cookie.parse(req.headers.cookie).clientId
    const userId = getUniqueUserId(req, options)

    const userUpdater = recommendationDelegate.putUserProperties({ browserId, clientId }, userId)

    /* Returning empty object coz limitations of graphql adapter as it needs to attach
      clientMutationId property to the returned object. Thus, no string, boolean, or number datatype */
    return new Promise((resolve, reject) => resolve(userUpdater.toPromise().then(val => ({}))))
  }

  recommendation.logUserItemInteraction = function (interaction, req, options) {
    const userId = getUniqueUserId(req, options)

    const userItemInteractionLogger = recommendationDelegate.logUserItemInteraction(interaction, userId)

    return new Promise((resolve, reject) => resolve(userItemInteractionLogger.toPromise().then(val => ({}))))
  }

  recommendation.listItems = function (params) {
    const itemsList = recommendationDelegate.listItems(params).toPromise()

    return new Promise((resolve, reject) => resolve(itemsList))
  }

  function getUniqueUserId (req, options) {
    const clientId = cookie.parse(req.headers.cookie).clientId

    if (clientId) {
      return options.accessToken ? options.accessToken.userId.toString() : clientId
    } else {
      throw new Error('No Client Id')
    }
  }
}
