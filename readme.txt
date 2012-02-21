What?
--

sketchPatch is a portal where anyone can collect and play with Processing sketches. More about the project here: http://www.sketchpatch.net/about.html

Why?
--
We liked the idea of a site which a) let people code Processing sketches online and b) collected the sketches and linked "forks" c) is accessible to old browsers e.g. IE6

The aim is to use sketchPatch as a teaching help - and schools don't necessarily have the latest and greatest browsers.

Although there were similar sites for other languages, there wasn't anything quite like that at the time, so we gave it a go.


How?
--
sketchPatch uses Processing.as by Tim Cameron Ryan where flash is available, and Processing.js otherwise. sketchPatch also uses a modified version of the CPedia blog engine by Ping Chen. Countless other libraries are used.


Can I use it?
--
Sure go ahead! The site is quite "branded", so you might want to change those visual references to sketchPatch. Also sketchPatch runs on Google App Engine. It's probably very easy to port it to a "neutral" host, since we used very few AppEngine-specific APIs, and the data model is very simple.