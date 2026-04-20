"""
Copyright ©2025. The Regents of the University of California (Regents). All Rights Reserved.

Permission to use, copy, modify, and distribute this software and its documentation
for educational, research, and not-for-profit purposes, without fee and without a
signed licensing agreement, is hereby granted, provided that the above copyright
notice, this paragraph and the following two paragraphs appear in all copies,
modifications, and distributions.

Contact The Office of Technology Licensing, UC Berkeley, 2150 Shattuck Avenue,
Suite 510, Berkeley, CA 94720-1620, (510) 643-7201, otl@berkeley.edu,
http://ipira.berkeley.edu/industry-info for commercial licensing opportunities.

IN NO EVENT SHALL REGENTS BE LIABLE TO ANY PARTY FOR DIRECT, INDIRECT, SPECIAL,
INCIDENTAL, OR CONSEQUENTIAL DAMAGES, INCLUDING LOST PROFITS, ARISING OUT OF
THE USE OF THIS SOFTWARE AND ITS DOCUMENTATION, EVEN IF REGENTS HAS BEEN ADVISED
OF THE POSSIBILITY OF SUCH DAMAGE.

REGENTS SPECIFICALLY DISCLAIMS ANY WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. THE
SOFTWARE AND ACCOMPANYING DOCUMENTATION, IF ANY, PROVIDED HEREUNDER IS PROVIDED
"AS IS". REGENTS HAS NO OBLIGATION TO PROVIDE MAINTENANCE, SUPPORT, UPDATES,
ENHANCEMENTS, OR MODIFICATIONS.
"""

import re
import time

from flask import current_app as app
from selenium.webdriver.common.by import By
from teena.models.ripley_tool import RipleyTools
from teena.pages.ripley.ripley_pages import RipleyPages
from teena.test_utils import utils


