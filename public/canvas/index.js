(function(window, $) {
  'use strict';

  var loadCanvasCustomization = function() {
    window.RIPLEY = 'https://ripley.ets.berkeley.edu';

    // Ensure the bCourses development and test servers are pointing to the correct
    // CalCentral instance when a copy of production is made
    if (window.location.origin === 'https://ucberkeley.beta.instructure.com') {
      window.RIPLEY = 'https://ripley-dev.ets.berkeley.edu';
    } else if (window.location.origin === 'https://ucberkeley.test.instructure.com') {
      window.RIPLEY = 'https://ripley-qa.ets.berkeley.edu';
    }

    // Load the JavaScript customizations
    $.getScript(window.RIPLEY + '/static/canvas/canvas-customization.js');

    // Load the CSS customizations
    var css = $('<link>', {
      'rel': 'stylesheet',
      'type': 'text/css',
      'href': window.RIPLEY + '/static/canvas/canvas-customization.css'
    });
    $('head').append(css);
  };

  if (document.readyState === 'complete' || (document.readyState !== 'loading' && !document.documentElement.doScroll)) {
    loadCanvasCustomization();
  } else {
    document.addEventListener('DOMContentLoaded', loadCanvasCustomization);
  }

})(window, window.$);
