"""
Copyright ©2023. The Regents of the University of California (Regents). All Rights Reserved.

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
from urllib.parse import urljoin

from flask import current_app as app
from ripley.externals import canvas


LTI_TOOL_DEFINITIONS = None


def configure_tools_from_current_host():
    current_host = app.config['LTI_HOST']
    main_account_tools = canvas.get_external_tools(obj_type='account', obj_id=app.config['CANVAS_BERKELEY_ACCOUNT_ID'])
    course_account_tools = canvas.get_external_tools(obj_type='account', obj_id=app.config['CANVAS_COURSES_ACCOUNT_ID'])
    admin_account_tools = canvas.get_external_tools(obj_type='account', obj_id=app.config['CANVAS_ADMIN_TOOLS_ACCOUNT_ID'])
    existing_tools = {}
    for tool in main_account_tools + course_account_tools + admin_account_tools:
        if not tool.url:
            continue
        host, key = _parse_launch_url(tool.url)
        if host and key:
            existing_tools[key] = {'host': host, 'id': tool.id, 'name': tool.name}
    results = {}
    for key, tool_definition in lti_tool_definitions().items():
        existing_tool = existing_tools.get(key, None)
        if existing_tool:
            log_message = f"Overwriting configuration for {key} (id={existing_tool['id']})"
            if existing_tool['host'] != current_host:
                log_message += f", provider from {existing_tool['host']} to {current_host}"
            if existing_tool['name'] != tool_definition['name']:
                log_message += f", name from {existing_tool['name']} to {tool_definition['name']}"
            app.logger.info(log_message)
            results[key] = canvas.edit_external_tool(
                tool_id=existing_tool['id'],
                url=urljoin(current_host, 'api/lti', key),
                obj_type='account',
                obj_id=tool_definition['account_id'],
            )
        else:
            app.logger.info(f"Adding configuration for {key} to account {tool_definition['account_id']}")
            results[key] = canvas.create_external_tool(account_id=tool_definition['account_id'], client_id=tool_definition['client_id'])
    return results


def lti_tool_definitions():
    global LTI_TOOL_DEFINITIONS
    if LTI_TOOL_DEFINITIONS is None:
        LTI_TOOL_DEFINITIONS = {
            'add_user': {
                'name': 'Find a Person to Add (LTI 1.3)',
                'account_id': app.config['CANVAS_BERKELEY_ACCOUNT_ID'],
                'client_id': '10720000000000621',
                'description': 'Search and add users to course sections',
                'placement': 'link_selection',
                'default': 'disabled',
            },
            'export_grade': {
                'name': 'Download E-Grades (LTI 1.3)',
                'account_id': app.config['CANVAS_COURSES_ACCOUNT_ID'],
                'client_id': '10720000000000623',
                'description': 'Exports Course Grades to E-Grades CSV file',
                'placement': 'link_selection',
                'default': 'disabled',
            },
            'mailing_list': {
                'name': 'Mailing List (LTI 1.3)',
                'account_id': app.config['CANVAS_COURSES_ACCOUNT_ID'],
                'client_id': '10720000000000620',
                'description': 'Create and manage a mailing list for a course site',
                'placement': 'course_navigation',
                'default': 'disabled',
            },
            'mailing_lists': {
                'name': 'Mailing Lists (LTI 1.3)',
                'account_id': app.config['CANVAS_ADMIN_TOOLS_ACCOUNT_ID'],
                'client_id': '10720000000000624',
                'description': 'Create and manage mailing lists for all course sites',
                'placement': 'account_navigation',
            },
            'manage_sites': {
                'name': 'Manage Sites (LTI 1.3)',
                'account_id': app.config['CANVAS_BERKELEY_ACCOUNT_ID'],
                'client_id': '10720000000000625',
                'description': 'Create or update bCourses sites',
                'placement': 'user_navigation',
            },
            'provision_user': {
                'name': 'User Provisioning (LTI 1.3)',
                'account_id': app.config['CANVAS_BERKELEY_ACCOUNT_ID'],
                'client_id': '10720000000000627',
                'description': 'Automated user provisioning',
                'placement': 'account_navigation',
            },
            'roster_photos': {
                'name': 'Roster Photos',
                'account_id': app.config['CANVAS_COURSES_ACCOUNT_ID'],
                'client_id': '10720000000000628',
                'description': 'Browse and search official roster photos',
                'placement': 'course_navigation',
            },
        }
    return LTI_TOOL_DEFINITIONS


def _parse_launch_url(launch_url):
    m = re.fullmatch(r'^(?P<host>http[s]?://.+)/api/lti/(?P<key>.+)', launch_url)
    host = m['host'] if m else None
    key = m['key'] if m else None
    return host, key
