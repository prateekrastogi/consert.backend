'use strict'

const recombeeClient = require('../../lib/login-assist').recombeeLogin()
const recombeeRqs = require('recombee-api-client').requests
const cookie = require('cookie')
const Rx = require('rxjs')
const _ = require('lodash')

const RETRY_COUNT = 3

const clientSendAsObservable = Rx.Observable.bindNodeCallback(recombeeClient.send.bind(recombeeClient))

module.exports = function (recommendation) {
  /**
   * get the recommendation based on filters
   * @param {string} Type of recommendation i.e. USER_BASED or ITEM_BASED
   * @param {number} Total no. of recommendations to be fetched
   * @param {object} Parameters to customize the returned recommendations
   * @param {object} express http request object
   * @param {object} options object to get accessToken, thus, always, non-fabricated authenticated user object
   */

  recommendation.getRecommendations = function (recType, count, recParams, req, options) {
    const userId = getRecombeeUser(req, options)
    const {itemId} = recParams
    let recommendationObservable

    switch (_.toUpper(recType)) {
      case 'ITEMS_USER':
        recommendationObservable = clientSendAsObservable(new recombeeRqs.RecommendItemsToUser(userId, count, recParams))
        break
      case 'USERS_USER':
        recommendationObservable = clientSendAsObservable(new recombeeRqs.RecommendUsersToUser(userId, count, recParams))
        break
      case 'ITEMS_ITEM':
        recommendationObservable = clientSendAsObservable(new recombeeRqs.RecommendItemsToItem(itemId, userId, count, _.omit(recParams, 'itemId')))
        break
      case 'USERS_ITEM':
        recommendationObservable = clientSendAsObservable(new recombeeRqs.RecommendUsersToItem(itemId, count, _.omit(recParams, 'itemId')))
        break
      default:
        throw new Error('Invalid Recommendation Type')
    }

    const recommendationPromise = recommendationObservable.retry(RETRY_COUNT).toPromise()

    return new Promise((resolve, reject) => resolve(recommendationPromise))
  }

  recommendation.putUserPropertyValues = function (req, options) {
    const browserId = cookie.parse(req.headers.cookie).browserId
    const clientId = cookie.parse(req.headers.cookie).clientId
    const userId = getRecombeeUser(req, options)

    const clientSendAsObservable = Rx.Observable.bindNodeCallback(recombeeClient.send.bind(recombeeClient))

    const userGetAndUpdate = clientSendAsObservable(new recombeeRqs.GetUserValues(userId)).retry(RETRY_COUNT)
      .catch(err => Rx.Observable.of(getUserUpdates(browserId, clientId, userId)))
      .concatMap((user) => {
        const mergedUser = mergeUserUpdates(user, getUserUpdates(browserId, clientId, userId))
        return clientSendAsObservable(new recombeeRqs.SetUserValues(userId, mergedUser, {'cascadeCreate': true})).retry(RETRY_COUNT)
      })

    return new Promise((resolve, reject) => resolve(userGetAndUpdate.toPromise().then(val => val === 'ok')))
  }

  /**
   * Registers the user's interaction with recommended item
   * @param {string} itemId Item Id of the item interacted with
   * @param {string} action The type of interaction action performed on that item by that user
   * @param {object} Parameters detailing the action
   * @param {object} express http request object
   * @param {object} options object to get accessToken, thus, always, non-fabricated authenticated user object
   */

  recommendation.logUserItemInteraction = function (itemId, action, actionParams, req, options) {
    const userId = getRecombeeUser(req, options)
    let actionLoggingObservable
    const clientSendAsObservable = Rx.Observable.bindNodeCallback(recombeeClient.send.bind(recombeeClient))

    switch (_.toUpper(action)) {
      case 'DETAIL_VIEW':
        actionLoggingObservable = clientSendAsObservable(new recombeeRqs.AddDetailView(userId, itemId, actionParams))
        break
      case 'PURCHASE':
        actionLoggingObservable = clientSendAsObservable(new recombeeRqs.AddPurchase(userId, itemId, actionParams))
        break
      case 'RATING':
        const {rating} = actionParams
        actionLoggingObservable = clientSendAsObservable(new recombeeRqs.AddRating(userId, itemId, rating, _.omit(actionParams, 'rating')))
        break
      case 'CART_ADDITION':
        actionLoggingObservable = clientSendAsObservable(new recombeeRqs.AddCartAddition(userId, itemId, actionParams))
        break
      case 'BOOKMARK':
        actionLoggingObservable = clientSendAsObservable(new recombeeRqs.AddBookmark(userId, itemId, actionParams))
        break
      default:
        throw new Error('Invalid Action Type')
    }

    const actionLoggingPromise = actionLoggingObservable.retry(RETRY_COUNT).toPromise()

    return new Promise((resolve, reject) => resolve(actionLoggingPromise.then(val => val === 'ok')))
  }

  recommendation.listItems = function (params) {
    const listItemsObservable = clientSendAsObservable(new recombeeRqs.ListItems(params))

    const itemsList = listItemsObservable.toPromise()

    return new Promise((resolve, reject) => resolve(itemsList))
  }

  function mergeUserUpdates (user, userUpdates) {
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
