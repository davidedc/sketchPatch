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


class BaseRequestHandler(webapp.RequestHandler):
  def generate(self, template_name, template_values={}):
    values = {
      'request': self.request,
    }
    values.update(template_values)
    directory = os.path.dirname(__file__)
    view.ViewPage(cache_time=0).render(self, template_name,values)


class thumbnailDownloadGallery(BaseRequestHandler):
  def get(self,randomID):
   
   logging.info('you are doing a get to the thumbnail downloader')

   # in the local environment
   randomID = randomID[0:len(randomID)-4]
   myModels = db.GqlQuery("SELECT * FROM GallerySketch WHERE randomID = :1", randomID).fetch(1)

   if myModels:
    if myModels[0].thumbnail:
    	logging.info('found thumbnail')
    	self.response.headers['Content-Type'] = "image/jpg"
    	self.response.out.write(myModels[0].thumbnail)
    	return
   logging.info('no thumbnail found')
   self.redirect('/imgs/noThumbnail.jpg')

   # There is an horrendous anomaly when using the sdk locally, where the keys are different
   # so for the real environment I'll need to do this instead:   
   # myModel = Thumbnail.get(permalink)
   # self.response.headers['Content-Type'] = "image/jpg"
   # self.response.out.write(myModel.thumbnail)

class thumbnailDownloadByUploader(BaseRequestHandler):
  def get(self,randomID):
   
   logging.info('you are doing a get to the thumbnail downloader')

   # in the local environment
   randomID = randomID[0:len(randomID)-4]
   myModels = db.GqlQuery("SELECT * FROM AuthorSketchesSketch WHERE randomID = :1", randomID).fetch(1)


   if myModels:
    if myModels[0].thumbnail:
    	logging.info('found thumbnail')
    	self.response.headers['Content-Type'] = "image/jpg"
    	self.response.out.write(myModels[0].thumbnail)
    	return
   logging.info('no thumbnail found')
   self.redirect('/imgs/noThumbnail.jpg')

   # There is an horrendous anomaly when using the sdk locally, where the keys are different
   # so for the real environment I'll need to do this instead:   
   # myModel = Thumbnail.get(permalink)
   # self.response.headers['Content-Type'] = "image/jpg"
   # self.response.out.write(myModel.thumbnail)

class thumbnailDownloadMySketches(BaseRequestHandler):
  def get(self,randomID):
   
   logging.info('you are doing a get to the thumbnail downloader')

   # in the local environment
   randomID = randomID[0:len(randomID)-4]
   myModels = db.GqlQuery("SELECT * FROM MySketchesSketch WHERE randomID = :1", randomID).fetch(1)


   if myModels:
    if myModels[0].thumbnail:
    	logging.info('found thumbnail')
    	self.response.headers['Content-Type'] = "image/jpg"
    	self.response.out.write(myModels[0].thumbnail)
    	return
   logging.info('no thumbnail found')
   self.redirect('/imgs/noThumbnail.jpg')

   # There is an horrendous anomaly when using the sdk locally, where the keys are different
   # so for the real environment I'll need to do this instead:   
   # myModel = Thumbnail.get(permalink)
   # self.response.headers['Content-Type'] = "image/jpg"
   # self.response.out.write(myModel.thumbnail)

class fullPictureDownload(BaseRequestHandler):
  def get(self,randomID):
   
   logging.info('you are doing a get to the full image downloader')

   # in the local environment
   randomID = randomID[0:len(randomID)-4]
   myModels = db.GqlQuery("SELECT * FROM FullPicture WHERE randomID = :1", randomID).fetch(1)


   if myModels:
    if myModels[0].fullPicture:
    	logging.info('found full picture')
    	self.response.headers['Content-Type'] = "image/jpg"
    	self.response.out.write(myModels[0].fullPicture)
    	return
   logging.info('no thumbnail found')
   self.redirect('/imgs/noThumbnail.jpg')

   # There is an horrendous anomaly when using the sdk locally, where the keys are different
   # so for the real environment I'll need to do this instead:   
   # myModel = Thumbnail.get(permalink)
   # self.response.headers['Content-Type'] = "image/jpg"
   # self.response.out.write(myModel.thumbnail)
  
