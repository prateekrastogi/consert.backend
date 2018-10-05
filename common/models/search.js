'use strict'

const R = require('ramda')
const elasticClient = require('../../lib/login-assist').elasticLogin()
const { map, concatMap, retry } = require('rxjs/operators')
const { from, bindNodeCallback } = require('rxjs')

const RETRY_COUNT = 3

module.exports = function (search) {
  search.search = function (params) {
    const searchObservable = bindNodeCallback(elasticClient.search.bind(elasticClient))
    const searchResultObservable = searchObservable(params)
      .pipe(map(R.compose(R.pluck('hits'), R.pluck('hits'), R.filter(R.has('hits')))),
        concatMap(results => from(results))
      )

    const searchResultPromise = searchResultObservable.pipe(retry(RETRY_COUNT)).toPromise()

    return new Promise((resolve, reject) => resolve(searchResultPromise))
  }
}
