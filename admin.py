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
import random
import Cookie

from xml.etree import ElementTree

from google.appengine.ext.webapp import template
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext import db
from google.appengine.api import memcache

from model import Weblog,WeblogReactions,Tag,CPediaLog
import authorized
import view
import util

# session library for when we override the true user identity, we store
# the fake one in session
from appengine_utilities.sessions import Session


class UserTrick(db.Model):
	user = db.UserProperty(required=True)


class BaseRequestHandler(webapp.RequestHandler):
  def generate(self, template_name, template_values={}):
    values = {
      'request': self.request,
    }
    values.update(template_values)
    directory = os.path.dirname(__file__)
    view.ViewPage(cache_time=0).render(self, template_name,values)

class MainPage(BaseRequestHandler):
  @authorized.role('admin')
  def get(self):
  
        if not authorized.checkIfUserIsInWhiteList():
        	self.redirect(authorized.getLoginPage())

        template_values = {
          }
        self.generate('admin_main.html',template_values)


class AdminCachePage(BaseRequestHandler):
  @authorized.role('admin')
  def get(self):

        if not authorized.checkIfUserIsInWhiteList():
        	self.redirect(authorized.getLoginPage())

        cache_stats = memcache.get_stats()
        template_values = {
          'cache_stats':cache_stats,
          }
        self.generate('admin/admin_cache.html',template_values)


class AdminSystemPage(BaseRequestHandler):
  @authorized.role('admin')
  def get(self):

        if not authorized.checkIfUserIsInWhiteList():
        	self.redirect(authorized.getLoginPage())

        template_values = {
          }
        self.generate('admin/admin_system.html',template_values)

  @authorized.role('admin')
  def post(self):

        if not authorized.checkIfUserIsInWhiteList():
        	self.redirect(authorized.getLoginPage())

        cpedialog = util.getCPedialog()
        cpedialog.title = self.request.get("title")
        cpedialog.author = self.request.get("author")
        cpedialog.email = users.GetCurrentUser().email()
        cpedialog.root_url = self.request.get("root_url")
        if(int(self.request.get("num_post_per_page"))!=cpedialog.num_post_per_page):
            cpedialog.num_post_per_page = int(self.request.get("num_post_per_page"))
            util.flushBlogPagesCache()        
        cpedialog.cache_time = int(self.request.get("cache_time"))
        if self.request.get("debug"):
            cpedialog.debug = True
        else:
            cpedialog.debug = False
        cpedialog.host_ip = self.request.remote_addr
        cpedialog.host_domain = self.request.get("SERVER_NAME")

        cpedialog.put()
        util.flushCPedialog()
        return True

        
class AdminPagesPage(BaseRequestHandler):
  @authorized.role('admin')
  def get(self):

        if not authorized.checkIfUserIsInWhiteList():
        	self.redirect(authorized.getLoginPage())

        pages = Weblog.all().filter('entrytype','page').order('-date')
        template_values = {
            'pages':pages,
          }
        self.generate('admin/admin_pages.html',template_values)



class AdminTagsPage(BaseRequestHandler):
  @authorized.role('admin')
  def get(self):

        if not authorized.checkIfUserIsInWhiteList():
        	self.redirect(authorized.getLoginPage())

        tags = Tag.all().order('-entrycount')
        template_values = {
           'tags':tags,
          }
        self.generate('admin/admin_tags.html',template_values)

