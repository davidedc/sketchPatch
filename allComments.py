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

__author__ = 'Davide Della Casa'



import cgi
import wsgiref.handlers
import os
import re
import logging
import string


from google.appengine.ext.webapp import template
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext import db
from google.appengine.api import memcache

import authorized
import view
import util
from admin import UserInfo

from model import SketchComment
from admin import UserInfo
from appengine_utilities.sessions import Session
from google.appengine.ext.db import Key


class BaseRequestHandler(webapp.RequestHandler):
  def generate(self, template_name, template_values={}):
    values = {
      'request': self.request,
    }
    values.update(template_values)
    directory = os.path.dirname(__file__)
    view.ViewPage(cache_time=0).render(self, template_name,values)


class allComments(BaseRequestHandler):


  def get(self,randomID):
        next = None
        PAGESIZE = 5

        """
        if not authorized.checkIfUserIsInWhiteList():
        	self.redirect(authorized.getLoginPage())
        """

        util.insertUsersideCookies(self)

        self.session = True
        user = UserInfo()
        user.whoIs(self)


        bookmark = self.request.get("bookmark")
        if bookmark:
        	bookmark = Key(self.request.get("bookmark"))
        else:
        	bookmark = Key.from_path('SketchComment',"-" + randomID + 'sketch00000000000000000000')
        	
        endKey =  Key.from_path('SketchComment',"-" + randomID +      'sketch99999999999999999999')

        q = db.GqlQuery("SELECT * FROM SketchComment WHERE __key__ >= :1 AND __key__ < :2", bookmark, endKey)
        sketchComments = q.fetch(PAGESIZE+1)
        if len(sketchComments) == PAGESIZE + 1:
        	next = str(sketchComments[-1].key())
        	sketchComments = sketchComments[:PAGESIZE]
        
        if next is None:
        	next = ""

        for sketchComment in sketchComments:
        	sketchComment.keyname = sketchComment.key().name()

			
        template_values = {
          'sketchComments':sketchComments,
          'bookmark':bookmark,
          'next':next,
          'randomID':randomID,
          }
        self.generate('commentsTemplate.html',template_values)
