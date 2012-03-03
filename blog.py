# !/usr/bin/env python
#
# Copyright 2008 CPedia.com, sketchPatch.
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

__author__ = 'Ping Chen, Davide Della Casa'

import cgi
import wsgiref.handlers
import os
import re
import datetime
import calendar
import logging
import string
import urllib
import util
import pagecount
import Cookie

from xml.etree import ElementTree

from google.appengine.ext.webapp import template
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext import db
from google.appengine.api import memcache
from google.appengine.ext import search
from google.appengine.api import images

from cpedia.pagination.GqlQueryPaginator import GqlQueryPaginator,GqlPage
from cpedia.pagination.paginator import InvalidPage,Paginator

from model import Sketcher,Weblog,WeblogReactions,Sketch,GallerySketch,MySketchesSketch,AuthorSketchesSketch,SketchComment,DeletedSketch
import authorized
import view
from admin import UserInfo

from thumbnailUpload import thumbnailUploaderClass

# session library for when we override the true user identity, we store
# the fake one in session
from appengine_utilities.sessions import Session
from google.appengine.ext.db import Key


class BaseRequestHandler(webapp.RequestHandler):
  """Supplies a common template generation function.

  When you call generate(), we augment the template variables supplied with
  the current user in the 'user' variable and the current webapp request
  in the 'request' variable.
  """
  def generate(self, template_name, template_values={}):

    self.session = True
    user = UserInfo()
    user.whoIs(self)    
    if user.user:
    	values = {
    	  'usernickname': user.nickname,
    	  'useremail': user.email,
    	  'usersiscurrentuseradmin' : user.is_current_user_admin,
    	  'userid': user.user_id,
    	}
    else:
    	values = {
    	  'usernickname': "anonymous",
    	  'useremail': None,
    	  'usersiscurrentuseradmin' : False,
    	  'userid': "anonymous",
    	}

    
    values.update(template_values)
    directory = os.path.dirname(__file__)
    view.ViewPage(cache_time=0).render(self, template_name,values)


class NotFoundHandler(webapp.RequestHandler):
    def get(self):
        self.error(404)
        view.ViewPage(cache_time=36000).render(self)

class UnauthorizedHandler(webapp.RequestHandler):
    def get(self):
        self.error(403)
        view.ViewPage(cache_time=36000).render(self)



class Login(BaseRequestHandler):
  def get(self):
  
   useremail = 'not logged in'

   if users.get_current_user() is not None:
   	useremail = users.get_current_user().email()
   
   template_values = {
      'page':'a',
      'recentReactions':'a',
      'useremail':useremail,
      }
   self.generate('login.html',template_values)

class GroupLogin(BaseRequestHandler):
  def get(self):
   template_values = {
      'page':'a',
      'recentReactions':'a',
      }
   self.generate('groupLogin.html',template_values)
  def post(self):
   secretWord = self.request.get('secretWord')
   
   
   """
   if secretWord == 'xxxx':
   		self.response.headers.add_header('Set-Cookie', 'groupLoginCode=%s; expires=Fri, 31-Dec-2020 23:59:59 GMT; path=/' % "xxxx")
   		self.redirect("/index.html")
   		return
   if secretWord == 'xxxx':
   		self.response.headers.add_header('Set-Cookie', 'groupLoginCode=%s; expires=Fri, 31-Dec-2020 23:59:59 GMT; path=/' % "xxxx")
   		self.redirect("/index.html")
   		return
   if secretWord == 'xxxx':
   		self.response.headers.add_header('Set-Cookie', 'groupLoginCode=%s; expires=Fri, 31-Dec-2020 23:59:59 GMT; path=/' % "xxxx")
   		self.redirect("/index.html")
   		return
   if secretWord == 'xxxx':
   		self.response.headers.add_header('Set-Cookie', 'groupLoginCode=%s; expires=Fri, 31-Dec-2020 23:59:59 GMT; path=/' % "xxxx")
   		self.redirect("/index.html")
   		return
   if secretWord == 'xxxx':
   		self.response.headers.add_header('Set-Cookie', 'groupLoginCode=%s; expires=Fri, 31-Dec-2020 23:59:59 GMT; path=/' % "xxxx")
   		self.redirect("/index.html")
   		return
   """
   
   self.redirect("/groupLoginNotOK.html")


class AddBlog(BaseRequestHandler):
#  @authorized.role("admin")
  def get(self):
      
      util.insertUsersideCookies(self)

      template_values = {
      	'action': "addBlog",
      	'isNew': True, # DDC
      	'published': True, # DDC
      	'headerTitle':"Add a sketch",
      }
      #self.generate('blog_add.html',template_values)
      self.generate('newSketchTemplate.html',template_values)
                

#  @authorized.role("admin")
  def post(self):

			self.session = True
			user = UserInfo()
			user.whoIs(self)

			if 'published' in self.request.arguments():
				logging.info('adding a sketch and the published field has been sent')

			preview = self.request.get('preview')
			submitted = self.request.get('submitted')
			published = ('published' in self.request.arguments())
			
			theKey = Sketch.generateKey()
			sketch = Sketch(key_name = theKey)
			sketch.sourceCode = self.request.get('text_input2').rstrip().lstrip()
			sketch.description = util.Sanitize(self.request.get('text_input'))
			
			# minimal protection against spammers, redirect to root if the program contains too many urls
			#logging.info('occurrences of http ' + str(sketch.sourceCode.count("http")))
			sketch_sourceCode_count_http = sketch.sourceCode.count("http://")
			sketch_sourceCode_count_url_http = sketch.sourceCode.count("[url=http://")
			sketch_description_count_http = sketch.description.count("http://")

			if sketch_sourceCode_count_http > 10:
				self.redirect("/")
				return
			if sketch_sourceCode_count_url_http > 0:
				self.redirect("/")
				return
			if sketch_description_count_http > 7:
				self.redirect("/")
				return
			if sketch_description_count_http + sketch_sourceCode_count_http > 12:
				self.redirect("/")
				return

			sketch_title = self.request.get('title_input')

			# now let's check in some other ways if the content is suspicious
			suspiciousContent = False
			sketch_title = self.request.get('title_input')
			sketch_tags_commas = self.request.get('tags')
			suspiciousContent = False

			# [todo] this piece of code is duplicated
			# also, it should really be in a satellite function
			logging.info('checking whether its a spam comment')
			if ((len(sketch_title) > 9) and  (len(sketch_title) < 20)):
				logging.info('length of title is suspicious')
				if (len(re.findall(" ",sketch_title)) == 0):
					logging.info('no spaces')
					if len(re.findall("[A-Z]",sketch_title)) > 1:
						logging.info('more than one capital letter')
						if (len(sketch_tags_commas) > 9) and  (len(sketch_tags_commas) < 20):
							logging.info('tags are of the correct length')
							if len(re.findall(" ",sketch_tags_commas)) == 0:
								logging.info('no spaces in the tags')
								if len(re.findall(",",sketch_tags_commas)) == 0:
									logging.info('no commas in the tags')
									if len(re.findall("[A-Z]",sketch_tags_commas)) > 1:
										logging.info('capital letters in the tags')
										suspiciousContent = True
										logging.info('this sketch is dodgy')

			if util.doesItContainProfanity(sketch_title):
				suspiciousContent = True
			if util.doesItContainProfanity(sketch.sourceCode):
				suspiciousContent = True
			if util.doesItContainProfanity(sketch.description):
				suspiciousContent = True
			
			gallerySketch = GallerySketch(key_name = theKey) # the gallery must be ordered by time, most recent first
			if user.user:
				#authorSketchesSketch = AuthorSketchesSketch(key_name = "-"+util.convDecToBase(string._long(user.user_id),62) + theKey)
				#mySketchesSketch = MySketchesSketch(key_name = "-"+util.convDecToBase(string._long(user.user_id),62) + theKey)
				user_id_in_fixed_digits = '-%023d' % (int(user.user_id))
				authorSketchesSketch = AuthorSketchesSketch(key_name = user_id_in_fixed_digits + theKey)
				mySketchesSketch = MySketchesSketch(key_name = user_id_in_fixed_digits + theKey)
				authorSketchesSketch.user_id_string = util.convDecToBase(string._long(user.user_id),62)
				mySketchesSketch.user_id_string = util.convDecToBase(string._long(user.user_id),62)
			else:
				authorSketchesSketch = AuthorSketchesSketch(key_name = '-%023d' % (0) + theKey)
				mySketchesSketch = MySketchesSketch(key_name = '-%023d' % (0) + theKey)
				authorSketchesSketch.user_id_string = "anonymous"
				mySketchesSketch.user_id_string = "anonymous"

			# propagate the "suspicious" flag in all the records that we are adding
			sketch.suspiciousContent = suspiciousContent
			gallerySketch.suspiciousContent = suspiciousContent
			authorSketchesSketch.suspiciousContent = suspiciousContent
			mySketchesSketch.suspiciousContent = suspiciousContent
			

			sketch.set_title(sketch_title)
			gallerySketch.title = sketch.title
			authorSketchesSketch.title = sketch.title
			mySketchesSketch.title = sketch.title
			
			if suspiciousContent == True:
				sketch.published = False
				authorSketchesSketch.published = False
				mySketchesSketch.published = False
			elif user.user:
				sketch.published = published
				authorSketchesSketch.published = published
				mySketchesSketch.published = published
			else:
				sketch.published = True
				authorSketchesSketch.published = True
				mySketchesSketch.published = True
			
			sketch.sourceCode = sketch.sourceCode.replace('&','&amp;')
			sketch.sourceCode = sketch.sourceCode.replace('<','&lt;')
			sketch.sourceCode = sketch.sourceCode.replace(' ','&nbsp;')
			sketch.sourceCode = sketch.sourceCode.replace('\r\n','<br>')
			sketch.sourceCode = sketch.sourceCode.replace('\n','<br>')
			sketch.sourceCode = sketch.sourceCode.replace('\r','<br>')
			sketch.sourceCode = sketch.sourceCode.replace('\t','&nbsp;&nbsp;&nbsp;&nbsp;')
			sketch.sourceCode = sketch.sourceCode.replace('"','&quot;')
			sketch.sourceCode = sketch.sourceCode.replace("'", '&#39;')
				
			#sketch.author_user = user.user
			sketch.author_email = user.email
			sketch.author_user_id = user.user_id
			if user.user:
				sketch.author_string_user_id = util.convDecToBase(string._long(user.user_id),62)
				sketch.author_nickname = user.nickname
			else:
				sketch.author_string_user_id = "anonymous"
				sketch.author_nickname = "anonymous"



			if user.user:
				gallerySketch.author_nickname = user.nickname
			else:
				gallerySketch.author_nickname = "anonymous"
			
			sketch.tags_commas = self.request.get('tags')
			gallerySketch.tags_commas = self.request.get('tags')
			authorSketchesSketch.tags_commas = self.request.get('tags')
			mySketchesSketch.tags_commas = self.request.get('tags')


			template_values = {
			  'sketch': sketch,
			  'published': sketch.published,
			  'preview': preview,
			  'submitted': submitted,
			  'action': "addBlog",
			  'tags': self.request.get('tags'),
			  }

			sketch.set_randomID()

			sketch.parentSketchRandomID = self.request.get('parentSketchRandomID')
			
			if sketch.parentSketchRandomID is None:
				sketch.parentSketchRandomID = ''
				
			if sketch.parentSketchRandomID == '':
				sketch.oldestParentSketchRandomID = sketch.randomID;
			else:
				sketch.oldestParentSketchRandomID = self.request.get('oldestParentSketchRandomID')			
			sketch.set_parents(self.request.get('parent_idList'),self.request.get('parent_nicknamesList'))


			gallerySketch.randomID = sketch.randomID
			authorSketchesSketch.randomID = sketch.randomID
			mySketchesSketch.randomID = sketch.randomID

			sketch.save()
			
			# if this is an anonymous user adding a sketch, we have forced this flag to True
			if sketch.published:
				authorSketchesSketch.save()
				gallerySketch.save()

			mySketchesSketch.save()
			
			
			
			## now, finally, this uploads the thumbnail
			thumbnailData = self.request.get('thumbnailData')
			#logging.info('add blog, thumbnail data: ' + thumbnailData)
			if thumbnailData != "":
				logging.info('add blog, thumbnail data not empty - adding/overwriting thumbnail')
				thumbnailUploaderObject = thumbnailUploaderClass()
				thumbnailUploaderObject.doTheUpload(sketch.randomID,thumbnailData)
			else:
				logging.info('add blog, no thumbnail data')



			if user.user and suspiciousContent and ('published' in self.request.arguments()):
				self.redirect("/sketchNotMadePublicNotice.html?sketchID="+sketch.randomID)
			else:
				self.redirect(sketch.full_permalink())

