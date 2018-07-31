'use strict'

const recombeeClient = require('./login-assist').recombeeLogin()
const recombeeRqs = require('recombee-api-client').requests
const recommenderRqs = require('./recommender-requests')
const _ = require('lodash')
const R = require('ramda')
const { bindNodeCallback, of } = require('rxjs')
const {map, retry, filter, concatMap, catchError} = require('rxjs/operators')

const RETRY_COUNT = 3

const clientSendAsObservable = bindNodeCallback(recombeeClient.send.bind(recombeeClient))

exports.getRecommmendations = function getRecommmendations (context) {
  const recommendationObservable = homePageRecommender(context)

  return recommendationObservable.pipe(retry(RETRY_COUNT))
}

exports.logUserItemInteraction = function logUserItemInteraction (interaction, userId) {
  const {itemId, action, actionParams} = interaction

  let actionLoggingObservable

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

  return actionLoggingObservable.pipe(retry(RETRY_COUNT))
}

exports.putUserProperties = function putUserProperties (userProperties, userId) {
  const {browserId, clientId} = userProperties

  const userGetAndUpdate = clientSendAsObservable(new recombeeRqs.GetUserValues(userId))
    .pipe(
      retry(RETRY_COUNT),
      catchError(err => of(getUserUpdates(browserId, clientId, userId))),
      concatMap((user) => {
        const mergedUser = mergeUserUpdates(user, getUserUpdates(browserId, clientId, userId))
        return clientSendAsObservable(new recombeeRqs.SetUserValues(userId, mergedUser, {'cascadeCreate': true})).pipe(retry(RETRY_COUNT))
      })
    )

  return userGetAndUpdate
}

exports.listItems = function listItems (params) {
  const listItemsObservable = clientSendAsObservable(new recombeeRqs.ListItems(params)).pipe(
    map(items => R.map(convertRecombeeResponseItemToCommonMediaItem, items)),
    retry(RETRY_COUNT)
  )

  return listItemsObservable
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

/* Can also write SPECIFIC conversion functions for recombee's genreItem, artistItem, radioItem etc., if needed.
But as of now, serializing all types of mediaItems to a single datatype */
function convertRecombeeResponseItemToCommonMediaItem (recombeeResponseItem) {
  let {id, values: recombeeItem} = recombeeResponseItem
  recombeeItem = recombeeItem || recombeeResponseItem
  const mediaItem = {
    id: id || recombeeItem.itemId, // added field
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
    artists: {
      ids: recombeeItem['artists-ids'],
      names: recombeeItem['artists-names'],
      popularity: _.map(recombeeItem['artists-popularity'], popularity => parseInt(popularity)),
      followers: _.map(recombeeItem['artists-followers'], followers => parseInt(followers)),
      type: recombeeItem['artists-type']
    },
    genres: recombeeItem['genres'],
    childrenItems: recombeeItem['childrenItems'],
    relatedItems: recombeeItem['relatedItems'],
    isRemoved: recombeeItem['item-isRemoved']
  }

  const {contentDetails, snippet, statistics, liveStreamingDetails, artists, ...otherDetails} = mediaItem
  const objectTrimmer = R.filter(R.compose(R.not, R.either(R.isNil, R.isEmpty)))

  const trimmedMediaSubObjects = R.map(objectTrimmer, {contentDetails, snippet, statistics, liveStreamingDetails, artists})

  const trimmedMediaItem = { ...trimmedMediaSubObjects, ...objectTrimmer(otherDetails) }

  return trimmedMediaItem
}

function homePageRecommender (context) {
  const homePageContext = of(context).pipe(filter(({route = '/'}) => route === '/'))

  return homePageContext.pipe(concatMap(context => clientSendAsObservable(recommenderRqs.homePage(context))))
}

function livePageRecommender (context) {
  const livePageContext = of(context).filter(({route}) => route === '/live')
}

function hiphopRnBPageRecommender (context) {
  const hiphopRnBPageContext = of(context).filter(({route}) => route === '/hip-hop-n-rnb')
}

function rockPageRecommender (context) {
  const rockPageContext = of(context).filter(({route}) => route === '/rock')
}

function popPageRecommender (context) {
  const popPageContext = of(context).filter(({route}) => route === '/pop')
}

function countryPageRecommender (context) {
  const countryPageContext = of(context).filter(({route}) => route === '/country')
}

function electronicPageRecommender (context) {
  const electronicPageContext = of(context).filter(({route}) => route === '/electronic')
}

function jazzBluesClassicalPageRecommender (context) {
  const jazzBluesClassicalPageContext = of(context).filter(({route}) => route === '/jazz-blues-classical')
}

function otherPageRecommender (context) {
  const otherPageContext = of(context).filter(({route}) => route === '/other')
}
