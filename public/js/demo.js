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
  var $loading = $('.loading'),
    $error = $('.error'),
    $errorMsg = $('.errorMsg'),
    $results = $('.results'),
    $compareBtn = $('.compare-btn'),
    $addProfile = $('.add-profile');

  var colors = ['#1cc665', '#0098ff', 'red', 'cadetblue', 'gold', 'green'];

  var profileId = 1;

  /**
   * 1. Create the request
   * 2. Call the API
   * 3. Call the methods to display the results
   */
  $compareBtn.click(function() {
    var profiles = [];
    $('.profile-form').each(function(_, form) {
      var id = $(form).attr('data-id');

      if (typeof(id) === 'undefined')
        return;

      var profile = {};

      profile.type = $(form).find('.input-type-radio:checked').val();
      profile.language = $(form).find('.language-radio:checked').val();
      profile.text = $(form).find('.input-' + profile.type).val();
      if ($.trim(profile.text) === '') {
        $(form).find('.input-' + profile.type).addClass('orange-border');
      } else {
        $(form).find('.input-' + profile.type).removeClass('orange-border');
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
    $addProfile.addClass('disabled');


    $.post('/', {
        profiles: profiles
      })
      // success
      .done(function(profiles) {
        $results.show();
        listProfiles(profiles);
      })
      // failure
      .fail(function(xhr) {
        showError(xhr.responseJSON);
      })
      // always
      .always(function() {
        $loading.hide();
        $addProfile.removeClass('disabled');
      });
  });

  /**
   * Display an error or a default message
   * @param  {String} error The error
   */
  function showError(error) {
    var defaultErrorMsg = 'Error processing the request, please try again later.';
    $error.show();
    $errorMsg.text(error ? (error.error || defaultErrorMsg) : defaultErrorMsg);
  }

  function listProfiles(profiles) {
    $('.profile-list').empty();
    $('.measuring-bar').empty();

    // parse the big5 from the profile and add them to the comparator
    var profileIds = getProfileIds();

    profiles.forEach(function(profile, i) {
      var id = profileIds[i];
      var template = $('.checkbox-profile-template').clone().first();
      var description = 'Profile ' + id;
      var form = $('form[data-id="' + id + '"]');
      var type = $(form).find('.input-type-radio:checked').val();

      if (profile.error) {
        $(form).find('.input-' + type).addClass('red-border');
        description += ' - ' + profile.error;
      } else {
        $(form).find('.input-' + type).removeClass('red-border');
        description += ' - lang: ' + profile.processed_lang +
          ' - ' + profile.word_count + ' words';

        var className = 'point-' + i;

        displayBig5(profile, className, colors[i % colors.length]);
        template.find('input').change(function(e) {
          if (e.target.checked)
            $('.' + className).show();
          else
            $('.' + className).hide();
        });

        template.find('.profile-label-link')
        .css('background-color', colors[i % colors.length])
        .hover(function() {
          $('.' + className).toggleClass('bigger');
        });
      }

      template.find('.name').text(description);
      template.appendTo('.profile-list');
    });
  }

  /**
   * Returns the profile ids that are being use
   * @return {Array} The array with profie ids
   */
  function getProfileIds() {
    return $('.profile-form').map(function(_, form) {
      return $(form).attr('data-id');
    });
  }

  /**
   * Display a profile and its traits
   * @param  {Object} profile the object with the personality profile
   */
  function displayBig5(profile, className, color) {
    var big5 = parseBig5(profile);

    $('.measuring-bar').each(function(i, traitContainer) {
      $('<div>').appendTo(traitContainer)
        .addClass('point')
        .addClass(className)
        .css('background-color', color)
        .css('left', 'calc(' + (big5[i].value * 100) + '%)');

    });
  }

  /**
   * Return the Big 5 Traits normalized
   * @return Array  The 5 main traits
   */
  function parseBig5(profile) {
    var _big5 = profile.tree.children[0].children[0].children;
    return _big5.map(function(trait) {
      return {
        name: trait.name,
        value: trait.percentage
      };
    });
  }

  function addProfile() {
    var template = $('.profile-template').last().clone();
    var id = profileId,
      lid = id + '-p-lang-',
      tid = id + '-p-type-';

    profileId++;

    template.find('.close-button').click(function(){
      template.remove();
    });

    template.find('.profile-form').attr('data-id', id);
    template.find('.profile-number').text('Entity ' + id);
    template.find('.language-radio').prop('name', lid);
    template.find('.input-type-radio').prop('name', tid);

    template.find('.input-text').prop('name', id + '-text');
    template.find('.input-url').prop('name', id + '-url');
    template.find('.input-twitter').prop('name', id + '-twitter');

    template.find('.input-type-radio').change(function(e) {
      template.find('.div-text').hide();
      template.find('.div-url').hide();
      template.find('.div-twitter').hide();
      template.find('.div-' + e.target.value).show();
    });

    template.find('.div-text').hide();
    template.find('.div-url').hide();
    $('.profile-container').append(template);
  }

  $($addProfile).click(addProfile);
  addProfile();
  addProfile();
});