class AddBlogNEW(BaseRequestHandler):
#  @authorized.role("admin")
  def get(self):
      
      util.insertUsersideCookies(self)

      template_values = {
      	'action': "addBlog",
      	'isNew': True, # DDC
      	'published': True, # DDC
      	'headerTitle':"Add a sketch",
      }
      #self.generate('blog_add.html',template_values)
      self.generate('newSketchTemplateNEW.html',template_values)
                

  def post(self):

			self.session = True
			user = UserInfo()
			user.whoIs(self)

			if 'published' in self.request.arguments():
				logging.info('adding a sketch and the published field has been sent')

			preview = self.request.get('preview')
			submitted = self.request.get('submitted')
			published = ('published' in self.request.arguments())
			
			theKey = Sketch.generateKey()
			sketch = Sketch(key_name = theKey)
			sketch.sourceCode = self.request.get('text_input2').rstrip().lstrip()
			
			# minimal protection against spammers, redirect to root if the program contains too many urls
			#logging.info('occurrences of http ' + str(sketch.sourceCode.count("http")))
			if sketch.sourceCode.count("http://") > 10:
				self.redirect("/")
				return
			if sketch.sourceCode.count("[url=http://") > 0:
				self.redirect("/")
				return
			
			gallerySketch = GallerySketch(key_name = theKey) # the gallery must be ordered by time, most recent first
			if user.user:
				user_id_in_fixed_digits = '-%023d' % (int(user.user_id))
				authorSketchesSketch = AuthorSketchesSketch(key_name = user_id_in_fixed_digits + theKey)
				mySketchesSketch = MySketchesSketch(key_name = user_id_in_fixed_digits + theKey)
				authorSketchesSketch.user_id_string = util.convDecToBase(string._long(user.user_id),62)
				mySketchesSketch.user_id_string = util.convDecToBase(string._long(user.user_id),62)
			else:
				authorSketchesSketch = AuthorSketchesSketch(key_name = '-%023d' % (0) + theKey)
				mySketchesSketch = MySketchesSketch(key_name = '-%023d' % (0) + theKey)
				authorSketchesSketch.user_id_string = "anonymous"
				mySketchesSketch.user_id_string = "anonymous"
			

			sketch.set_title(self.request.get('title_input'))
			gallerySketch.title = sketch.title
			authorSketchesSketch.title = sketch.title
			mySketchesSketch.title = sketch.title

			sketch.description = util.Sanitize(self.request.get('text_input'))
			
			if user.user:
				sketch.published = published
				authorSketchesSketch.published = published
				mySketchesSketch.published = published
			else:
				sketch.published = True
				authorSketchesSketch.published = True
				mySketchesSketch.published = True
			
			sketch.sourceCode = sketch.sourceCode.replace('&','&amp;')
			sketch.sourceCode = sketch.sourceCode.replace('<','&lt;')
			sketch.sourceCode = sketch.sourceCode.replace(' ','&nbsp;')
			sketch.sourceCode = sketch.sourceCode.replace('\r\n','<br>')
			sketch.sourceCode = sketch.sourceCode.replace('\n','<br>')
			sketch.sourceCode = sketch.sourceCode.replace('\r','<br>')
			sketch.sourceCode = sketch.sourceCode.replace('\t','&nbsp;&nbsp;&nbsp;&nbsp;')
			sketch.sourceCode = sketch.sourceCode.replace('"','&quot;')
			sketch.sourceCode = sketch.sourceCode.replace("'", '&#39;')
				
			#sketch.author_user = user.user
			sketch.author_email = user.email
			sketch.author_user_id = user.user_id
			if user.user:
				sketch.author_string_user_id = util.convDecToBase(string._long(user.user_id),62)
				sketch.author_nickname = user.nickname
			else:
				sketch.author_string_user_id = "anonymous"
				sketch.author_nickname = "anonymous"



			if user.user:
				gallerySketch.author_nickname = user.nickname
			else:
				gallerySketch.author_nickname = "anonymous"
			
			sketch.tags_commas = self.request.get('tags')
			gallerySketch.tags_commas = self.request.get('tags')
			authorSketchesSketch.tags_commas = self.request.get('tags')
			mySketchesSketch.tags_commas = self.request.get('tags')


			template_values = {
			  'sketch': sketch,
			  'published': sketch.published,
			  'preview': preview,
			  'submitted': submitted,
			  'action': "addBlog",
			  'tags': self.request.get('tags'),
			  }

			sketch.set_randomID()

			sketch.parentSketchRandomID = self.request.get('parentSketchRandomID')
			
			if sketch.parentSketchRandomID is None:
				sketch.parentSketchRandomID = ''
				
			if sketch.parentSketchRandomID == '':
				sketch.oldestParentSketchRandomID = sketch.randomID;
			else:
				sketch.oldestParentSketchRandomID = self.request.get('oldestParentSketchRandomID')			
			sketch.set_parents(self.request.get('parent_idList'),self.request.get('parent_nicknamesList'))


			gallerySketch.randomID = sketch.randomID
			authorSketchesSketch.randomID = sketch.randomID
			mySketchesSketch.randomID = sketch.randomID

			sketch.save()
			
			# if this is an anonymous user adding a sketch, we have forced this flag to True
			if sketch.published:
				authorSketchesSketch.save()
				gallerySketch.save()

			mySketchesSketch.save()
			
			## now, finally, this uploads the thumbnail
			thumbnailData = self.request.get('thumbnailData')
			#logging.info('add blog, thumbnail data: ' + thumbnailData)
			if thumbnailData != "":
				logging.info('add blog, thumbnail data not empty - adding/overwriting thumbnail')
				thumbnailUploaderObject = thumbnailUploaderClass()
				thumbnailUploaderObject.doTheUpload(sketch.randomID,thumbnailData)
			else:
				logging.info('add blog, no thumbnail data')



			self.redirect(sketch.full_permalink())


