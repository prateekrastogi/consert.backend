'use strict'

const loopback = require('loopback')
const boot = require('loopback-boot')
const app = module.exports = loopback()

// Create an instance of PassportConfigurator with the app instance
const PassportConfigurator = require('loopback-component-passport').PassportConfigurator
const passportConfigurator = new PassportConfigurator(app)
// Load the provider configurations according to environment
let config = {}
try {
  switch (app.get('env')) {
    case 'production' :
      config = require('../providers.' + app.get('env') + '.json')
      break
    default:
      config = require('../providers.json')
  }
} catch (err) {
  console.trace(err)
  process.exit(1) // fatal
}

app.start = function () {
  // start the web server
  return app.listen(function () {
    app.emit('started')
    const baseUrl = app.get('url').replace(/\/$/, '')
    console.log('Web server listening at: %s', baseUrl)
    console.log('Browse your GraphQL API at %s%s', baseUrl, '/graphiql')
    if (app.get('loopback-component-explorer')) {
      const explorerPath = app.get('loopback-component-explorer').mountPath
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath)
    }
  })
}

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function (err) {
  if (err) throw err

  // start the server if `$ node server.js`
  if (require.main === module) { app.start() }
})

// Passport needs to be configured after application has booted. Otherwise, models in app.models will not be present
// Initialize passport
passportConfigurator.init()

// Set up related models
passportConfigurator.setupModels({
  userModel: app.models.user,
  userIdentityModel: app.models.userIdentity,
  userCredentialModel: app.models.userCredential
})

// Configure passport strategies for third party auth providers
for (const s in config) {
  const c = config[s]
  c.session = c.session !== false
  passportConfigurator.configureProvider(s, c)
}
