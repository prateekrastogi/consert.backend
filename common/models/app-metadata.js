'use strict'

const recommendationDelegate = require('../../lib/recommendation-delegate')

let tags = []

module.exports = function (appMetadata) {
  appMetadata.getTags = function (context = {}, req, options) {
    const params = {
      filter: `${"'itemType' == \"genre\""}`,
      returnProperties: true
    }

    const genreItems = tags.length ? tags : recommendationDelegate.listItems(params).toPromise().then(items => {
      tags.push(items)
      return items
    })

    return new Promise((resolve, reject) => resolve(genreItems))
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
}