class CopyBlog(BaseRequestHandler):
#    @authorized.role("admin")
    def get(self,randomID):

      util.insertUsersideCookies(self)

      randomID = randomID.replace("/","")
      sketch = Sketch.get_by_randomID(randomID)
      
      # this big blot inserted by Davide Della Casa
      self.session = True
      user = UserInfo()
      user.whoIs(self)

      sketch.sourceCodeForTextArea = sketch.sourceCode
      sketch.sourceCodeForTextArea = sketch.sourceCodeForTextArea.replace('&nbsp;',' ')
      sketch.sourceCodeForTextArea = sketch.sourceCodeForTextArea.replace('<br>','\r\n')
      sketch.sourceCodeForTextArea = sketch.sourceCodeForTextArea.replace('<br>','\n')
      sketch.sourceCodeForTextArea = sketch.sourceCodeForTextArea.replace('<br>','\r')
      sketch.sourceCodeForTextArea = sketch.sourceCodeForTextArea.replace('&nbsp;&nbsp;&nbsp;&nbsp;','\t')
      sketch.sourceCodeForTextArea = sketch.sourceCodeForTextArea.rstrip().lstrip()
      sketch.blogdate = "";
      sketch.entrytype="";
      sketch.status="published";

      sketch.author_email = user.email
      sketch.author_user_id = user.user_id
      if user.user:
      	sketch.author_nickname = user.nickname
      else:
      	sketch.author_nickname = "anonymous"

      
      # this big blot inserted by Davide Della Casa
      template_values = {
      	'sketch': sketch,
      	'action': "copyBlog",
      	'published': sketch.published,
      	'headerTitle':"Copy sketch",

      }
      self.generate('newSketchTemplate.html',template_values)

class EditBlogNEW(BaseRequestHandler):
#    @authorized.role("admin")
    def get(self,randomID):
    
      util.insertUsersideCookies(self)

      randomID = randomID.replace("/","")
      sketch = Sketch.get_by_randomID(randomID)
      
      # this big blot inserted by Davide Della Casa
      self.session = True
      user = UserInfo()
      user.whoIs(self)

      sketch.sourceCodeForTextArea = sketch.sourceCode
      sketch.sourceCodeForTextArea = sketch.sourceCodeForTextArea.replace('&nbsp;',' ')
      sketch.sourceCodeForTextArea = sketch.sourceCodeForTextArea.replace('<br>','\r\n')
      sketch.sourceCodeForTextArea = sketch.sourceCodeForTextArea.replace('<br>','\n')
      sketch.sourceCodeForTextArea = sketch.sourceCodeForTextArea.replace('<br>','\r')
      sketch.sourceCodeForTextArea = sketch.sourceCodeForTextArea.replace('&nbsp;&nbsp;&nbsp;&nbsp;','\t')
      sketch.sourceCodeForTextArea = sketch.sourceCodeForTextArea.rstrip().lstrip()

      if ((sketch.author_user_id == user.user_id) or (user.is_current_user_admin)):
			template_values = {
			'sketch': sketch,
			'published': sketch.published,
			'action': "editBlog",
			'headerTitle':"Edit sketch",
			}
			self.generate('newSketchTemplateNEW.html',template_values)
      else:
			if self.request.method == 'GET':
				self.redirect("/403.html")
			else:
				self.error(403)   # User didn't meet role.

#    @authorized.role("admin")
    def post(self,randomID):

      randomID = randomID.replace("/","")
      sketch = Sketch.get_by_randomID(randomID)


      # this big blot inserted by Davide Della Casa
      self.session = True
      user = UserInfo()
      user.whoIs(self)

      if ((sketch.author_user_id == user.user_id) or (user.is_current_user_admin)):
			if(sketch is None):
				self.redirect('/index.html')

			################################################################################
			################################################################################ 
			# and now for some serious tiptapping. On top of the sketch table, there are other
			# tables to change.
			# first, if the published flag changes, then the entries in the gallery and in the by_author
			# table need to either be inserted or be deleted
			# that said, also if the title or the tags change, then you need to modify the entries
			# in all the three tables (unless you just deleted or added them)
			

			AuthorSketchesSketch_add = False
			AuthorSketchesSketch_change = False
			AuthorSketchesSketch_delete = False
			
			GallerySketch_add = False
			GallerySketch_change = False
			GallerySketch_delete = False
			
			if 'published' in self.request.arguments():
				logging.info('editing a sketch and the published field has been sent')
			
			# Anonymous users can't create unpublished sketches
			if user.user:
				shouldItBePublished = ('published' in self.request.arguments())
			else:
				shouldItBePublished = True
			
			# first, check is the title of the tags changed
			# if so, then you modify the MySketchesSketch table right away
			# and you mark the AuthorSketchesSketch and the GallerySketch table as
			# *potentially* to be modified ( *potentially* because you might have to just add those
			# entries anew or delete them, depending on whether the published flag has changed)
			if ((sketch.title != self.request.get('title_input')) or (sketch.tags_commas != self.request.get('tags'))):
				q0 = db.GqlQuery("SELECT * FROM MySketchesSketch WHERE randomID = :1", randomID).fetch(1)
				q0[0].title = self.request.get('title_input')
				q0[0].tags_commas = self.request.get('tags')
				q0[0].published = (shouldItBePublished)
				q0[0].put()
				#
				AuthorSketchesSketch_change = True
				GallerySketch_change = True

			# now you check how the published flag changes to see if the entries
			# in the other two tables need to be added or deleted
			
			if ((sketch.published == True) and (shouldItBePublished==False)):
				logging.info('unpublishing a sketch')
				AuthorSketchesSketch_delete = True
				GallerySketch_delete = True

			if ((sketch.published == False) and (shouldItBePublished==True)):
				logging.info('making a sketch public')
				AuthorSketchesSketch_add = True
				GallerySketch_add = True
				
			# if you have to add, add, and set the "change" flag to false so that
			# you don't blindly change this record soon after you've added it
			if AuthorSketchesSketch_add	:
				authorSketchesSketch = AuthorSketchesSketch(key_name = '-%023d' % int(user.user_id) + sketch.key().name())
				authorSketchesSketch.title = self.request.get('title_input')
				authorSketchesSketch.published = shouldItBePublished
				authorSketchesSketch.randomID = sketch.randomID
				authorSketchesSketch.tags_commas = self.request.get('tags')
				authorSketchesSketch.put()
				AuthorSketchesSketch_change = False

			if GallerySketch_add	:
				gallerySketch = GallerySketch(key_name = sketch.key().name())
				if user.user:
					gallerySketch.author_nickname = user.nickname
				else:
					gallerySketch.author_nickname = "anonymous"
				gallerySketch.title = self.request.get('title_input')
				gallerySketch.published = shouldItBePublished
				gallerySketch.randomID = sketch.randomID
				gallerySketch.tags_commas = self.request.get('tags')
				gallerySketch.put()
				GallerySketch_change = False

			# if you have to delete, delete, and set the "change" flag to false so that
			# you don't blindly change those entries soon after you've added
			if AuthorSketchesSketch_delete	:
				q1 = db.GqlQuery("SELECT * FROM AuthorSketchesSketch WHERE randomID = :1", randomID).fetch(1)
				q1[0].delete()
				AuthorSketchesSketch_change = False

			if GallerySketch_delete	:
				q2 = GallerySketch.get_by_key_name(sketch.key().name())
				q2.delete()
				GallerySketch_change = False

			
			
			# any change to the AuthorSketches or GallerySketch tables only happens if the sketch is public,
			# cause otherwise those two sketch records aren't just going to be there in the first place!
			if (sketch.published) :
				# ok now check the "change" flags. If they are still on, it means that the title or
				# tag have changed, and the published flag hasn't changed (so it's not like you just
				# added or deleted the records), so you have to effectively
				# go and fish the records out of the database and change them
				if AuthorSketchesSketch_change	:
					# need to fetch the other tables (gallery, my page and by author) and change them
					q3 = db.GqlQuery("SELECT * FROM AuthorSketchesSketch WHERE randomID = :1", randomID).fetch(1)
					q3[0].title = self.request.get('title_input')
					q3[0].tags_commas = self.request.get('tags')
					q3[0].put()
				if GallerySketch_change	:
					q4 = GallerySketch.get_by_key_name(sketch.key().name())
					q4.title = self.request.get('title_input')				
					q4.tags_commas = self.request.get('tags')				
					q4.put()

				
			################################################################################
			################################################################################
			
			sketch.set_title(self.request.get('title_input'))
			sketch.description = util.Sanitize(self.request.get('text_input'))
			sketch.published = (shouldItBePublished)

			#blog.sourceCode = self.request.get('text_input2')
			sketch.sourceCode = self.request.get('text_input2').rstrip().lstrip()
			sketch.sourceCode = sketch.sourceCode.replace('&','&amp;')
			sketch.sourceCode = sketch.sourceCode.replace('<','&lt;')
			sketch.sourceCode = sketch.sourceCode.replace(' ','&nbsp;')
			sketch.sourceCode = sketch.sourceCode.replace('\r\n','<br>')
			sketch.sourceCode = sketch.sourceCode.replace('\n','<br>')
			sketch.sourceCode = sketch.sourceCode.replace('\r','<br>')
			sketch.sourceCode = sketch.sourceCode.replace('\t','&nbsp;&nbsp;&nbsp;&nbsp;')
			sketch.sourceCode = sketch.sourceCode.replace('"','&quot;')
			sketch.sourceCode = sketch.sourceCode.replace("'", '&#39;')
			
			sketch.tags_commas = self.request.get('tags')
			
			sketch.update()

			## now, finally, this uploads the thumbnail
			thumbnailData = self.request.get('thumbnailData')
			#logging.info('thumbnail data: ' + thumbnailData)
			if thumbnailData != "":
				logging.info('thumbnail data not empty - adding/overwriting thumbnail')
				thumbnailUploaderObject = thumbnailUploaderClass()
				thumbnailUploaderObject.doTheUpload(sketch.randomID,thumbnailData)
			else:
				logging.info('no thumbnail data')



			self.redirect(sketch.full_permalink())
      else:
			if self.request.method == 'GET':
				self.redirect("/403.html")
			else:
				self.error(403)   # User didn't meet role.


