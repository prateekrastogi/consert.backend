'use strict';

const authentication = require('feathers-authentication-refreshtoken');

const SpotifyStrategy = require('passport-spotify').Strategy;

module.exports = function () {
  // removed authentication settings from json to keep single source of truth. And production and development will be same anyway.
  const app = this;
  app.configure(authentication({
    idField: '_id',
    token: {
      secret: 'cbvAOK+wGVhei6R9kDiumubYJYX+s8gJI2ZKOSyjH37zsTx7KVH6zO3Fgn0kfaIGw6SXoaVVbwiLxvbsEq1C2A=='
    },
    local: false,
    shouldSetupSuccessRoute: false,
    shouldSetupFailureRoute: false,
    spotify: {
      strategy: SpotifyStrategy,
      'clientID': '5084d28ce6924d7b98884323abc76109',
      'clientSecret': '97e2cf30dd2d4f2b9f9b3cf40bbbfcc0',
      'permissions': {
        authType: 'rerequest',
        'scope': ['user-top-read', 'user-read-birthdate', 'user-library-read', 'user-library-modify', 'user-follow-read', 'playlist-read-private', 'playlist-read-collaborative', 'playlist-modify-public', 'playlist-modify-private', 'user-follow-modify', 'user-read-email', 'user-read-private']
      }
    }
  }));
};