class UserIdPage(BaseRequestHandler):

  @authorized.role('admin')
  def get(self):

        if not authorized.checkIfUserIsInWhiteList():
        	self.redirect(authorized.getLoginPage())

        self.session = True
        
        self.response.out.write('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">')
        self.response.out.write('<html lang="en-US" xml:lang="en-US" xmlns="http://www.w3.org/1999/xhtml">')
        self.response.out.write('<head>')
        self.response.out.write('<title>Change identity</title>')
        self.response.out.write('</head>')

        self.response.out.write('<script type="text/javascript">')
        self.response.out.write('function deleteCookie(name){')
        self.response.out.write('document.cookie = name +')
        self.response.out.write('\'=; expires=Thu, 01-Jan-70 00:00:01 GMT;path=/\';')
        self.response.out.write('} ')

        self.response.out.write('function deleteClientSideUserInfoCookies(){')
        self.response.out.write('	alert(\'clearing live cookies\');')
        self.response.out.write('	deleteCookie(\'user.user_id\');')
        self.response.out.write('	deleteCookie(\'user.is_current_user_admin\');')
        self.response.out.write('	deleteCookie(\'user.user\');')
        self.response.out.write('	deleteCookie(\'user.nickname\');')
        self.response.out.write('	deleteCookie(\'firstLogin\');')
        self.response.out.write('} ')

        self.response.out.write('</script>')


        self.response.out.write('<body>')
        self.response.out.write('<b>Real identity</b>')

        user = users.get_current_user()
        self.response.out.write('<br>Your real user_id: ' + user.user_id())
        self.response.out.write('<br>Your real email: ' + user.email())
        self.response.out.write('<br>Your real nickname: ' + user.nickname())
        self.response.out.write('<br>Your real is_current_user_admin: ' + str(users.is_current_user_admin()))

        '''       
        self.response.out.write('<hr>')
        self.response.out.write('<b>Last user info update</b>')

        self.response.out.write('<br>You posted this user_id: ' + self.request.get('user_id'))
        self.response.out.write('<br>You posted this email: ' + self.request.get('email'))
        self.response.out.write('<br>You posted this nickname: ' + self.request.get('nickname'))
        self.response.out.write('<br>You posted this is_current_user_admin: ' + self.request.get('is_current_user_admin'))
        '''

        #self.response.out.write('<hr>')
        #self.response.out.write('<b>Info on session update</b>')
        '''
        # first, if any parameters are sent, we create the session, or we catch the previous one
        if self.request.get('is_current_user_admin') != "" or self.request.get('user_id') != "" or self.request.get('email') != "" or self.request.get('nickname') != "":
        	if sess.is_new():
                        #self.response.out.write('<br>New session - setting counter to 0.<br>')
                        sess['myCounter']=0
        	else:
                        #self.response.out.write('<br>Modifying the current session<br>')
                        sess['myCounter']+=1
                        self.response.out.write('<br>Session counter is ' + str(sess['myCounter']) + '<br>')
        '''
        # second, if anything changed, we modify the session
        if self.request.get('user') != "":
        	#self.response.out.write('user not empy - setting it in session <br>')
        	self.session['user'] = self.request.get('user')
        if self.request.get('user_id') != "":
        	#self.response.out.write('user_id not empy - setting it in session <br>')
        	self.session['user_id'] = self.request.get('user_id')

        if self.request.get('email') != "":
        	#self.response.out.write('email not empy - setting it in session <br>')
        	self.session['email'] = self.request.get('email')

        if self.request.get('nickname') != "":
        	#self.response.out.write('nickname not empy - setting it in session <br>')
        	self.session['nickname'] = self.request.get('nickname')

        if self.request.get('is_current_user_admin') != "":
        	#self.response.out.write('is_current_user_admin not empy - setting it in session <br>')
        	self.session['is_current_user_admin'] = self.request.get('is_current_user_admin')

        if self.request.get('clear') != "" :
        	self.session.delete()
        	self.session = None
        	logging.info('invalidated the session')

        '''
        self.response.out.write('<hr>')
        self.response.out.write('<b>Session info</b>')

        if not self.session:
        	self.response.out.write('<br><br>no session')
        else:
        	try:
        		self.response.out.write('<br>user in session: ' + self.session['user'] )
        	except KeyError:
        		self.response.out.write('<br>No user in session ')
        	try:
        		self.response.out.write('<br>user_id in session: ' + self.session['user_id'] )
        	except KeyError:
        		self.response.out.write('<br>No user_id in session ')
        	try:
        		self.response.out.write('<br>email in session: ' + self.session['email'] )
        	except KeyError:
        		self.response.out.write('<br>No email in session ')
        	try:
        		self.response.out.write('<br>nickname in session: ' + self.session['nickname'] )
        	except KeyError:
        		self.response.out.write('<br>No nickname in session ')
        	try:
        		self.response.out.write('<br>is_current_user_admin in session: ' + str(self.session['is_current_user_admin'] == 'True') )
        	except KeyError:
        		self.response.out.write('<br>No is_current_user_admin in session ')

        '''
        
        self.response.out.write('<hr>')
        self.response.out.write('<b>Cover Identity</b>')
        user2 = UserInfo()
        user2.whoIs(self)
        self.response.out.write('<br>Your UserInfo user (as string): ' + str(user2.user))
        self.response.out.write('<br>Your UserInfo user_id: ' + str(user2.user_id))
        self.response.out.write('<br>Your UserInfo email: ' + str(user2.email))
        self.response.out.write('<br>Your UserInfo nickname: ' + str(user2.nickname))
        self.response.out.write('<br>Your UserInfo is_current_user_admin: ' + str(user2.is_current_user_admin))

        impersonatedUser = users.User(str(user2.email))
        if impersonatedUser is not None:
        	key = UserTrick(user=impersonatedUser).put()
        	obj = UserTrick.get(key)
        	self.response.out.write('<hr>')
        	self.response.out.write('<b>Full identity of user with this email</b>')
        	self.response.out.write('<br>Your real user_id: ' + str(obj.user.user_id()))
        	self.response.out.write('<br>Your real email: ' + obj.user.email())
        	self.response.out.write('<br>Your real nickname: ' + obj.user.nickname())
        

        self.response.out.write('<hr>')
        self.response.out.write('<b>Overwrite any part of your identity (blanks will stay the same)</b>')
        self.response.out.write('<br><br><form name="input" action="." method="get">')
        self.response.out.write('user:<input type="user" name="user" />')
        self.response.out.write('user_id:<input type="user_id" name="user_id" />')
        self.response.out.write('email:<input type="email" name="email" />')
        self.response.out.write('nickname:<input type="nickname" name="nickname" />')
        self.response.out.write('is_current_user_admin:<input type="is_current_user_admin" name="is_current_user_admin" />')
        self.response.out.write('<input type="submit" value="Submit" onClick="deleteClientSideUserInfoCookies();"/>')
        self.response.out.write('</form>')
        
        self.response.out.write('<hr>')
                
        self.response.out.write('<br><a href="/admin/userid/">Refresh page</a> ')
        self.response.out.write('<br><a href="/admin/userid/?clear=y" onClick="deleteClientSideUserInfoCookies();">Return to original identity</a> ')
        self.response.out.write('<br><a href="/admin/userid/?user=None&user_id=None&email=None&nickname=None&is_current_user_admin=None" onClick="deleteClientSideUserInfoCookies();">Make anonymous (all None)</a> ')
        self.response.out.write('<br><a href="#" onClick="deleteClientSideUserInfoCookies();">clean the "live" cookies</a> (these are used in the live environment so that the client can render the effects of the permissions on its own so that we can keep one and only page in the cache, not one for each user!)')
        self.response.out.write('<br><br><a href="/index.html">Back to home page</a> ')

        # for formatting, see http://www.network-theory.co.uk/docs/pytut/FancierOutputFormatting.html
        # for python date and time operations see http://docs.python.org/library/datetime.html
        # for controlling keys in GAE datastore see: http://code.google.com/appengine/docs/python/datastore/keysandentitygroups.html
        self.response.out.write('<hr>')
        self.response.out.write('<b>Tests with date and time objects to create the sketch key</b><br>')
        d = datetime.date(2028, 7, 3) # third of July 2028. I would be 50 on that day 
        t = datetime.time(12, 30)
        refdate = datetime.datetime.combine(d, t)


        difference =  refdate - datetime.datetime.now() 
                
        self.response.out.write('<br>difference between now and 3rd July 2028: ' + str(difference))
        self.response.out.write('<br>i.e. ' + str(difference.days) + ' days and ' + str(difference.seconds) + ' seconds and ' + str(difference.microseconds) + ' microseconds')
        self.response.out.write('<br>compactly and with a random number: %04d %05d %06d %05d' % (difference.days, difference.seconds, difference.microseconds, random.random()*100000) )
        self.response.out.write('<br>key I will use: %04d%05d%06d%05d' % (difference.days, difference.seconds, difference.microseconds, random.random()*100000) )

        self.response.out.write('<hr>')
        self.response.out.write('<b>Tests with stringification of userID</b><br>')
        if user2.user_id is None:
        	self.response.out.write('<br>your are marked to be anonymous, so this doesnt apply to you')
        else:
        	self.response.out.write('<br>your userid: ' + user2.user_id)
        	self.response.out.write('<br>converted to base 62: ' + util.convDecToBase(string._long(user2.user_id),62))
        	self.response.out.write('<br>back to base 10: ' + str(util.toBase10(util.convDecToBase(string._long(user2.user_id),62), 62)))

        self.response.out.write('</body>')
        self.response.out.write('</html>')

