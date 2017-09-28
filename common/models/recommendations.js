'use strict'

module.exports = function (recommendations) {
  /**
   * gets the recommendation based on genreItems
   * @param {array} genres List of genres for which to get recommendations
   * @param {Function(Error, array)} callback
   */

  recommendations.getGenreBasedRecommendations = function (genres) {
    var recommendations
    // TODO
    return new Promise((resolve, reject) => resolve(recommendations))
  }
}
