'use strict'

const recombeeClient = require('./login-assist').recombeeLogin()
const recombeeRqs = require('recombee-api-client').requests
const R = require('ramda')
const { bindNodeCallback } = require('rxjs')

const RETRY_COUNT = 3

const clientSendAsObservable = bindNodeCallback(recombeeClient.send.bind(recombeeClient))
