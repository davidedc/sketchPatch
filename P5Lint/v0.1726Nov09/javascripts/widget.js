// web.js
// 2009-10-03

// This is the web browser companion to fulljslint.js. It is an ADsafe
// lib file that implements a web ui by adding behavior to the widget's
// html tags.

// It stores a function in lib.init_jslint_ui. Calling that function will
// start up the JSLint widget ui.

// option = {adsafe: true, fragment: false}

/*members check, cookie, each, edition, get, getTitle, getValue, indent,
    isArray, join, jslint, lib, maxerr, maxlen, on, passfail, predef, push,
    q, select, set, split, value, white
*/

"use strict";

// this one is needed to keep track of whether the program uses extends or implements
// in that case, we don't report undeclared variables because
// obviously variables are not inherited accross classes, so they
// are reported as undeclared when used. We could fix that with some time.
var usedExtendsOrImplements = false;

/**
*
*  Javascript trim, ltrim, rtrim
*  http://www.webtoolkit.info/
*
**/

function ltrim(str, chars) {
	chars = chars || "\\s";
	return str.replace(new RegExp("^[" + chars + "]+", "g"), "");
}
 
function rtrim(str, chars) {
	chars = chars || "\\s";
	return str.replace(new RegExp("[" + chars + "]+$", "g"), "");
}
 
function trim(str, chars) {
	return ltrim(rtrim(str, chars), chars);
}
 

    function P5Report (thePassedProgram) {
	    var data = JSLINT.data();
        var a = [], c, e, err, f, i, k, l, m = '', n, o = [], s;
		err = false;

        function detail(h, s) {
            if (s) {
                o.push('  ' + h + ' - ' +
                        s.sort().join(', ') + '\n');
            }
        }


        if (data.errors || data.implieds || data.unused) {
            if (data.errors) {
                for (i = 0; i < data.errors.length; i += 1) {
                    c = data.errors[i];
                    if (c) {
						var JSLintErrorReason = c.reason.entityify();
					   if(
							JSLintErrorReason.indexOf("was used before it was defined") == -1 &&
							JSLintErrorReason.indexOf("Use '===' to compare with") == -1 &&
							JSLintErrorReason.indexOf("is already defined") == -1 &&
							JSLintErrorReason.indexOf("Mixed spaces and tabs") == -1 &&
							JSLintErrorReason.indexOf("Use '!==' to compare with") == -1 &&
							JSLintErrorReason.indexOf("A leading decimal point can be confused with a dot") == -1 &&
							JSLintErrorReason.indexOf("Expected '{' and instead saw") == -1 
						){
                        err = true;
						e = c.evidence || '';
						o.push('Error: \n');
                        o.push('Problem' + (isFinite(c.line) ? ' at line ' +
                                c.line + ' character ' + c.character : '') +
                                ': ' + JSLintErrorReason +
                                (e && (e.length > 80 ? e.slice(0, 77) + '...' :
                                e).entityify()) );
						}
                    }
                }
            }

            if (data.implieds) {
                s = [];
				if (!usedExtendsOrImplements){
					var numberOfUndeclared = 0;
					var undeclareds = [];
					for (i = 0; i < data.implieds.length; i += 1) {
						var theImpliedData = data.implieds[i].name;
						if (
							theImpliedData != "float" &&
							theImpliedData != "size" &&
							theImpliedData != "smooth" &&
							theImpliedData != "noStroke" &&
							theImpliedData != "fill" &&
							theImpliedData != "background" &&
							theImpliedData != "mouseX" &&
							theImpliedData != "mouseY" &&
							theImpliedData != "ellipse" &&
							theImpliedData != "CENTER" &&
							theImpliedData != "frameRate" &&
							theImpliedData != "colorMode" &&
							theImpliedData != "RGB" &&
							theImpliedData != "width" &&
							theImpliedData != "random" &&
							theImpliedData != "TWO_PI" &&
							theImpliedData != "sin" &&
							theImpliedData != "cos" &&
							theImpliedData != "P5LintStringReplacement" &&
							theImpliedData != "loadImage" &&
							theImpliedData != "image" &&
							theImpliedData != "strokeWeight" &&
							theImpliedData != "stroke" &&
							theImpliedData != "PI" &&
							theImpliedData != "height" &&
							theImpliedData != "pushMatrix" &&
							theImpliedData != "popMatrix" &&
							theImpliedData != "translate" &&
							theImpliedData != "rotate" &&
							theImpliedData != "map" &&
							theImpliedData != "abs" &&
							theImpliedData != "line" &&
							theImpliedData != "point" &&
							theImpliedData != "noFill" &&
							theImpliedData != "bezier" &&
							theImpliedData != "HSB" &&
							theImpliedData != "int" &&
							theImpliedData != "rect" &&
							theImpliedData != "P2D" &&
							theImpliedData != "loadFont" &&
							theImpliedData != "textFont" &&
							theImpliedData != "textMode" &&
							theImpliedData != "SCREEN" &&
							theImpliedData != "textAlign" &&
							theImpliedData != "println" &&
							theImpliedData != "set" &&
							theImpliedData != "text" &&
							theImpliedData != "key" &&
							theImpliedData != "second" &&
							theImpliedData != "HALF_PI" &&
							theImpliedData != "minute" &&
							theImpliedData != "norm" &&
							theImpliedData != "hour" &&
							theImpliedData != "radians" &&
							theImpliedData != "RADIUS" &&
							theImpliedData != "color" &&
							theImpliedData != "arc" &&
							theImpliedData != "constrain" &&
							theImpliedData != "createGraphics" &&
							theImpliedData != "P3D" &&
							theImpliedData != "createImage" &&
							theImpliedData != "ARGB" &&
							theImpliedData != "byte" &&
							theImpliedData != "loadShape" &&
							theImpliedData != "noLoop" &&
							theImpliedData != "shape" &&
							theImpliedData != "dist" &&
							theImpliedData != "link" &&
							theImpliedData != "loadPixels" &&
							theImpliedData != "sqrt" &&
							theImpliedData != "atan2" &&
							theImpliedData != "pixels" &&
							theImpliedData != "updatePixels" &&
							theImpliedData != "keyPressed" &&
							theImpliedData != "millis" &&
							theImpliedData != "char" &&
							theImpliedData != "red" &&
							theImpliedData != "green" &&
							theImpliedData != "blue" &&
							theImpliedData != "loop" &&
							theImpliedData != "rectMode" &&
							theImpliedData != "mousePressed" &&
							theImpliedData != "noise" &&
							theImpliedData != "redraw" &&
							theImpliedData != "PImage" &&
							theImpliedData != "boolean" &&
							theImpliedData != "requestImage" &&
							theImpliedData != "scale" &&
							theImpliedData != "triangle" &&
							theImpliedData != "quad" &&
							theImpliedData != "beginShape" &&
							theImpliedData != "vertex" &&
							theImpliedData != "endShape" &&
							theImpliedData != "tint" &&
							theImpliedData != "Point" &&
							theImpliedData != "TRIANGLE_STRIP" &&
							theImpliedData != "curveVertex" &&
							theImpliedData != "LINES" &&
							theImpliedData != "bezierVertex" &&
							theImpliedData != "POINTS" &&
							theImpliedData != "P5LintHexColorReplacement" &&
							theImpliedData != "P5LintFloatReplacement" &&
							theImpliedData != "CLOSE" &&
							theImpliedData != "CORNER" &&
							theImpliedData != "P5LintSuperReplacement" &&
							theImpliedData != "ellipseMode"        				     
						) {
						
						// we could show the line number here,
						// but it could be misleading, so we don't show it
						//s[i] = theImpliedData + " line number " + data.implieds[i].line + '\n';
						s[i] = theImpliedData + ' ';
						undeclareds[numberOfUndeclared] = theImpliedData + ' ';
						numberOfUndeclared++;
						}
						else{
							s[i] = '';
						}
					}
				}
				else{
					o.push('\nNot reporting undeclared functions/variables because I still can\'t deal with extends/implements costructs. Yet.\n ');
					// now put the flag back to false
					usedExtendsOrImplements = false;
				}
                if (undeclareds.length != 0) {
					o.push('\nUndeclared functions/variables:\n------------------------------\n\n' + undeclareds.join(', ') + '\n');
				}
            }

            if (data.unused) {
                s = [];
				var numberOfUnuseds = 0;
                for (i = 0; i < data.unused.length; i += 1) {
					if (s[i] === '') continue;
					var isItReallyUnused = new RegExp( '[^a-zA-Z0-9_]'+data.unused[i].name+'[^a-zA-Z0-9_]',"g");
					
					if (thePassedProgram.match(isItReallyUnused).length == 1){
					
						s[numberOfUnuseds] = data.unused[i].name  +
							data.unused[i].line + 
							data.unused[i]['function'] + ' ';
						numberOfUnuseds++;
					}
                }
                if (s.length != 0) {
					o.push('\nUnused variable(s):\n------------------\n\n ' + s.join(', ') );
				}
            }
            o.push('\n');
        }





            if (data.globals) {
				  var dataGlobalsCopy = [];
			      for (var copyStuffToSort = 0; copyStuffToSort < data.globals.length; copyStuffToSort++)  {
							dataGlobalsCopy[copyStuffToSort] = data.globals[copyStuffToSort];
					}
                o.push('\nGlobal variables: \n----------------\n\n' +
                        dataGlobalsCopy.sort().join(', ') );
            } else {
                //o.push('<div><i>No new global variables introduced.</i></div>');
            }
			
			if (data.functions.length != 0) {
				o.push('\n\n\nFunctions details: \n-----------------\n');
				for (i = 0; i < data.functions.length; i += 1) {
					f = data.functions[i];

					o.push('\n' + f.line + '-' +
							f.last + '- ' + (f.name || '') + '(' +
							(f.param ? f.param.join(', ') : '') + ')\n');
					//detail('<big><b>Unused</b></big>', f.unused);
					detail('Closure', f.closure);
					detail('Variable', f['var']);
					detail('Exception', f.exception);
					detail('Outer', f.outer);
					detail('Global', f.global);
					detail('Label', f.label);
				}
			}

			// these two (is_own and to_array) are two helper functions needed a few lines below
			
					var is_own = function (object, name) {
						return Object.prototype.hasOwnProperty.call(object, name);
					}

					var to_array = function (o) {
						var a = [], k;
						for (k in o) {
							if (is_own(o, k)) {
								a.push(k);
							}
						}
						return a;
					}

            if (data.member) {
                a = to_array(data.member);
                if (a.length) {
                    a = a.sort();
                    m = '\n\nMembers (names and string literals that were used with dot notation, subscript notation, and object literals to name the members of objects): \n--------------------------------------------\n\n';
                    l = 10;
                    for (i = 0; i < a.length; i += 1) {
                        k = a[i];
                        n = k.name();
                        if (l + n.length > 72) {
                            o.push(m + '');
                            m = '    ';
                            l = 1;
                        }
                        l += n.length + 2;
                        if (data.member[k] === 1) {
                            n = '' + n + '';
                        }
                        if (i < a.length - 1) {
                            n += ', ';
                        }
                        m += n;
                    }
                    o.push(m + '');
                }
                o.push('\n');
            }
        return o.join('');
    };




