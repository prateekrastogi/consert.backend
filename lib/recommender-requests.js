'use strict'

const recombeeRqs = require('recombee-api-client').requests
const app = require('../server/server')

exports.homePage = function homePage (context) {
  const appMetadata = app.models.appMetadata
  const {userId, itemId, count} = context

  appMetadata.getTags({serialized: false, ...context}).then(value => console.log(value))
  let rqs = []

  /*
  new recombeeRqs.RecommendItemsToItem('Pop', userId, (count / 6), {
    filter: `${"(not 'itemType' == \"genre\") and (not snippet-liveBroadcastContent == \"live\") and (not 'item-isRemoved')"}`
  })
  */

  return new recombeeRqs.Batch(rqs)
}
