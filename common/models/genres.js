'use strict'

const genresList = require('../../lib/genres')
const _ = require('lodash')
const Rx = require('rxjs')
const recombeeClient = require('../../lib/login-assist').recombeeLogin()
const recombeeRqs = require('recombee-api-client').requests

module.exports = function (Genres) {
  /**
   * gets the list of available genres available to viewer for filtering recommendations and results
   * @param {Function(Error, array)} callback
   */

  Genres.getGenres = function (callback) {
    let genres = ['All']

    const genreSerialized = serializeGenres(genresList.genres)
    genres = _.concat(genres, _.sortBy(genreSerialized))

    callback(null, genres)
  }

  /**
   * seeds the genres items to recombee to get item based recommendation
   * @param {Function(Error)} callback
   */

  Genres.seedGenreItemsToRecombee = function (callback) {
    let genres = []
    _.forIn(Object.assign({}, genresList.genres, genresList.spotifyGenres), (value, key) => {
      genres = _.concat(genres, {key, value})
    })

    Rx.Observable.from(genres).concatMap(({key, value}) => {
      const genreItem = convertGenreToRecombeeGenre(value)

      return Rx.Observable.fromPromise(recombeeClient.send(new recombeeRqs.SetItemValues(key, genreItem, {'cascadeCreate': true})))
    }).subscribe(x => console.log(x))

    callback(null)
  }

  function convertGenreToRecombeeGenre (genre) {
    const recombeeGenre = {
      'itemType': 'genre',
      'genres': genre
    }

    return recombeeGenre
  }

  function serializeGenres (genres) {
    const serializedGenres = _.map(_.keys(genres), genres => {
      const genre = _.replace(genres, 'And', ' & ')
      return _.replace(genre, 'dash', '-')
    })
    return serializedGenres
  }
}
