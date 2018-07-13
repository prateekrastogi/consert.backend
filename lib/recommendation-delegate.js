'use strict'

const recombeeClient = require('./login-assist').recombeeLogin()
const recombeeRqs = require('recombee-api-client').requests
const _ = require('lodash')
const R = require('ramda')
const { bindNodeCallback, of } = require('rxjs')
const {pluck, map, retry, concatMap, catchError} = require('rxjs/operators')

const RETRY_COUNT = 3

const clientSendAsObservable = bindNodeCallback(recombeeClient.send.bind(recombeeClient))

exports.getContextualRecommmendations = function getContextualRecommmendations (context) {
  const {userId, count, itemId, recParams, recType} = context

  let recommendationObservable

  switch (_.toUpper(recType)) {
    case 'ITEMS_USER':
      recommendationObservable = clientSendAsObservable(new recombeeRqs.RecommendItemsToUser(userId, count, recParams))
        .pipe(
          pluck('recomms'),
          map(recomms => R.map(convertRecombeeResponseItemToCommonMediaItem, recomms))
        )
      break
    case 'USERS_USER':
      recommendationObservable = clientSendAsObservable(new recombeeRqs.RecommendUsersToUser(userId, count, recParams))
      break
    case 'ITEMS_ITEM':
      recommendationObservable = clientSendAsObservable(new recombeeRqs.RecommendItemsToItem(itemId, userId, count))
        .pipe(
          pluck('recomms'),
          map(recomms => R.map(convertRecombeeResponseItemToCommonMediaItem, recomms))
        )
      break
    case 'USERS_ITEM':
      recommendationObservable = clientSendAsObservable(new recombeeRqs.RecommendUsersToItem(itemId, count, recParams))
      break
    default:
      throw new Error('Invalid Recommendation Type')
  }

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
  const listItemsObservable = clientSendAsObservable(new recombeeRqs.ListItems(params)).pipe(retry(RETRY_COUNT))

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
