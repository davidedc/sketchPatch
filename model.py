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

__author__ = 'Ping Chen, Davide Della Casa, Sophie McDonald'


import pickle

from google.appengine.ext import db
from google.appengine.ext import search
import logging
import datetime
import urllib
import cgi
import random
import string
import util

class Tag(db.Model):
    tag = db.StringProperty(multiline=False)
    entrycount = db.IntegerProperty(default=0)
    valid = db.BooleanProperty(default = True)

class DeletedSketch(db.Model):
    visited = db.BooleanProperty(default = False)
    timestamp = db.DateTimeProperty(auto_now=True)

# this is in order to create a static method in the Sketch class
# that generates its key
# see: http://code.activestate.com/recipes/52304/
# added by ddc
class Callable:
    def __init__(self, anycallable):
        self.__call__ = anycallable

# this is used for the profile page
class Sketcher(db.Model):
  userID = db.StringProperty()
  name = db.StringProperty()
  profileText = db.TextProperty()
  location = db.StringProperty()
  avatar = db.BlobProperty()
  url1 = db.StringProperty()
  url2 = db.StringProperty()
  url3 = db.StringProperty()
  url4 = db.StringProperty()


# the sketch class added by ddc
class Sketch(db.Model):

    timestamp = db.DateTimeProperty(auto_now=True)
    randomID = db.StringProperty()
    title = db.StringProperty()
    sanitizedTitle = db.StringProperty()
    description = db.TextProperty()
    sourceCode = db.TextProperty()
    published = db.BooleanProperty()
    parentSketchRandomID = db.StringProperty()
    oldestParentSketchRandomID = db.StringProperty()

    # author_user = db.UserProperty()
    author_email = db.EmailProperty()
    author_user_id = db.StringProperty()
    author_string_user_id = db.StringProperty() # we calculate this once and store it so we can quickly build the link to the other sketches of this user
    author_nickname = db.StringProperty()

    dateSaved = db.DateTimeProperty(auto_now_add=True)
    tags = db.ListProperty(str)
    parent_idList = db.ListProperty(str)
    parent_nicknamesList = db.ListProperty(str)

    # this function sets the title and a sanitized version of the title too   
    def set_randomID(self):
        self.randomID = ''.join([random.choice(string.letters + string.digits) for i in xrange(11)])
        return self.randomID

    def set_title(self,thetitle):
        # self.title = sanitize.Sanitize(thetitle)
        self.title = util.Sanitize(thetitle)
        self.sanitizedTitle =  util.sanitizeStringWithoutSpaces(thetitle)

    def relative_permalink(self):
        return self.randomID+"/"+self.sanitizedTitle

    def full_permalink(self):
        return '/view/' + self.relative_permalink()

    def get_tags(self):
        '''comma delimted list of tags'''
        return ','.join([urllib.unquote(tag.encode('utf8')) for tag in self.tags])

    def get_parents(self):
        '''comma delimted list of parent user_ids'''
        return ','.join([parent for parent in self.parent_idList])

    def get_parentNicknamesList(self):
        '''comma delimted list of parent nicknames'''
        return ','.join([parent for parent in self.parent_nicknamesList])

    def set_parents(self, parent_idList, parent_nicknamesList):
        if parent_idList:
            parent_idList = parent_idList.replace(',',' ').replace(';',' ').split()

            logging.info('last one entered '+ parent_idList[-1])
            logging.info('all of them '+ ','.join([parent for parent in parent_idList]) )
                        
            try:
            	logging.info('previous: '+ str(parent_idList[0:-1]))
            	if parent_idList[-1] not in parent_idList[0:-1]:
            		# this is if the last contributor is already in the list of contributors
            		self.parent_nicknamesList = parent_nicknamesList.replace(',',' ').replace(';',' ').split()
            		self.parent_idList = parent_idList
            	else:
            		# this is if the last contributor is not a new contributor
            		self.parent_nicknamesList = parent_nicknamesList.replace(',',' ').replace(';',' ').split()[0:-1]
            		self.parent_idList = parent_idList[0:-1]
            except IndexError:
            		# this happens when there are no parents - i.e. you just created a sketch instead of copying it
            		self.parent_nicknamesList = parent_nicknamesList.replace(',',' ').replace(';',' ').split()
            		self.parent_idList = parent_idList

  
    def set_tags(self, tags):
        if tags:
            self.tags = tags.replace(',',' ').replace(';',' ').replace('#',' ').split()
            # self.tags = [db.Category(urllib.quote(tag.strip().encode('utf8'))) for tag in tags.split()]
  
    tags_commas = property(get_tags,set_tags)

    def save(self):
        self.put()

    def update(self):
        self.put()

    def generateKey():
        d = datetime.date(2028, 7, 3) # third of July 2028. I would be 50 on that day 
        t = datetime.time(12, 00)
        refdate = datetime.datetime.combine(d, t)
        difference =  refdate - datetime.datetime.now()                 
        return 'sketch%04d%05d%06d%05d' % (difference.days, difference.seconds, difference.microseconds, random.random()*100000)
    generateKey = Callable(generateKey)

    def get_by_randomID(randomID):
        sketches = db.GqlQuery("select * from Sketch where randomID =:1", randomID).fetch(1)
        if (sketches): return sketches[0]
        else: return None
    get_by_randomID = Callable(get_by_randomID)