class UserInfo():
  email = ""
  user_id = ""
  string_user_id = ""
  nickname = ""
  is_current_user_admin = False
  user = None
  sess = None
  # group logins are where we know that many people will want to login
  # at the same time and we want to provide the same login to everyone
  # in that case we don't use the google login mechanism cause
  # it would be far too difficult
  is_group_login = False

  """
  def __init__(self,thesession):
        self.sess = thesession
  """
  
  """
  def whoIs(self):
        self.user = users.get_current_user()
        if not self.sess:
        
        		if self.user: self.user_id = self.user.user_id()
        		else: self.user_id = None
        		
        		if self.user: self.string_user_id = str(util.convDecToBase(string._long(self.user_id),62))
        		else: self.string_user_id
        		
        		if self.user: self.email = self.user.email()
        		else: self.email = None
        		
        		if self.user: self.nickname = (self.user.nickname().partition("@"))[0].replace(".","_")
        		else: self.nickname = None
        		
        		if self.user: self.is_current_user_admin = users.is_current_user_admin()
        		else: self.is_current_user_admin = None
        		
        		if self.user: self.user = users.get_current_user()
        		else: self.user = None
        		
        		return
        try:
        	self.user_id = self.sess['user_id']
        	if self.user_id == "None": self.user_id = None
        except KeyError:
        	if self.user:
        		self.user_id = self.user.user_id()
        	else:
        		self.user_id = None
        try:
        	self.string_user_id = self.sess['string_user_id']
        	if self.string_user_id == "None": self.string_user_id = None
        except KeyError:
        	if self.user:
        		if ((self.user_id is None)or(self.user_id == "None")): self.string_user_id = None
        		else: self.string_user_id = str(util.convDecToBase(string._long(self.user_id),62))
        	else:
        		self.string_user_id = None
        try:
        	self.email = self.sess['email']
        	if self.email == "None": self.email = None
        except KeyError:
        	if self.user:
        		self.email = self.user.email()
        	else:
        		self.email = '1@2.3'
        try:
        	self.nickname = self.sess['nickname']
        	if self.nickname == "None": self.nickname = None
        except KeyError:
        	if self.user:
        		self.nickname = (self.user.nickname().partition("@"))[0].replace(".","_")
        	else:
        		self.nickname = 'anonymous'
        try:
        	self.is_current_user_admin = (self.sess['is_current_user_admin']=='True')
        	if self.sess['is_current_user_admin'] == "None": self.is_current_user_admin = None
        except KeyError:
        	if self.user:
        		self.is_current_user_admin = users.is_current_user_admin()
        	else:
        		self.is_current_user_admin = False
        try:
        	self.user = self.sess['user']
        	if self.user == "None": self.user = None
        except KeyError:
        	self.user = users.get_current_user()

  """

  #
  def whoIs(self,requester):
        		
        		logging.info('whois function started')
        		if requester != None:
        			logging.info('requester is not none')
        			c = Cookie.SimpleCookie(requester.request.headers.get('Cookie'))
        			logging.info('got the cookie')
        			
        			"""
        			if "groupLoginCode" in c.keys():
        				logging.info('groupLoginCode is one of the cookies and it is: ' + c["groupLoginCode"].value)
        				if c["groupLoginCode"].value == "xxxx":
        					logging.info('...and it is True')
        					self.user = users.User("RaveJuly2011Group1@fakeEmail.com")
        					self.user_id = "12345678901234567890154"
        					self.string_user_id = str(util.convDecToBase(string._long(self.user_id),62))
        					self.email = "RaveJuly2011Group1@fakeEmail.com"
        					self.nickname = "RaveJuly2011Group1"
        					self.is_current_user_admin = None
        					return
        				if c["groupLoginCode"].value == "xxxx":
        					logging.info('...and it is True')
        					self.user = users.User("RaveJuly2011Group2@fakeEmail.com")
        					self.user_id = "12345678901234567890155"
        					self.string_user_id = str(util.convDecToBase(string._long(self.user_id),62))
        					self.email = "RaveJuly2011Group2@fakeEmail.com"
        					self.nickname = "RaveJuly2011Group2"
        					self.is_current_user_admin = None
        					return
        				if c["groupLoginCode"].value == "xxxx":
        					logging.info('...and it is True')
        					self.user = users.User("RaveJuly2011Group3@fakeEmail.com")
        					self.user_id = "12345678901234567890156"
        					self.string_user_id = str(util.convDecToBase(string._long(self.user_id),62))
        					self.email = "RaveJuly2011Group3@fakeEmail.com"
        					self.nickname = "RaveJuly2011Group3"
        					self.is_current_user_admin = None
        					return
        				if c["groupLoginCode"].value == "xxxx":
        					logging.info('...and it is True')
        					self.user = users.User("RaveJuly2011Group4@fakeEmail.com")
        					self.user_id = "12345678901234567890157"
        					self.string_user_id = str(util.convDecToBase(string._long(self.user_id),62))
        					self.email = "RaveJuly2011Group4@fakeEmail.com"
        					self.nickname = "RaveJuly2011Group4"
        					self.is_current_user_admin = None
        					return
        				if c["groupLoginCode"].value == "xxxx":
        					logging.info('...and it is True')
        					self.user = users.User("RaveJuly2011Group5@fakeEmail.com")
        					self.user_id = "12345678901234567890158"
        					self.string_user_id = str(util.convDecToBase(string._long(self.user_id),62))
        					self.email = "RaveJuly2011Group5@fakeEmail.com"
        					self.nickname = "RaveJuly2011Group5"
        					self.is_current_user_admin = None
        					return
        			"""

        		
        		
        		
        		# in this case, we give the user session plain and simple
        		self.user = users.get_current_user()
        		
        		if self.user: self.user_id = self.user.user_id()
        		else: self.user_id = None
        		
        		if self.user: self.string_user_id = str(util.convDecToBase(string._long(self.user_id),62))
        		else: self.string_user_id
        		
        		if self.user: self.email = self.user.email()
        		else: self.email = None
        		
        		if self.user: self.nickname = (self.user.nickname().partition("@"))[0].replace(".","_")
        		else: self.nickname = None
        		
        		if self.user: self.is_current_user_admin = users.is_current_user_admin()
        		else: self.is_current_user_admin = None
        		
        		if self.user: self.user = users.get_current_user()
        		else: self.user = None
        		
        		return

  #

