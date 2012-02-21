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
# further changes made by Davide Della Casa, Sophie McDonald, Johnny Stutter

import os
import re
import datetime
import calendar
import logging
import string
from google.appengine.api import users
from google.appengine.ext import db
from google.appengine.api import memcache
from google.appengine.api import urlfetch

from cpedia.pagination.GqlQueryPaginator import GqlQueryPaginator,GqlPage
from cpedia.pagination.paginator import InvalidPage,Paginator

from model import Weblog,WeblogReactions,CPediaLog
import cgi
import urllib, hashlib
import re, sys, string
from admin import UserInfo
from appengine_utilities.sessions import Session


'''
# Functions to generate permalinks
def get_permalink(date,title):
    return get_friendly_url(title)

# Module methods to handle incoming data
def get_datetime(time_string):
    if time_string:
        return datetime.datetime.strptime(time_string, '%Y-%m-%d %H:%M:%S')
    return datetime.datetime.now()

def get_friendly_url(title):
    return re.sub('-+', '-', re.sub('[^\w-]', '', re.sub('\s+', '-', removepunctuation(title).strip()))).lower()

def removepunctuation(str):
    punctuation = re.compile(r'[.?!,":;]')
    str = punctuation.sub("", str)
    return str
'''

def u(s, encoding):
    if isinstance(s, unicode):
        return s
    else:
        return unicode(s, encoding)


#get recent comments. Cached.
def getRecentReactions():
    key_ = "blog_recentReactions_key"
    try:
        recentReactions = memcache.get(key_)
    except Exception:
        recentReactions = None
    if recentReactions is None:
        recentReactions = db.GqlQuery("select * from Weblog order by lastCommentedDate desc").fetch(10)
        memcache.add(key=key_, value=recentReactions, time=3600)
    else:
        logging.debug("getRecentReactions from cache. ")

    return recentReactions

#get list of sketches saved not even once. Not Cached. By Davide Della Casa
#def getSketchesSavedNotEvenOncePagination(page):
#    blogs_query = db.GqlQuery("select * from Weblog WHERE savedAtLeastOnce = :1", True)
#    try:
#        cpedialog = getCPedialog()
#        obj_page  =  GqlQueryPaginator(blogs_query,page,cpedialog.num_post_per_page).page()
#    except InvalidPage:
#        return None
#    
#    return obj_page


#get blog pagination. Cached.
def getBlogPagination(page):
    key_ = "blog_pages_key"
    try:
        obj_pages = memcache.get(key_)
    except Exception:
        obj_pages = None
    if obj_pages is None or page not in obj_pages:
        blogs_query = Weblog.all().filter('entrytype','post').order('-date')
        try:
            cpedialog = getCPedialog()
            obj_page  =  GqlQueryPaginator(blogs_query,page,cpedialog.num_post_per_page).page()
            if obj_pages is None:
                obj_pages = {}
            obj_pages[page] = obj_page
            memcache.add(key=key_, value=obj_pages, time=3600)
        except InvalidPage:
            return None
    else:
        logging.debug("getBlogPagination from cache. ")

    return obj_pages[page]


#get tag list. Cached.
def getTagList():
    key_ = "blog_tagList_key"
    try:
        tags = memcache.get(key_)
    except Exception:
        tags = None
    if tags is None:
        tags = Tag.all().filter('valid',True).order('tag')
        memcache.add(key=key_, value=tags, time=3600)
    else:
        logging.debug("getTagList from cache. ")
    return tags


#get cpedialog configuration. Cached.
def getCPedialog():
    key_ = "blog_cpedialog_key"
    try:
        cpedialog = memcache.get(key_)
    except Exception:
        cpedialog = None
    if cpedialog is None:
        cpedialogs = CPediaLog().all().filter("default",True)
        if cpedialogs.count() > 0 :
            cpedialog = cpedialogs.get()
        else:
            cpedialog = CPediaLog()
        memcache.add(key=key_, value=cpedialog, time=36000)            
    else:
        logging.debug("getFeeedList from cache. ")
    return cpedialog


#flush tag list.
def flushCPedialog():
    memcache.delete("blog_cpedialog_key")


#flush tag list.
def flushTagList():
    memcache.delete("blog_tagList_key")