class EditBlog(BaseRequestHandler):
    def get(self,randomID):
    
      util.insertUsersideCookies(self)

      randomID = randomID.replace("/","")
      sketch = Sketch.get_by_randomID(randomID)
      
      # this big blot inserted by Davide Della Casa
      self.session = True
      user = UserInfo()
      user.whoIs(self)

      sketch.sourceCodeForTextArea = sketch.sourceCode
      sketch.sourceCodeForTextArea = sketch.sourceCodeForTextArea.replace('&nbsp;',' ')
      sketch.sourceCodeForTextArea = sketch.sourceCodeForTextArea.replace('<br>','\r\n')
      sketch.sourceCodeForTextArea = sketch.sourceCodeForTextArea.replace('<br>','\n')
      sketch.sourceCodeForTextArea = sketch.sourceCodeForTextArea.replace('<br>','\r')
      sketch.sourceCodeForTextArea = sketch.sourceCodeForTextArea.replace('&nbsp;&nbsp;&nbsp;&nbsp;','\t')
      sketch.sourceCodeForTextArea = sketch.sourceCodeForTextArea.rstrip().lstrip()

      if ((sketch.author_user_id == user.user_id) or (user.is_current_user_admin)):
			template_values = {
			'sketch': sketch,
			'published': sketch.published,
			'action': "editBlog",
			'headerTitle':"Edit sketch",
			}
			self.generate('newSketchTemplate.html',template_values)
      else:
			if self.request.method == 'GET':
				self.redirect("/403.html")
			else:
				self.error(403)   # User didn't meet role.

#    @authorized.role("admin")
    def post(self,randomID):

      logging.info('editing the sketch')
      randomID = randomID.replace("/","")
      sketch = Sketch.get_by_randomID(randomID)


      # this big blot inserted by Davide Della Casa
      self.session = True
      user = UserInfo()
      user.whoIs(self)

      if ((sketch.author_user_id == user.user_id) or (user.is_current_user_admin)):
			if(sketch is None):
				self.redirect('/index.html')

			################################################################################
			################################################################################ 
			# and now for some serious tiptapping. On top of the sketch table, there are other
			# tables to change.
			# first, if the published flag changes, then the entries in the gallery and in the by_author
			# table need to either be inserted or be deleted
			# that said, also if the title or the tags change, then you need to modify the entries
			# in all the three tables (unless you just deleted or added them)
			

			AuthorSketchesSketch_add = False
			AuthorSketchesSketch_change = False
			AuthorSketchesSketch_delete = False
			
			GallerySketch_add = False
			GallerySketch_change = False
			GallerySketch_delete = False
			
			if 'published' in self.request.arguments():
				logging.info('editing a sketch and the published field has been sent')
			
			# check if the edited sketch has become suspicious
			sketch_title = self.request.get('title_input')
			sketch_tags_commas = self.request.get('tags')
			suspiciousContent = False

			# [todo] this piece of code is duplicated
			# also, it should really be in a satellite function
			logging.info('checking whether its a spam comment')
			if ((len(sketch_title) > 9) and  (len(sketch_title) < 20)):
				logging.info('length of title is suspicious')
				if (len(re.findall(" ",sketch_title)) == 0):
					logging.info('no spaces')
					if len(re.findall("[A-Z]",sketch_title)) > 1:
						logging.info('more than one capital letter')
						if (len(sketch_tags_commas) > 9) and  (len(sketch_tags_commas) < 20):
							logging.info('tags are of the correct length')
							if len(re.findall(" ",sketch_tags_commas)) == 0:
								logging.info('no spaces in the tags')
								if len(re.findall(",",sketch_tags_commas)) == 0:
									logging.info('no commas in the tags')
									if len(re.findall("[A-Z]",sketch_tags_commas)) > 1:
										logging.info('capital letters in the tags')
										suspiciousContent = True
										logging.info('this sketch is dodgy')

			if util.doesItContainProfanity(sketch_title):
				suspiciousContent = True
				logging.info('this sketch is dirrrrrrrty')

			# Anonymous users can't create unpublished sketches,
			# so we override the flag of the form if the case
			if suspiciousContent == True:
				logging.info('forcing the sketch to unpublishing because it is so dirty')
				shouldItBePublished = False
			elif user.user:
				shouldItBePublished = ('published' in self.request.arguments())
			else:
				shouldItBePublished = True
			

			# first, check if the title or the tags changed
			# if so, then you modify the MySketchesSketch table right away
			# and you mark the AuthorSketchesSketch and the GallerySketch table as
			# *potentially* to be modified ( *potentially* because you might have to just add those
			# entries anew or delete them, depending on whether the published flag has changed)
			if ((sketch.title != sketch_title) or (sketch.tags_commas != self.request.get('tags'))):
				q0 = db.GqlQuery("SELECT * FROM MySketchesSketch WHERE randomID = :1", randomID).fetch(1)
				q0[0].title = sketch_title
				q0[0].tags_commas = self.request.get('tags')
				q0[0].published = (shouldItBePublished)
				q0[0].put()
				#
				AuthorSketchesSketch_change = True
				GallerySketch_change = True

			# now you check how the published flag changes to see if the entries
			# in the other two tables need to be added or deleted
			
			if ((sketch.published == True) and (shouldItBePublished==False)):
				logging.info('unpublishing a sketch')
				AuthorSketchesSketch_delete = True
				GallerySketch_delete = True

			if ((sketch.published == False) and (shouldItBePublished==True)):
				logging.info('making a sketch public')
				AuthorSketchesSketch_add = True
				GallerySketch_add = True
				
			# if you have to add, add, and set the "change" flag to false so that
			# you don't blindly change this record soon after you've added it
			if AuthorSketchesSketch_add	:
				authorSketchesSketch = AuthorSketchesSketch(key_name = '-%023d' % int(user.user_id) + sketch.key().name())
				authorSketchesSketch.title = self.request.get('title_input')
				authorSketchesSketch.published = shouldItBePublished
				authorSketchesSketch.randomID = sketch.randomID
				authorSketchesSketch.tags_commas = self.request.get('tags')
				authorSketchesSketch.put()
				AuthorSketchesSketch_change = False

			if GallerySketch_add	:
				gallerySketch = GallerySketch(key_name = sketch.key().name())
				if user.user:
					gallerySketch.author_nickname = user.nickname
				else:
					gallerySketch.author_nickname = "anonymous"
				gallerySketch.title = self.request.get('title_input')
				gallerySketch.published = shouldItBePublished
				gallerySketch.randomID = sketch.randomID
				gallerySketch.tags_commas = self.request.get('tags')
				gallerySketch.put()
				GallerySketch_change = False

			# if you have to delete, delete, and set the "change" flag to false so that
			# you don't blindly change those entries soon after you've added
			if AuthorSketchesSketch_delete	:
				q1 = db.GqlQuery("SELECT * FROM AuthorSketchesSketch WHERE randomID = :1", randomID).fetch(1)
				q1[0].delete()
				AuthorSketchesSketch_change = False

			if GallerySketch_delete	:
				q2 = GallerySketch.get_by_key_name(sketch.key().name())
				q2.delete()
				GallerySketch_change = False

			
			
			# any change to the AuthorSketches or GallerySketch tables only happens if the sketch is public,
			# cause otherwise those two sketch records aren't just going to be there in the first place!
			if (sketch.published) :
				# ok now check the "change" flags. If they are still on, it means that the title or
				# tag have changed, and the published flag hasn't changed (so it's not like you just
				# added or deleted the records), so you have to effectively
				# go and fish the records out of the database and change them
				if AuthorSketchesSketch_change	:
					# need to fetch the other tables (gallery, my page and by author) and change them
					q3 = db.GqlQuery("SELECT * FROM AuthorSketchesSketch WHERE randomID = :1", randomID).fetch(1)
					q3[0].title = self.request.get('title_input')
					q3[0].tags_commas = self.request.get('tags')
					q3[0].put()
				if GallerySketch_change	:
					q4 = GallerySketch.get_by_key_name(sketch.key().name())
					q4.title = self.request.get('title_input')				
					q4.tags_commas = self.request.get('tags')				
					q4.put()

				
			################################################################################
			################################################################################
			
			sketch.set_title(self.request.get('title_input'))
			sketch.description = util.Sanitize(self.request.get('text_input'))
			sketch.published = (shouldItBePublished)

			sketch.sourceCode = self.request.get('text_input2').rstrip().lstrip()
			sketch.sourceCode = sketch.sourceCode.replace('&','&amp;')
			sketch.sourceCode = sketch.sourceCode.replace('<','&lt;')
			sketch.sourceCode = sketch.sourceCode.replace(' ','&nbsp;')
			sketch.sourceCode = sketch.sourceCode.replace('\r\n','<br>')
			sketch.sourceCode = sketch.sourceCode.replace('\n','<br>')
			sketch.sourceCode = sketch.sourceCode.replace('\r','<br>')
			sketch.sourceCode = sketch.sourceCode.replace('\t','&nbsp;&nbsp;&nbsp;&nbsp;')
			sketch.sourceCode = sketch.sourceCode.replace('"','&quot;')
			sketch.sourceCode = sketch.sourceCode.replace("'", '&#39;')
			
			sketch.tags_commas = self.request.get('tags')
			
			sketch.update()
			
			
			
			
			## now, finally, this uploads the thumbnail
			thumbnailData = self.request.get('thumbnailData')
			#logging.info('thumbnail data: ' + thumbnailData)
			if thumbnailData != "":
				logging.info('thumbnail data not empty - adding/overwriting thumbnail')
				thumbnailUploaderObject = thumbnailUploaderClass()
				thumbnailUploaderObject.doTheUpload(sketch.randomID,thumbnailData)
			else:
				logging.info('no thumbnail data')


			# note that we don't tell anonymous users what happened - this is to make
			# bots' life a tiny little bit more complicated
			if user.user and suspiciousContent and ('published' in self.request.arguments()):
				self.redirect("/sketchNotMadePublicNotice.html?sketchID="+sketch.randomID)
			else:
				self.redirect(sketch.full_permalink())

      else:
			if self.request.method == 'GET':
				self.redirect("/403.html")
			else:
				self.error(403)   # User didn't meet role.