'''
        
class noThumbnailImageUpload(BaseRequestHandler):

  @authorized.role('admin')
  def get(self):

        if not authorized.checkIfUserIsInWhiteList():
        	self.redirect(authorized.getLoginPage())

        self.session = True

        self.response.out.write('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">')
        self.response.out.write('<html lang="en-US" xml:lang="en-US" xmlns="http://www.w3.org/1999/xhtml">')
        self.response.out.write('<head>')
        self.response.out.write('<title>no Thumbnail Image Upload</title>')
        self.response.out.write('</head>')
        self.response.out.write('<body>')
        self.response.out.write('<b>Upload the "no thumbnail" thumbnail<br>')
        self.response.out.write("""
          <form action="." enctype="multipart/form-data" method="post">
            <div><label>Message:</label></div>
            <div><textarea name="content" rows="3" cols="60"></textarea></div>
            <div><label>Avatar:</label></div>
            <div><input type="file" name="img"/></div>
            <div><input type="submit" value="Sign Guestbook"></div>
          </form>
        </body>
      </html>""")
      

  @authorized.role('admin')
  def post(self):

    if not authorized.checkIfUserIsInWhiteList():
        	self.redirect(authorized.getLoginPage())

    greeting = Greeting()
    if users.get_current_user():
      greeting.author = users.get_current_user()

    myModels = db.GqlQuery("SELECT * FROM Greeting")
    for myModel in myModels:
     self.response.headers['Content-Type'] = "image/png"
     self.response.out.write(myModel.avatar)
     checkNoThumbnailImageUpload

    greeting.content = self.request.get("content")
    avatar = self.request.get("img")
    greeting.avatar = db.Blob(avatar)
    greeting.put()
     
    self.redirect('/checkNoThumbnailImageUpload/')
    
class checkNoThumbnailImageUpload(BaseRequestHandler):

  @authorized.role('admin')
  def get(self):

    if not authorized.checkIfUserIsInWhiteList():
        	self.redirect(authorized.getLoginPage())

    myModels = db.GqlQuery("SELECT * FROM Greeting")

    for myModel in myModels:
     self.response.headers['Content-Type'] = "image/png"
     self.response.out.write(myModel.avatar)
    
    
class Greeting(db.Model):
  avatar = db.BlobProperty()
'''
