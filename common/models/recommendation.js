'use strict'

const recombeeClient = require('../../lib/login-assist').recombeeLogin()
const recombeeRqs = require('recombee-api-client').requests
const cookie = require('cookie')
const Rx = require('rxjs-compat')
const _ = require('lodash')
const R = require('ramda')

const RETRY_COUNT = 3

const clientSendAsObservable = Rx.Observable.bindNodeCallback(recombeeClient.send.bind(recombeeClient))

module.exports = function (recommendation) {
  /**
    @param {req}:  http request object
    @param {options}: options object to get accessToken, thus, always, non-fabricated authenticated user object
   */

  recommendation.getRecommendations = function (recType, count, recParams, req, options) {
    const userId = getRecombeeUser(req, options)
    const {itemId} = recParams
    let recommendationObservable

    switch (_.toUpper(recType)) {
      case 'ITEMS_USER':
        recommendationObservable = clientSendAsObservable(new recombeeRqs.RecommendItemsToUser(userId, count, recParams))
          .pluck('recomms').map(recomms => R.map(convertRecombeeResponseItemToCommonMediaItem, recomms))
        break
      case 'USERS_USER':
        recommendationObservable = clientSendAsObservable(new recombeeRqs.RecommendUsersToUser(userId, count, recParams))
        break
      case 'ITEMS_ITEM':
        recommendationObservable = clientSendAsObservable(new recombeeRqs.RecommendItemsToItem(itemId, userId, count, _.omit(recParams, 'itemId')))
          .pluck('recomms').map(recomms => R.map(convertRecombeeResponseItemToCommonMediaItem, recomms))
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

      /* Returning empty object coz limitations of graphql adapter as it needs to attach
      clientMutationId property to the returned object. Thus, no string, boolean, or number datatype */
    return new Promise((resolve, reject) => resolve(userGetAndUpdate.toPromise().then(val => ({}))))
  }

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

    return new Promise((resolve, reject) => resolve(actionLoggingPromise.then(val => ({}))))
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

  // Can also write SPECIFIC conversion functions for recombee's genreItem, artistItem, and mediaItem, if needed.
  function convertRecombeeResponseItemToCommonMediaItem (recombeeResponseItem) {
    const {id, values: recombeeItem = {}} = recombeeResponseItem
    const mediaItem = {
      id: id, // added field
      itemType: recombeeItem.itemType,
      kind: recombeeItem.kind,
      etag: recombeeItem.etag,
      contentDetails: {
        duration: recombeeItem['contentDetails-duration'],
        dimension: recombeeItem['contentDetails-dimension'],
        definition: recombeeItem['contentDetails-definition'],
        caption: recombeeItem['contentDetails-caption'],
        licensedContent: recombeeItem['contentDetails-licensedContent'],
        regionRestriction: recombeeItem['contentDetails-regionRestriction'],
        contentRating: recombeeItem['contentDetails-contentRating'],
        projection: recombeeItem['contentDetails-projection'],
        hasCustomThumbnail: recombeeItem['contentDetails-hasCustomThumbnail']
      },
      statistics: {
        viewCount: recombeeItem['statistics-viewCount'],
        likeCount: recombeeItem['statistics-likeCount'],
        dislikeCount: recombeeItem['statistics-dislikeCount'],
        favoriteCount: recombeeItem['statistics-favoriteCount'],
        commentCount: recombeeItem['statistics-commentCount']
      },
      snippet: {
        publishedAt: recombeeItem['snippet-publishedAt'],
        channelId: recombeeItem['snippet-channelId'],
        title: recombeeItem['snippet-title'],
        description: recombeeItem['snippet-description'],
        channelTitle: recombeeItem['snippet-channelTitle'],
        thumbnails: recombeeItem['snippet-thumbnails'],
        tags: recombeeItem['snippet-tags'],
        categoryId: recombeeItem['snippet-categoryId'],
        liveBroadcastContent: recombeeItem['snippet-liveBroadcastContent'],
        defaultLanguage: recombeeItem['snippet-defaultLanguage'],
        localized: recombeeItem['snippet-localized'],
        defaultAudioLanguage: recombeeItem['snippet-defaultAudioLanguage']
      },
      liveStreamingDetails: {
        actualStartTime: recombeeItem['liveStreamingDetails-actualStartTime'],
        actualEndTime: recombeeItem['liveStreamingDetails-actualEndTime'],
        scheduledStartTime: recombeeItem['liveStreamingDetails-scheduledStartTime'],
        scheduledEndTime: recombeeItem['liveStreamingDetails-scheduledEndTime'],
        concurrentViewers: recombeeItem['liveStreamingDetails-concurrentViewers'],
        activeLiveChatId: recombeeItem['liveStreamingDetails-activeLiveChatId']
      },
      ArtistsIds: recombeeItem['artists-ids'],
      genres: recombeeItem['genres'], // differ from mediaItem
      ArtistsNames: recombeeItem['artists-names'],
      ArtistsPopularity: _.map(recombeeItem['artists-popularity'], popularity => parseInt(popularity)),
      ArtistsFollowers: _.map(recombeeItem['artists-followers'], followers => parseInt(followers)),
      relatedArtists: recombeeItem['artists-relatedArtists'],
      ArtistsType: recombeeItem['artists-type'],
      isRemoved: recombeeItem['item-isRemoved']
    }

    const {contentDetails, snippet, statistics, liveStreamingDetails, ...otherDetails} = mediaItem
    const objectTrimmer = R.filter(R.compose(R.not, R.either(R.isNil, R.isEmpty)))

    const trimmedMediaSubObjects = R.map(objectTrimmer, {contentDetails, snippet, statistics, liveStreamingDetails})

    const trimmedMediaItem = { ...trimmedMediaSubObjects, ...objectTrimmer(otherDetails) }

    return trimmedMediaItem
  }
}
