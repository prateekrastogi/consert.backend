'use strict'

const recombeeClient = require('../../lib/login-assist').recombeeLogin()
const recombeeRqs = require('recombee-api-client').requests
const cookie = require('cookie')
const Rx = require('rxjs')
const _ = require('lodash')

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
   * Puts the value of user properties in recombee
   * @param {object} req Express request object
   * @param {Function(Error)} callback
   */

  recommendations.putUserPropertyValues = function (req, options) {
    const browserId = cookie.parse(req.headers.cookie).browserId
    const clientId = cookie.parse(req.headers.cookie).clientId
    const userId = getRecombeeUser(req, options)

    const clientSendAsObservable = Rx.Observable.bindNodeCallback(recombeeClient.send.bind(recombeeClient))

    const userGetAndUpdate = clientSendAsObservable(new recombeeRqs.GetUserValues(userId)).retry(3)
      .catch(err => Rx.Observable.of(getUserUpdates(browserId, clientId, userId)))
      .concatMap((user) => {
        const mergedUser = mergerUserUpdates(user, getUserUpdates(browserId, clientId, userId))
        return clientSendAsObservable(new recombeeRqs.SetUserValues(userId, mergedUser, {'cascadeCreate': true})).retry(3)
      })

    userGetAndUpdate.subscribe(x => console.log(x), e => console.error(e))

    return new Promise((resolve, reject) => resolve(true))
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

  function mergerUserUpdates (user, userUpdates) {
    return _.mergeWith(user, userUpdates, (objVal, srcVal) => {
      if (_.isArray(objVal)) {
        return _.compact(_.uniq(objVal.concat(srcVal)))
      }
    })
  }

  function getUserUpdates (browserId, clientId, userId) {
    const userUpdates = {
      'userType': `${userId !== clientId ? 'spotify' : 'guest'}`,
      'browser-ids': browserId ? [`${browserId}`] : []
    }
    return userUpdates
  }

  function getRecombeeUser (req, options) {
    const clientId = cookie.parse(req.headers.cookie).clientId

    if (clientId) {
      return options.accessToken ? options.accessToken.userId.toString() : clientId
    } else {
      throw new Error('No Client Id')
    }
  }
}
