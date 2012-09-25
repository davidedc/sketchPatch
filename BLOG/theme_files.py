# -*- coding: utf-8 -*-
import  os,sys,stat
os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'
from google.appengine.dist import use_library
use_library('django', '1.2')
import wsgiref.handlers
from mimetypes import types_map
from datetime import  timedelta
from google.appengine.ext.webapp import template
from google.appengine.ext.zipserve import *
sys.path.append('modules')
from BLOG.model import *

# {{{ Handlers
import logging
cwd = os.getcwd()
print cwd
theme_path = os.path.join(cwd, 'themes')
file_modifieds={}
max_age = 600  #expires in 10 minutes

def Error404(handler):
    handler.response.set_status(404)
    html = template.render(os.path.join(cwd,'views/404.html'), {'error':404})
    handler.response.out.write(html)


class GetFile(webapp.RequestHandler):
    def get(self,prefix,name):
        request_path = self.request.path[13:]


        server_path = os.path.normpath(os.path.join(cwd, 'themes', request_path))
        #server_path = cwd + "/themes" + request_path

        try:
            fstat=os.stat(server_path)
        except:
            #use zipfile
            theme_file=os.path.normpath(os.path.join(cwd, 'themes', prefix))
            if os.path.exists(theme_file+".zip"):
                #is file exist?
                fstat=os.stat(theme_file+".zip")
                zipdo=ZipHandler()
                zipdo.initialize(self.request,self.response)
                return zipdo.get(theme_file,name)
            else:
                Error404(self)
                return


        fmtime=datetime.fromtimestamp(fstat[stat.ST_MTIME])
        #logging.info("QUAMIME %s",os.path.splitext(server_path)[1])
        if self.request.if_modified_since and self.request.if_modified_since.replace(tzinfo=None) >= fmtime:
            self.response.headers['Date'] = format_date(datetime.utcnow())
            self.response.headers['Last-Modified'] = format_date(fmtime)
            cache_expires(self.response, max_age)
            self.response.set_status(304)
            self.response.clear()
        elif server_path.startswith(theme_path):
            ext = os.path.splitext(server_path)[1]
            if types_map.has_key(ext):
                mime_type = types_map[ext]
            else:
                mime_type = 'application/octet-stream'
            try:
                #logging.info("MIMETYPE %s %s",mime_type,ext)
                self.response.headers['Content-Type'] = mime_type
                self.response.headers['Last-Modified'] = format_date(fmtime)
                cache_expires(self.response, max_age)
                #logging.info("MIMETYPE in resp %s %s",str(self.response.headers),self.response.headers['Content-Type'])
                self.response.out.write(open(server_path, 'rb').read())
            except Exception, e:
                Error404(self)
        else:
            Error404(self)

class NotFound(webapp.RequestHandler):
    def get(self):
         Error404(self)

#}}}

def format_date(dt):
    return dt.strftime('%a, %d %b %Y %H:%M:%S GMT')

def cache_expires(response, seconds=0, **kw):
    """
    Set expiration on this request.  This sets the response to
    expire in the given seconds, and any other attributes are used
    for cache_control (e.g., private=True, etc).

    this function is modified from webob.Response
    it will be good if google.appengine.ext.webapp.Response inherits from this class...
    """
    if not seconds:
        # To really expire something, you have to force a
        # bunch of these cache control attributes, and IE may
        # not pay attention to those still so we also set
        # Expires.
        response.headers['Cache-Control'] = 'max-age=0, must-revalidate, no-cache, no-store'
        response.headers['Expires'] = format_date(datetime.utcnow())
        if 'last-modified' not in self.headers:
            self.last_modified = format_date(datetime.utcnow())
        response.headers['Pragma'] = 'no-cache'
    else:
        response.headers['Cache-Control'] = 'max-age=%d' % seconds
        response.headers['Expires'] = format_date(datetime.utcnow() + timedelta(seconds=seconds))

def main():
    application = webapp.WSGIApplication(
            [
                ('/blog/themes/[\\w\\-]+/templates/.*', NotFound),
                ('/blog/themes/(?P<prefix>[\\w\\-]+)/(?P<name>.+)', GetFile),
                ('.*', NotFound),
                ],
            debug=True)
    wsgiref.handlers.CGIHandler().run(application)

if __name__ == '__main__':
    main()

