'use strict';

const expect = require('expect');
const app = require('../../../src/app');

describe('user service', function() {
  it('registered the users service', () => {
    expect(app.service('users')).toExist();
  });
});
