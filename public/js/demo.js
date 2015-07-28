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

$(document).ready(function() {

  // Jquery variables
  var $loading  = $('.loading'),
    $error      = $('.error'),
    $errorMsg   = $('.errorMsg'),
    $results    = $('.results'),
    $compareBtn = $('.compare-btn');

  var colors = ['#1cc665','#0098ff','red','cadetblue','gold','green'];

  /**
   * 1. Create the request
   * 2. Call the API
   * 3. Call the methods to display the results
   */
  $compareBtn.click(function(){
    var profiles = [];
    $('.profile-form').each(function(_, form) {
      var id = $(form).prop('data-id');

      if (typeof(id) === 'undefined')
        return;

      var profile = {};

      profile.type = $(form).find('.input-type-radio:checked').val();
      profile.language = $(form).find('.language-radio:checked').val();
      profile.text = $(form).find('.input-'+ profile.type).val();
      if ($.trim(profile.text) === ''){
        $(form).find('.input-'+ profile.type).addClass('red-border');
      } else {
        $(form).find('.input-'+ profile.type).removeClass('red-border');
        profiles.push(profile);
      }
    });

    if (profiles.length === 0)
      return;

    $loading.show();
    $error.hide();
    $results.hide();
    $compareBtn.blur();
    $loading[0].scrollIntoView(true);


    $.post('/', { profiles: profiles, csv: ($('.csv-radio:checked').length !== 0) })
    // success
    .done(function(profiles) {
      $results.show();
      listProfiles(profiles);
    })
    // failure
    .fail(function(xhr){
      showError(xhr.responseJSON);
    })
    // always
    .always(function() {
      $loading.hide();
    });
  });

  /**
   * Display an error or a default message
   * @param  {String} error The error
   */
  function showError(error) {
    var defaultErrorMsg = 'Error processing the request, please try again later.';
    $error.show();
    $errorMsg.text(error ? (error.error || defaultErrorMsg ) : defaultErrorMsg);
  }

  function listProfiles(profiles) {
    $('.profile-list').empty();
    $('.measuring-bar').empty();
    // parse the big5 from the profile and add them to the comparator
    var flattened = profiles.map(parseBig5);
    flattened.forEach(function(big5, i) {
      var className = 'point-' + i;
      displayBig5(big5, className, colors[i % colors.length]);

      var description = 'Profile '+ (i + 1) +
         ' - lang: ' + profiles[i].processed_lang +
         ' - ' + profiles[i].word_count + ' words';

      var template = $('.checkbox-profile-template').clone().first();
      template.find('.name').text(description);
      template.find('input')
      .change(function(e) {
        if (e.target.checked)
          $('.'+className).show();
        else
          $('.'+className).hide();
      });

      template.find('.profile-label-link')
        .css('background-color', colors[i % colors.length])
        .hover(function() {
        $('.'+className).toggleClass('bigger');
      });

      template.appendTo('.profile-list');
    });
  }


  /**
   * Display a profile and its traits
   * @param  {Object} profile the object with the personality profile
   */
  function displayBig5(big5, className, color) {
    $('.measuring-bar').each(function(i, traitContainer){
      $('<div>').appendTo(traitContainer)
        .addClass('point')
        .addClass(className)
        .css('background-color',color)
        .css('left','calc('+(big5[i].value * 100)+'%)');

    });
  }

  /**
   * Return the Big 5 Traits normalized
   * @return Array  The 5 main traits
   */
  function parseBig5 (profile) {
    var _big5 = profile.tree.children[0].children[0].children;
    return _big5.map(function(trait) {
        return { name: trait.name, value: trait.percentage };
    });
  }

  function addProfile() {
    var template = $('.profile-template').last().clone();
    var id = $('.profile-template').length - 1,
      lid = id + '-p-lang-',
      tid = id + '-p-type-';

    template.find('.profile-form').prop('data-id', id);
    template.find('.profile-number').text('Profile ' + (id+1));
    template.find('.language-radio').prop('name', lid);
    template.find('.input-type-radio').prop('name', tid);

    template.find('.input-text').prop('name', id + '-text');
    template.find('.input-url').prop('name', id + '-url');
    template.find('.input-twitter').prop('name', id + '-twitter');

    template.find('.input-type-radio').change(function(e) {
      template.find('.div-text').hide();
      template.find('.div-url').hide();
      template.find('.div-twitter').hide();
      template.find('.div-'+ e.target.value).show();
    });

    template.find('.div-text').hide();
    template.find('.div-url').hide();
    $('.profile-container').append(template);
  }

  $('.add-profile').click(addProfile);
  addProfile();
  addProfile();
});
