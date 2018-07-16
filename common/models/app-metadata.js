'use strict'

const recommendationDelegate = require('../../lib/recommendation-delegate')

const RETRY_COUNT = 3

let tags = []

module.exports = function (appMetadata) {
  appMetadata.getTags = function (context = {}, req, options) {
    if (tags.length === 0) {
      const params = {
        filter: `${"'itemType' == \"genre\""}`   // eslint-disable-line
      }

      const genreItems = recommendationDelegate.listItems(params)
    }

    return new Promise((resolve, reject) => resolve(genreItems.toPromise()))
  }

  appMetadata.getStationTags = function (context = {}, req, options) {
    return new Promise((resolve, reject) => resolve(['Popular', 'Shuffle', 'Trending']))
  }
}
