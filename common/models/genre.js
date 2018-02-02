'use strict'

const genresList = require('../../lib/genres')
const _ = require('lodash')
const Rx = require('rxjs')
const recombeeClient = require('../../lib/login-assist').recombeeLogin()
const recombeeRqs = require('recombee-api-client').requests

module.exports = function (genre) {
  /**
   * gets the list of available Genres available to viewer for filtering recommendations and results
   * @param {Function(Error, array)} callback
   */

  genre.getGenres = function () {
    let genres = ['All']

    const genreSerialized = serializeGenres(genresList.genres)
    genres = _.concat(genres, _.sortBy(genreSerialized))

    return new Promise((resolve, reject) => resolve(genres))
  }

  /**
   * seeds the genres items to recombee to get item based recommendation
   * @param {Function(Error)} callback
   */

  genre.seedGenreItemsToRecombee = function () {
    let genres = []
    _.forIn(Object.assign({}, genresList.genres, genresList.spotifyGenres), (value, key) => {
      genres = _.concat(genres, {key, value})
    })

    Rx.Observable.from(genres).concatMap(({key, value}) => {
      const genreItem = convertGenreToRecombeeGenre(value)

      return Rx.Observable.fromPromise(recombeeClient.send(new recombeeRqs.SetItemValues(key, genreItem, {'cascadeCreate': true})))
    }).subscribe(x => console.log(x))

    return new Promise()
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
