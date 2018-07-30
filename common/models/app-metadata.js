'use strict'

const recommendationDelegate = require('../../lib/recommendation-delegate')
const R = require('ramda')

let tags = []

module.exports = function (appMetadata) {
  appMetadata.getTags = async function (context = {}, req, options) {
    const {serialized = true, ...tagContext} = context
    const params = {
      filter: `${"'itemType' == \"genre\""}`,
      returnProperties: true
    }

    const genreItems = tags.length ? tags : await recommendationDelegate.listItems(params).toPromise().then(items => {
      return (tags = items)
    })

    const tagItems = R.compose(serializationContextualizedReturn, R.curry(contextualizedTags)(tagContext))(genreItems)

    return new Promise((resolve, reject) => resolve(tagItems))

    function contextualizedTags (tagContext, tagItems) {
      const {route} = tagContext
      let filteredTags

      function filter (itemId, item) {
        const {id} = item
        return (id === itemId)
      }

      function tagFilterer (itemId) {
        return R.filter(R.curry(filter)(itemId), tagItems)
      }

      switch (route) {
        case '/':
          filteredTags = tagFilterer('Root')
          break
        case '/live':
          filteredTags = tagFilterer('Live')
          break
        case '/hip-hop-n-rnb':
          filteredTags = tagFilterer('HipDashHopSpaceAndSpaceRAndB')
          break
        case '/rock':
          filteredTags = tagFilterer('Rock')
          break
        case '/pop':
          filteredTags = tagFilterer('Pop')
          break
        case '/country':
          filteredTags = tagFilterer('Country')
          break
        case '/electronic':
          filteredTags = tagFilterer('Electronic')
          break
        case '/jazz-blues-classical':
          filteredTags = tagFilterer('JazzCommaSpaceBluesCommaSpaceandSpaceClassical')
          break
        case '/other':
          filteredTags = tagFilterer('Other')
          break
        default:
          filteredTags = tagFilterer('Root')
      }
      return filteredTags
    }

    function serializationContextualizedReturn (items) { return serialized ? R.map(serializeGenre, items) : items }
  }

  appMetadata.getStationTags = function (context = {}, req, options) {
    return new Promise((resolve, reject) => resolve([{
      id: 'Popular',
      itemType: 'radio',
      snippet: { thumbnails: '{}' }
    }, {
      id: 'Shuffle',
      itemType: 'radio',
      snippet: { thumbnails: '{}' }
    }, {
      id: 'Trending',
      itemType: 'radio',
      snippet: { thumbnails: '{}' }
    }]))
  }

  function serializeGenre ({...genre}) {
    if (genre.childrenItems) {
      const serializedGenres = R.map(
        R.compose(R.replace(/Comma/g, ','), R.replace(/And/g, '&'), R.replace(/Dash/g, '-'), R.replace(/Space/g, ' '))
      )(genre.childrenItems)

      genre.childrenItems = serializedGenres
    }

    return genre
  }
}
