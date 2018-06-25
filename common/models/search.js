'use strict'

const Rx = require('rxjs-compat')
const R = require('ramda')
const elasticClient = require('../../lib/login-assist').elasticLogin()

const RETRY_COUNT = 3

module.exports = function (search) {
  search.search = function (params) {
    const searchObservable = Rx.Observable.bindNodeCallback(elasticClient.search.bind(elasticClient))
    const searchResultObservable = searchObservable(params)
      .map(R.compose(R.pluck('hits'), R.pluck('hits'), R.filter(R.has('hits'))))
      .concatMap(results => Rx.Observable.from(results))

    const searchResultPromise = searchResultObservable.retry(RETRY_COUNT).toPromise()

    return new Promise((resolve, reject) => resolve(searchResultPromise))
  }
}
