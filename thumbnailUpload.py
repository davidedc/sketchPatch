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

from model import FullPicture
from admin import UserInfo

import authorized
import view
import util
import binascii
import urllib
import base64

class BaseRequestHandler(webapp.RequestHandler):
  def generate(self, template_name, template_values={}):
    values = {
      'request': self.request,
    }
    values.update(template_values)
    directory = os.path.dirname(__file__)
    view.ViewPage(cache_time=0).render(self, template_name,values)


class thumbnailUpload(BaseRequestHandler):
  def post(self,randomID):
   # in theory we should check whether the user either owns the sketch or is an   
   # admin, but it's not really worth it so far.
   
   self.response.headers['Content-Type'] = "text/html"
   logging.info('you are doing a get to the thumbnail uploader')
   self.response.out.write("from page:")
   logging.info("from page: <br>")

   logging.info('randomID is: ' + randomID)

   # In order to check who the user is, the flash applet needs to include the same
   # session cookie that the browser uses to keep the identity of the user
   # if users.get_current_user().email().lower() != "davidedc@gmail.com":
   # 	raise web.HTTPError(501)
   # 	return
   	
   # for myModel in MyModel.all():
   #  myModel.delete()


   file_contents = self.request.get("thumb")
   # self.response.out.write(file_contents)
   # in the local environment   
   logging.info('about to create the thumbnail object')
   # self.response.out.write('<br> unescaped: <br>')
   # self.response.out.write(urllib.unquote(file_contents).replace(chr(45),chr(43)))
   # self.response.out.write('<br> over <br>')
   # logging.info('<br> unescaped: <br>')
   # logging.info(urllib.unquote(file_contents).replace(chr(45),chr(43)))
   # logging.info('<br> over <br>')

   thumbnailUploaderObject = thumbnailUploaderClass()
   thumbnailUploaderObject.doTheUpload(randomID,file_contents)

   # in the real environment   
   # Thumbnail.get_or_insert(randomID, thumbnail=db.Blob( file_contents ))

class thumbnailUploaderClass():
  def doTheUpload(self,randomID, file_contents):
   # in theory we should check whether the user either owns the sketch or is an   
   # admin, but it's not really worth it so far.
   
   thumbnailBinary = base64.standard_b64decode(urllib.unquote(file_contents).replace(chr(45),chr(43)) ) 

   q0 = db.GqlQuery("SELECT * FROM MySketchesSketch WHERE randomID = :1", randomID).fetch(1)

   updateAuthorSketchesAndGallerySketch = True
   
   if(q0):
   	q0[0].thumbnail = db.Blob(thumbnailBinary)
   	if q0[0].published: updateAuthorSketchesAndGallerySketch = True
   	q0[0].put()
   
   if updateAuthorSketchesAndGallerySketch:
      q1 = db.GqlQuery("SELECT * FROM AuthorSketchesSketch WHERE randomID = :1", randomID).fetch(1)
      q2 = db.GqlQuery("SELECT * FROM GallerySketch WHERE randomID = :1", randomID).fetch(1)
      if (q1):
   	     q1[0].thumbnail = db.Blob(thumbnailBinary)
   	     q1[0].put()
      if (q2):
   	     q2[0].thumbnail = db.Blob(thumbnailBinary)
   	     q2[0].put()
   

class fullPictureUpload(BaseRequestHandler):
  def post(self,randomID):
   
   # Only an admin can upload full pictures
   # Note that non-admins can still do lengthy posts to this address, which should ideally be avoided
   self.session = True
   user = UserInfo()
   user.whoIs(self)

   if ((user.is_current_user_admin)):
   		logging.info('you are an admin: OK')
   else:
   		logging.info('you are an not an admin: not OK')
   		return

   
   self.response.headers['Content-Type'] = "text/html"
   logging.info('you are doing a get to the full picture uploader')
   self.response.out.write("from page:")
   logging.info("from page: <br>")

   logging.info('randomID is: ' + randomID)

   # In order to check who the user is, the flash applet needs to include the same
   # session cookie that the browser uses to keep the identity of the user
   # if users.get_current_user().email().lower() != "davidedc@gmail.com":
   # 	raise web.HTTPError(501)
   # 	return
   	
   # for myModel in MyModel.all():
   #  myModel.delete()


   file_contents = self.request.get("fullPicture")
   # self.response.out.write(file_contents)
   # in the local environment   
   logging.info('about to create the full picture object')
   # self.response.out.write('<br> unescaped: <br>')
   # self.response.out.write(urllib.unquote(file_contents).replace(chr(45),chr(43)))
   # self.response.out.write('<br> over <br>')
   # logging.info('<br> unescaped: <br>')
   # logging.info(urllib.unquote(file_contents).replace(chr(45),chr(43)))
   # logging.info('<br> over <br>')

   fullPictureBinary = base64.standard_b64decode(urllib.unquote(file_contents).replace(chr(45),chr(43)) ) 

   q0 = db.GqlQuery("SELECT * FROM FullPicture WHERE randomID = :1", randomID).fetch(1)
   
   if(q0):
   	logging.info('updated an existing full picture record')
   	q0[0].fullPicture = db.Blob(fullPictureBinary)
   	q0[0].put()
   else:
    logging.info('created a new full picture record')
    fullPictureRecord = FullPicture()
    fullPictureRecord.randomID = randomID
    fullPictureRecord.fullPicture = db.Blob(fullPictureBinary)
    fullPictureRecord.put()   
   
   self.response.out.write('<br> ...done <br>')
   logging.info('created the full picture object and put it in datastore')
   
   # in the real environment   
   # Thumbnail.get_or_insert(randomID, thumbnail=db.Blob( file_contents ))
