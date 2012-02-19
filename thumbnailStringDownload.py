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


class thumbnailStringDownload(BaseRequestHandler):
  def get(self,permalink):
   
   logging.info('you are doing a get to the thumbnail downloader')

   # in the local environment
   myModels = Thumbnail.get_by_key_name(permalink)

   for myModel in myModels:
    self.response.headers['Content-Type'] = "text/html"
    self.response.out.write('<br><br>decoded b64:<br><br>')
    self.response.out.write(base64.standard_b64encode(myModel.thumbnail))

   # There is an horrendous anomaly when using the sdk locally, where the keys are different
   # so for the real environment I'll need to do this instead:   
   # myModel = Thumbnail.get(permalink)
   # self.response.headers['Content-Type'] = "image/png"
   # self.response.out.write(myModel.thumbnail)
  
class Thumbnail(db.Model):
  thumbnail = db.BlobProperty()

