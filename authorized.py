# !/usr/bin/env python
#
# Copyright 2008 CPedia.com.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


__author__ = 'Ping Chen'


from google.appengine.api import users
from google.appengine.ext import db

import urllib


# modified by Davide Della Casa
#def role(role):
def role(role):
    """This method refer to the Bloog (http://bloog.appspot.com).

    A decorator to enforce user roles, currently 'user' (logged in) and 'admin'.

    To use it, decorate your handler methods like this:

    import authorized
    @authorized.role("admin")
    def get(self):
      user = users.GetCurrentUser(self)
      self.response.out.write('Hello, ' + user.nickname())

    If this decorator is applied to a GET handler, we check if the user is logged in and
    redirect her to the create_login_url() if not.

    For HTTP verbs other than GET, we cannot do redirects to the login url because the
    return redirects are done as GETs (not the original HTTP verb for the handler).  
    So if the user is not logged in, we return an error.
    """
    def wrapper(handler_method):
        def check_login(self, *args, **kwargs):
            user = users.get_current_user()
            if not user:
                if self.request.method != 'GET':
                    self.error(403)
                else:
                    self.redirect(users.create_login_url(self.request.uri))
            elif role == "user" or (role == "admin" and users.is_current_user_admin()):
                return handler_method(self, *args, **kwargs)
            else:
                if self.request.method == 'GET':
                    self.redirect("/403.html")
                else:
                    self.error(403)   # User didn't meet role.
        return check_login
    return wrapper



def checkIfUserIsInWhiteList():
	#return True;
	# if the user is not logged in, send him/her to log in
	if users.get_current_user() is None:
		return False;

	if users.get_current_user().email().lower() == "davidedc@gmail.com":
		return True;

	if users.get_current_user().email().lower() == "sophie.mcdonald@gmail.com":
		return True;

	if users.get_current_user().email().lower() == "daryl.gamma@googlemail.com":
		return True;

	if users.get_current_user().email().lower() == "idellacasa84@gmail.com":
		return True;

	if users.get_current_user().email().lower() == "pcmabroad@gmail.com":
		return True;

	if users.get_current_user().email().lower() == "kill.krt@gmail.com":
		return True;

	if users.get_current_user().email().lower() == "godrbenson@googlemail.com":
		return True;

	if users.get_current_user().email().lower() == "psychicteeth@gmail.com":
		return True;

	if users.get_current_user().email().lower() == "emilioverde@gmail.com":
		return True;

	if users.get_current_user().email().lower() == "ennio.della.casa@googlemail.com":
		return True;

	if users.get_current_user().email().lower() == "albertoghe@gmail.com":
		return True;

	if users.get_current_user().email().lower() == "analytic@gmail.com":
		return True;

	if users.get_current_user().email().lower() == "bava.emanuela@gmail.com":
		return True;

	if users.get_current_user().email().lower() == "hahyanyee@gmail.com":
		return True;

	if users.get_current_user().email().lower() == "elecarpenter@gmail.com":
		return True;

	if users.get_current_user().email().lower() == "gamer226@gmail.com":
		return True;

	if users.get_current_user().email().lower() == "sarah.northmore@gmail.com":
		return True;

	if users.get_current_user().email().lower() == "artie2stars@gmail.com":
		return True;

	if users.get_current_user().email().lower() == "ahmedriaz@gmail.com":
		return True;

	return False;

def getLoginPage():
	return "/login/";
	#return users.create_login_url(handler.request.uri);