#flush recent comments.
def flushRecentReactions():
    memcache.delete("blog_recentReactions_key")

#flush blog pagination.
def flushBlogPagesCache():
    memcache.delete("blog_pages_key")

#flush month-cached blog.
def flushBlogMonthCache(blog):
    if blog.date is None:
        blog.date = datetime.datetime.now()
    year_ =  blog.date.year
    month_ =  blog.date.month
    key= "blog_year_month_"+str(year_)+"_"+str(month_)+"_key"
    memcache.delete(key)


def getGravatarUrlByUser(user):
    default = "/img/anonymous.jpg"
    if user is not None:
        return getGravatarUrl(user.email())
    else:
        return default

def getGravatarUrl(email):
    cpedialog = getCPedialog()
    default = cpedialog.root_url+"/img/anonymous.jpg"
    size = 48
    gravatar_url = "http://www.gravatar.com/avatar.php?"
    gravatar_url += urllib.urlencode({'gravatar_id':hashlib.md5(str(email)).hexdigest(),
        'default':default, 'size':str(size)})
    return gravatar_url

def getUserNickname(user):
    default = "anonymous"
    if user:
        return user.email().split("@")[0]
    else:
        return default

def shorten(str,leng):
    if len(str) > leng:
        return str[:leng-3]+'...'
    return str

def convDecToBase(num, base, dd=False):
	if not 2 <= base <= 62:
		raise ValueError, 'The base number must be between 2 and 62.'
	if not dd:
		dd = dict(zip(range(62), list(string.digits+string.letters)))
	if num == 0: return ''
	num, rem = divmod(num, base)
	return convDecToBase(num, base, dd)+dd[rem]

def toBase10(num, base):
	sum = 0
	parseNum = str(num)
	indices = range(len(parseNum)) #Exponents depend on digit place, indices necessary.
	charbuf = (string.digits+string.letters)
	for i in indices:
		sum += charbuf.find(parseNum[i])*base**indices[::-1][i]
	return sum
	
def sanitizeStringWithoutSpaces(theString):
        char = []
        for letter in theString:
            if letter not in (string.letters + string.digits + '-'): # removes all special chars apart from separator
                letter = ' '
            char.append(letter)
        return  (" ".join(string.join(char, '').split())).replace(" ","-")

def sanitizeStringWithSpaces(theString):
        char = []
        for letter in theString:
            if letter not in (string.letters + string.digits + '-'): # removes all special chars apart from separator
                letter = ' '
            char.append(letter)
        return  (" ".join(string.join(char, '').split()))

AllowedHTML = re.compile(r"""
    (?isx)              # case-insensitive, multiline, verbose regexp
    </?B> |             # bold
    </?I> |             # italics
    </?P.*?> |          # paragraph (alignment)
    <A\s*HREF\s*=\s*"\s*HTTP://WWW.SKETCHPATCH.NET/.*?> |           # anchors to sketchpatch(links)
    </A> |              # anchor close
    </?OL> |            # ordered lists (numbered)
    </?UL> |            # unordered lists (bulleted)
    <LI> |              # list elements
    </?EM> |            # emphasis
    <BR> |              # link breaks
    <HR> |              # horizontal rules
    </?TT> |            # teletype font
    </?STRONG> |        # strong emphasis
    </?BLOCKQUOTE.*?> | # block quotes
    </?H[1-6]>          # heading markers
    """)


def HTMLChecker(match_obj):
    """HTMLChecker(match_obj) -- Used by the Sanitize function to validate HTML.

Given an re module match object as a parameter, it will return either
the HTML tag in question if it's allowed, otherwise a null string."""
    
    if AllowedHTML.search(match_obj.group()):
        return match_obj.group()
    else:
        return ""

def LinkChecker(match_obj):
    """LinkChecker(match_obj) - Used by the Sanitize function to validate links.

Given an re module match object as a parameter containing link tag, it
will return a link tag with the actual link URL validated through
Pretty_Link() using the normal 'lenient' methods."""
    
    return match_obj.group(1) + Pretty_Link(match_obj.group(2)) + match_obj.group(3)

    