# the GallerySketch class added by ddc +smcd
class GallerySketch(db.Model):

    timestamp = db.DateTimeProperty(auto_now=True)
    randomID = db.StringProperty()
    title = db.StringProperty()
    author_nickname = db.StringProperty()
    tags = db.ListProperty(str)
    thumbnail = db.BlobProperty()
    
    def get_tags(self):
        '''comma delimted list of tags'''
        return ','.join([urllib.unquote(tag.encode('utf8')) for tag in self.tags])
  
    def set_tags(self, tags):
        if tags:
            self.tags = tags.replace(',',' ').replace(';',' ').replace('#',' ').split()
            # self.tags = [db.Category(urllib.quote(tag.strip().encode('utf8'))) for tag in tags.split()]
  
    tags_commas = property(get_tags,set_tags)


    def save(self):
        self.put()

# the GallerySketch class added by ddc +smcd
class AuthorSketchesSketch(db.Model):

    timestamp = db.DateTimeProperty(auto_now=True)
    randomID = db.StringProperty()
    title = db.StringProperty()
    # author_nickname = db.StringProperty()
    tags = db.ListProperty(str)
    thumbnail = db.BlobProperty()
    user_id_string = db.StringProperty()
    
    def get_tags(self):
        '''comma delimted list of tags'''
        return ','.join([urllib.unquote(tag.encode('utf8')) for tag in self.tags])
  
    def set_tags(self, tags):
        if tags:
            self.tags = tags.replace(',',' ').replace(';',' ').replace('#',' ').split()
            # self.tags = [db.Category(urllib.quote(tag.strip().encode('utf8'))) for tag in tags.split()]
  
    tags_commas = property(get_tags,set_tags)


    def save(self):
        self.put()

# the MySketchesSketch class added by ddc
class MySketchesSketch(db.Model):

    timestamp = db.DateTimeProperty(auto_now=True)
    randomID = db.StringProperty()
    title = db.StringProperty()
    tags = db.ListProperty(str)
    published = db.BooleanProperty()
    thumbnail = db.BlobProperty()
    user_id_string = db.StringProperty()

    def get_tags(self):
        '''comma delimted list of tags'''
        return ','.join([urllib.unquote(tag.encode('utf8')) for tag in self.tags])
  
    def set_tags(self, tags):
        if tags:
            self.tags = tags.replace(',',' ').replace(';',' ').replace('#',' ').split()
            # self.tags = [db.Category(urllib.quote(tag.strip().encode('utf8'))) for tag in tags.split()]
  
    tags_commas = property(get_tags,set_tags)


    def save(self):
        self.put()

class FullPicture(db.Model):

    timestamp = db.DateTimeProperty(auto_now=True)
    randomID = db.StringProperty()
    fullPicture = db.BlobProperty()

    def save(self):
        self.put()