class DeleteBlog(BaseRequestHandler):
  def get(self,randomID):

      randomID = randomID.replace("/","")
      sketch = Sketch.get_by_randomID(randomID)
      if sketch is None: self.redirect("/403.html")
      
      # this big blot inserted by Davide Della Casa
      self.session = True
      user = UserInfo()
      user.whoIs(self)

      if ((sketch.author_user_id == user.user_id) or (user.is_current_user_admin)):

           q0 = db.GqlQuery("SELECT * FROM MySketchesSketch WHERE randomID = :1", randomID).fetch(1)
           q1 = db.GqlQuery("SELECT * FROM AuthorSketchesSketch WHERE randomID = :1", randomID).fetch(1)
           logging.info('key stuff: '+ str(sketch.key()))
           logging.info('key stuff: '+ sketch.key().name())
           q2 = GallerySketch.get_by_key_name(sketch.key().name())

           DeletedSketch(key_name = 'sketchRandomID'+randomID).put()
           if(q0) : q0[0].delete()
           if(q1) : q1[0].delete()
           if(q2) : q2.delete()
           if(sketch): sketch.delete()           		
           # deletion of comments is missing

           self.redirect('/mySketches')
      else:
			if self.request.method == 'GET':
				self.redirect("/403.html")
			else:
				self.error(403)   # User didn't meet role.
 
                
class AddBlogReaction(BaseRequestHandler):
  def post(self,randomID):

    self.session = True
    user = UserInfo()
    user.whoIs(self)


    # this key is actually of fixed length
    theKey = "-" + randomID + Sketch.generateKey()
    sketchComment = SketchComment(key_name = theKey)
    sketchComment.randomID = randomID
    sketchComment.body = self.request.get('text_input')

    #sketchComment.author_user = user.user
    sketchComment.author_email = user.email
    sketchComment.author_user_id = user.user_id
    sketchComment.author_string_user_id = util.convDecToBase(string._long(user.user_id),62)
    sketchComment.author_nickname = user.nickname

    # This is necessary cause we need to store in the comment who is the author of the sketch
    # cause we'll have the client browser to independently check whether to allow the author of the sketch to delete any of the comments
    # we could do this check on the server side without storing the sketch author in the comment    
    # BUT we can't do the check on the client side without passing a parameter accross three pages...    
    sketch = Sketch.get_by_randomID(randomID)
    if sketch is None: self.redirect("/403.html")
    sketchComment.sketch_author_user_id = sketch.author_user_id
        
    sketchComment.save()
    self.redirect('/view/'+randomID+"/")



class DeleteBlogReaction(BaseRequestHandler):
  @authorized.role("user")
  def get(self,commentId):

		  logging.info('got in')

		  util.insertUsersideCookies(self)

		  self.session = True
		  user = UserInfo()
		  user.whoIs(self)

		  # anonymous users can't delete comments or sketches
		  if not user.user:
		  	self.redirect("/403.html")
		  	return

		  # does the comment exist?
		  q = SketchComment.get_by_key_name(commentId)
		  if not q:
		  	logging.info('no such comment')
		  	self.redirect("/403.html?no such comment")
		  	return

		  # is the user a) an admin b) the owner of the sketch c) the owner of the comment?
		  if ((user.user_id == q.author_user_id) or (user.is_current_user_admin) or (user.user_id == q.sketch_author_user_id)):
		  	logging.info('ok, deleting now')
		  	q.delete()
		  else:
		  	logging.info('wrong permissions')
		  	self.redirect("/403.html?you cant do that")
		  	return

		  logging.info('redirecting to: ' + self.request.get("backTo"))
		  self.redirect(self.request.get("backTo"))
		  return



class ArticleHandler(BaseRequestHandler):
    def get(self,randomID,perm_stem):

        cpedialog = util.getCPedialog()
        sketch = db.Query(Sketch).filter('randomID =',randomID).get()
        if(sketch is None):
            self.redirect('/index.html')
				
        # if the page is viewed for the first time, we don't find the cookie
        # so we add the cookie and we increment the pageviews.
        # otherwise if we find the cookie then it means that the page has been viewed already
        # so we just read the counter without incrementing
        c = Cookie.SimpleCookie(self.request.headers.get('Cookie'))
        if "viewed" not in c.keys():
          # set the "viewed" cookie here so that we don't increment the counter at the next visit
          self.response.headers.add_header('Set-Cookie', 'viewed=%s; expires=Fri, 31-Dec-2020 23:59:59 GMT' % "yes")
          numberOfViews = pagecount.IncrPageCount(randomID, 1)
          if sketch.author_string_user_id != 'anonymous':
            authorViews = pagecount.IncrPageCount(sketch.author_string_user_id, 1)
          util.insertPageviewsCookie(self, numberOfViews)
        else:
          numberOfViews = pagecount.GetPageCount(randomID)

        # in case the user log-ins from a sketch view page, then when he lands on the same
        # page after the login page, we need to write all the cookies on the client side
        # so this is what we are doing here.
        util.insertUsersideCookies(self)


        # this was a mechanism to set up the number of views manually
        # when the site started. We did set the views based on numbers
        # from Google Analytics.
        """
        forcedNumberOfViewsCounter = self.request.get("xxxx")
        if forcedNumberOfViewsCounter != '':
        	pagecount.IncrPageCount(randomID, int(forcedNumberOfViewsCounter) - pagecount.GetPageCount(randomID))
        """



        template_values = {
          'sketch': sketch,
          'headerTitle':"Playground",
          #'blog': blog,
          #'reactions': reactions,
          }
        self.generate('viewSketchTemplate.html',template_values)