class MailingListsPage(RipleyPages):

    # Search
    SITE_ID_INPUT = By.ID, 'page-site-mailing-list-site-id'
    GET_LIST_BUTTON = By.ID, 'btn-get-mailing-list'
    NOT_FOUND_MSG = By.XPATH, '//div[contains(., "bCourses site 99999999 was not found.")]'
    AUTH_FAILED_MSG = By.XPATH, '//pre[contains(text(), "failed to authenticate")]'

    # Create list
    SITE_NAME_LINK = By.ID, 'course-site-href'
    SITE_TERM = By.XPATH, '//div[contains(@class, "text-subtitle-1")]'
    SITE_ID = By.XPATH, '//div[contains(text(), "Site ID")]'
    VIEW_SITE_LINK = By.ID, 'mailing-list-course-site-name'
    LIST_NAME_INPUT = By.ID, 'mailing-list-name-input'
    REGISTER_LIST_BUTTON = By.ID, 'btn-create-mailing-list'
    LIST_NAME_ERROR_MSG = By.XPATH, '//div[contains(text(), "Only lowercase alphanumeric, underscore and hyphen characters allowed")]'
    LIST_NAME_TAKEN_ERROR_MSG = By.XPATH, '//div[contains(., "is used by another bCourses site and is not available")]'

    # View list
    LIST_SITE_LINK = By.ID, 'mailing-list-course-site-name'
    LIST_SITE_ID = By.ID, 'mailing-list-course-site-id'
    LIST_SITE_DESC = By.ID, 'mailing-list-course-site-code'
    LIST_ADDRESS = By.ID, 'mailing-list-name'
    LIST_MEMBERSHIP_COUNT = By.ID, 'mailing-list-member-count'
    LIST_UPDATE_TIME = By.ID, 'mailing-list-membership-last-updated'

    # Update membership
    CANCEL_BUTTON = By.ID, 'btn-cancel'
    UPDATE_MEMBERSHIP_BUTTON = By.ID, 'btn-populate-mailing-list'
    UPDATE_MEMBERSHIP_AGAIN_BUTTON = By.XPATH, '//button[contains(., "Update Memberships Again")]'
    NO_MEMBERSHIP_CHANGE_MSG = By.XPATH, '//*[text()="Everything is up-to-date. No changes necessary."]'
    SHOW_ADDED_USERS_BUTTON = By.XPATH, '//button[contains(., "Added")]'
    MEMBER_ADDED_MSG = By.XPATH, '//span[contains(text(), "Added")]'
    SHOW_REMOVED_USERS_BUTTON = By.XPATH, '//button[contains(., "Removed")]'
    MEMBER_REMOVED_MSG = By.XPATH, '//span[contains(text(), "Removed")]'
    SHOW_RESTORED_USERS_BUTTON = By.XPATH, '//button[contains(., "Restored")]'
    MEMBER_RESTORED_MSG = By.XPATH, '//span[contains(text(), "Restored")]'

    @staticmethod
    def embedded_tool_path():
        return f'/accounts/{utils.canvas_admin_acct()}/external_tools/{RipleyTools.MAILING_LISTS.value.tool_id}'

    def hit_embedded_tool_url(self):
        self.navigate_to(f'{utils.canvas_base_url()}{self.embedded_tool_path()}')

    def load_embedded_tool(self):
        app.logger.info('Loading embedded admin Mailing Lists tool')
        self.load_tool_in_canvas(self.embedded_tool_path())

    def search_for_list(self, search_term):
        app.logger.info(f'Searching for mailing list for course site {search_term}')
        self.wait_for_element_remove_chars_send_keys(self.SITE_ID_INPUT, search_term)
        self.wait_for_element_and_click(self.GET_LIST_BUTTON)

    @staticmethod
    def site_not_found_msg(search_term):
        return By.XPATH, f"//div[contains(., 'No bCourses site with ID \"{search_term}\" was found')]"

    @staticmethod
    def default_list_name(site):
        part = site.title
        part = f'{part} {site.term.name[:2]}{site.term.name[-2:]}' if site.term else f'{part} list'
        return re.sub('[ :]', '-', part.lower())

    def enter_custom_list_name(self, name):
        app.logger.info(f'Entering mailing list name {name}')
        self.wait_for_element_remove_chars_send_keys(self.LIST_NAME_INPUT, name)
        self.wait_for_element_and_click(self.REGISTER_LIST_BUTTON)

    def wait_for_list_address(self):
        self.when_present(self.LIST_ADDRESS, utils.get_short_timeout())
        return self.el_text_if_exists(self.LIST_ADDRESS)

    def update_memberships(self):
        app.logger.info('Clicking update membership button')
        self.wait_for_element_and_click(self.UPDATE_MEMBERSHIP_BUTTON)
        self.when_present(self.UPDATE_MEMBERSHIP_AGAIN_BUTTON, utils.get_short_timeout())
        time.sleep(1)

    def wait_for_membership_count(self):
        self.when_present(self.LIST_MEMBERSHIP_COUNT, utils.get_short_timeout())
        return self.el_text_if_exists(self.LIST_MEMBERSHIP_COUNT)

    def expand_added_users(self):
        app.logger.info('Expanding list of added users')
        self.wait_for_element_and_click(self.SHOW_ADDED_USERS_BUTTON)

    def is_user_added(self, user):
        return self.is_user_updated(user, 'Added')

    def expand_removed_users(self):
        app.logger.info('Expanding list of removed users')
        self.wait_for_element_and_click(self.SHOW_REMOVED_USERS_BUTTON)

    def is_user_removed(self, user):
        return self.is_user_updated(user, 'Removed')

    def expand_restored_users(self):
        app.logger.info('Expanding list of restored users')
        self.wait_for_element_and_click(self.SHOW_RESTORED_USERS_BUTTON)

    def is_user_restored(self, user):
        return self.is_user_updated(user, 'Restored')

    def is_user_updated(self, user, status):
        xpath = f'//button[contains(., "{status}")]/following-sibling::div//div[contains(., "{user.email}")]'
        return self.is_present((By.XPATH, xpath))

    def click_cancel_list(self):
        app.logger.info('Clicking cancel')
        self.wait_for_element_and_click(self.CANCEL_BUTTON)
