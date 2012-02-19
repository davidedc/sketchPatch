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


import re
from google.appengine.ext import webapp

import urllib
import re
import cgi



register = webapp.template.create_template_register()


@register.filter
def replace ( string, args ):
        search  = args[0]
        replace = args[1]
        return re.sub( search, replace, string )

@register.filter
def email_username ( email ):
        return email.split("@")[0]

@register.filter
def unquote ( str ):
        return urllib.unquote(str.encode('utf8'))

@register.filter
def quote ( str ):
        return urllib.quote(str)

@register.filter
def escape ( str ):
        return cgi.escape(str)

