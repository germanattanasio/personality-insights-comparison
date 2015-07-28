/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var express     = require('express'),
  app           = express(),
  watson        = require('watson-developer-cloud'),
  util          = require('util'),
  request       = require('request'),
  async         = require('async'),
  config        = require('./config/config'),
  TwitterHelper = require('./config/twitter-helper');


// Bootstrap application settings
require('./config/express')(app);

// Create the service wrapper
var personalityInsights = watson.personality_insights(config.personality_insights);

// Create the twitter helper
var twitter = new TwitterHelper(config.twitter);

// render index page
app.get('/', function(req, res) {
  res.render('index');
});

app.post('/', function(req, res, next) {

  if (!req.body.profiles || !util.isArray(req.body.profiles)){
    next({ code:400, error:'Bad request'});
    return;
  }

  // create an async task for each profile
  var tasks = req.body.profiles.map(buildProfileRequest);
  async.parallel(tasks, function(err, results) {
    if (err)
      next(err);
    else
      res.json(results);
  });
});

function ignoreErrors(callback) {
  return function(err, result) {
    if (err)
      callback(null, err);
    else
      callback(null, result);
  }
}
/**
 * Build the request for Personality Insights based on the profile type
 *  - text: no actions required
 *  - url: use the HTML as text
 *  - twitter: build a contentItems array with all the tweets
 *
 * @param  {Object} params The parameters {text:'', type:(url|text|tweeter), language:''}
 * @return {function}  An async function
 */
function buildProfileRequest(params) {
  return function (callback) {
    var cb = ignoreErrors(callback);
    if (params.type === 'text') {
      // profile based on text, no actions required
      personalityInsights.profile(params, cb);

    } else if (params.type === 'url') {
      request.get(params.text, function(err, response, body){
        params.text = body;
        personalityInsights.profile(params, cb);
      });

    } else {
      // return the tweets as contentItems
      twitter.getTweets(params.text, function(err, tweets){
        if (err) {
          cb(err);
        }
        else {
          delete params.text;
          params.contentItems = tweets;
          personalityInsights.profile(params, cb);
        }
      });
    }
  };
}

// error-handler settings
require('./config/error-handler')(app);

var port = process.env.VCAP_APP_PORT || 3000;
app.listen(port);
console.log('listening at:', port);
