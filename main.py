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

import wsgiref.handlers

from google.appengine.ext import webapp

import blog
import admin
import logging
import util
import thumbnailDownload
import thumbnailUpload
import thumbnailStringDownload
import latestComments
import allComments

from google.appengine.ext.webapp import template
template.register_template_library('cpedia.filter.replace')


def main():
    cpedialog = util.getCPedialog()
    application = webapp.WSGIApplication(
                                       [
                                        ('/thumbnailStringDownload/(.*)/*$', thumbnailStringDownload.thumbnailStringDownload), #DDC
                                        ('/thumbnailsForGallery/(.*)/*$', thumbnailDownload.thumbnailDownloadGallery), #DDC
                                        ('/thumbnailsForMyPage/(.*)/*$', thumbnailDownload.thumbnailDownloadMySketches), #DDC
                                        ('/thumbnailsByUploader/(.*)/*$', thumbnailDownload.thumbnailDownloadByUploader), #DDC
                                        ('/thumbnailUpload/(.*)/*$', thumbnailUpload.thumbnailUpload), #DDC
                                        ('/fullPictureUpload/(.*)/*$', thumbnailUpload.fullPictureUpload), #DDC
                                        ('/fullPictureDownload/(.*)/*$', thumbnailDownload.fullPictureDownload), #DDC
                                        ('/fetchsourcecode/([12]\d\d\d)/(\d|[01]\d)/([-\w]+)/*$', blog.FetchSourceCode), #DDC
                                        ('/latest.html/*$', blog.showLatestSketches),
                                        ('/myPage/*([\w\s]*-[\w\s]*)*/*$', blog.showProfile),
                                        ('/viewProfile/*([\w\s]*-[\w\s]*)*/*$', blog.showProfile),
                                        ('/myPageEdit/*$', blog.showProfileEdit),
                                        ('/avatar/*([\w\s]*-*[\w\s]*)\.png/*$', blog.avatarImage),                                      
                                        ('/mySketches/*$', blog.showMySketches),
                                        ('/indexSKELETAL.html', blog.showFrontPageSKELETAL),
                                        ('/index.html', blog.showFrontPage),
                                        ('/watermansIndex.html', blog.showFrontPage),
                                        ('/indexNEW.html', blog.showFrontPageNEW),
                                        ('/', blog.showFrontPage),
                                        ('/view/([-\w]+)/([-\w]*)/*$', blog.ArticleHandler),
                                        ('/uploadFullSketchImagePage/([-\w]+)/([-\w]*)/*$', blog.UploadFullSketchImagePage),
                                        ('/embed/([-\w]+)/([-\w]*)/*$', blog.ArticleHandlerEmbed),
                                        ('/byUploader/([\w\s]*-*[\w\s]*)/*$', blog.showSketchesByUploader),
                                        ('/delete/([-\w]+)/*$', blog.DeleteBlog),
                                        ('/copy/([-\w]+)/*$', blog.CopyBlog), #DDC
                                        ('/addComment/([-\w]+)/*$', blog.AddBlogReaction),
                                        ('/deleteComment/([-\w]+)/*$', blog.DeleteBlogReaction),
                                        ('/latestComments/([-\w]+)/*$', latestComments.latestComments),
                                        ('/comments/([-\w]+)/*$', allComments.allComments),
                                        #('/noThumbnailImageUpload/*$', admin.noThumbnailImageUpload),
                                        #('/checkNoThumbnailImageUpload/*$', admin.checkNoThumbnailImageUpload),

                                        ('/login/*$', blog.Login),
                                        ('/groupLogin.html', blog.GroupLogin),
                                        ('/create/*$', blog.AddBlog),
                                        ('/edit/(.*)/*$', blog.EditBlog),
                                        ('/createNEW/*$', blog.AddBlogNEW),
                                        ('/editNEW/(.*)/*$', blog.EditBlogNEW),
                                        #('/edit/comment/(.*)/(.*)/*$', blog.EditBlogReaction),
                                        ('/delete/comment/(.*)/(.*)/*$', blog.DeleteBlogReaction),

                                        #('/admin/*$', admin.MainPage),
                                        
                                        # this page actually works but can't make too much sense of it now
                                        #('/admin/system/*$', admin.AdminSystemPage),

                                        ('/admin/userid/*$', admin.UserIdPage),

                                        #('/sketchesSavedNotEvenOnce/*$', blog.SketchesSavedNotEvenOnce),
                                        ('/403.html', blog.UnauthorizedHandler),
                                        ('/404.html', blog.NotFoundHandler),
                                        #('/search/(.*)/*$', blog.SearchHandler),
                                        #('/sitemap/*$', blog.SiteMapHandler),  #for live.com SEO

                                       ],
                                       debug=cpedialog.debug)
    wsgiref.handlers.CGIHandler().run(application)

if __name__ == "__main__":
    main()