def Sanitize(Content):    # for your protection
    """Sanitize(Content) - Sanitizes HTML strings for your protection.

Given a string containing HTML, it will return that same string with
any disallowed tags removed. (Disallowed tags are those not explicitly
allowed in the regular expression AllowedHTML defined above.)

Also runs any <A HREF=\"link\"> links through Pretty_Link.

TODO: not sure if I should re.escape() the string here or not... If I
do, it would be for the database...?"""

    ### strip any illegal HTML
    Content = re.sub(r"(?is)<.+?>", HTMLChecker, Content)

    ### validate any links
    Content = re.sub(r'(?is)(<A .*?HREF=")(.+?)(".*?>)', LinkChecker, Content)
        
    ### then escape any funky characters
    ### TODO: is this really neccesary for the database?
    
    # Content = re.escape(Content)

    return Content

def PlainText_to_HTML(Text):
    """PlainText_to_HTML(Text) - Converts a plain text string to equivelent HTML for display.

This function converts a plain text string to suitable HTML.  In
general, this just means adding <P>'s and <BR>'s.  Also, convert any <
to &lt; so they won't be interpreted as HTML tags."""
    
    Text = string.replace(Text, "<", "&lt;")    
    Text = string.replace(Text, "\n\n", "<P>")
    Text = string.replace(Text, "\n", "<BR>")
    return Text

# this defines valid URL network interfaces for Pretty_Link
NetworkInterfaces = [
    "http",
    "ftp",
    "mailto",
    "gopher",
    "file"
    ]

def Pretty_Link(link, Strict = None):
    """Pretty_Link(link, Strict = None) - Parses URL fragments into more generally useful, valid forms.

This function helps parse user-given link (fragments) into valid URL's

potential link to be parsed is first parameter

second, optional, parameter, if not None, sets 'Strict' parsing which
will return None for a variety of malformed or weird links

the prettified link is returned

Note: most people will NOT want Strict because it can be a real
bastard.  'Lenient' mode makes a real good faith effort to clean up a
URL and shouldn't return a None; in the worst case it will return
'http://some_invalid_url'

Some example cases:
   www.some-site.com  -->   http://www.some-site.com
   ftp://site.com     -->   ftp://site.com  (same)
   not_a_valid_link   -->   None if Strict, otherwise http://not_a_valid_link
   fake://site.com    -->   None if Strict, otherwise http://site.com
   mailto bob@slack.com --> None if Strict, otherwise mailto:bob@slack.com"""

    # strings = re.split(r"([^\-a-zA-Z0-9_]+)",link)[:-1]
    strings = re.split(r"([^\-a-zA-Z0-9_]+)",link)

    if not strings:
        return None
    
    if strings[0] in NetworkInterfaces:
        if strings[1] == "://":
            if Strict:                
                if "." in strings[2:]:
                    return link  # it's valid!
            else:
                return link
        elif strings[0] == "file":
            if strings[1] == ":/":
                return link
            elif strings[1] == ".":
                return "http://" + string.join(strings,"")
            else:
                return None
        elif strings[0] == "mailto":
            if strings[1] == ":":
                if Strict:
                    if "@" in strings[2:] and "." in strings[2:]:
                        return link
                    else:
                        return None
                else:
                    return link
            else:
                if Strict:
                    return None
                else:
                    return "mailto:" + string.join(strings[2:],"")
        else:
            if Strict:
                return None
            else:
                return strings[0] + "://" + string.join(strings[2:],"")
    else:
        # in this case, it's probably just a plain link
        # in the form somesite.com
        # and we'll assume they mean http link
        if Strict:
            if not "." in strings[1:]:
                return None  # handles "nosuchlink" type cases

        if len(strings) > 2 and strings[1] != ".":
            if Strict:
                return None  # handles fake://something
            else:
                return "http://" + string.join(strings,"")
            
        return "http://" + link
        
