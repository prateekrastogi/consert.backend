'use strict'

const genresList = require('../../lib/genres')
const _ = require('lodash')

module.exports = function (Genres) {
  /**
   * gets the list of available genres available to viewer for filtering recommendations and results
   * @param {Function(Error, array)} callback
   */

  Genres.getGenres = function (callback) {
    let genres = ['All']

    const customGenres = _.map(_.keys(genresList.genres), genres => {
      const genre = _.replace(genres, 'And', ' & ')
      return _.replace(genre, 'dash', '-')
    })
    genres = _.concat(genres, _.sortBy(customGenres))

    callback(null, genres)
  }
}