class UploadFullSketchImagePage(BaseRequestHandler):
    def get(self,randomID,perm_stem):

        cpedialog = util.getCPedialog()
        sketch = db.Query(Sketch).filter('randomID =',randomID).get()
        if(sketch is None):
            self.redirect('/index.html')
				

        template_values = {
          'sketch': sketch,
          'headerTitle':"Playground",
          }
        self.generate('uploadFullSketchImagePageTemplate.html',template_values)


class ArticleHandlerEmbed(BaseRequestHandler):
    def get(self,randomID,perm_stem):

        # NOTE: this piece of code is out of date. You should refresh it using the
        # latest code of the ArticleHandler class. The only thing that you
        # should re-use is the template of the embed view sketch
        
        cpedialog = util.getCPedialog()
        sketch = db.Query(Sketch).filter('randomID =',randomID).get()
        if(sketch is None):
            self.redirect('/index.html')
				
        # if the page is viewed for the first time, we don't find the cookie
        # so we add the cookie and we increment the pageviews.
        # otherwise if we find the cookie then it means that the page has been viewed already
        # so we just read the counter without incrementing
        c = Cookie.SimpleCookie(self.request.headers.get('Cookie'))
        if "viewed" not in c.keys():
          c["viewed"] = ""
          self.response.headers['Set-cookie'] = str(c)				
          numberOfViews = pagecount.IncrPageCount(randomID, 1)
          if sketch.author_string_user_id != 'anonymous':
            authorViews = pagecount.IncrPageCount(sketch.author_string_user_id, 1)
          util.insertPageviewsCookie(self, numberOfViews)
        else:
          numberOfViews = pagecount.GetPageCount(randomID)

        util.insertUsersideCookies(self)


        forcedNumberOfViewsCounter = self.request.get("forcedNumberOfViewsCounter3141592")
        if forcedNumberOfViewsCounter != '':
        	pagecount.IncrPageCount(randomID, int(forcedNumberOfViewsCounter) - pagecount.GetPageCount(randomID))



        template_values = {
          'sketch': sketch,
          'headerTitle':"Playground",
          }
        self.generate('embedSketchTemplate.html',template_values)


class FetchSourceCode(BaseRequestHandler):
    def get(self,randomID):

        cpedialog = util.getCPedialog()
        sketch = db.Query(Sketch).filter('randomID =',randomID).get()
        if(blog is None):
            self.redirect('/index.html')
        template_values = {
          'sketch': sketch,
          }
        self.generate('sourcecode_view.html',template_values)


class SiteMapHandler(BaseRequestHandler):    #for live.com SEO
    def get(self):

        blogs = Weblog.all().order('-date')
        template_values = {
          'allblogs': blogs,
          }
        self.generate('site_map.html',template_values)


class TagHandler(BaseRequestHandler):
    def get(self, encoded_tag):

        #tag =  re.sub('(%25|%)(\d\d)', lambda cmatch: chr(string.atoi(cmatch.group(2), 16)), encoded_tag)   # No urllib.unquote in AppEngine?
        #tag =  urllib.unquote(encoded_tag.encode('utf8'))
        tag = encoded_tag
        blogs = Weblog.all().filter('tags', tag).order('-date')
        recentReactions = util.getRecentReactions()
        template_values = {
          'blogs':blogs,
          'tag':tag,
          'recentReactions':recentReactions,
          }
        self.generate('tag.html',template_values)


    
class SearchHandler(BaseRequestHandler):
    def get(self,search_term):

        pageStr = self.request.get('page')
        if pageStr:
            page = int(pageStr)
        else:
            page = 1;
        query = db.Query(Weblog).filter('tags =', search_term).order('-date')
        try:
            cpedialog = util.getCPedialog()
            obj_page  =  Paginator(query,1000)
        except InvalidPage:
            self.redirect('/index.html')

        recentReactions = util.getRecentReactions()
        template_values = {
          'search_term':search_term,
          'page':obj_page,
          'recentReactions':recentReactions,
          }
        self.generate('blog_main.html',template_values)

class showLatestSketches(BaseRequestHandler):

  def get(self):
        next = None
        PAGESIZE = 30

        util.insertUsersideCookies(self)

        bookmark = self.request.get("bookmark")
        if bookmark:
        	bookmark = Key(self.request.get("bookmark"))
        else:
        	bookmark = Key.from_path('GallerySketch',"sketch00000000000000000000")

        logging.info('starting key  ' + str(bookmark))
        logging.info('starting key  name' + bookmark.name())
        q = db.GqlQuery("SELECT * FROM GallerySketch WHERE __key__ >= :1", bookmark)
        sketches = q.fetch(PAGESIZE+1)
        
        if len(sketches) == PAGESIZE + 1:
        	next = str(sketches[-1].key())
        	sketches = sketches[:PAGESIZE]
        	logging.info('next key  ' + next)
        	logging.info('next key name ' + sketches[-1].key().name())

        if next is None:
        	next = ""


        for sketch in sketches:
        	sketch.stringtags = util.shorten(" ".join(sketch.tags),18)
			
        template_values = {
          'sketches':sketches,
          'bookmark':bookmark,
          'next':next,
          'action':"gallery",
          'headerTitle':"Gallery",
          }
        self.generate('galleryTemplate.html',template_values)