def insertUsersideCookies(requester):

        """
        firstLogin = requester.request.cookies.get('firstLogin', '')
        """

        #
        firstLogin = False
        #

        if not firstLogin:
        		"""
        		if not users.get_current_user():
        			requester.redirect(authorized.getLoginPage())
        			return
        		logging.info('firstLogin' + str(users.get_current_user()))
        		requester.response.headers.add_header('Set-Cookie', 'user.is_current_user_admin=%s; expires=Fri, 31-Dec-2020 23:59:59 GMT; path=/' % users.is_current_user_admin())
        		requester.response.headers.add_header('Set-Cookie', 'user.user=%s; expires=Fri, 31-Dec-2020 23:59:59 GMT; path=/' % str(users.get_current_user()))
        		requester.response.headers.add_header('Set-Cookie', 'user.user_id=%s; expires=Fri, 31-Dec-2020 23:59:59 GMT; path=/' % users.get_current_user().user_id())
        		requester.response.headers.add_header('Set-Cookie', 'firstLogin=%s; expires=Fri, 31-Dec-2020 23:59:59 GMT; path=/' % "True")
        		requester.response.headers.add_header('Set-Cookie', 'user.nickname=%s; expires=Fri, 31-Dec-2020 23:59:59 GMT; path=/' % (users.get_current_user().nickname()).partition("@"))[0].replace(".","_")
        		"""

        		#
        		user = UserInfo()
        		user.whoIs(requester)
        		if user.user:
        			requester.response.headers.add_header('Set-Cookie', 'user.is_current_user_admin=%s; expires=Fri, 31-Dec-2020 23:59:59 GMT; path=/' % str(user.is_current_user_admin))
        			requester.response.headers.add_header('Set-Cookie', 'user.user=%s; expires=Fri, 31-Dec-2020 23:59:59 GMT; path=/' % str(user.user))
        			requester.response.headers.add_header('Set-Cookie', 'user.user_id=%s; expires=Fri, 31-Dec-2020 23:59:59 GMT; path=/' % str(user.user_id))
        			requester.response.headers.add_header('Set-Cookie', 'firstLogin=%s; expires=Fri, 31-Dec-2020 23:59:59 GMT; path=/' % "True")
        			requester.response.headers.add_header('Set-Cookie', 'user.nickname=%s; expires=Fri, 31-Dec-2020 23:59:59 GMT; path=/' % str(user.nickname))
        		else:
        			requester.response.headers.add_header('Set-Cookie', 'groupLoginCode=%s; expires=Fri, 31-Dec-2020 23:59:59 GMT; path=/' % "None")
        			requester.response.headers.add_header('Set-Cookie', 'user.user_id=%s; expires=Fri, 31-Dec-2020 23:59:59 GMT; path=/' % "None")
        			requester.response.headers.add_header('Set-Cookie', 'user.is_current_user_admin=%s; expires=Fri, 31-Dec-2020 23:59:59 GMT; path=/' % "None")
        			requester.response.headers.add_header('Set-Cookie', 'user.user=%s; expires=Fri, 31-Dec-2020 23:59:59 GMT; path=/' % "None")
        			requester.response.headers.add_header('Set-Cookie', 'user.nickname=%s; expires=Fri, 31-Dec-2020 23:59:59 GMT; path=/' % "Anonymous")
        		#
        else:

        	requester.session = True
        	user = UserInfo(requester.session)
        	user.whoIs(requester)

        	# if the user is logged in, then have him to remember his userID on the client side
        	# this is so the page can independently format themselves on the client side        
        	# depending on who the user is. We validate his permissions on the server side too,
        	# but we delegate the presentation details to the client so we don't have to generate
        	# different pages, we can keep one in cache and we are happy.
        	if user.user:
        		user_id = requester.request.cookies.get('user.user_id', '')
        		if not user_id:
        			logging.info('user.user_id: '+ str(user.user_id))
        			requester.response.headers.add_header('Set-Cookie', 'user.user_id=%s; expires=Fri, 31-Dec-2020 23:59:59 GMT; path=/' % str(user.user_id))

        		is_current_user_admin = requester.request.cookies.get('user.is_current_user_admin', '')
        		if not is_current_user_admin:
        			logging.info('user.is_current_user_admin: '+ str(user.is_current_user_admin))
        			requester.response.headers.add_header('Set-Cookie', 'user.is_current_user_admin=%s; expires=Fri, 31-Dec-2020 23:59:59 GMT; path=/' % str(user.is_current_user_admin))

        		useruser = requester.request.cookies.get('user.user', '')
        		if not useruser:
        			logging.info('user.user: '+str(user.user))
        			requester.response.headers.add_header('Set-Cookie', 'user.user=%s; expires=Fri, 31-Dec-2020 23:59:59 GMT; path=/' % str(user.user))

        		usernickname = requester.request.cookies.get('user.nickname', '')
        		if not usernickname:
        			logging.info('user.nickname: '+str(user.user))
        			requester.response.headers.add_header('Set-Cookie', 'user.nickname=%s; expires=Fri, 31-Dec-2020 23:59:59 GMT; path=/' % str(user.nickname))
        	else:
        			requester.response.headers.add_header('Set-Cookie', 'user.user_id=%s; expires=Fri, 31-Dec-2020 23:59:59 GMT; path=/' % "None")
        			requester.response.headers.add_header('Set-Cookie', 'user.is_current_user_admin=%s; expires=Fri, 31-Dec-2020 23:59:59 GMT; path=/' % "None")
        			requester.response.headers.add_header('Set-Cookie', 'user.user=%s; expires=Fri, 31-Dec-2020 23:59:59 GMT; path=/' % "None")
        			requester.response.headers.add_header('Set-Cookie', 'user.nickname=%s; expires=Fri, 31-Dec-2020 23:59:59 GMT; path=/' % "Anonymous")
        

