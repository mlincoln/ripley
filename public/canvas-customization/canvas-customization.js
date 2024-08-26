// jscs:disable maximumNumberOfLines
/* jshint camelcase: false */

(function(window, document, $) {
  'use strict';

  /* UTIL */

  /**
   * Perform a CalCentral API Get request
   *
   * @param  {String}     url                 The relative URL of the API request that should be made
   * @param  {Function}   callback            Standard callback function
   * @param  {Object}     callback.response   The API request response
   */
  var apiRequest = function(url, callback) {
    $.ajax({
      'dataType': 'json',
      'url': window.RIPLEY + url,
      'success': callback
    });
  };

  /**
   * Get the id for a custom LTI tool that user has access to
   *
   * @param  {String}     toolType            The classification of the LTI tool. This will be the top level property in the external tools hash
   * @param  {String}     toolName            The name of the LTI tool for which the id should be retrieved
   * @param  {Function}   callback            Standard callback function
   * @param  {String}     callback.id         The id of the requested custom LTI tool
   */
  var getExternalToolId = function(toolType, toolName, callback) {
    apiRequest('/api/canvas/external_tools', function(externalToolsHash) {
      if (externalToolsHash && externalToolsHash[toolType]) {
        return callback(externalToolsHash[toolType][toolName]);
      } else {
        return callback(null);
      }
    });
  };

  // Keeps track of the elements to become available on the page
  var elementWaitList = [];

  /**
   * Wait until an element is available on the page
   *
   * @param  {String}     selector            The jQuery selector of the element for which presence is checked
   * @param  {Boolean}    repeat              Whether to continue checking for the existence of the element after it has been found for the first time. If `true`, the callback function will be executed every time the element is present
   * @param  {Function}   callback            Standard callback function
   * @param  {Element}    callback.element    The jQuery element that represent the element for which presence was found
   */
  var waitUntilAvailable = function(selector, repeat, callback) {
    // Add the element to the list of elements to check for existence on the page
    elementWaitList.push({
      'selector': selector,
      'repeat': repeat,
      'callback': callback
    });
  };

  /**
   * Check for the presence of elements in the waiting list on the page
   */
  var checkElements = function() {
    elementWaitList = elementWaitList.filter(function(element) {
      var $element = $(element.selector);
      if ($element.length > 0) {
        element.callback($element);
        return element.repeat ? true : false;
      } else {
        return true;
      }
    });
  };

  setInterval(checkElements, 200);

  /* CREATE & MANAGE SITES */

  /**
   * Check whether the current user is allowed to create a new site
   *
   * @param  {Function}   callback                  Standard callback function
   * @param  {Element}    callback.canCreateSite    Whether the current user is allowed to create a new site
   */
  var canUserCreateSite = function(callback) {
    apiRequest('/api/canvas/can_user_create_site?canvas_user_id=' + window.ENV.current_user_id, function(authResult) {
      return callback(authResult.canCreateSite);
    });
  };

  /**
   * Add the 'Create & Manage sites' button that will provide access to the custom LTI tool
   * that allows a user to create a course site and/or a project site
   */
  const addCreateSiteButton = function() {
    // Only add the 'Create & Manage Sites' button from the dashboard or courses page
    const currentUserId = window.ENV.current_user_id;
    if (['/', '/courses'].indexOf(window.location.pathname) !== -1 && currentUserId) {
      // Check if the user is allowed to create a new site
      canUserCreateSite(function(canCreateSite) {
        if (canCreateSite) {
          // Get the id of the 'Create & Manage Sites' LTI tool
          getExternalToolId('globalTools', 'Manage Sites', function(createSiteId) {
            if (createSiteId) {
              const $manageSitesButton = $('<a/>', {
                href: `/users/${currentUserId}/external_tools/${createSiteId}`,
                text: 'Create & Manage Sites',
                class: 'btn btn-primary button-sidebar-wide'
              });

              // Add the 'Create & Manage Sites' button to the Dashboard page
              waitUntilAvailable('#dashboard_header_container', false, function() {
                const isLegacyDashboardUX = !$('#dashboard_header_container').find('h1').length
                if (isLegacyDashboardUX) {
                  // TODO: When the legacy UX (per RIP-768) is retired in all environments then delete this code.
                  const intervalId = setInterval(() => {
                    const selector = '#right-side > div:not([class])';
                    if (document.querySelector(selector)) {
                      clearInterval(intervalId);
                      $('#start_new_course').remove();
                      $(selector).prepend($manageSitesButton)
                    }
                  }, 300);
                } else {
                  // Remove the element enclosing the #start_new_course button.
                  $('#start_new_course').parent().remove();
                  const $manageSitesContainer = $('<span style="flex-shrink: 0" />')
                  $manageSitesContainer.append($manageSitesButton)
                  // Inject the 'Create & Manage Sites' button after the dashboard-options button.
                  $('#DashboardOptionsMenu_Container').parent().after($manageSitesContainer)
                }
              });

              // Add the 'Create & Manage Sites' button to the Courses page
              waitUntilAvailable('.ic-Action-header', false, function($actionHeader) {
                $actionHeader.remove();
                // Add the button to the header
                const $headerBar = $('.header-bar');
                $('h2', $headerBar).addClass('pull-left');
                const $manageSitesContainer = $('<div/>', {
                  id: 'my-courses-create-site',
                  class: 'text-right'
                }).append($manageSitesButton);
                $headerBar.append($manageSitesContainer);
              });
            }
          });
        }
      });
    }
  };

  /**
   * Remove the 'Create & Manage Sites' menu item from the 'User Settings' page
   * if the current user is not allowed to create a new site
   */
  var removeCreateSiteUserNav = function() {
    // Only attempt to remove the 'Create & Manage Sites' item on the 'User Settings' page
    if (window.location.pathname === '/profile/settings' && window.ENV.current_user_id) {
      // Remove the 'Create & Manage Sites' item if the current user is not allowed
      // to create a new site
      canUserCreateSite(function(canCreateSite) {
        if (canCreateSite) {
          waitUntilAvailable('nav ul#section-tabs li.section a:contains("Create & Manage Sites")', false, function($createSiteLink) {
            $createSiteLink.parent().remove();
          });
        }
      });
    }
  };

  addCreateSiteButton();
  removeCreateSiteUserNav();

  /* ACADEMIC POLICIES LINK */

  /**
   * Add 'Academic Policies' above 'Help' in left-hand global navigation
   */

  var addAcademicPoliciesLink = function() {
    waitUntilAvailable(".ic-app-header__menu-list .ic-app-header__menu-list-item:contains('Help')", false, function($helpMenuItem) {
      var $policiesMenuItem = $helpMenuItem.clone();
      $policiesMenuItem.find('.menu-item__text')
        .text('Academic Policies');
      $policiesMenuItem.find('.menu-item__badge')
        .remove();
      $policiesMenuItem.find('a')
        .attr('id', 'global_nav_academic_policies_link')
        .attr('href', 'https://evcp.berkeley.edu/programs-resources/academic-accommodations-hub')
        .attr('target', '_blank')
        .attr('role', null)
        .attr('data-track-category', null)
        .attr('data-track-label', null);
      // Add SVG source for https://fontawesome.com/icons/university
      $policiesMenuItem.find('path')
        .attr('transform', 'scale(0.39,0.39)')
        .attr('d', 'M496 128v16a8 8 0 0 1-8 8h-24v12c0 6.627-5.373 12-12 12H60c-6.627 0-12-5.373-12-12v-12H24a8 8 0 0 1-8-8v-16a8 8 0 0 1 4.941-7.392l232-88a7.996 7.996 0 0 1 6.118 0l232 88A8 8 0 0 1 496 128zm-24 304H40c-13.255 0-24 10.745-24 24v16a8 8 0 0 0 8 8h464a8 8 0 0 0 8-8v-16c0-13.255-10.745-24-24-24zM96 192v192H60c-6.627 0-12 5.373-12 12v20h416v-20c0-6.627-5.373-12-12-12h-36V192h-64v192h-64V192h-64v192h-64V192H96z');
      $helpMenuItem.before($policiesMenuItem);
    });
  };

  addAcademicPoliciesLink();

  /* MENTAL HEALTH RESOURCES LINK */

  /**
   * Add 'Mental Health Resources' above 'Help' in left-hand global navigation
   */

  var addMentalHealthResourcesLink = function() {
  waitUntilAvailable(".ic-app-header__menu-list .ic-app-header__menu-list-item:contains('Help')", false, function($helpMenuItem) {
    var $mentalHealthMenuItem = $helpMenuItem.clone();
    $mentalHealthMenuItem.find('.menu-item__text')
      .text('Mental Health Resources');
    $mentalHealthMenuItem.find('.menu-item__badge')
         .remove();
    $mentalHealthMenuItem.find('a')
      .attr('id', 'global_nav_mental_health_resources_link')
      .attr('href', 'https://uhs.berkeley.edu/mental-health')
      .attr('target', '_blank')
      .attr('role', null)
      .attr('data-track-category', null)
      .attr('data-track-label', null);
    // Add SVG source for https://fontawesome.com/icons/handshake-angle
    $mentalHealthMenuItem.find('path')
      .attr('transform', 'scale(0.39,0.39)')
      .attr('d', 'M488 191.1h-152l.0001 51.86c.0001 37.66-27.08 72-64.55 75.77c-43.09 4.333-79.45-29.42-79.45-71.63V126.4l-24.51 14.73C123.2 167.8 96.04 215.7 96.04 267.5L16.04 313.8c-15.25 8.751-20.63 28.38-11.75 43.63l80 138.6c8.875 15.25 28.5 20.5 43.75 11.75l103.4-59.75h136.6c35.25 0 64-28.75 64-64c26.51 0 48-21.49 48-48V288h8c13.25 0 24-10.75 24-24l.0001-48C512 202.7 501.3 191.1 488 191.1zM635.7 154.5l-79.95-138.6c-8.875-15.25-28.5-20.5-43.75-11.75l-103.4 59.75h-62.57c-37.85 0-74.93 10.61-107.1 30.63C229.7 100.4 224 110.6 224 121.6l-.0004 126.4c0 22.13 17.88 40 40 40c22.13 0 40-17.88 40-40V159.1h184c30.93 0 56 25.07 56 56v28.5l80-46.25C639.3 189.4 644.5 169.8 635.7 154.5z');
    $helpMenuItem.before($mentalHealthMenuItem);
  });
};

addMentalHealthResourcesLink();

  /* ACADEMIC POLICIES RESPONSIVE LINK */

  /**
   * Add 'Academic Policies' above 'Help' in left-hand global navigation
   */

  var addAcademicPoliciesResponsiveLink = function() {
  waitUntilAvailable("div span ul li:contains('Inbox')", true, function($helpMenuItem) {
    const isElementPresent = !!document.getElementById('global_nav_academic_policies_link_responsive')
    if (!isElementPresent) {
      var $academicPoliciesMenuItemResponsive = $helpMenuItem.clone();
      var $academicPoliciesMenuTextElement = $academicPoliciesMenuItemResponsive.find('span span span').first()
      $academicPoliciesMenuTextElement.text('Academic Policies');
      $academicPoliciesMenuTextElement.next().remove();
      $academicPoliciesMenuItemResponsive.find('a')
        .attr('id', 'global_nav_academic_policies_link_responsive')
        .attr('href', 'https://evcp.berkeley.edu/programs-resources/academic-accommodations-hub')
        .attr('target', '_blank')
        .attr('role', null)
        .attr('data-track-category', null)
        .attr('data-track-label', null);
    // Add SVG source for https://fontawesome.com/icons/handshake-angle
      $academicPoliciesMenuItemResponsive.find('path')
        .attr('transform', 'scale(3.8,3.8)')
        .attr('d', 'M496 128v16a8 8 0 0 1-8 8h-24v12c0 6.627-5.373 12-12 12H60c-6.627 0-12-5.373-12-12v-12H24a8 8 0 0 1-8-8v-16a8 8 0 0 1 4.941-7.392l232-88a7.996 7.996 0 0 1 6.118 0l232 88A8 8 0 0 1 496 128zm-24 304H40c-13.255 0-24 10.745-24 24v16a8 8 0 0 0 8 8h464a8 8 0 0 0 8-8v-16c0-13.255-10.745-24-24-24zM96 192v192H60c-6.627 0-12 5.373-12 12v20h416v-20c0-6.627-5.373-12-12-12h-36V192h-64v192h-64V192h-64v192h-64V192H96z');
      $helpMenuItem.after($academicPoliciesMenuItemResponsive);
    }
  });
};

addAcademicPoliciesResponsiveLink();

/* MENTAL HEALTH RESOURCES RESPONSIVE LINK */

  /**
   * Add 'Mental Health Resources' above 'Help' in left-hand global navigation
   */

  var addMentalHealthResourcesResponsiveLink = function() {
  waitUntilAvailable("div span ul li:contains('Inbox')", true, function($helpMenuItem) {
    const isElementPresent = !!document.getElementById('global_nav_mental_health_resources_link_responsive')
    if (!isElementPresent) {
      var $mentalHealthResourcesMenuItemResponsive = $helpMenuItem.clone();
      var $mentalHealthMenuTextElement = $mentalHealthResourcesMenuItemResponsive.find('span span span').first()
      $mentalHealthMenuTextElement.text('Mental Health Resources');
      $mentalHealthMenuTextElement.next().remove();
      $mentalHealthResourcesMenuItemResponsive.find('a')
        .attr('id', 'global_nav_mental_health_resources_link_responsive')
        .attr('href', 'https://uhs.berkeley.edu/mental-health')
        .attr('target', '_blank')
        .attr('role', null)
        .attr('data-track-category', null)
        .attr('data-track-label', null);
      // Add SVG source for https://fontawesome.com/icons/handshake-angle
      $mentalHealthResourcesMenuItemResponsive.find('path')
        .attr('transform', 'scale(3.8,3.8)')
        .attr('d', 'M488 191.1h-152l.0001 51.86c.0001 37.66-27.08 72-64.55 75.77c-43.09 4.333-79.45-29.42-79.45-71.63V126.4l-24.51 14.73C123.2 167.8 96.04 215.7 96.04 267.5L16.04 313.8c-15.25 8.751-20.63 28.38-11.75 43.63l80 138.6c8.875 15.25 28.5 20.5 43.75 11.75l103.4-59.75h136.6c35.25 0 64-28.75 64-64c26.51 0 48-21.49 48-48V288h8c13.25 0 24-10.75 24-24l.0001-48C512 202.7 501.3 191.1 488 191.1zM635.7 154.5l-79.95-138.6c-8.875-15.25-28.5-20.5-43.75-11.75l-103.4 59.75h-62.57c-37.85 0-74.93 10.61-107.1 30.63C229.7 100.4 224 110.6 224 121.6l-.0004 126.4c0 22.13 17.88 40 40 40c22.13 0 40-17.88 40-40V159.1h184c30.93 0 56 25.07 56 56v28.5l80-46.25C639.3 189.4 644.5 169.8 635.7 154.5z');
      $helpMenuItem.after($mentalHealthResourcesMenuItemResponsive);
    }
  });
};

addMentalHealthResourcesResponsiveLink();

  /* E-GRADES EXPORT */

  /**
   * Add the 'E-Grades' export option to the Canvas Gradebook
   */
  const addEGrades = function() {
    // Verify that the current context is the Gradebook tool
    if (window.ENV && window.ENV.GRADEBOOK_OPTIONS && window.ENV.GRADEBOOK_OPTIONS.context_id) {
      // Verify that the current course contains official course sections
      const courseId = window.ENV.GRADEBOOK_OPTIONS.context_id;
      apiRequest(`/api/canvas_site/egrades_export/${courseId}/is_official_course`, function(officialCourseResponse) {
        if (officialCourseResponse.isOfficialCourse) {
          // Get the id of the E-Grades LTI tool
          getExternalToolId('officialCourseTools', 'Download E-Grades', function(gradesExportLtiId) {
            if (gradesExportLtiId) {
              const linkUrl = `/courses/${courseId}/external_tools/${gradesExportLtiId}`;
              // Add the 'E-Grades' export option
              waitUntilAvailable('#gradebook-toolbar-instui-nav', false, function($gradebookToolbarMenu) {
                $gradebookToolbarMenu.append(`<a id="e-grades-button" class="ui-button" href="${linkUrl}">E-Grades</a>`);
              });
            }
          });
        }
      });
    }
  };

  addEGrades();

  /* ADD PEOPLE */

  var customizations = function() {
    return {
      'peoplesearch_radio_cc_path': {
        'text': 'Email Address',
        'example': 'student@berkeley.edu, guest@example.com, gsi@berkeley.edu',
        'help': 'Please enter the email addresses of users you would like to add, separated by commas'
      },
      'peoplesearch_radio_unique_id': {
        'text': 'Berkeley UID',
        'example': '1032343, 11203443',
        'help': 'Please enter the UC Berkeley UIDs of users you would like to add, separated by commas.'
      },
      'peoplesearch_radio_sis_user_id': {
        'text': 'Student ID',
        'example': '25738808, UID:11203443',
        'help': 'Please enter the Student IDs of users you would like to add, separated by commas.'
      }
    };
  };

  var constructFindPersonLink = function(toolId) {
    if (toolId) {
      var linkUrl = window.ENV.COURSE_ROOT_URL + '/external_tools/' + toolId;
      return [
        '<div class="pull-right" id="calnet-directory-link">',
        '  <a href="' + linkUrl + '">',
        '    <i class="icon-search-address-book" aria-hidden="true"></i>',
        '    Find a Person to Add',
        '  </a>',
        '</div>'
      ].join('');
    }
  };

  /**
   * Customize help text of Add People text-area
   */
  var customizeAddPeopleTextArea = function(customization) {
    if (customization) {
      var textArea = $('textarea');
      if (textArea.length > 0) {
        $('textarea').parent().parent().prev().children().text(customization.help);
        $('textarea')[0].placeholder = customization.example;
      }
    }
  };

  var onPeopleSearchRadioClick = function(event) {
    if (event && event.target && event.target.id) {
      var c = customizations();
      var keys = Object.keys(c);
      if (keys.indexOf(event.target.id) !== -1) {
        customizeAddPeopleTextArea(c[event.target.id]);
      }
    }
  };

  /**
   * Customize People tool of React-based Canvas UI
   */
  const customizeAddPeople = function() {
    const defaultRadioButtonId = 'peoplesearch_radio_cc_path';
    const modifiedMarker = 'face-hugger';

    waitUntilAvailable(`[for=${defaultRadioButtonId}]:visible:not([ripley-marker~=${modifiedMarker}])`, true, function() {
      const c = customizations();
      customizeAddPeopleTextArea(c[defaultRadioButtonId]);
      // Class names are dynamically generated in Canvas' React-based UI.
      let labelStyle = '';
      // Modify radio buttons
      for (const id in c) {
        // JSHint demands the following conditional
        if (c.hasOwnProperty(id)) {
          const e = $('#' + id);
          if (e.length > 0) {
            // For Production as of 2017-12-15
            let label = $('[for=' + id + '] span:first span:last');
            if (label.length < 1) {
              // For Beta as of 2017-12-15
              label = $('[for=' + id + '] span:last');
            }
            label.text(c[id].text);
            labelStyle = label[0].className;
          }
        }
      }
      $(`[for=${defaultRadioButtonId}]`).attr('ripley-marker', modifiedMarker);

      // Canvas's rendering is triggered by a click event listener on the document root.
      // To override it across browsers, we must append a click event listener on the same element.
      document.addEventListener('click', onPeopleSearchRadioClick);

      // Instructional text in footer of dialog
      var informational = $('.peoplesearch__instructions span:first');
      if (informational.length > 0) {
        informational.html('Add user by Email Address, Berkeley UID or Student ID. See <a target="_blank" href="https://berkeley.service-now.com/kb_view.do?sysparm_article=KB0010842">How do I add users to my course site?</a> for more information.');
      }
      getExternalToolId('globalTools', 'Find a Person to Add', function(toolId) {
        var firstDiv = $('div.addpeople__peoplesearch');
        if (!firstDiv.hasClass(modifiedMarker)) {
          if (labelStyle) {
            firstDiv.addClass(labelStyle);
          } else {
            firstDiv[0].setAttribute('style', 'font-family: \'Lato\', \'Helvetica Neue\'');
          }
          firstDiv.prepend(constructFindPersonLink(toolId));
          firstDiv.addClass(modifiedMarker);
        }
      });
    });
  };

  var extractBadUserInput = function(nameList) {
    // Extract user input from table elements.
    var userInput = [];
    var rows = $(':button[data-address]', nameList);
    for (var row in rows) {
      if (rows.hasOwnProperty(row) && rows[row].getAttribute) {
        var ref = rows[row].getAttribute('data-address');
        if (ref) {
          userInput.push(ref);
        }
      }
    }
    return (userInput.length > 0) ? '<div>Unable to find matches for ' + userInput.join(', ') + '. Please ensure they are formatted correctly.</div>' : '';
  };

  var addPeopleNextClickable = function(clickable) {
    var nextButton = $('#addpeople_next');
    if (nextButton.length > 0) {
      var b = nextButton[0];
      if (clickable) {
        b.removeAttribute('disabled');
        b.removeAttribute('aria-disabled');
      } else {
        b.setAttribute('disabled', 'true');
        b.setAttribute('aria-disabled', 'true');
      }
    }
  };

  var enableNextButton = function() {
    addPeopleNextClickable(true);
  };

  var listenersForAddPeopleError = function(backButton) {
    addPeopleNextClickable(false);
    // The 'Next' button will be re-enabled when user clicks 'Back' or 'Cancel'.
    backButton[0].addEventListener('click', enableNextButton);
    var cancelButton = backButton.siblings(':button').first();
    if (cancelButton.length > 0) {
      cancelButton[0].addEventListener('click', enableNextButton);
    }
  };

/**
   * Customize Canvas' error dialog of Add People tool
   */
  var customizeAddPeopleError = function () {
    let errorEmails = null;

    waitUntilAvailable("#addpeople_back", true, function ($backButton) {
      var validationError = $(".peoplevalidationissues__missing");
      if (validationError.length > 0) {
        // Add listeners to button
        listenersForAddPeopleError($backButton);
        $backButton[0].addEventListener("click", () => {
          errorEmails = null;
        });
        var cancelButton = $backButton.siblings(":button").first();
        if (cancelButton.length > 0) {
          cancelButton[0].addEventListener("click", () => {
            errorEmails = null;
          });
        }
        addpeople_cancel;
        // The following names were not found.
        var alertBox = $("div div", validationError);
        if (alertBox.length > 1 && $("#add-people-error-guests").length === 0) {
          var nameList = $(".addpeople__missing.namelist");
          errorEmails = errorEmails || extractBadUserInput(nameList);
          // UC Berkeley's custom messaging
          alertBox.last().html(
            `<div>
              <div>
                ${errorEmails}
              </div>
              <div id="add-people-error-guests">
                NOTE: If you are attempting to add a guest to your site who does NOT have a CalNet ID, they must first be sponsored. For more information, see
                <a target="_blank" href="https://berkeley.service-now.com/kb?id=kb_article_view&sysparm_article=KB0011761">Accessing bCourses Without a Calnet Account</a>.
            </div>`
          );
          // We remove the Canvas feature in which you can create new users using unrecognized input.
          nameList.remove();
        }
      }
    });
  };

    /**
   * Add additional information to the Add People error message
   */
  var customizePeopleTools = function() {
    // Verify 'add_users' context
    if (window.ENV && window.ENV.permissions && (window.ENV.permissions.add_users || window.ENV.permissions.add_users_to_course)) {

      // Customizations for Canvas React-based UI.
      customizeAddPeople();
      // The error page requires customization, too.
      customizeAddPeopleError();
    }
  };

  customizePeopleTools();

  /* ALTERNATIVE MEDIA PANEL */

  /**
   * Check whether the current user can manage the files tool in the current course
   *
   * @return {Boolean}                        Whether the current user can manage the files tool
   */
  var canManageFilesTool = function() {
    return window.ENV.FILES_CONTEXTS[0] && window.ENV.FILES_CONTEXTS[0].permissions && window.ENV.FILES_CONTEXTS[0].permissions.manage_files;
  };

  /**
   * Add an 'Alternative Media' information panel for instructors to the 'Files' tool
   */
  var addAltMediaPanel = function() {
    if (canManageFilesTool) {
      var altMediaPanel = [
        '<div id="alt-media-container" class="alert alert-info">',
        '  <button class="btn-link element_toggler" aria-controls="alt-media-content" aria-expanded="false" aria-label="Notice to Instructors for Making Course Materials Accessible">',
        '    <i class="icon-arrow-right"></i> <strong>Instructors: Making Course Materials Accessible (click to expand)</strong>',
        '  </button>',
        '  <div id="alt-media-content" class="hide" role="region" tabindex="-1">',
        '    <div>Without course instructor assistance, the University cannot meet its mission and responsibility to <a href="http://www.ucop.edu/electronic-accessibility/index.html" target="_blank">make online content accessible to students with disabilities<span class="sr-only"> (link opens in new tab)</span></a>. The <a href="https://policy.ucop.edu/doc/7000611/IMT-1300" target="_blank">University of California Policy IMT-1300<span class="sr-only"> (link opens in new tab)</span></a> defines "accessible" as "the concept that people with disabilities are able to access and use a product or system, including with the help of assistive technologies." The following resources can help you make your course content materials more accessible for all students:</div>',
        '    <h5>General Accessibility Resources</h5>',
        '    <ul>',
        '      <li><a href="https://bcourses.berkeley.edu/courses/1476601" target="_blank">Accessibility Basics for bCourses (Canvas)<span class="sr-only"> (opens in new tab)</span></a> - bCourses Site</li>',
        '      <li><a href="https://community.canvaslms.com/t5/Instructor-Guide/How-do-I-use-the-Accessibility-Checker-in-the-Rich-Content/ta-p/820" target="_blank">How do I use the Accessibility Checker in the Rich Content Editor as an instructor?<span class="sr-only"> (opens in new tab)</span></a> - Canvas Guide</li>',
        '      <li><a href="https://dsp.berkeley.edu/faculty/resources-faculty/creating-accessible-content" target="_blank">How to improve the accessibility of your online content<span class="sr-only"> (opens in new tab)</span></a> - Disabled Students\' Program</li>',
        '      <li><a href="https://ets.berkeley.edu/sensusaccess" target="_blank">SensusAccess Conversion<span class="sr-only"> (opens in new tab)</span></a> - Educational Technology Services</li>',
        '      <li>Need assistive technology help? <a href="mailto:assistive-technology@berkeley.edu" target="_blank">Contact Us</a></li>',
        '    </ul>',
        '    <h5>Ally in bCourses Resources</h5>',
        '    <ul>',
        '      <li><a href="https://rtl.berkeley.edu/services-programs/ally-bcourses" target="_blank">Ally in bCourses Service Page<span class="sr-only"> (opens in new tab)</span></a></li>',
        '      <li>Need help with Ally in bCourses? Contact <a href="mailto:allyhelp@berkeley.edu">allyhelp@berkeley.edu</a></li>',
        '    </ul>',
        '  </div>',
        '</div>'
      ].join('');

      waitUntilAvailable('header.ef-header', false, function($header) {
        $header.before(altMediaPanel);

        // Toggle icon
        $('#alt-media-container .element_toggler').on('click', function() {
          $(this).find('i[class*="icon-arrow"]').toggleClass('icon-arrow-down icon-arrow-right');
        });
      });
    }
  };

  addAltMediaPanel();

  /* SECTIONS HELPER TEXT */

  /**
   * Add an Tool Tip to the Sections page pointing users to the Create & Manage Sites tool
   */
  var addSectionsToolTip = function() {
    var sectionsToolTip = [
      '<div class="alert alert-info" id="sections-tool-tip">',
      '  <button class="btn-link element_toggler" aria-controls="sections-tooltip-content" aria-expanded="false" aria-label="Notice to Instructors Adding Sections/Rosters">',
      '    <i class="icon-arrow-right"></i> <strong>Need Help Adding a Section/Roster?</strong>',
      '  </button>',
      '  <div id="sections-tooltip-content" class="hide" role="region" tabindex="-1">',
      '    <div>If you are trying to add or remove a SIS-linked roster section to your course, this is done using the Create & Manage Sites tool. See this article for instructions on how to <a href="https://berkeley.service-now.com/kb?id=kb_article_view&sysparm_article=KB0010686" target="_blank">add or delete a course roster from your bCourses site<span class="sr-only"> (opens in new tab)</span></a></br>' +
      '    Warning: manually creating sections from this page, and/or manually enrolling students will override their SIS enrollment and cause them to remain in the course if they drop.</div>',
      '  </div>',
      '</div>'
    ].join('');

    waitUntilAvailable('h2:contains("Course Sections")', false, function($header) {
      $header.before(sectionsToolTip);

      // Toggle icon
      $('#sections-tool-tip .element_toggler').on('click', function() {
        $(this).find('i[class*="icon-arrow"]').toggleClass('icon-arrow-down icon-arrow-right');
      });
    });
  };

  addSectionsToolTip();

  /**
   * Link to the religious holiday calendar from the assign-to field
   */
  var addReligiousHolidaysInfo = () => {
    var religiousHolidaysInfo = [
      '<div class="alert alert-info" id="religious-holidays-tool-tip">',
      '  <button class="btn-link element_toggler" aria-controls="religious-holidays-content" aria-expanded="false" aria-label="Notice to Instructors About Religious Holidays Policy">',
      '    <i class="icon-arrow-right"></i> <strong>Religious Holidays Policy</strong>',
      '  </button>',
      '  <div id="religious-holidays-content" class="hide" role="region" tabindex="-1">',
      '    <div>In order to minimize requests for accommodations when setting due dates, please see <a href="https://registrar.berkeley.edu/calendar/religious-holidays-religious-creed-policy/" target="_blank">the Religious Holiday and Religious Creed Policy and list of religious and cultural holidays</a>.</div>',
      '  </div>',
      '</div>'
    ].join('');

    waitUntilAvailable('#manage-assign-to-container', false, function($header) {
      $header.before(religiousHolidaysInfo);

      // Toggle icon
      $('#religious-holidays-tool-tip .element_toggler').on('click', function() {
        $(this).find('i[class*="icon-arrow"]').toggleClass('icon-arrow-down icon-arrow-right');
      });
    });
  };

  addReligiousHolidaysInfo();

  /* 404 PAGE */

  /**
   * Customize the default Canvas 404 page with bCourses support information
   */
  var pageNotFound = function() {
    // Verify that the current context is the error page
    waitUntilAvailable('#submit_error_form', false, function() {
      // Remove the default content and replace it with bCourses specific
      // support information
      $('#content h2').nextAll('*').remove();
      var pageNotFoundHelp = [
        '<p>Oops, we couldn\'t find that page! Contact the instructor or project site owner and let them know that something is missing.</p>',
        '<p>If you\'re still having a problem, email <a href="mailto:bcourseshelp@berkeley.edu">bcourseshelp@berkeley.edu</a> for support.</p>'
      ].join('');
      $('#content h2').after(pageNotFoundHelp);
    });
  };

  pageNotFound();

  /* WEBCAST */

  /**
   * Allow full screen for WebCast videos
   */
  var enableFullScreen = function() {
    waitUntilAvailable('#tool_content', false, function($toolContent) {
      $toolContent.attr('allowfullscreen', '');
    });
  };

  enableFullScreen();

  /* FOOTER */

  /**
   * Customize the default footer with Berkeley information
   */
  var customizeFooter = function() {
    // Replace the Instructure logo with the Berkeley logo
    var $berkeleyLogo = $('<a>', {
      'class': 'footer-logo',
      'href': 'http://www.berkeley.edu',
      'title': 'University of California, Berkeley',
      'css': {
        'backgroundImage': 'url(' + window.RIPLEY + '/static/canvas/images/ucberkeley_footer.png)'
      }
    });
    $('#footer a.footer-logo').replaceWith($berkeleyLogo);

    // Replace the default footer links with the Berkeley footer links
    var footerLinks = [
      '<div class="footer-rows">',
      '  <div>',
      '    <a href="https://rtl.berkeley.edu/services-programs/bcourses" target="_blank">About</a>',
      '    <a href="https://rtl.berkeley.edu/services-programs/bcourses/bcourses-accessibility" target="_blank">Accessibility</a>',
      '    <a href="https://ophd.berkeley.edu/policies-and-procedures/nondiscrimination-policy-statement" target="_blank">Nondiscrimination</a>',
      '    <a href="https://www.instructure.com/policies/privacy" target="_blank">Privacy Policy</a>',
      '    <a href="https://www.instructure.com/policies/terms-of-use" target="_blank">Terms of Service</a>',
      '  </div>',
      '  <div>',
      '    <a href="https://dls.berkeley.edu/bcourses-data-use-and-analytics" target="_blank">Data Use &amp; Analytics</a>',
      '    <a href="http://teaching.berkeley.edu/berkeley-honor-code" target="_blank">UC Berkeley Honor Code</a>',
      '    <a href="https://asuc.org/resources/" target="_blank">Student Resources</a>',
      '  </div>',
      '</div>'
    ].join('');
    $('#footer-links').html(footerLinks);
  };

  customizeFooter();

  /* IFRAME COMMUNICATION */

  /**
   * We use window events to interact between the LTI iFrame and the parent container.
   * Resizing the iFrame based on its content is handled by Instructure's `public/javascripts/tool_inline.js`
   * file, and it determines the message format we use.
   *
   * The following custom events are provided for modifying the URL of the parent container:
   *
   *  - Change the location of the parent container:
   *    ```
   *     {
   *       subject: 'changeParent',
   *       parentLocation: <newLocation>
   *     }
   *    ```
   *
   *  - Change the hash of the parent container:
   *    ```
   *     {
   *       subject: 'setParentHash',
   *       'hash': <newHash>
   *     }
   *    ```
   *
   * The following custom event is provided to retrieve the URL of the parent container:
   *
   *  - Get the location of the parent container:
   *    ```
   *     {
   *       subject: 'getParent'
   *     }
   *    ```
   *
   * The following custom events are provided to support scrolling-related interaction between
   * the LTI iFrame and the parent container:
   *
   *  - Change the height of the LTI iFrame:
   *    ```
   *     {
   *       subject: 'changeParent',
   *       height: <height>
   *     }
   *    ```
   *
   *  - Scroll the parent container to a specified position:
   *    ```
   *     {
   *       subject: 'changeParent',
   *       scrollTo: <scrollPosition>
   *     }
   *    ```
   *
   *  - Scroll the parent container to the top of the screen:
   *    ```
   *     {
   *       subject: 'changeParent',
   *       scrollToTop: true
   *     }
   *    ```
   *
   *  - Get the scroll information of the parent container:
   *    ```
   *     {
   *       subject: 'getScrollInformation'
   *     }
   *    ```
   *
   *    Each of these events will respond with a window event back to the LTI iFrame containing the scroll information
   *    for the parent container:
   *    ```
   *     {
   *       iFrameHeight: <currentIframeHeight>,
   *       parentHeight: <currentParentHeight>,
   *       scrollPosition: <currentScrollPosition>,
   *       scrollToBottom: <currentHeightBelowFold>
   *     }
   *    ```
   *
   * @param  {Object}    ev         Event that is sent over from the iframe
   * @param  {String}    ev.data    The message sent with the event. Note that this is expected to be a stringified JSON object
   */
  window.onmessage = function(ev) {
    // Parse the provided event message
    if (ev && ev.data) {
      var message;
      try {
        message = JSON.parse(ev.data);
      } catch (err) {
        // The message is not for us; ignore it
        return;
      }

      var response = null;
      // Event that will modify the URL of the parent container
      if (message.subject === 'changeParent' && message.parentLocation) {
        window.location = message.parentLocation;

      // Event that retrieves the parent container's URL
      } else if (message.subject === 'getParent') {
        response = {
          'location': window.location.href
        };
        ev.source.postMessage(JSON.stringify(response), '*');

      // Event that will modify the hash of the parent container's URL
      } else if (message.subject === 'setParentHash') {
        history.replaceState(undefined, undefined, '#' + message.hash);

      // Events related to scrolling interaction between the LTI iFrame and the parent container
      } else if (message.subject === 'changeParent' || message.subject === 'getScrollInformation') {
        // Scroll to the specified position
        if (message.scrollTo !== undefined) {
          window.scrollTo(0, message.scrollTo);
        // Scroll to the top of the current window
        } else if (message.scrollToTop) {
          window.scrollTo(0, 0);
        } else if (message.height !== undefined) {
          if (!message.height || message.height < 450) {
            message.height = 450;
          }
          $('.tool_content_wrapper').height(message.height).data('height_overridden', true);
        }

        // Respond with a window event back to the LTI iFrame containing the scroll information for the parent container
        if (ev.source) {
          var iFrameHeight = $('.tool_content_wrapper').height();
          var parentHeight = $(document).height();
          var scrollPosition = $(document).scrollTop();
          var scrollToBottom = parentHeight - $(window).height() - scrollPosition;
          response = {
            'iFrameHeight': iFrameHeight,
            'parentHeight': parentHeight,
            'scrollPosition': scrollPosition,
            'scrollToBottom': scrollToBottom
          };
          ev.source.postMessage(JSON.stringify(response), '*');
        }
      }
    }
  };

})(window, window.document, window.$);

// jscs:enable maximumNumberOfLines