class showProfile(BaseRequestHandler):

  def get(self, id):
        next = None
        PAGESIZE = 3

        logging.info("profile handler - being called by"  + self.request.path)

        util.insertUsersideCookies(self)

        self.session = True
        user = UserInfo()
        user.whoIs(self)
        

        if id==None: id=""
        logging.info("id from URL: " + id)
        userIDasString = id.partition('-')[2]
        logging.info('most weird: sometimes this ends with justcorners.js : ' + userIDasString)
        userIDasString = userIDasString.partition('/')[0]
        logging.info("userIDasString: >" + userIDasString +"<")

		# this test below checks if an anonymous user is going to http://www.sketchpatch.net/profile/
		# cause (s)he shouldn't. (s)He just shouldn't see the link. (s)He should be redirected to the login
		# page really, but we are lazy here.
        if userIDasString == "" and (not user.user):
          logging.info("user is not logged in and trying to access his own profile, kicking him/her out")
          self.redirect("/")
          return

		# this happens when a user is logged in and goes to http://www.sketchpatch.net/profile/
		# we fill in the missing information that identifies the user. In order to make
		# the flow of things more uniform
        if userIDasString == "" and user.user:
        	userIDasString = util.convDecToBase(string._long(user.user_id),62)
        
        logging.info('looking for profile with userID = ' + userIDasString)
        query = db.GqlQuery("SELECT * FROM Sketcher WHERE userID = :1", userIDasString)
        sketcher = query.get();
        
		# we'll be using this variable later and it better not be null
        if user.user_id == None:
        	user.user_id = "0";
        
        # if no profile has been found, then there are two cases:
        # 1) anyone for any reason is going to the profile page specifying a userID that
        #    doesn't exist
        # 2) the owner of the profile is going to his own profile page and there is no profile
        #    record yet.
        # We are going to check which case we are in and if we are in case 2) then we create
        # a record for the user. In case he sends his profile URL to his mates, they should
        # see the newly created record there even if he didn't edit his profile.
        # Basically the idea is to create his profile record at the earliest convenience
        
        if sketcher == None:
        	logging.info('comparing ' + util.convDecToBase(string._long(user.user_id),62) + " to " + userIDasString)
        	if util.convDecToBase(string._long(user.user_id),62) != userIDasString:
        		logging.info("no sketcher found - returning an empty record")
        		sketcher = Sketcher()
        		# we are not creating a record here, we can populate this data
        		# with funny data :-)
        		sketcher.name = "No profile for this user yet :-("
        		sketcher.profileText = "nothing"
        		sketcher.url1 = "nada"
        		sketcher.url2 = "nisba"
        		sketcher.url3 = "zilch"
        		sketcher.url4 = "zip"
        		sketcher.location = "so sad!"
        	else:
        		logging.info("user is checking his profile and it's empty")
        		logging.info("quick, let's create one!")
        		sketcher = Sketcher()
        		sketcher.userID = userIDasString
        		sketcher.name = user.nickname
        		sketcher.profileText = ""
        		sketcher.url1 = ""
        		sketcher.url2 = ""
        		sketcher.url3 = ""
        		sketcher.url4 = ""
        		sketcher.put()

        # the table we fetch the thumbnails from depends on whether the author is looking
        # at his own page. In that case, we show all the sketches from the MySketchesSketch table
        # which includes private sketches too.
        # Otherwise if the user is looking at the profile of someone else
        # then we only show the public sketches in the AuthorSketchesSketch table.
        if util.convDecToBase(string._long(user.user_id),62) != userIDasString:
        	logging.info('user is looking at someone else\'s sketches, showing only public sketches from AuthorSketchesSketch table')
        	bookmark = Key.from_path('AuthorSketchesSketch',"-"+ ('%023d' % (util.toBase10(userIDasString,62))) + '00000000000000000000')        	
        	endKey =  Key.from_path('AuthorSketchesSketch','-%023d' % (int(util.toBase10(userIDasString,62)) + 1) + '00000000000000000000')
        	logging.info('starting key  ' + str(bookmark))
        	logging.info('end key  ' + str(endKey))
        	q = db.GqlQuery("SELECT * FROM AuthorSketchesSketch WHERE __key__ >= :1 AND __key__ < :2",bookmark,endKey)
        else:
        	logging.info('user is looking at his own sketches, showing private and public sketches from MySketchesSketch table')
        	bookmark = Key.from_path('MySketchesSketch','-%023d' % (int(user.user_id)) + 'sketch00000000000000000000')
        	endKey =  Key.from_path('MySketchesSketch','-%023d' % (int(user.user_id) + 1) + 'sketch00000000000000000000')
        	logging.info('starting key  ' + str(bookmark))
        	logging.info('end key  ' + str(endKey))
        	q = db.GqlQuery("SELECT * FROM MySketchesSketch WHERE __key__ >= :1 AND __key__ < :2",bookmark,endKey)
        
        sketches = q.fetch(PAGESIZE+1)
        
        # if there are more sketches than the ones shown here, we show a "more" link
        # that links to the mySketches page
        if len(sketches) == PAGESIZE + 1:
        	next = "yes"
        else:
        	next = ""

        for sketch in sketches:
        	sketch.stringtags = util.shorten(" ".join(sketch.tags),18)
			
        template_values = {
          'sketches':sketches,
          'bookmark':bookmark,
          'next':next,
          'action':"gallery",
          'headerTitle':"Gallery",
          'name':sketcher.name,
          'profileText':sketcher.profileText,
          'location':sketcher.location,
          'url1':sketcher.url1,
          'url2':sketcher.url2,
          'url3':sketcher.url3,
          'url4':sketcher.url4,
          'user_nick_and_id':id,
          'userNickname':sketcher.name,
          'user_id':util.toBase10(sketcher.userID,62),
          'userIDasString':userIDasString
          }
        self.generate('profileTemplate.html',template_values)
        
class showProfileEdit(BaseRequestHandler):
  def get(self):
        next = None
        PAGESIZE = 24

        util.insertUsersideCookies(self)

        self.session = True
        user = UserInfo()
        user.whoIs(self)
        
        if user.nickname == None:
          logging.info("not logged in so redirecting")
          self.redirect("/")
          return
        
        # we try to fetch the profile record of the user
        # the record might not be there if the user visits his edit profile page without having ever seen his
        # profile page. Which is really rare, it should't happen, but we cover all the corners
        query = db.GqlQuery("SELECT * FROM Sketcher WHERE userID = :1", util.convDecToBase(string._long(user.user_id),62))
        sketcher = query.get();


        # if there is no profile record we create one. Again, this really shouldn't happen in
        # practice
        if (sketcher == None):
          logging.info("Creating new empty sketcher")
          sketcher = Sketcher()
          sketcher.name = user.nickname
          sketcher.profileText = ""
          sketcher.url1 = ""
          sketcher.url2 = ""
          sketcher.url3 = ""
          sketcher.url4 = ""

        sketcher.profileText = sketcher.profileText.replace('&nbsp;',' ')
        sketcher.profileText = sketcher.profileText.replace('<br>','\r\n')
        sketcher.profileText = sketcher.profileText.replace('<br>','\n')
        sketcher.profileText = sketcher.profileText.replace('<br>','\r')
        sketcher.profileText = sketcher.profileText.replace('&nbsp;&nbsp;&nbsp;&nbsp;','\t')

        template_values = {
          'action':"gallery",
          'headerTitle':"Gallery",
          'name':sketcher.name,
          'profileText':sketcher.profileText,
          'location':sketcher.location,
          'url1':sketcher.url1,
          'url2':sketcher.url2,
          'url3':sketcher.url3,
          'url4':sketcher.url4,
          'userNickname':user.nickname,
          'userIDasString':util.convDecToBase(string._long(user.user_id),62)
          }
        self.generate('profileEditTemplate.html',template_values)
        
  def post(self):
    util.insertUsersideCookies(self)

    self.session = True
    user = UserInfo()
    user.whoIs(self)
    
    if user == None:
      logging.info("not logged in so redirecting")
      self.redirect("/")
      return
      
    logging.info("Saving profile for: " + user.user_id)
    
    query = db.GqlQuery("SELECT * FROM Sketcher WHERE userID = :1", util.convDecToBase(string._long(user.user_id),62))
    if query.count() > 0:
      logging.info("found existing profile for user")
      sketcher = query.get();
    else:
      sketcher = Sketcher()
      
    sketcher.userID = util.convDecToBase(string._long(user.user_id),62)
    sketcher.name = self.request.get('title_input')
    sketcher.profileText = self.request.get('text_input')
    sketcher.url1 = self.request.get('url1_input')
    sketcher.url2 = self.request.get('url2_input')
    sketcher.url3 = self.request.get('url3_input')
    sketcher.url4 = self.request.get('url4_input')

    sketcher.profileText = sketcher.profileText.replace('&','&amp;')
    sketcher.profileText = sketcher.profileText.replace('<','&lt;')
    sketcher.profileText = sketcher.profileText.replace(' ','&nbsp;')
    sketcher.profileText = sketcher.profileText.replace('\r\n','<br>')
    sketcher.profileText = sketcher.profileText.replace('\n','<br>')
    sketcher.profileText = sketcher.profileText.replace('\r','<br>')
    sketcher.profileText = sketcher.profileText.replace('\t','&nbsp;&nbsp;&nbsp;&nbsp;')
    sketcher.profileText = sketcher.profileText.replace('"','&quot;')
    sketcher.profileText = sketcher.profileText.replace("'", '&#39;')


    #sketcher.avatar = db.Blob(self.request.get("avatarPic"))
    if self.request.get("avatarPic") != "":
    	avatarPic = images.Image(self.request.get("avatarPic"))
    	
    	originalWidth = avatarPic.width
    	originalHeight = avatarPic.height
    	logging.info('originalWidth: ' + str(originalWidth))
    	logging.info('originalHeigth: ' + str(originalHeight))
    	logging.info('difference: ' + str(originalWidth - originalHeight))
    	logging.info('proportion of difference: ' + str(float(originalWidth - originalHeight)/float(originalWidth)))
    	logging.info('going to crop this way: ' + str((float(originalWidth - originalHeight)/float(originalWidth))/2.0) + " ,0.0, "+ str(1.0-(float(originalWidth - originalHeight)/float(originalWidth))/2.0) + " , 1.0")
    	
    	if originalWidth > originalHeight:
    		# if the image is wider than tall, then we cut away the two sides of the image so we make it square
    		avatarPic.crop((float(originalWidth - originalHeight)/float(originalWidth))/2.0,0.0,1-(float(originalWidth - originalHeight)/float(originalWidth))/2.0,1.0);
    	
    	elif originalWidth < originalHeight:
    		# if the image is taller than wide, then we cut away top and bottom of the image so we make it square
    		avatarPic.crop(0.0,(float(originalHeight - originalWidth)/float(originalHeight))/2.0,1.0,1-(float(originalHeight - originalWidth)/float(originalHeight))/2.0);
    		
    	squareSideSize = min(originalWidth,originalHeight)
    	
    	# we resize the image only if it's too big
    	# if it's too small we resize it to its own dimensions. This is a dirty
    	# trick so that we do at least one transformation and can invoke
    	# execute_transforms and convert the image to png without getting errors.
    	# The reason is that I want to make sure that all images in the database
    	# are proper .png files and if I don't do at least one transformation I get
    	# an error when invoking "execute_transforms"
    	if squareSideSize > 200:
    		avatarPic.resize(200,200);
    	else:
    		avatarPic.resize(squareSideSize,squareSideSize);


    	# this is because square iages smaller than 200px undergo no transformations, and I get
    	# an error if I invoke "execute_transforms" with no transformations in the pipeline
    	sketcher.avatar = db.Blob(avatarPic.execute_transforms(output_encoding=images.PNG))
    
    sketcher.put()
    
    logging.info('title: ' + self.request.get('title_input'))
    logging.info('text: ' + self.request.get('text_input'))
    logging.info('url1: ' + self.request.get('url1_input'))
    logging.info('url2: ' + self.request.get('url2_input'))
    logging.info('url3: ' + self.request.get('url3_input'))
    logging.info('url4: ' + self.request.get('url4_input'))
    self.redirect("/myPage/" + user.nickname + "-" + util.convDecToBase(string._long(user.user_id),62))

