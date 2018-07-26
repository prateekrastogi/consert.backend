'use strict'

const recombeeRqs = require('recombee-api-client').requests

module.exports = {
  homePage: function(context) {
    const {userId, itemId, count} = context

    let rqs = []

    new recombeeRqs.RecommendItemsToItem('Pop', userId, (count / 6), {
      filter: `${"(not 'itemType' == \"genre\") and (not snippet-liveBroadcastContent == \"live\") and (not 'item-isRemoved')"}`
    })

  }
}