class Weblog(db.Model):
    permalink = db.StringProperty()
    title = db.StringProperty()
    content = db.TextProperty()

    # added by Davide Della Casa
    sourceCode = db.TextProperty()
    faves = db.IntegerProperty(default=0)
    status = db.StringProperty(multiline=False,default='published',choices=[
        'published','unpublished','deleted'])
    #savedAtLeastOnce = db.BooleanProperty()

    #rather big change in user account management
    #author = db.UserProperty()
    authorEmail = db.EmailProperty()
    #lastModifiedBy = db.UserProperty()
    authorUserId = db.StringProperty()
    authorNickname = db.StringProperty()
    # only the creator or the admin can modify it so no need to keep track
    #lastModifiedBy = db.StringProperty()
    ##############################

    date = db.DateTimeProperty(auto_now_add=True)
    catalog = db.StringProperty()
    lastCommentedDate = db.DateTimeProperty()
    commentcount = db.IntegerProperty(default=0)
    lastModifiedDate = db.DateTimeProperty()
    tags = db.ListProperty(db.Category)
    monthyear = db.StringProperty(multiline=False)
    entrytype = db.StringProperty(multiline=False,default='post',choices=[
        'post','page'])
    _weblogId = db.IntegerProperty()   ##for data migration from the mysql system
    assoc_dict = db.BlobProperty()     # Pickled dict for sidelinks, associated Amazon items, etc.

    def relative_permalink(self):
        if self.entrytype == 'post':
            return self.date.strftime('%Y/%m/')+ self.permalink
        else:
            return self.permalink

    def full_permalink(self):
        if self.entrytype == 'post':
            return '/' + self.date.strftime('%Y/%m/')+ self.permalink
        else:
            return '/'+ self.permalink

    def get_tags(self):
        '''comma delimted list of tags'''
        return ','.join([urllib.unquote(tag.encode('utf8')) for tag in self.tags])
  
    def set_tags(self, tags):
        if tags:
            self.tags = [db.Category(urllib.quote(tag.strip().encode('utf8'))) for tag in tags.split(',')]
  
    tags_commas = property(get_tags,set_tags)

    def save(self):
        my = self.date.strftime('%B %Y') # July 2008
        self.monthyear = my
        self.put()

    def update(self):
        self.put()


class SketchComment(db.Model):
    timestamp = db.DateTimeProperty(auto_now=True)
    body = db.TextProperty()
    randomID = db.StringProperty()

    # author_user = db.UserProperty()
    author_email = db.EmailProperty()
    author_user_id = db.StringProperty()
    author_string_user_id = db.StringProperty() # we calculate this once and store it so we can quickly build the link to the other sketches of this user
    author_nickname = db.StringProperty()

    # we need this for when we make the check of whether we can delete the comment or not   
    # (cause the authors of the sketch can delete any comment on their sketches) 
    # we could do this check on the server side without storing the sketch author in the comment    
    # BUT we can't do the check on the client side without passing a parameter accross three pages... 
    # also, to delete a comment we make a check of whether the user is the owner of the sketch. We could do the
    # check by doing one additional query but this way is quicker.
    sketch_author_user_id = db.StringProperty()

    dateSaved = db.DateTimeProperty(auto_now_add=True)

class WeblogReactions(db.Model):
    weblog = db.ReferenceProperty(Weblog)
    user = db.StringProperty()
    date = db.DateTimeProperty(auto_now_add=True)
    authorUserId = db.StringProperty()
    authorEmail = db.EmailProperty()
    #authorid = db.StringProperty()
    authorWebsite = db.StringProperty()
    userIp = db.StringProperty()
    content = db.TextProperty()
    lastModifiedDate = db.DateTimeProperty()
    # only the owner of the comment can modify it. The owner of the sketch can delete it but not
    # change it
    #lastModifiedBy = db.UserProperty()
    _weblogReactionId = db.IntegerProperty()   ##for data migration from the mysql system

    def save(self):
        self.put()
        if self.weblog is not None:
            self.weblog.lastCommentedDate = self.date
            self.weblog.commentcount += 1
            self.weblog.put()



class CPediaLog(db.Model):
    title = db.StringProperty(multiline=False, default='sketchPatch')
    author = db.StringProperty(multiline=False, default='Your Blog Author')
    email = db.StringProperty(multiline=False, default='')
    description = db.StringProperty(default='')
    root_url = db.StringProperty(multiline=False,default='http://www.sketchpatch.com')
    num_post_per_page = db.IntegerProperty(default=8)
    cache_time = db.IntegerProperty(default=0)
    debug = db.BooleanProperty(default = True)
 
    host_ip = db.StringProperty()
    host_domain = db.StringProperty()
    default = db.BooleanProperty(default = True)
 