ADSAFE.lib("init_jslint_ui", function (lib) {
    return function (dom) {

        var checkboxes = dom.q('input_checkbox'),
            goodparts = checkboxes.q('&goodpart'),
            //indent = dom.q('#JSLINT_INDENT'),
            input = dom.q('#JSLINT_INPUT'),
            jslintstring = dom.q('#JSLINT_JSLINTSTRING'),
            //maxerr = dom.q('#JSLINT_MAXERR'),
            //maxlen = dom.q('#JSLINT_MAXLEN'),
            option = lib.cookie.get(),
            output = dom.q('#JSLINT_OUTPUT'),
            predefined = dom.q('#JSLINT_PREDEF');

        function show_jslint_options() {

// Build and display a jslint control comment.
// The comment can be copied into a .js file.

            var a = [], name;
            for (name in option) {
                if (typeof ADSAFE.get(option, name) === 'boolean') {
                    a.push(name + ': true');
                }
            }
            //if (+option.maxerr > 0) {
            //    a.push('maxerr: ' + option.maxerr);
            //}
            a.push('maxerr: 500');
            //if (+option.maxlen > 0) {
            //    a.push('maxlen: ' + option.maxlen);
            //}
            a.push('maxlen: 0');
            //if (+option.indent > 0) {
            //    a.push('indent: ' + option.indent);
            //}
            a.push('indent: 4');
            jslintstring.value('/*jslint ' + a.join(', ') + ' */');
        }



		
        function update_options() {

// Make an object containing the current options.

            var value;
            option = {};
            checkboxes.q(':checked').each(function (bunch) {
                ADSAFE.set(option, bunch.getTitle(), true);
            });
            if (option.white) {
                //value = +indent.getValue();
                //if (value && value !== 4) {
                    option.indent = 4;
                //}
            }
            if (!option.passfail) {
                //value = +maxerr.getValue();
                //if (value && value !== 50) {
                    option.maxerr = 500;
                //}
            }
            //value = +maxlen.getValue();
            //option.maxlen = value && value > 0 ? value : 0;
            option.maxlen = 0;
            value = predefined.getValue();
            if (value) {
                option.predef = value.split(/\s*,\s*/);
            }
            show_jslint_options();
        }

		function addLineNumbers(input,output) {
				var removedComments = removeComments(input);
				
   				//alert("making the regex");
				var noStringsRegex = new RegExp( '(\"\\s*\".*?\")|(\"([^\"]|.)*?\")');
								
   				//alert("made the regex");
   			
				var removedCommentsMatches;
   				var removedCommentsMatch;
				var removedCommentsPosition;
				
				while(true){
	   				//alert("trying to find more strings");
					removedCommentsMatches = [];
					removedCommentsMatches = removedComments.match(noStringsRegex);
				
					if  (removedCommentsMatches === null) {					
						break;
					}
 	   				removedCommentsMatch = removedCommentsMatches[0];

					//alert("eliminating this string now: " + removedCommentsMatch);

					removedCommentsPosition = removedComments.search(noStringsRegex);
					//alert("at position " + removedCommentsPosition);
					removedComments = removedComments.substring(0,removedCommentsPosition) + "P5LintStringReplacement" +removedComments.substring(removedCommentsPosition+removedCommentsMatch.length);
					//alert("so now it is: " + removedComments);

				}
				
    			//alert("done now");
   				output.innerHTML = removedComments.replace( /\n/g, '<br />\n' );
				return removedComments;
		}	
		
		function findTheClasses(input,output) {
		
		// to do this is wrong cause there might be a comment with a line number in between class and the name
		
			  var pos = 0;
			  var nextOpenParenthesys = 0;
			  var num = -1;
			  var i = -1;
			  var extractedClassName = -1;
			  var classesList = [];
			  
			  output.innerHTML = "";
			  
			  // first we remove comments because
			  // a) they might contain pieces of code that we don't want to consider
			  // b) can be placed between key tokens that we need to scan
			  //    in order to find the class names
			  inputWithoutComments = input;			  
			  
			 // then this routine simply finds the tokens between "class" and "{"
			 // , which catches all the class names
			    //alert('finding classes');
			    var regexForFindingClasses = new RegExp("class\\s+[a-zA-Z][a-zA-Z0-9_]*",'g');
				//alert('regex for finding classes: ' + regexForFindingClasses);
				var classMatch = inputWithoutComments.match(regexForFindingClasses);
				//alert('number of classes found: ' + classMatch.length);
				
				if (classMatch !== null){				
				  for ( var i=0; i<classMatch.length; i++ ){			  			  

					extractedClassName = trim(classMatch[i].substring(6));
					//alert('extracted class name number '+i+' : ' + extractedClassName);
				    output.innerHTML += extractedClassName + ' ' ;
					classesList.push(extractedClassName);
					//alert(extractedClassName);
				  }
				}
			  
			  classesList.push("void");
			  classesList.push("byte");
			  classesList.push("char");
			  classesList.push("boolean");
			  classesList.push("int");
			  classesList.push("float");
			  classesList.push("String");
			  classesList.push("color");
			  classesList.push("PImage");
			  classesList.push("PFont");
			  classesList.push("PGraphics");
			  classesList.push("PShape");
			  classesList.push("Point");
			  

				
			  return classesList;
			  
			  

		}	

		function simplifyStringArrayDeclarationsWithLiteralInit(input,output,classesArray) {
			  
			// this function is to convert stuff like "new String(" into something like "new StringClass"
			// this is because later transformations transform all types into var, so "new String("
			// would become "new var(" which is not OK.
			
 					  output.innerHTML = "";

					  // first we remove comments
					  //inputWithoutComments = removeComments(input);			  

					  var lineCommentExp = "((\\r|\\n)*\\/\\*lineNumber[1234567890]*\\*\\/(\\r|\\n)*\\s*)*";
					  var howManyClasses = classesArray.length;

					  //alert('entering turnClassesIntoFunctions function');


						var allMatches=0;
							while (  true )	{
								allMatches++;

							  // let's find right side declarations of arrays
							  // that is, anything that has a class name and actually contains something
							  // after the opening square bracket
								var secondPart = "new\\s*"+ lineCommentExp + "String"+"\\s*"+ lineCommentExp +"[\\[\\]\\s]*\\{";
								var myRe = new RegExp(secondPart,"g");
								var foundLeftSideArrays = input.search(myRe);

								// go to the next class if there are no more results for this one
								if (foundLeftSideArrays == -1){
			                        //alert('found no classes');
									break;
								}

		                        //alert('found a class');

								var foundLeftSideArraysMatch = input.match(myRe);
		                        //alert('matched');
								var matchPortion = foundLeftSideArraysMatch[0];
		                        //alert('old header: ' + matchPortion);
								var foundLeftSideArraysMatchLength = matchPortion.length;  

								//to do this is not exactly right cause the function name could contain the string class, you
								// have to use a proper regular expression here
								// replace class with function, and add the empty parameters
								matchPortion = "\{";
		                        //alert('new function header: ' + matchPortion);

								//alert('found a match for right side array declaration of class ' + );

								input= input.substring(0,foundLeftSideArrays) + matchPortion + input.substring(foundLeftSideArrays+foundLeftSideArraysMatchLength);
							}
						output.innerHTML += input.replace( /\n/g, '<br />\n' );
						return input;
				
		}	
			  

		// example of left sides (also including some right sides for testing):
		
		// These:
		//		float m1[], m2[] = new float[4];
		//		float[] m3[] [][], m4[] = new float[2][9];
		//		float[] m5[], m6 = new float[7];
		//		int id1[] [], id2[], id3 [] [][], id4, id5[] [];
		
		// ...become:
		// 		var m1 , m2 = float[4];
		// 		var m3 , m4 = float[2][9];
		// 		var m5 , m6 = float[7];
		// 		var id1 , id2 , id3 , id4, id5 ;
		
		function findArrayDeclarationsLeftSides(input,output,classesArray) {

			  // to do 1) you regex the whole program every time when you look
			  // for successive array declarations - you obviously don't need to do
			  // that. You should regex the whole file only when you check
			  // a new type
			  
			  // to do 2) if at the end of this you still find something like
			  // type[] then it means that you are referencing a type / class
			  // that doesn't exist, you can report that.



			  // this should replace stuff like
			  // float mx[] = new float[num], my[] = new float[num];
			  // into
			  // var mx = new float[num], my = new float[num];
			  
			  output.innerHTML = "";
			  
			  // first we remove comments
			  var inputWithoutComments = input;			  
			  
			  //alert('entering the function');
			  			  
			  // let's find left side declarations of arrays
			  // i.e. stuff like float [] coswave;
			  
			  // this is the regex for eating a line comment ((\r|\n)*\/\*lineNumber[1234567890]*\*\/(\r|\n)*\s*)*

			  // so the actual regular expression is something like /float\s*((\r|\n)*\/\*lineNumber[1234567890]*\*\/(\r|\n)*\s*)*\[\s*((\r|\n)*\/\*lineNumber[1234567890]*\*\/(\r|\n)*\s*)*\]/g
			  
			  var lineCommentExp = "((\\r|\\n)*\\/\\*lineNumber[1234567890]*\\*\\/(\\r|\\n)*\\s*)*";
			  var second_part  = "\\s*"+ lineCommentExp +"[a-zA-Z0-9_]*"+"\\s*"+ lineCommentExp +"\\[\\s*"+lineCommentExp+"\\]";
			  var segment_part = '';
			  var myRe = '';
			  var foundLeftSideArrays = '';
				var howManyClasses = classesArray.length;
				//alert('entering the loop');
				var secondPart = '';
					
				var processingLintMatches = [];
				var positionOfSecondBracket = '';
				var foundLeftSideArraysMatches = [];
					
				
			  for ( var i=0; i<howManyClasses; i++ ){
			  while(true){
				//alert('inside the loop testing class ' + classesArray[i]);
				segment_part = classesArray[i];
				var buildingRegex = "[^a-zA-Z0-9_]"+segment_part + second_part;
				//alert('regex: ' + buildingRegex );
				myRe = new RegExp(buildingRegex ,"g");
				//alert('regexed');
				
				// to do you need only to find one instance, not all, this is a waste of time
				
				foundLeftSideArraysMatches = [];
				foundLeftSideArraysMatches = inputWithoutComments.match(myRe);
				if (foundLeftSideArraysMatches === null){
					//alert('found no instances of type ' + classesArray[i] );
					break;
				}
				foundLeftSideArraysMatches = foundLeftSideArraysMatches[0];
				var foundLeftSideArraysMatchesLength = foundLeftSideArraysMatches.length;
				
				//alert('found some instances of type ' + classesArray[i] );
				
					
					var foundLeftSideArraysMatchesPlace = inputWithoutComments.search(myRe);
					// take the type out
					foundLeftSideArraysMatches = foundLeftSideArraysMatches.replace(classesArray[i],' var ').replace(/\s*\[\s*\]/,' ');
					//alert('replaced with: ' + foundLeftSideArraysMatches);
					
					
					inputWithoutComments = inputWithoutComments.substring(0,foundLeftSideArraysMatchesPlace) + foundLeftSideArraysMatches + inputWithoutComments.substring(foundLeftSideArraysMatchesPlace + foundLeftSideArraysMatchesLength);
				
				//alert('program is now: ' + inputWithoutComments);
					
			  }
			  }
			  //alert('outside the loop');
				
//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////

			  // this should replace stuff like
			  // float mx[] = new float[num], my[] = new float[num];
			  // into
			  // float mx[] = new float[num], my = new float[num];
			  var second_part  = "\\,\\s*"+"[a-zA-Z0-9_]*"+"(\\s*"+ lineCommentExp +"\\[\\s*"+lineCommentExp + "\\]\\s*)+[\\,\\=;]";
			  var segment_part = '';
			  var myRe = '';
			  var foundLeftSideArrays = '';
				//alert('entering the loop');
				var secondPart = '';
					
				var processingLintMatches = [];
				var positionOfSecondBracket = '';
				var foundLeftSideArraysMatches = [];
					
				
			  while(true){
				//alert('inside the loop testing class ');
				//segment_part = classesArray[i];
				var buildingRegex = second_part;
				//alert('regex: ' + buildingRegex );
				myRe = new RegExp(buildingRegex ,"g");
				//alert('regexed');
				
				// to do you need only to find one instance, not all, this is a waste of time
				
				foundLeftSideArraysMatches = [];
				foundLeftSideArraysMatches = inputWithoutComments.match(myRe);
				if (foundLeftSideArraysMatches === null){
					//alert('found no instances' );
					break;
				}
				foundLeftSideArraysMatches = foundLeftSideArraysMatches[0];
				var foundLeftSideArraysMatchesLength = foundLeftSideArraysMatches.length;
				
				//alert('found one instance');
				
					
					var foundLeftSideArraysMatchesPlace = inputWithoutComments.search(myRe);
					// take the type out
					foundLeftSideArraysMatches = foundLeftSideArraysMatches.replace(/\s*\[\s*\]/,' ');
					//alert('replaced with: ' + foundLeftSideArraysMatches);
					
					
					inputWithoutComments = inputWithoutComments.substring(0,foundLeftSideArraysMatchesPlace ) + foundLeftSideArraysMatches + inputWithoutComments.substring(foundLeftSideArraysMatchesPlace + foundLeftSideArraysMatchesLength);
				
				//alert('program is now: ' + inputWithoutComments);
					
			  }
			  //alert('outside the loop');

//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////

			  // this should replace stuff like
			  // var mx[] = new float[num], my[] = new float[num];
			  // into
			  // var mx = new float[num], my = new float[num];
			  var second_part  = "var\\s*"+"[a-zA-Z0-9_]*"+"(\\s*"+ lineCommentExp +"\\[\\s*"+lineCommentExp + "\\]\\s*)+[\\=;\\,]";
			  var segment_part = '';
			  var myRe = '';
			  var foundLeftSideArrays = '';
				//alert('entering the loop');
				var secondPart = '';
					
				var processingLintMatches = [];
				var positionOfSecondBracket = '';
				var foundLeftSideArraysMatches = [];
					
				
			  while(true){
				//alert('inside the loop testing class ');
				//segment_part = classesArray[i];
				var buildingRegex = second_part;
				//alert('regex: ' + buildingRegex );
				myRe = new RegExp(buildingRegex ,"g");
				//alert('regexed');
				
				// to do you need only to find one instance, not all, this is a waste of time
				
				foundLeftSideArraysMatches = [];
				foundLeftSideArraysMatches = inputWithoutComments.match(myRe);
				if (foundLeftSideArraysMatches === null){
					//alert('found no instances' );
					break;
				}
				foundLeftSideArraysMatches = foundLeftSideArraysMatches[0];
				var foundLeftSideArraysMatchesLength = foundLeftSideArraysMatches.length;
				
				//alert('found one instance');
				
					
					var foundLeftSideArraysMatchesPlace = inputWithoutComments.search(myRe);
					// take the type out
					foundLeftSideArraysMatches = foundLeftSideArraysMatches.replace(/\s*\[\s*\]/,' ');
					//alert('replaced with: ' + foundLeftSideArraysMatches);
					
					
					inputWithoutComments = inputWithoutComments.substring(0,foundLeftSideArraysMatchesPlace ) + foundLeftSideArraysMatches + inputWithoutComments.substring(foundLeftSideArraysMatchesPlace + foundLeftSideArraysMatchesLength);
				
				//alert('program is now: ' + inputWithoutComments);
					
			  }
			  //alert('outside the loop');

			  
				output.innerHTML += inputWithoutComments.replace( /\n/g, '<br />\n' );
				return inputWithoutComments;

		}	

		function deleteExtendsAndImplements(input,output,classesArray) {
			//alert('starting deleteExtendsAndImplements');
			  // to do 1) you regex the whole program every time when you look
			  // for successive array declarations - you obviously don't need to do
			  // that. You should regex the whole file only when you check
			  // a new type
			  
			  // to do 2) if at the end of this you still find something like
			  // type[] then it means that you are referencing a type / class
			  // that doesn't exist, you can report that.



			  // this should replace stuff like
			  // float mx[] = new float[num], my[] = new float[num];
			  // into
			  // var mx = new float[num], my = new float[num];
			  
			  output.innerHTML = "";
			  
			  // first we remove comments
			  var inputWithoutComments = input;			  
			  
			  //alert('entering the function');
			  			  
			  // let's find left side declarations of arrays
			  // i.e. stuff like float [] coswave;
			  
			  // this is the regex for eating a line comment ((\r|\n)*\/\*lineNumber[1234567890]*\*\/(\r|\n)*\s*)*

			  // so the actual regular expression is something like /float\s*((\r|\n)*\/\*lineNumber[1234567890]*\*\/(\r|\n)*\s*)*\[\s*((\r|\n)*\/\*lineNumber[1234567890]*\*\/(\r|\n)*\s*)*\]/g
			  
			  var lineCommentExp = "((\\r|\\n)*\\/\\*lineNumber[1234567890]*\\*\\/(\\r|\\n)*\\s*)*";
			  var second_part  = "\\s+((extends|implements)\\s+[a-zA-Z0-9_]*\\,*)+"+"\\s*"+ lineCommentExp +"\\{";
			  var segment_part = '';
			  var myRe = '';
			  var foundLeftSideArrays = '';
				var howManyClasses = classesArray.length;
				//alert('entering the loop');
				var secondPart = '';
					
				var processingLintMatches = [];
				var positionOfSecondBracket = '';
				var foundLeftSideArraysMatches = [];
					
				
			  for ( var i=0; i<howManyClasses; i++ ){
			  while(true){
				//alert('inside the loop testing class ' + classesArray[i]);
				segment_part = classesArray[i];
				var buildingRegex = "class\\s+"+segment_part + second_part;
				//alert('regex: ' + buildingRegex );
				myRe = new RegExp(buildingRegex ,"g");
				//alert('regexed');
				
				// to do you need only to find one instance, not all, this is a waste of time
				
				foundLeftSideArraysMatches = [];
				foundLeftSideArraysMatches = inputWithoutComments.match(myRe);
				if (foundLeftSideArraysMatches === null){
					//alert('found no instances of type ' + classesArray[i] );
					break;
				}
				usedExtendsOrImplements = true;
				foundLeftSideArraysMatches = foundLeftSideArraysMatches[0];
				var foundLeftSideArraysMatchesLength = foundLeftSideArraysMatches.length;
				
				//alert('found some instances of type ' + classesArray[i] );
				
					
					var foundLeftSideArraysMatchesPlace = inputWithoutComments.search(myRe);
					// take the type out
					foundLeftSideArraysMatches = foundLeftSideArraysMatches.replace(/\s+((extends|implements)\s+[a-zA-Z0-9_]*\,*)+/,' ');
					//alert('replaced with: ' + foundLeftSideArraysMatches);
					
					
					inputWithoutComments = inputWithoutComments.substring(0,foundLeftSideArraysMatchesPlace) + foundLeftSideArraysMatches + inputWithoutComments.substring(foundLeftSideArraysMatchesPlace + foundLeftSideArraysMatchesLength);
				
				//alert('program is now: ' + inputWithoutComments);
					
			  }
			  }
			  //alert('outside the loop');
			  
				output.innerHTML += inputWithoutComments.replace( /\n/g, '<br />\n' );
				return inputWithoutComments;
		}
		
		function findArrayDeclarationsRightSides(input,output,classesArray) {
			  
			  output.innerHTML = "";
			  
			  // first we remove comments
			  //inputWithoutComments = removeComments(input);			  

			  var lineCommentExp = "((\\r|\\n)*\\/\\*lineNumber[1234567890]*\\*\\/(\\r|\\n)*\\s*)*";
			  var howManyClasses = classesArray.length;
			  
			  for ( var i=0; i<howManyClasses; i++ ){

				var allMatches=0;
					while (  true )	{
						allMatches++;
				  
					  // let's find right side declarations of arrays
					  // that is, anything that has a class name and actually contains something
					  // after the opening square bracket
						var secondPart = "new\\s*"+ lineCommentExp + classesArray[i]+"\\s*"+ lineCommentExp +"\\[";
						var myRe = new RegExp(secondPart,"g");
						var foundLeftSideArrays = input.search(myRe);
						
						// go to the next class if there are no more results for this one
						if (foundLeftSideArrays == -1){
							break;
						}
						
						//alert('found a match for right side array declaration of class ' + );
					
						input= input.substring(0,foundLeftSideArrays) + input.substring(foundLeftSideArrays+3);
					}
				}
				output.innerHTML += input.replace( /\n/g, '<br />\n' );
				return input;
				
		}	

		function getRidOfEmptyBracketsInArrayDeclarationsRightSide(input,output,classesArray) {
			  
			  output.innerHTML = "";
			  
			  // first we remove comments
			  //inputWithoutComments = removeComments(input);			  

			  var lineCommentExp = "((\\r|\\n)*\\/\\*lineNumber[1234567890]*\\*\\/(\\r|\\n)*\\s*)*";
			  var howManyClasses = classesArray.length;
			  
			  //alert('entering turnClassesIntoFunctions function');
			

				var allMatches=0;
					for ( var i=0; i<howManyClasses; i++ ){ 
						allMatches++;
				  
					  // let's find right side declarations of arrays
					  // that is, anything that has a class name and actually contains something
					  // after the opening square bracket
						//alert('building the regular expression for type ' + classesArray[i]);
						var secondPart = "new\\s*"+ lineCommentExp + classesArray[i]+"\\s*"+ lineCommentExp +"[a-zA-Z\\s1234567890\\[\\]\\+\\-\\*\\(\\)]*;";
						//alert('built the regular expression');
						var myRe = new RegExp(secondPart,"g");
						var foundLeftSideArrays = input.search(myRe);

						// go to the next class if there are no more results for this one
						if (foundLeftSideArrays == -1){
	                        //alert('found no array declarations');
							continue;
						}
						
                        //alert('found an array declarations');

						var foundLeftSideArraysMatch = input.match(myRe);
                        //alert('matched');
						var matchPortion = foundLeftSideArraysMatch[0];
                        //alert('old array declaration: ' + matchPortion);
						var foundLeftSideArraysMatchLength = matchPortion.length;  
						
						//to do this is not exactly right cause the function name could contain the string class, you
						// have to use a proper regular expression here
						// replace class with function, and add the empty parameters
						matchPortion = matchPortion.replace(/\[\s*\]/g,'[placeholder]');
                        //alert('new array declaration: ' + matchPortion);
												
						//alert('found a match for right side array declaration of class ' + );
					
						input= input.substring(0,foundLeftSideArrays) + matchPortion + input.substring(foundLeftSideArrays+foundLeftSideArraysMatchLength);
					}
				output.innerHTML += input.replace( /\n/g, '<br />\n' );
				return input;
				
		}	

		function turnClassesIntoFunctions(input,output,classesArray) {
			  
			  output.innerHTML = "";
			  
			  // first we remove comments
			  //inputWithoutComments = removeComments(input);			  

			  var lineCommentExp = "((\\r|\\n)*\\/\\*lineNumber[1234567890]*\\*\\/(\\r|\\n)*\\s*)*";
			  var howManyClasses = classesArray.length;
			  
			  //alert('entering turnClassesIntoFunctions function');
			

				var allMatches=0;
					while (  true )	{
						allMatches++;
				  
					  // let's find right side declarations of arrays
					  // that is, anything that has a class name and actually contains something
					  // after the opening square bracket
						var secondPart = "class\\s*"+ lineCommentExp + "[a-zA-Z1234567890_]+"+"[\\s\\r\\n]*"+ lineCommentExp +"\\{";
						var myRe = new RegExp(secondPart,"g");
						//alert('turning classes into functions regexp: ' + myRe);
						var foundLeftSideArrays = input.search(myRe);

						// go to the next class if there are no more results for this one
						if (foundLeftSideArrays == -1){
	                        //alert('found no classes');
							break;
						}
						
                        //alert('found a class');

						var foundLeftSideArraysMatch = input.match(myRe);
                        //alert('matched');
						var matchPortion = foundLeftSideArraysMatch[0];
                        //alert('old class header: ' + matchPortion);
						var foundLeftSideArraysMatchLength = matchPortion.length;  
						
						//to do this is not exactly right cause the function name could contain the string class, you
						// have to use a proper regular expression here
						// replace class with function, and add the empty parameters
						matchPortion = matchPortion.replace(/class/,"function");
						matchPortion = matchPortion.replace(/\{/,"() {");
                        //alert('new function header: ' + matchPortion);
												
						//alert('found a match for right side array declaration of class ' + );
					
						input= input.substring(0,foundLeftSideArrays) + matchPortion + input.substring(foundLeftSideArrays+foundLeftSideArraysMatchLength);
					}
				output.innerHTML += input.replace( /\n/g, '<br />\n' );
				return input;
				
		}	


		function findDeclarationsAndReturnTypeInsideFunctionDefinitions(input,output,classesArray) {

			  //alert('starting function declarations adjustments');
			  //alert('input: ' + input);
			  output.innerHTML = "";

			  // first we remove comments
			  //inputWithoutComments = removeComments(input);			  

			  var lineCommentExp = "((\\r|\\n)*\\/\\*lineNumber[1234567890]*\\*\\/(\\r|\\n)*\\s*)*";
			  var howManyClasses = classesArray.length;
			  var myRe;
			  var foundLeftSideArraysPlace;
			  var foundLeftSideArrays;
			  var foundLeftSideArraysLength;
			  var secondPart;
						
			  for ( var i=0; i<howManyClasses; i++ ){

				var allMatches=0;
					while (  true )	{
						allMatches++;
				  
					  // let's find right side declarations of arrays
					  // that is, anything that has a class name and actually contains something
					  // after the opening square bracket
					
				      // NOTE THAT THIS ONLY TAKES CARE OF FUNCTIONS THAT SPECIFY A RETURN TYPE (EVEN IF IT'S VOID)
				      // I.E. it doesn't deal with constructors
						secondPart = classesArray[i] + "\\s+" + lineCommentExp + "[a-zA-Z1234567890_]+"+"\\s*" + lineCommentExp +"\\(\\s*" + lineCommentExp + "[\\/a-zA-Z1234567890_\\,\\s\\*]*\\)" + "\\s*" + lineCommentExp + "\\{";
						//alert('building regex for functions returning ' + classesArray[i]);
						myRe = new RegExp("[^a-zA-Z0-9_]"+secondPart);
						//alert('searching for functions returning ' + classesArray[i]);
						foundLeftSideArraysPlace = input.search(myRe);

						// go to the next class if there are no more results for this one
						if (foundLeftSideArraysPlace  == -1){
						//alert('found no functions returning ' + classesArray[i]);
							break;
						}
						foundLeftSideArraysPlace++;

   					
						//alert('found one function returning ' + classesArray[i]);
						
						foundLeftSideArrays = input.match(myRe);
						foundLeftSideArraysLength = foundLeftSideArrays[0].length;
						foundLeftSideArraysLength--;

						//alert('the untouched part is: ' + input.substring(foundLeftSideArraysPlace + foundLeftSideArraysLength));
						
						foundLeftSideArrays = foundLeftSideArrays[0].substring(1);
						//alert('here it is: ' + foundLeftSideArrays);
 
 						  // this is because function definitions could contain arrays
						  // to do : you should take care of the line comments that could be
						  // between the square brackets.
   						  var arrayBracketsInsideFunctionDefinitions = new RegExp("\\s*\\[\\s*\\]\\s*","g");
						  foundLeftSideArrays = foundLeftSideArrays.replace(arrayBracketsInsideFunctionDefinitions,'');

   						  // this is because if you transform something like this
						  //    float testFunction(float[] b, float c) {
						  // then the array catcher transforms that into
						  //    float testFunction(var b, float c) { 
						  // so we want to get rid of that var
						  var varInsideFunctionDefinitions = new RegExp("\\s*var\\s*","g");
						  foundLeftSideArrays = foundLeftSideArrays.replace(varInsideFunctionDefinitions,'');
   						
						  for ( var j=0; j<howManyClasses; j++ ){
							//alert('eliminating the type ' + classesArray[j] + 'inside the parenthesys');
						    // the type name is preceded by either an open parenthesys, a comma
							// or a space
							var regexsoonafterPar = new RegExp("\\("+classesArray[j]+"\\s","g");
							var regexsoonafterComma = new RegExp("\\,"+classesArray[j]+"\\s","g");
							var regexsoonafterSpace = new RegExp("\\s"+classesArray[j]+"\\s","g");
							foundLeftSideArrays = foundLeftSideArrays.replace(regexsoonafterPar,'(');
							foundLeftSideArrays = foundLeftSideArrays.replace(regexsoonafterComma,',');
							foundLeftSideArrays = foundLeftSideArrays.replace(regexsoonafterSpace,' ');
						  
						  }
						
						//alert('found a match for right side array declaration of class ' + );

						// in the line with the function declaration, now all types within
						// the parenthesys should be gone
						
						// substitute the function declaration in the program. Also remove the return type and change it into "function"
						input= input.substring(0,foundLeftSideArraysPlace) + "function " + foundLeftSideArrays.substring(classesArray[i].length) + input.substring(foundLeftSideArraysPlace + foundLeftSideArraysLength);
					}
				}
				output.innerHTML += input.replace( /\n/g, '<br />\n' );
				return input;

		}

		function findDeclarationsAndReturnTypeInsideConstructors(input,output,classesArray) {
              
			  //alert('starting function declarations adjustments');
			  //alert('input: ' + input);
			  output.innerHTML = "";

			  var lineCommentExp = "((\\r|\\n)*\\/\\*lineNumber[1234567890]*\\*\\/(\\r|\\n)*\\s*)*";
			  var howManyClasses = classesArray.length;
			  var myRe;
			  var foundLeftSideArraysPlace;
			  var foundLeftSideArrays;
			  var foundLeftSideArraysLength;
			  var secondPart;
						
			  for ( var i=0; i<howManyClasses; i++ ){

				var allMatches=0;
					while (  true )	{
						allMatches++;
				  
					  // let's find right side declarations of arrays
					  // that is, anything that has a class name and actually contains something
					  // after the opening square bracket
					
				      // NOTE THAT THIS ONLY TAKES CARE OF FUNCTIONS THAT SPECIFY A RETURN TYPE (EVEN IF IT'S VOID)
				      // I.E. it doesn't deal with constructors
						secondPart = classesArray[i] + "\\s*" + lineCommentExp + "\\(\\s*" + lineCommentExp + "[\\/a-zA-Z1234567890_\\,\\s\\*]*\\)"+ "\\s*" + lineCommentExp + "\\{";
						//alert('building regex for functions returning ' + classesArray[i]);
						myRe = new RegExp("[^a-zA-Z0-9_]"+secondPart,"g");
						//alert('regex: ' + myRe);
						foundLeftSideArraysPlace = input.search(myRe);

						// go to the next class if there are no more results for this one
						if (foundLeftSideArraysPlace  == -1){
						    //alert('found no constructors for ' + classesArray[i]);
							break;
						}
						foundLeftSideArraysPlace++;

						
						//alert('found one constructor for ' + classesArray[i]);
						
						foundLeftSideArrays = input.match(myRe);
						foundLeftSideArraysLength = foundLeftSideArrays[0].length;
						foundLeftSideArraysLength--;

						//alert('the untouched part is: ' + input.substring(foundLeftSideArraysPlace + foundLeftSideArraysLength));
						
						foundLeftSideArrays = foundLeftSideArrays[0].substring(1);
						//alert('here is the match: ' + foundLeftSideArrays);
 
 						  // this is because function definitions could contain arrays
						  // to do : you should take care of the line comments that could be
						  // between the square brackets.
   						  var arrayBracketsInsideFunctionDefinitions = new RegExp("\\s*\\[\\s*\\]\\s*","g");
						  foundLeftSideArrays = foundLeftSideArrays.replace(arrayBracketsInsideFunctionDefinitions,'');

   						  // this is because if you transform something like this
						  //    float testFunction(float[] b, float c) {
						  // then the array catcher transforms that into
						  //    float testFunction(var b, float c) { 
						  // so we want to get rid of that var
						  var varInsideFunctionDefinitions = new RegExp("\\s*var\\s*","g");
						  foundLeftSideArrays = foundLeftSideArrays.replace(varInsideFunctionDefinitions,'');
   						
						  for ( var j=0; j<howManyClasses; j++ ){
							//alert('eliminating the type ' + classesArray[j] + 'inside the parenthesys');
						    // the type name is preceded by either an open parenthesys, a comma
							// or a space
							var regexsoonafterPar = new RegExp("\\("+classesArray[j]+"\\s","g");
							var regexsoonafterComma = new RegExp("\\,"+classesArray[j]+"\\s","g");
							var regexsoonafterSpace = new RegExp("\\s"+classesArray[j]+"\\s","g");
							foundLeftSideArrays = foundLeftSideArrays.replace(regexsoonafterPar,'(');
							foundLeftSideArrays = foundLeftSideArrays.replace(regexsoonafterComma,',');
							foundLeftSideArrays = foundLeftSideArrays.replace(regexsoonafterSpace,' ');
							
						  
						  }
						
						//alert('the constructor without types inside the parenthesys looks like this: ' + foundLeftSideArrays);
						
						// substitute the function declaration in the program. Also remove the return type and change it into "function"
						//alert('foundLeftSideArrays: ' + foundLeftSideArrays);
						//alert('apparently the class is long: '+classesArray[i].length);
						//alert('class name: >'+classesArray[i]+'<');
						//alert('so taking away the class name in the constructor: '+ foundLeftSideArrays.substring(classesArray[i].length ) );
						input= input.substring(0,foundLeftSideArraysPlace) + "function " + classesArray[i] + "/*constructor*/ " + foundLeftSideArrays.substring(classesArray[i].length ) + input.substring(foundLeftSideArraysPlace + foundLeftSideArraysLength);
						//alert('program after substitution: >'+input);
					}
				}
				output.innerHTML += input.replace( /\n/g, '<br />\n' );
				return input;

		}


		function eliminateMultidimentionalDeclarationsRemainants(input,output,classesArray) {
			// if you declare something like float[][] distances;  
			// then it normally gets transformed to var[] distances;
			// so now we want to sweep all those [] away
			
			  output.innerHTML = "";
			  
			  // first we remove comments
			  //inputWithoutComments = removeComments(input);			  

			  var lineCommentExp = "var\\s*(\\[\\s*\\])*";

				  
					  // let's find right side declarations of arrays
					  // that is, anything that has a class name and actually contains something
					  // after the opening square bracket
    					var myRe = new RegExp(lineCommentExp,"g");
						input = input.replace(myRe,'var ');
						//alert('replacing casting to ' + classesArray[i] + ' '+ input);
						
				output.innerHTML += input.replace( /\n/g, '<br />\n' );
				return input;
				
		}	


		function eliminateCastings(input,output,classesArray) {
			  
			//alert('deleting castings');
			  output.innerHTML = "";
			  
			  // first we remove comments
			  //inputWithoutComments = removeComments(input);			  

			  var lineCommentExp = "((\\r|\\n)*\\/\\*lineNumber[1234567890]*\\*\\/(\\r|\\n)*\\s*)*";
			  var howManyClasses = classesArray.length;
			  
			  for ( var i=0; i<howManyClasses; i++ ){

				  
					  // let's find right side declarations of arrays
					  // that is, anything that has a class name and actually contains something
					  // after the opening square bracket
						var secondPart = "\\("+ lineCommentExp + classesArray[i]+"\\s*"+ lineCommentExp +"\\)";
						var myRe = new RegExp(secondPart,"g");
						input = input.replace(myRe,'');
						//alert('replacing casting to ' + classesArray[i] + ' '+ input);
						
				}
				output.innerHTML += input.replace( /\n/g, '<br />\n' );
				return input;
				
		}	

        

        //  var lineCommentExp = "((\\r|\\n)*\\/\\*lineNumber[1234567890]*\\*\\/(\\r|\\n)*\\s*)*";
		//  var second_part  = "\\s+"+lineCommentExp+"[a-zA-Z1234567890_]*\\s*"+lineCommentExp+"[\\;\\,\\s]";
		
		function transformTheOtherDeclarations(input,output,classesArray) {

			  //alert('starting function declarations adjustments');
			  //alert('input: ' + input);
			  output.innerHTML = "";

			  // first we remove comments
			  //inputWithoutComments = removeComments(input);			  

			  var lineCommentExp = "((\\r|\\n)*\\/\\*lineNumber[1234567890]*\\*\\/(\\r|\\n)*\\s*)*";
			  var howManyClasses = classesArray.length;
			  var myRe;
			  var foundLeftSideArraysPlace;
			  var foundLeftSideArrays;
			  var foundLeftSideArraysLength;
			  var secondPart;
						
			  for ( var i=0; i<howManyClasses; i++ ){

				var allMatches=0;
					while (  true )	{
						allMatches++;
				  
					  // let's find right side declarations of arrays
					  // that is, anything that has a class name and actually contains something
					  // after the opening square bracket
						secondPart = classesArray[i] + "\\s+"+lineCommentExp+"[a-zA-Z][a-zA-Z0-9_]*\\s*"+lineCommentExp+"[\\;\\,\\=]";
						//alert('building regex for functions returning ' + classesArray[i]);
						myRe = new RegExp("[^a-zA-Z0-9_]"+secondPart);
						//alert('searching for type ' + classesArray[i]);
						foundLeftSideArraysPlace = input.search(myRe);

						// go to the next class if there are no more results for this one
						if (foundLeftSideArraysPlace  == -1){
						    //alert('found no types ' + classesArray[i]);
							break;
						}
						foundLeftSideArraysPlace++;

						
						//alert('found one function returning ' + classesArray[i]);
						
						foundLeftSideArrays = input.match(myRe);
						foundLeftSideArraysLength = foundLeftSideArrays[0].length;
						foundLeftSideArraysLength--;
                        var untouchedPart = input.substring(foundLeftSideArraysPlace + foundLeftSideArraysLength);
						//alert('the untouched part is: ' + input.substring(foundLeftSideArraysPlace + foundLeftSideArraysLength));
						
						foundLeftSideArrays = foundLeftSideArrays[0].substring(1);
						//alert('here it is: ' + foundLeftSideArrays);
 						
						var regexsoonafterPar;
						//var foundLeftSideArraysPlace;

						  for ( var j=0; j<howManyClasses; j++ ){
							//alert('eliminating the type ' + classesArray[j] + 'inside the parenthesys');
						    // the type name is preceded by either an open parenthesys, a comma
							// or a space
							regexsoonafterPar = new RegExp(classesArray[j]+"\\s","g");
							var foundLeftSideArraysPlace2 = foundLeftSideArrays.search(regexsoonafterPar,'');
							foundLeftSideArrays = foundLeftSideArrays.replace(regexsoonafterPar,'');
							if (foundLeftSideArraysPlace2 !== -1){
								break;
							}
						  
						  }
						//alert('the replaced version is '+foundLeftSideArrays);
						
						//alert('found a match for right side array declaration of class ' + );

						// in the line with the function declaration, now all types within
						// the parenthesys should be gone
						
						// substitute the function declaration in the program. Also remove the return type and change it into "var"
						
						input= input.substring(0,foundLeftSideArraysPlace) + "var " + foundLeftSideArrays + untouchedPart;
						//alert('substitution: '+input);
					}
				}
				
				
				output.innerHTML += input.replace( /\n/g, '<br />\n' );
				return input;

		}	
        

		// this is really quite bad, because we literally pick the first open and closed
		// curly brace if thet are after an assignment, and we change them to square.
		// The opening bracket probably works OK in all cases, but this naive way of
		// finding the closing square really doesn't, like, imagine for example
		// that you initialize an array of strings that contain some closed curly braces...
		// or an array of initialised arrays...
		// you could probably get by by removing all the strings and balancing the
		// parenthesys to zero though.
		
		function convertArrayInitFromCurlyToSquare(input,output,classesArray) {
			  
			  output.innerHTML = "";
			  
			  // first we remove comments
			  //inputWithoutComments = removeComments(input);			  
              
			  // an array initialisation can be after an equal, or can be after an open parenthesys or a comma if it's used inside
			  // a costructor or in a function call.
			  var arrayInitStart = "[\\=\,\(]\\s*\\{";
			  var howManyClasses = classesArray.length;
			  
					while (  true )	{
				  
						var myRe = new RegExp(arrayInitStart,"g");
						var foundLeftSideArrays = input.search(myRe);
						
						// go to the next class if there are no more results for this one
						if (foundLeftSideArrays == -1){
							//alert('found no array inits');
							break;
						}

						var foundLeftSideArraysMatch = input.match(myRe);
						foundLeftSideArraysMatch = foundLeftSideArraysMatch[0];
						var foundLeftSideArraysMatchLength =  foundLeftSideArraysMatch.length;
						
						var restOfTheProgram = input.substring(foundLeftSideArrays+foundLeftSideArraysMatchLength);
						//alert(' rest Of The Program: '+restOfTheProgram);
						var lengthOfArrayDefinition = 0;
						
						// to do : we should check two twings:
						var counter = 0;
						for (var j = 0 ; j < restOfTheProgram.length; j++){
							//alert('looking at char '+j+' of definition: '+restOfTheProgram.charAt(j));
							if  (restOfTheProgram.charAt(j) == '\{'){
								counter++;
							}
							else if (restOfTheProgram.charAt(j) == '\}'){ 
								counter--;
							}
							if (counter < 0) {
								lengthOfArrayDefinition = j;
								break;
							}
							
						}
						var arrayDefinition = input.substring(foundLeftSideArrays+foundLeftSideArraysMatchLength,foundLeftSideArrays+foundLeftSideArraysMatchLength+lengthOfArrayDefinition+1);
						//alert('array definition body: '+ arrayDefinition);
						
						//alert('found a match for right side array declaration of class ' + );
					    var newArrayDefinition = arrayDefinition.replace(/}/g,"]").replace(/{/g,"[");
					    //alert('new array definition: ' + newArrayDefinition);
						input= input.substring(0,foundLeftSideArrays + foundLeftSideArraysMatchLength - 1) + "[" + newArrayDefinition + input.substring(foundLeftSideArrays+foundLeftSideArraysMatchLength+lengthOfArrayDefinition+1);
					}

				output.innerHTML += input.replace( /\n/g, '<br />\n' );
				return input;
				
		}	

				function simplifyOtherOddLiterals(input,output,classesArray) {
			
			  output.innerHTML = "";
			  
			

			  input = input.replace(/#[0-9a-zA-Z][0-9a-zA-Z][0-9a-zA-Z][0-9a-zA-Z][0-9a-zA-Z][0-9a-zA-Z]/g,'P5LintHexColorReplacement');
				input = input.replace(/[0-9]+\.[0-9]+f/g,'P5LintFloatReplacement');		
				output.innerHTML += input.replace( /\n/g, '<br />\n' );
				return input;
				
		}	

		function removePublicPrivateStaticFinalStuff(input,output,classesArray) {

			  //alert('starting function declarations adjustments');
			  //alert('input: ' + input);
			  output.innerHTML = "";

			  // first we remove comments
			  //inputWithoutComments = removeComments(input);			  

			  var lineCommentExp = "((\\r|\\n)*\\/\\*lineNumber[1234567890]*\\*\\/(\\r|\\n)*\\s*)*";
			  var howManyClasses = classesArray.length;
			  var myRe;
			  var foundLeftSideArraysPlace;
			  var foundLeftSideArrays;
			  var foundLeftSideArraysLength;
			  var secondPart;
						

				var allMatches=0;
					while (  true )	{
						allMatches++;
				  
					  // let's find right side declarations of arrays
					  // that is, anything that has a class name and actually contains something
					  // after the opening square bracket
						//alert('building regex for functions returning ' + classesArray[i]);
						myRe = new RegExp("[^a-zA-Z0-9_](public|private|static|final)+\\s+var");
						//alert('searching for functions returning ' + classesArray[i]);
						foundLeftSideArraysPlace = input.search(myRe);

						// go to the next class if there are no more results for this one
						if (foundLeftSideArraysPlace  == -1){
						//alert('found no functions returning ' + classesArray[i]);
							break;
						}
						foundLeftSideArraysPlace++;

						
						//alert('found one function returning ' + classesArray[i]);
						
						foundLeftSideArrays = input.match(myRe);
						foundLeftSideArraysLength = foundLeftSideArrays[0].length;
						foundLeftSideArraysLength--;
                        var untouchedPart = input.substring(foundLeftSideArraysPlace + foundLeftSideArraysLength);
						//alert('the untouched part is: ' + input.substring(foundLeftSideArraysPlace + foundLeftSideArraysLength));
						
						
						
						input= input.substring(0,foundLeftSideArraysPlace) + " var " + untouchedPart;
						//alert('substitution: '+input);
					}
				
						// javascript doesn't support super();
						// and JSLint reports an error and blocks when
						// it sees it, so we are replacing it with a
						// placeholder
						while (true){
							myRe = new RegExp("[^a-zA-Z0-9_]super\\s*\\(");
							foundLeftSideArraysPlace = input.search(myRe);

							if (foundLeftSideArraysPlace  == -1){
								//alert('not found any super');
								break;
							}
						
							//alert('found a super');
							foundLeftSideArraysPlace++;
							foundLeftSideArrays = input.match(myRe);
							foundLeftSideArraysLength = foundLeftSideArrays[0].length;
							foundLeftSideArraysLength--;
							var untouchedPart = input.substring(foundLeftSideArraysPlace + foundLeftSideArraysLength);
							input= input.substring(0,foundLeftSideArraysPlace) + " P5LintSuperReplacement(" + untouchedPart;	

						}
							
						
				
				output.innerHTML += input.replace( /\n/g, '<br />\n' );
				return input;

		}	

		
// Restore the options from a JSON cookie.
/*
        if (!option || typeof option !== 'object') {
            option = {};
        } else {
            checkboxes.each(function (bunch) {
                bunch.check(ADSAFE.get(option, bunch.getTitle()));
            });
            indent.value(option.indent || '4');
            maxlen.value(option.maxlen || '');
            maxerr.value(option.maxerr || '50');
            predefined.value(ADSAFE.isArray(option.predef) ?
                    option.predef.join(',') : '');
        }
*/
        show_jslint_options();

// Display the edition.

        //dom.q('#JSLINT_EDITION').value('Edition ' + lib.edition());

// Add click event handlers to the [JSLint] and [clear] buttons.

        dom.q('input&jslint').on('click', function (e) {

// Make a JSON cookie of the option object.

            //lib.cookie.set(option);


			//alert('trying to find the dom stuff');
			//dom.q('#LIST_OF_CLASSES_OUTPUT').innerHTML='<div><i>No miao variables introduced.</i></div>';
			//dom.q('#LIST_OF_CLASSES_OUTPUT').value('at least is not empty');

		    // the best way to replace stuff is to do the most specific replacements first,
		    // and then moving on to the more generic declarations.
		    // this is why for example we replace array declarations first and the normal declarations
		
			var strippedProgram = addLineNumbers(input.getValue(),document.getElementById("WITH_LINE_NUMBERS"));
			//alert('theClassList');
			var theClassList = findTheClasses(strippedProgram,document.getElementById("LIST_OF_CLASSES_OUTPUT"));
			//alert('theClassList done');
			var simplifiedStringArrayDeclarationsWithLiteralInit = simplifyStringArrayDeclarationsWithLiteralInit(strippedProgram,document.getElementById("simplifyStringArrayDeclarationsWithLiteralInit"),theClassList);
			var programWithoutArrayDeclarationsLeftSide = findArrayDeclarationsLeftSides(simplifiedStringArrayDeclarationsWithLiteralInit,document.getElementById("ARRAY_DECLARATIONS_LEFT_SIDES"),theClassList);
			var programWithoutEmptyArrayDeclarations = getRidOfEmptyBracketsInArrayDeclarationsRightSide(programWithoutArrayDeclarationsLeftSide,document.getElementById("programWithoutEmptyArrayDeclarations"),theClassList);
			var programWithoutArrayDeclarationsRightSide = findArrayDeclarationsRightSides(programWithoutEmptyArrayDeclarations,document.getElementById("ARRAY_DECLARATIONS_RIGHT_SIDES"),theClassList);
			var programWithFixedFunctionDeclarations = findDeclarationsAndReturnTypeInsideFunctionDefinitions(programWithoutArrayDeclarationsRightSide,document.getElementById("TYPE_INSIDE_FUNCTION_DEFINITION"),theClassList);
			var programWithCleanConstructors = findDeclarationsAndReturnTypeInsideConstructors(programWithFixedFunctionDeclarations,document.getElementById("CLEAN_CONSTRUCTORS"),theClassList);
			var programWithoutMultidimentionalDeclarations = eliminateMultidimentionalDeclarationsRemainants(programWithCleanConstructors,document.getElementById("ELIMINATED_MULTIDIM_DEFINITIONS"),theClassList);
			var programWithoutCastings = eliminateCastings(programWithoutMultidimentionalDeclarations,document.getElementById("TYPE_INSIDE_CASTING"),theClassList);
			var programsWithoutTypesInDeclarations = transformTheOtherDeclarations(programWithoutCastings,document.getElementById("ALL_OTHER_DECLARATIONS"),theClassList);
            var noExtendsImplements = deleteExtendsAndImplements(programsWithoutTypesInDeclarations,document.getElementById("NO_EXTENDS_IMPLEMENTS"),theClassList);
			var turnedClassesIntoFunctions = turnClassesIntoFunctions(noExtendsImplements,document.getElementById("TURNED_CLASSES_IN_FUNCTIONS"),theClassList);
			var convertedArrayInits = convertArrayInitFromCurlyToSquare(turnedClassesIntoFunctions,document.getElementById("CONVERTED_ARRAY_INIT"),theClassList);
			var noOddLiterals = simplifyOtherOddLiterals(convertedArrayInits,document.getElementById("NO_ODD_LITERALS"),theClassList);
			var noPublicPrivateStaticFinalStuff = removePublicPrivateStaticFinalStuff(noOddLiterals,document.getElementById("NO_PUBLIC_PRIVATE_STATIC_FINAL"),theClassList);
	
			
			// now call JSLint and display the report.
            lib.jslint(noPublicPrivateStaticFinalStuff, option, output);
            var theReport = P5Report(noPublicPrivateStaticFinalStuff);
			document.getElementById("P5LINT_OUTPUT").value = theReport;
			
            input.select();
            return false;
        });

        dom.q('input&clear').on('click', function (e) {
            output.value('');
            input.value('').select();
        });

        /*
        dom.q('#JSLINT_CLEARALL').on('click', function (e) {
            checkboxes.check(false);
            indent.value(option.indent || '4');
            maxlen.value(option.maxlen || '');
            maxerr.value(option.maxerr || '50');
            update_options();
        });

        dom.q('#JSLINT_GOODPARTS').on('click', function (e) {
            goodparts.check(true);
            update_options();
        });
        */

        checkboxes.on('click', update_options);

        //indent.on('change', update_options);
        //maxerr.on('change', update_options);
        //maxlen.on('change', update_options);
        predefined.on('change', update_options);

        input
            .on('change', function (e) {
                output.value('');
            })
            .select();
    };
});