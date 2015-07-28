'use strict';

module.exports = {

  personality_insights: {
    version: 'v2',
    username: '<username>',
    password: '<password>',
    url: 'https://gateway.watsonplatform.net/personality-insights/api'
  },
  // Since we use an array, you can use more than one twitter app
  twitter: [{
    consumer_key: '<consumer_key>',
    consumer_secret: '<consumer_secret>',
    access_token_key: '<access_token_key>',
    access_token_secret: '<access_token_secret>'
  }
  ]
};