def insertPageviewsCookie(requester, numberOfViews):
        requester.response.headers.add_header('Set-Cookie', 'pageViews=%s; expires=Fri, 31-Dec-2020 23:59:59 GMT' % str(numberOfViews))

def doesItContainProfanity(value):

    value = value.lower()
    logging.info('checking for profanities ')
    bad_words =  [
    '@$$','%20teen','%20teen%20','2g1c','ababa','acrotomophilia','adult','ahole',
    'alprazolam','amateur','amatour','amatur','amcik','amoxil','anal','andskota',
    'anilingus','anus','ariset','arschloch','arse','aryan','asexual','ash0le','ash0les',
    'asholes','asshole','assmunch','assrammer','autoerotic','ayir','azzhole','b!+ch','b!tch',
    'b00b','b00bs','b17ch','b1tch','babeland','bangbros','bareback','barenaked','bassterd',
    'bastard','bastardo','basterd','bastinado','bbw','bdsm','beaner','bestiality','bi+ch','bi7ch',
    'biatch','bikini','birdlock','bisexual','bitch','blackjack','blow','blowjob','bludgeon',
    'blumpkin','boffing','boiolas','bollock','bollocks','bondage','boner','boob','boobs','breast',
    'breasts','buceta','bugger','bukkake','bulldyke','bumming','bunghole','buspar','busty',
    'butalbital','butt-pirate','buttcheeks','buttcrack','butthole','buttocks','buttwipe','c0ck',
    'cabron','camgirl','camslut','camwhore','carisoprodol','carnage','carpetmuncher','casino',
    'cawk','cazzo','celexa','chastity','chink','chraa','chuj','cialis','cipa','circlejerk',
    'citibank','clit','clitoral','clitoris','clitoritis','clits','clusterfuck','cnts','cntz',
    'cocaine','cock','commie','coprolagnia','coprophagia','coprophilia','cornhole','cowgirl',
    'crack','crap','creampie','credit card','crossdresser','couture','cuckold','cumshot','cunnilingus','cunt','cyberturf',
    'd4mn','dago','damn','darkie','daterape','daygo','deepthroat','dego','dick','didrex',
    'dike','dild0','dildo','dilld0','dirsa','disembowel','dismember','doggiestyle','doggystyle',
    'dolcett','domination','dominatricks','dominatrics','dominatrix','dosage','dothead','drug','dupa',
    'dyke','dziwka','ecchi','ecstasy','ejackulate','ejactulation','ejaculat','ejaculation',
    'ejakul','ekrem','ekto','electrotorture','enculer','enema','erection','erotic','erotism',
    'escort','ethical','eunuch','excrement','faen','fag','fag1t','faget','fagg1t','faggit',
    'faggot','fagit','fags','fagz','faig','faigs','fanculo','fanny','fapserver','fart',
    'fascist','fatass','fcuk','fecal','feces','feg','felch','felcher','fellatio','feltch',
    'femdom','feminazi','fetish','ficken','figging','fingering','fioricet','fisting','fitt',
    'flikker','footjob','foreclosure','foreplay','foreskin','forex','fornicate','fotze','foursome',
    'freemegavideo','freeones','frotting','fuck','fudge','fudgepacker','fuk','fukah','fuken',
    'fuker','fukin','fukk','fukkah','fukken','fukker','fukkin','futanari','futkretzn','fux0r',
    'g00k','gambling','gangbang','gay','gayboy','gaygirl','gays','gayz','genitals','goatcx',
    'goatse','god-damned','gokkun','golliwog','goodpoop','goodvibes','gook','goregasm','greaser',
    'grope','gtfo','guiena','guro','h00r','h0ar','h0r','h0re','h4x0r','handjob','hebe','hell',
    'hells','helvete','hentai','hermaphrodite','heroin','heterosexual','hickey','hoar',
    'hochulexus','hoer','holdem','hollyvalance','homeloan','homoerotic','homosexual','honkey',
    'honky','hooker','hookup','hoor','hoore','hore','horny','hottie','huevon','humping','hustler',
    'impalement','incest','injun','insurance','interracial','jackoff','jailbait','jap','japs',
    'jerk-off','jigaboo','jiggaboo','jiggerboo','jisim','jism','jiss','jizm','jizz','kamagra',
    'kamasutra','kanker','kawk','keno','kike','kinbaku','kinkster','kinky','klootzak','knob',
    'knobbing','knobs','knobz','knulle','kraut','kuk','kuksuger','kunt','kunts','kuntz','Kurac',
    'kurwa','kusi','kyrpa','l3i+ch','l3itch','labia','lemonparty','lesb','lesbian','levitra',
    'lezzian',' licked','lingerie','lipshits','lipshitz','lolita','vuitton','lovemaking','mamhoon',
    'marijuana','masochist','masokist','massterbait','masstrbait','masstrbate','masterbaiter',
    'masterbat','masterbate','masterbates','masturbat','masturbate','mature','mdma','meats',
    'medication','medicine','merd',
    'merkin','mibun','milf','missionary','mofo','monkleigh','mortgage','motherfucker','mouliewop',
    'muffdiving','muie','mulkku','muncher','murder','muschi','n1gr','naked','nambla','nasonex',
    'nastt','naughty','nawashi','nazi','nazis','necrophilia','negro','neonazi','nepesaurio',
    'nfsautoloan','nigga','nigger','nigur','niiger','niigr','nimphet','nimphets','nimphomania',
    'nipple','nipples',
    'nonconsent','nsfw','nude','nudist','nutsack','nympho','octopussoir','octopussy','omorashi',
    'oprah','orafis','oral','orgasim','orgasm','orgasum','orgy','oriface','orifice','orifiss',
    'orospu','outercourse','outlet','p0rn','Packer','packie','packy','paedophile','paki','pakie','paky',
    'pansy','panties','panty','paska','pecker','pedo','pedobear','pedophile','peeenus','peeenusss',
    'peenus','pegging','peinus','pen1s','penas','penetration','penis','penthouse','penus','penuus',
    'perse','pervert','phentermine','phuc','phuck','phuk','phuker','phukker','picka','pickaninny',
    'pierdol','pillu','pimmel','pimpis','pinko','piss','pissing','pisspig','pizda','plavix',
    'playboy','plendil','poker','polac','polack','polak','ponyplay','poofter','poonani','poontsee',
    'poopchute','porevo','porn','pr0n','pr1c','pr1ck','pr1k','prequalify','preteen','prolapsed',
    'prostitute','provigil','prozac','pthc','pubes','pubic','pula','pule','pusse','pussee','pussy',
    'puta','puto','puuke','puuker','qahbeh','queaf','queef','queer','queers','queerz','quickie',
    'quim','qweers','qweerz','qweir','r@ygold','raghead','ralph\slauren','rape','raping','rapist','rautenberg',
    'recktum','rectum','redskin','redtube','refinance','renob','retard','rimjob','rimming',
    'ringtone','ringtones','russian','s&m','sadie','sadism','sadist','sambo','scank',
    'schaffer',
    'scheiss','schlampe','schlong','schmuck','schoolboy','schoolgirl','scissoring','screw',
    'screwing','scrotum','seduced','seductive','semen','servitude','serviture',' sex','sexo','sexy',
    'sh!+','sh!t','sh1t','sh1ter','sharmuta','sharmute','shaved','shemale','shi+','shibari',
    'shipal','shit','shiz','shota','shrimping','shyt','shyte','shytty','shyty','sjambok','skanck',
    'skank','skankee','skankey','skanks','skanky','skribz','skurwysyn','slanteye','slots','slut',
    'smut','sodomize','sodomy','spank','speculum','sperm','sphencter','spic','spierdalaj',
    'splooge','spooge','squirt','stab','stickam','stileproject','stormfront','strapon',
    'straponclub','strappado','submission','submissive','suicide','suka','swastika','swinger',
    't\sby\sjft','talsarta','teen','teen\sboy','teen\sgirl','teenage','teets','teez','tenoretic','tenormin',
    'testical','testicle','thong','threesome','throating','tits','titt','titties','titty','toprol',
    'tosser','towelhead','tramadol','tranny','transexual','transgender','tribadism','trisexual',
    'tritace','tubgirl','turd','tushy','twat','twink','twinkie','ugg\sboots','ultram','underage','undressing','upskirt',
    'urethra','urophilia','va1jina','vag1na','vagiina','vagina','vagisil','vaj1na','vajina',
    'vasotec','viagra','vibrator','beackham','vittu','vivienne\swestwood','vorarephilia','voyeur','vullva','vulva','w00se','w0p',
    'wank','wartenberg','webcam','wetback','wh00r','wh0re','whoar','whore','wichser','wigger',
    'xanax','xrated','xxx','yasamohuel','yigan999','zabourah','zebeta','zestoretic','zestril',
    'zoophilia','zyban','[a-zA-Z0-9]*\\.ru',unichr(1076)+unichr(1080)+unichr(1077)+unichr(1090)+unichr(1099),
    unichr(1084)+unichr(1072)+unichr(1089)+unichr(1089)+unichr(1072)+unichr(1078)]
    # note that .ru comes after a doman name, so we do allow for digits or characters to be
    # before it

    # This paragraph here below was the old profanity filter.
    # Problem is it was too strict. It wouldn't accept Hello world for example
    # because it contained "hell"
    # So we switched to another way of doing things below
    #words_seen = [w for w in bad_words if w in value]  
    #if words_seen:  
    #    logging.info('oh no seen ' + "".join(words_seen))
    #    return True

    # This one appends a regexp that makes sure that we are not searching within each word
    # this was modified from http://stackoverflow.com/questions/3531746/whats-a-good-python-profanity-filter-library
    f = ProfanitiesFilter(bad_words, replacements="" + unichr(13231))    

    if unichr(13231) in f.clean(value):
        logging.info('profanity filter says no')
        return True


