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


class latestComments(BaseRequestHandler):
  def get(self,randomID):
   NUMBER_OF_COMMENTS_PREVIEWED = 3
   logging.info('you are doing a get to the latest comments downloader')

   """
   if not authorized.checkIfUserIsInWhiteList():
   		self.redirect(authorized.getLoginPage())
   """

   self.session = True
   user = UserInfo()
   user.whoIs(self)

   startKey = Key.from_path('SketchComment' , "-" + randomID + "sketch00000000000000000000")
   endKey = Key.from_path('SketchComment' , "-" + randomID +   "sketch99999999999999999999")
   # in the local environment
   myModels = db.GqlQuery("SELECT * FROM SketchComment WHERE __key__ >= :1 AND __key__ < :2", startKey, endKey).fetch(NUMBER_OF_COMMENTS_PREVIEWED+1)

   more = False
   if len(myModels) == 4:
   		more = True
   		myModels = myModels[:3]

   if len(myModels) == 0:
    	self.response.out.write("<br>no comments yet")
    	return


   for myModel in myModels:

    	self.response.out.write('<div class="usercomments">')
    	self.response.out.write("<br /><strong><A class=timestamp-link href=\"/byUploader/" + myModel.author_nickname+"-"+ myModel.author_string_user_id+"/\">"+myModel.author_nickname+"</A> comment: </strong> <br />")
    	self.response.out.write(myModel.body.replace('\n', "<br>"))
    	self.response.out.write('<div class="commentdelete">')
    	# also check that the user is not anonymous before providing the delete link
    	if ((user.user)and(myModel.author_user_id == user.user_id or user.is_current_user_admin or myModel.sketch_author_user_id == user.user_id)) :
    		self.response.out.write('<A href=\"/deleteComment/'+myModel.key().name()+'/?backTo=/view/'+randomID+'/\"><img src="/imgs/delete.gif" alt="delete" height="25px" /> Delete</A>')
    	self.response.out.write('</div>')
    	self.response.out.write("</div><br />")

   if more:
    	self.response.out.write("<p><A class=timestamp-link href=\"/comments/" + randomID+"/\">more...</A></p>")
    	
   return
