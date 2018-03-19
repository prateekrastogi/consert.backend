'use strict'

const Rx = require('rxjs')
const elasticClient = require('../../lib/login-assist').elasticLogin()

module.exports = function (search) {
  search.search = function (params) {
    const searchObservable = Rx.Observable.bindNodeCallback(elasticClient.search.bind(elasticClient))
    searchObservable(params).subscribe(x => console.log(x))
    var searchResults
    // TODO
    return new Promise((resolve, reject) => resolve(searchResults))
  }
}