import random
import re

class ProfanitiesFilter(object):
    def __init__(self, filterlist, ignore_case=True, replacements="" + unichr(13231), 
                 complete=True, inside_words=False):
        """
        Inits the profanity filter.

        filterlist -- a list of regular expressions that
        matches words that are forbidden
        ignore_case -- ignore capitalization
        replacements -- string with characters to replace the forbidden word
        complete -- completely remove the word or keep the first and last char?
        inside_words -- search inside other words?

        """

        self.badwords = filterlist
        self.ignore_case = ignore_case
        self.replacements = replacements
        self.complete = complete
        self.inside_words = inside_words

    def _make_clean_word(self, length):
        """
        Generates a random replacement string of a given length
        using the chars in self.replacements.

        """
        return ''.join([random.choice(self.replacements) for i in
                  range(length)])

    def __replacer(self, match):
        value = match.group()
        if self.complete:
            return self._make_clean_word(len(value))
        else:
            return value[0]+self._make_clean_word(len(value)-2)+value[-1]

    def clean(self, text):
        """Cleans a string from profanity."""

        # we check whether the character before or after a swearword is not
        # a number or digit, or start of line and end of line.
        # note that this would allow for swearwords preceded or followed
        # by any letter or digit to be undetected. Fortunately doesn't
        # seem to be happening often.
        regexp_notinsidewords = r'([^a-zA-Z0-9]|^)(%s)(s|S|[^a-zA-Z0-9]|$)'

        regexp = (regexp_notinsidewords % 
                  '|'.join(self.badwords))

        # logging.info('regexp: ' + regexp)
        # logging.info('text: ' + text)

        r = re.compile(regexp, re.IGNORECASE if self.ignore_case else 0)

        return r.sub(self.__replacer, text)