class avatarImage(BaseRequestHandler):
  def get(self, id):
    logging.info("avatar image handler: id from URL: " + id)
    userIDasString = id.replace('.png','')
    userIDasString = userIDasString.partition('-')[2]
    logging.info('most weird: sometimes this ends with justcorners.js : ' + userIDasString)
    userIDasString = userIDasString.partition('/')[0]
    
    query = db.GqlQuery("SELECT * FROM Sketcher WHERE userID = :1", userIDasString)
    logging.info(query.count())
    sketcher = query.get();
    
    # if there is no profile record for this userid
    # or if there is a record but the avatar image is empty
    # then redirect to the no avatar image
    if sketcher == None or sketcher.avatar=="" or sketcher.avatar==None:
      logging.info('got no avatar image, redirecting to default no avatar image')
      self.redirect('/imgs/noAvatar.png')
    else:
      logging.info('got avatar image')
      self.response.headers['Content-Type'] = "image/png"
      self.response.out.write(sketcher.avatar)


class showMySketches(BaseRequestHandler):

  def get(self):
        next = None
        PAGESIZE = 30

        util.insertUsersideCookies(self)

        self.session = True
        user = UserInfo()
        user.whoIs(self)

        bookmark = self.request.get("bookmark")
        if bookmark:
        	bookmark = Key(self.request.get("bookmark"))
        else:
        	if user.user:
        		bookmark = Key.from_path('MySketchesSketch','-%023d' % (int(user.user_id)) + 'sketch00000000000000000000')
        	else:
        		bookmark = Key.from_path('MySketchesSketch','-%023d' % (0) + 'sketch00000000000000000000')

        if user.user:
        	endKey =  Key.from_path('MySketchesSketch','-%023d' % (int(user.user_id) + 1) + 'sketch00000000000000000000')
        else:
        	endKey =  Key.from_path('MySketchesSketch','-%023d' % (1) + 'sketch00000000000000000000')
        
        logging.info('starting key  ' + str(bookmark))
        logging.info('starting key  name' + bookmark.name())

        

        q = db.GqlQuery("SELECT * FROM MySketchesSketch WHERE __key__ >= :1 AND __key__ < :2",bookmark,endKey)

        sketches = q.fetch(PAGESIZE+1)
        if len(sketches) == PAGESIZE + 1:
        	next = str(sketches[-1].key())
        	sketches = sketches[:PAGESIZE]
        	logging.info('next key  ' + next)
        	logging.info('next key name ' + sketches[-1].key().name())
        
        if next is None:
        	next = ""

        for sketch in sketches:
        	sketch.stringtags = util.shorten(" ".join(sketch.tags),18)
			
        template_values = {
          'sketches':sketches,
          'bookmark':bookmark,
          'next':next,
          'action':"mySketches",
          'headerTitle':"My sketches",
          }
        self.generate('galleryTemplate.html',template_values)

class showSketchesByUploader(BaseRequestHandler):

  def get(self,originaluserIDasString):
        next = None
        PAGESIZE = 30

        util.insertUsersideCookies(self)

        # we get it in the form davidedc-2jaidlbSQRSE and we only want 2jaidlbSQRSE
        userIDasString = originaluserIDasString.partition('-')[2]
        logging.info('most weird: sometimes this ends with justcorners.js : ' + userIDasString)
        userIDasString = userIDasString.partition('/')[0]
        
        if userIDasString != "anonymous":
        	userIDasString = '%023d' % (util.toBase10(userIDasString,62))
        	logging.info('coverting to 23 digits: ' + userIDasString)
        	logging.info('after cleanup, query starts from ' + "-"+userIDasString + '00000000000000000000')
        	logging.info('query ends at ' + '-%023d' % (int(userIDasString) + 1) + '00000000000000000000')
        else:
        	userIDasString = '%023d' % (0)
        	logging.info('searching for anonymous sketches, user id is 23 zeroes')

        self.session = True
        user = UserInfo()
        user.whoIs(self)

		# we'll be using this variable later and it better not be null
        if user.user_id == None:
        	user.user_id = "0";
			
        logging.info('comparing ' + ('%023d' % int(user.user_id)) + " to " + userIDasString)
        if ('%023d' % int(user.user_id)) != userIDasString:
        	logging.info('user is looking at someone else\'s sketches, showing only public sketches from AuthorSketchesSketch table')
        	bookmark = self.request.get("bookmark")
        	if self.request.get("bookmark"):
        		bookmark = Key(self.request.get("bookmark"))
        	else:
        		bookmark = Key.from_path('AuthorSketchesSketch',"-"+userIDasString + '00000000000000000000')
        	endKey =  Key.from_path('AuthorSketchesSketch','-%023d' % (int(userIDasString) + 1) + '00000000000000000000')
        	q = db.GqlQuery("SELECT * FROM AuthorSketchesSketch WHERE __key__ >= :1 AND __key__ < :2",bookmark,endKey)
        else:
        	logging.info('user is looking at his own sketches, showing private and public sketches from MySketchesSketch table')
        	if self.request.get("bookmark"):
        		bookmark = Key(self.request.get("bookmark"))
        	else:
        		bookmark = Key.from_path('MySketchesSketch','-%023d' % (int(user.user_id)) + 'sketch00000000000000000000')
        	endKey =  Key.from_path('MySketchesSketch','-%023d' % (int(user.user_id) + 1) + 'sketch00000000000000000000')
        	q = db.GqlQuery("SELECT * FROM MySketchesSketch WHERE __key__ >= :1 AND __key__ < :2",bookmark,endKey)


        logging.info('starting key  ' + str(bookmark))
        logging.info('end key  ' + str(endKey))


        sketches = q.fetch(PAGESIZE+1)
        logging.info('number of sketches found: ' + str(len(sketches)))
        if len(sketches) == PAGESIZE + 1:
        	next = str(sketches[-1].key())
        	sketches = sketches[:PAGESIZE]
        
        if next is None:
        	next = ""

        for sketch in sketches:
        	sketch.stringtags = util.shorten(" ".join(sketch.tags),18)
			
        template_values = {
          'sketches':sketches,
          'bookmark':bookmark,
          'next':next,
          'action':"sketchesByUploader",
          'userIDasString':originaluserIDasString,
          'headerTitle':"By submitter",
          }
        self.generate('galleryTemplate.html',template_values)

class showFrontPage(BaseRequestHandler):

  def get(self):

        util.insertUsersideCookies(self)
        
        q = db.GqlQuery("SELECT * FROM GallerySketch")
        sketches = q.fetch(28)

        counter = 28
        for sketch in sketches:
        	sketch.stringtags = util.shorten(" ".join(sketch.tags),18)
        	sketch.counter = counter
        	counter = counter + 1
			
        template_values = {
          'sketches':sketches,
          }
        self.generate('frontPageTemplate.html',template_values)

class showFrontPageNEW(BaseRequestHandler):

  def get(self):

        util.insertUsersideCookies(self)
        
        q = db.GqlQuery("SELECT * FROM GallerySketch")
        sketches = q.fetch(28)

        counter = 28
        for sketch in sketches:
        	sketch.stringtags = util.shorten(" ".join(sketch.tags),18)
        	sketch.counter = counter
        	counter = counter + 1
			
        template_values = {
          'sketches':sketches,
          }
        self.generate('frontPageTemplateNEW.html',template_values)



class showFrontPageSKELETAL(BaseRequestHandler):

  def get(self):

        util.insertUsersideCookies(self)
        
        q = db.GqlQuery("SELECT * FROM GallerySketch")
        sketches = q.fetch(28)

        counter = 28
        for sketch in sketches:
        	sketch.stringtags = util.shorten(" ".join(sketch.tags),18)
        	sketch.counter = counter
        	counter = counter + 1
			
        template_values = {
          'sketches':sketches,
          }
        self.generate('frontPageTemplateSKELETAL.html',template_values)
