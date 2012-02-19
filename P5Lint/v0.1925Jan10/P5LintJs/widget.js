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


			

var problemsLinesArray = [];
var problemsSummariesArray = [];
var problemsSnippetsArray = [];

// these three return a list of classes
var classesList = [];
var classesListStartLines = [];
var classesListEndLines = [];

var classesWithExtensionsList = [];
var classesExtensionsNamesList = [];

var classesWithZeroArgumentConstructors = [];


// this variable remembers whether any import statements have
// been found, cause we might want to report that as an error
var someImportsHaveBeenFound = false;


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
 

    function P5Report (thePassedProgram, originalProcessingProgram, theClassList, noSinglequotes) {
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
												
						if(JSLintErrorReason.indexOf("Stopping, unable to continue") !== -1 ){
							o.push('Only a part of the sketch was checked\n');						
						}
						
					   if(
							// some of the normal javascript errors
							// don't apply in our case, so we filter
							// those unwanted errors out.
							
							// I guess the "Expected a 'break' statement before 'case'." would be
							// necessary for processing.js but not for processing.as
							// (dunno why JSLint throws it. Personal taste? JS incompatibilities?)
							JSLintErrorReason.indexOf("Expected a 'break' statement before 'case'.") == -1 &&
							JSLintErrorReason.indexOf("Stopping, unable to continue") == -1 &&
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
						
                        // the line of the error in the actual transformed code
						// is at c.line , but we want to report the line in the
						// original processing program, so we have to fish
						// the original line number from a useful tag in a comment
						// we've stuck at the beginning of each line
						var regexForFindingRealLineNumber = new RegExp("/\\*lineNumber[0-9]+",'g');
						var realLineNumberMatch = e.match(regexForFindingRealLineNumber);
						
						var realLineNumber = 0;
						if (realLineNumberMatch !== null){				
							realLineNumber = trim(realLineNumberMatch[0].substring(12,realLineNumberMatch[0].length));
						}

						var originalLineReference = originalProcessingProgram.split("\n")[realLineNumber-1];
						JSLintErrorReason = JSLintErrorReason.replace(new RegExp("Expected \\'\\)\\' and instead saw", "g"),"Expected ')' or ',' and instead saw");
						JSLintErrorReason = JSLintErrorReason.replace(new RegExp("Expected an identifier and instead saw \\';\\'", "g"),"Unexpected ';'");
						JSLintErrorReason = JSLintErrorReason.replace(new RegExp("an identifier", "g"),"a number/string/variable/function-call");
						// you could also use the character number in c.character
						// but it would be misleading because it references the
						// transformed program, not the original javascript program
						o.push('Problem' + (isFinite(c.line) ? ' at line ' +
                                realLineNumber  : '') +
                                ': ' + JSLintErrorReason +
                                (originalLineReference && (originalLineReference.length > 80 ? originalLineReference.slice(0, 77) + '...' :
                                originalLineReference).entityify()) + '\n');

						problemsLinesArray.push(isFinite(c.line) ? realLineNumber  : '');
						problemsSummariesArray.push(JSLintErrorReason);
						problemsSnippetsArray.push((originalLineReference && (originalLineReference.length > 80 ? originalLineReference.slice(0, 77) + '...' :
                                originalLineReference).entityify()));

								}
                    }
                }
            }

            var undeclareds = [];					
			if (data.implieds) {
                s = [];
				if (!usedExtendsOrImplements){
					var numberOfUndeclared = 0;
					for (i = 0; i < data.implieds.length; i += 1) {
						var theImpliedData = data.implieds[i].name;
						if (
							theImpliedData != "ArrayList" &&
							theImpliedData != "Minim" &&
							theImpliedData != "AudioPlayer" &&
							theImpliedData != "resetMatrix" &&
							theImpliedData != "pow" &&
							theImpliedData != "log" &&
							theImpliedData != "float" &&
							theImpliedData != "size" &&
							theImpliedData != "smooth" &&
							theImpliedData != "noStroke" &&
							theImpliedData != "fill" &&
							theImpliedData != "background" &&
							theImpliedData != "mouseX" &&
							theImpliedData != "mouseY" &&
							theImpliedData != "mouseButton" &&
							theImpliedData != "ellipse" &&
							theImpliedData != "CENTER" &&
							theImpliedData != "LEFT" &&
							theImpliedData != "frameRate" &&
							theImpliedData != "delay" &&
							theImpliedData != "frameCount" &&
							theImpliedData != "colorMode" &&
							theImpliedData != "RGB" &&
							theImpliedData != "width" &&
							theImpliedData != "random" &&
							theImpliedData != "TWO_PI" &&
							theImpliedData != "sin" &&
							theImpliedData != "cos" &&
							theImpliedData != "tan" &&
							theImpliedData != "min" &&
							theImpliedData != "max" &&
							theImpliedData != "get" &&
							theImpliedData != "bezierPoint" &&
							theImpliedData != "P5LintStringReplacement" &&
							theImpliedData != "loadImage" &&
							theImpliedData != "image" &&
							theImpliedData != "strokeCap" &&
							theImpliedData != "ROUND" &&
							theImpliedData != "SQUARE" &&
							theImpliedData != "PROJECT" &&
							theImpliedData != "strokeJoin" &&
							theImpliedData != "MITER" &&
							theImpliedData != "BEVEL" &&
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
							theImpliedData != "floor" &&
							theImpliedData != "ceil" &&
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
							theImpliedData != "print" &&
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
						
						
					////////////////////////////////////////
					// finding the line where this undeclared variable is
					// note: this code is duplicated from another place,
					// it would be neat to factor it out.
					////////////////////////////////////////
					var isItReallyUnused = new RegExp( '[^a-zA-Z0-9_]'+theImpliedData+'[^a-zA-Z0-9_]',"g");
					
					// we search for the variable in the program without comments and strings
					// so if we don't find further reference then it means that it's
					// really unused
					//alert("checking how many times "+data.unused[i].name+" is in "+noSinglequotes);
					//alert(isItReallyUnused);
					var undeclaredVariableMatch = originalProcessingProgram.match(isItReallyUnused);
							var characterCountr = 0;
							var lineFoundAt = null;
							var onlyUsedOnce = originalProcessingProgram.search(isItReallyUnused);
							var splittedProgram = originalProcessingProgram.split("\n");
					//alert("found " + originalProcessingProgram.match(isItReallyUnused).length + " instances");
						if (originalProcessingProgram.match(isItReallyUnused).length == 1){
						
							//alert("checking which line character numner "+onlyUsedOnce+" is in ");
						

							for (var findingTheLine = 0 ; findingTheLine < splittedProgram.length ; findingTheLine++) {
								characterCountr += (splittedProgram[findingTheLine].length)+1;
								if (characterCountr > onlyUsedOnce+1){
									lineFoundAt = findingTheLine+1;
							//alert("... found in line "+ lineFoundAt);
									break;
								}
							}
						}
					
					if (theImpliedData !== "RIGHT"){
					
						if (lineFoundAt != null && undeclaredVariableMatch != undefined) {
							problemsLinesArray.push(lineFoundAt);
							problemsSummariesArray.push("Can't recognize function/variable '" + theImpliedData+"'. Typo? Or maybe it's undeclared?");
							problemsSnippetsArray.push(splittedProgram[lineFoundAt-1]);
						}
						else {
							// this happens if the undefined variable is on the last line
							// it's a tricky corner case cause it's difficult in codemirror to highlight the last line
							problemsLinesArray.push('');
							problemsSummariesArray.push("Can't recognize function/variable '" + theImpliedData+"'. Typo? Or maybe it's undeclared?");
							problemsSnippetsArray.push('');
					
						}
					}
					else {
						problemsLinesArray.push(lineFoundAt);
						problemsSummariesArray.push("Warning: right-clicks are not handled on some browsers/devices");
						problemsSnippetsArray.push(splittedProgram[lineFoundAt-1]);

					}
						////////////////////////////////////////
											
						

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
					
					// we search for the variable in the program without comments and strings
					// so if we don't find further reference then it means that it's
					// really unused
					//alert("checking how many times "+data.unused[i].name+" is in "+noSinglequotes);
					if (noSinglequotes.match(isItReallyUnused).length == 1){
						
						var onlyUsedOnce = noSinglequotes.search(isItReallyUnused);
						var splittedProgram = noSinglequotes.split("\n");
						var characterCountr = 0;
						var lineFoundAt = 0;
						//alert("checking which line character numner "+onlyUsedOnce+" is in ");
						

						for (var findingTheLine = 0 ; findingTheLine < splittedProgram.length ; findingTheLine++) {
							characterCountr += (splittedProgram[findingTheLine].length + 1);
							if (characterCountr > onlyUsedOnce){
								lineFoundAt = findingTheLine+1;
								break;
							}
						}
						//alert("... found in line "+ lineFoundAt);
						
					
						s[numberOfUnuseds] = data.unused[i].name  +
							data.unused[i].line + 
							data.unused[i]['function'] + ' ';
							
						problemsLinesArray.push(lineFoundAt);
						//problemsLinesArray.push(1);
						problemsSummariesArray.push('Warning: unused function/variable: ' + data.unused[i].name);
						problemsSnippetsArray.push('');


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
			
			var processedClasses = [];
			
			if (data.functions.length != 0) {
				o.push('\n\n\nFunctions details: \n-----------------\n');
				for (i = 0; i < data.functions.length; i += 1) {
					f = data.functions[i];

					o.push('\n' + f.line + '-' +
							f.last + '- ' + (f.name || '') + '(' +
							(f.param ? f.param.join(', ') : '') + ')\n');
					

					// now we want to isolate where all the classes are.
					// this is becuse in processing.as all the function definitions should happen
					// before any part of the body is executed - otherwise
					// you might initialise a variable to an instantiated object of a class
					// for which you have no constructor built yet.
					// Classes are some of the functions without arguments that are
					// in the previously-collected class-list
					if (!f.param){

						var itsActuallyAClass = false;
						
						for ( var k=0; k < theClassList.length; k++ ){
							if (f.name === theClassList[k])
								itsActuallyAClass=true;								
						}


						if (itsActuallyAClass) {

								// so far, the function name is a class name
								// but constructors would test positive so far as
								// well. So, we need to check if this class name
								// has already been processed (cause the class is
								// the first function with the name of the class)
								// If it's not, then we add the class as processed
								// and continue. If yes, then we claim that this
								// is not a class (it's one of its constructors, the
								// class has been already processed) and we proceed
								
										o.push('\n found '+ processedClasses.length +' classes so far \n');
								for ( var alreadyProcessedIndex=0; alreadyProcessedIndex < processedClasses.length; alreadyProcessedIndex++ ){
										o.push('\n I already found a class named '+ processedClasses[alreadyProcessedIndex]+'\n');
									if (f.name === processedClasses[alreadyProcessedIndex]){
										itsActuallyAClass=false;
										o.push('\n (this is a constructor with zero arguments, not a class)\n');
										
										// here we are remembering the constructors
										// that have been found. The reason for that
										// is that when there is a class without constructors,
										// then we'll need to add one.
										classesWithZeroArgumentConstructors.push(f.name);
									}
								}

							// check again if this is still a class,
							// this flag might have changed if we found out that
							// this was actually a constructor with zero arguments.
							if (itsActuallyAClass) {
								o.push('\n (this one is actually a class)\n');
								processedClasses.push(f.name);
								classesList.push(f.name);
								classesListStartLines.push(f.line);
								classesListEndLines.push(f.last);
							}
						}
					}
					
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

		
		function addLineNumbers(input,output) {
				//alert("addLineNumbers - about to remove comments");
				var removedComments = input;
				//alert("addLineNumbers - removed comments");
				
   				//alert("addLineNumbers - making the regex");
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
   				if (output !== null)
   					output.innerHTML = removedComments.replace( /\n/g, '<br />\n' );
				return removedComments;
		}	

		function noSinglequoteStrings(input) {
				// this function attempts to check
				// whether the program contains single-quote strings,
				// because those work in actionscript/javascript but
				// not in the proper processing programming
				// environment.
				
				// note that this regular expression doesn't catch
				// strings that begin with many symbols
				// 'a' <---- uncaught, OK
				// '' <---- uncaught, OK
				// 'bcdef' <---- caught, OK
				// 'klmkn' <---- caught, OK
				// '\n' <---- uncaught, OK
				// 'miao' <---- caught, OK
				// '\nad' <---- caught, OK
				// '(miao" <---- uncaught, not OK
				
				//alert("enter singlequotes function");
				var noSingleQuoteStringsRegex = new RegExp("\\'\\\\?[a-zA-Z0-9][a-zA-Z0-9]+\\'");
				//alert("built regex");
				
				var inputMatches;
   				var inputMatch;
				var inputPosition;
				
				while(true){
	   				//alert("trying to find more strings");
					inputMatches = [];
					inputMatches = input.match(noSingleQuoteStringsRegex);
				
					if  (inputMatches === null) {					
						break;
					}
					//alert("found one single quote thing");
					inputMatch = inputMatches[0];

					//alert("eliminating this string now: " + inputMatch);

					problemsLinesArray.push('');
					problemsSummariesArray.push("strings should have double quotes");
					problemsSnippetsArray.push((inputMatch && (inputMatch.length > 80 ? inputMatch.slice(0, 77) + '...' :inputMatch).entityify()));

					//alert("added the error");

								
					inputPosition = input.search(noSingleQuoteStringsRegex);
					//alert("at position " + inputPosition);
					input = input.substring(0,inputPosition) + "\"P5LintStringReplacement\"" +input.substring(inputPosition+inputMatch.length);
					//alert("so now it is: " + input);

				}
				
				return input;
		}	


		

		
		function findTheClasses(input,output) {
		
		// to do this is wrong cause there might be a comment with a line number in between class and the name
		
			  var pos = 0;
			  var nextOpenParenthesys = 0;
			  var num = -1;
			  var i = -1;
			  var extractedClassName = -1;
			  var classesList = [];
			  
			  if (output !== null) output.innerHTML = "";
			  
			  // first we remove comments because
			  // a) they might contain pieces of code that we don't want to consider
			  // b) can be placed between key tokens that we need to scan
			  //    in order to find the class names
			  var inputWithoutComments = input;			  
			  
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
				    if (output !== null) output.innerHTML += extractedClassName + ' ' ;
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
			  classesList.push("ArrayList");
			  classesList.push("Minim");
			  classesList.push("AudioPlayer");

				// here we keep a collection of which classes extend some other class
				// and if they do, both the name of the extending and extended class
				// this is needed because we are adding a bunch of constructors
				// if not there.
				
			    var regexForFindingClassesExtendingOtherClasses = new RegExp("class\\s+[a-zA-Z][a-zA-Z0-9_]*\\s+extends\\s+[a-zA-Z][a-zA-Z0-9_]*\\s*{",'g');
				//alert('regex for finding classes: ' + regexForFindingClassesExtendingOtherClasses);
				var classMatch = inputWithoutComments.match(regexForFindingClassesExtendingOtherClasses);
				//alert('number of classes found: ' + classMatch.length);
				
				if (classMatch !== null){				
				  for ( var i=0; i<classMatch.length; i++ ){			  			  

					extractedClassName = trim(classMatch[i].substring(6).replace("{","")).split(" ");
					extractedClassName = extractedClassName[0];
					var extractedExtendedClassName = trim(classMatch[i].substring(6).replace("{","")).split(" ");
					extractedExtendedClassName = extractedExtendedClassName[extractedExtendedClassName.length-1];
					//alert('extracted class name number '+i+' : ' + extractedClassName);
				    //alert('it extends '+i+' : ' + extractedExtendedClassName);
				    if (output !== null) output.innerHTML += 'class ' + extractedClassName + ' extends class ' + extractedExtendedClassName;
				    
				    	classesWithExtensionsList.push(extractedClassName);
						classesExtensionsNamesList.push(extractedExtendedClassName);

				  }
				}
				
			  return classesList;			  			  

		}	

		function simplifyStringArrayDeclarationsWithLiteralInit(input,output,classesArray) {
			  
			// this function is to convert stuff like "new String(" into something like "new StringClass"
			// this is because later transformations transform all types into var, so "new String("
			// would become "new var(" which is not OK.
			
 					  if (output !== null) output.innerHTML = "";

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
						if (output !== null) output.innerHTML += input.replace( /\n/g, '<br />\n' );
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
			  
			  if (output !== null) output.innerHTML = "";
			  
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
				
				//alert('found some instances of type ' + classesArray[i] + " foundLeftSideArraysMatches: " + foundLeftSideArraysMatches);
				
					
					var foundLeftSideArraysMatchesPlace = inputWithoutComments.search(myRe);
					// take the type out
					
					
					//var checkingThatItsNotAFunctionInvokation = inputWithoutComments.charAt(foundLeftSideArraysMatchesPlace + foundLeftSideArraysMatchesLength);
					//alert("next char: " + checkingThatItsNotAFunctionInvokation);
					//if ( !(checkingThatItsNotAFunctionInvokation === '[' || checkingThatItsNotAFunctionInvokation === ']' || checkingThatItsNotAFunctionInvokation === ',' || checkingThatItsNotAFunctionInvokation === ';')) {
					//break;
					//}
					
					
					foundLeftSideArraysMatches = foundLeftSideArraysMatches.replace(classesArray[i],' var ').replace(/\s*\[\s*\]/,' ');
					
					// this if is to avoid that function definitions like for example
					//    Butterfly[] makeButterflies(String a, String b, ...) {
					//        ...
					//    }
					// to be turned into
					//    var makeButterflies(String a, String b, ...) {
					//        ...
					//    }
					// which in turn will be transformed into valid javascript
					// in the next steps.
					if (trim(foundLeftSideArraysMatches) == "var") {
						foundLeftSideArraysMatches = " " + classesArray[i] + " ";					
					}
				
					//alert('1replaced with: ' + foundLeftSideArraysMatches);
					
					
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
					//alert('2replaced with: ' + foundLeftSideArraysMatches);
					
					
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
					//alert('3replaced with: ' + foundLeftSideArraysMatches);
					
					
					inputWithoutComments = inputWithoutComments.substring(0,foundLeftSideArraysMatchesPlace ) + foundLeftSideArraysMatches + inputWithoutComments.substring(foundLeftSideArraysMatchesPlace + foundLeftSideArraysMatchesLength);
				
				//alert('program is now: ' + inputWithoutComments);
					
			  }
			  //alert('outside the loop');

			  
				if (output !== null) output.innerHTML += inputWithoutComments.replace( /\n/g, '<br />\n' );
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
			  
			  if (output !== null) output.innerHTML = "";
			  
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
			  
				if (output !== null) output.innerHTML += inputWithoutComments.replace( /\n/g, '<br />\n' );
				return inputWithoutComments;
		}
		
		function findArrayDeclarationsRightSides(input,output,classesArray) {
			  
			  if (output !== null) output.innerHTML = "";
			  
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
				if (output !== null) output.innerHTML += input.replace( /\n/g, '<br />\n' );
				return input;
				
		}	

		function getRidOfEmptyBracketsInArrayDeclarationsRightSide(input,output,classesArray) {
			  
			  if (output !== null) output.innerHTML = "";
			  
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
				if (output !== null) output.innerHTML += input.replace( /\n/g, '<br />\n' );
				return input;
				
		}	

		function turnClassesIntoFunctions(input,output,classesArray) {
			  
			  if (output !== null) output.innerHTML = "";
			  
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
				if (output !== null) output.innerHTML += input.replace( /\n/g, '<br />\n' );
				return input;
				
		}	


		function findDeclarationsAndReturnTypeInsideFunctionDefinitions(input,output,classesArray) {

			  //alert('starting function declarations adjustments');
			  //alert('input: ' + input);
			  if (output !== null) output.innerHTML = "";

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
				if (output !== null) output.innerHTML += input.replace( /\n/g, '<br />\n' );
				return input;

		}

		function findDeclarationsAndReturnTypeInsideConstructors(input,output,classesArray) {
              
			  //alert('starting function declarations adjustments');
			  //alert('input: ' + input);
			  if (output !== null) output.innerHTML = "";

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
				if (output !== null) output.innerHTML += input.replace( /\n/g, '<br />\n' );
				return input;

		}


		function eliminateMultidimentionalDeclarationsRemainants(input,output,classesArray) {
			// if you declare something like float[][] distances;  
			// then it normally gets transformed to var[] distances;
			// so now we want to sweep all those [] away
			
			  if (output !== null) output.innerHTML = "";
			  
			  // first we remove comments
			  //inputWithoutComments = removeComments(input);			  

			  var lineCommentExp = "var\\s*(\\[\\s*\\])*";

				  
					  // let's find right side declarations of arrays
					  // that is, anything that has a class name and actually contains something
					  // after the opening square bracket
    					var myRe = new RegExp(lineCommentExp,"g");
						input = input.replace(myRe,'var ');
						//alert('replacing casting to ' + classesArray[i] + ' '+ input);
						
				if (output !== null) output.innerHTML += input.replace( /\n/g, '<br />\n' );
				return input;
				
		}	


		function eliminateCastings(input,output,classesArray) {
			  
			//alert('deleting castings');
			  if (output !== null) output.innerHTML = "";
			  
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
				if (output !== null) output.innerHTML += input.replace( /\n/g, '<br />\n' );
				return input;
				
		}	

        

        //  var lineCommentExp = "((\\r|\\n)*\\/\\*lineNumber[1234567890]*\\*\\/(\\r|\\n)*\\s*)*";
		//  var second_part  = "\\s+"+lineCommentExp+"[a-zA-Z1234567890_]*\\s*"+lineCommentExp+"[\\;\\,\\s]";
		
		function transformTheOtherDeclarations(input,output,classesArray) {

			  //alert('starting function declarations adjustments');
			  //alert('input: ' + input);
			  if (output !== null) output.innerHTML = "";

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
							
							// this is because otherwise we replace stuff like
							//   	Point[]p = new Point[3];
							// into
							//    	var Pop = Point[3];
							// and "p" hence goes undeclared
							// this happens because Point contains another class name (int)
							
							
							var checkingCharacter = foundLeftSideArrays.charAt(foundLeftSideArraysPlace2 - 1);
							if ( checkingCharacter !== ""){
								//alert("not replacing this one, it's a type name that has another type name within itself, e.g. Point containing int: >" + foundLeftSideArrays.charAt(foundLeftSideArraysPlace2 - 1) + "<");
								continue;
							}
							
							
							
							
							foundLeftSideArrays = foundLeftSideArrays.replace(regexsoonafterPar,'');
							//alert("replaced: " + foundLeftSideArrays);
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
				
				
				if (output !== null) output.innerHTML += input.replace( /\n/g, '<br />\n' );
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
			  
			  if (output !== null) output.innerHTML = "";
			  
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

				if (output !== null) output.innerHTML += input.replace( /\n/g, '<br />\n' );
				return input;
				
		}	

				function simplifyOtherOddLiterals(input,output,classesArray) {
			
			  if (output !== null) output.innerHTML = "";
			  
			

			  input = input.replace(/#[0-9a-zA-Z][0-9a-zA-Z][0-9a-zA-Z][0-9a-zA-Z][0-9a-zA-Z][0-9a-zA-Z]/g,'P5LintHexColorReplacement');
				input = input.replace(/[0-9]+\.[0-9]+f/g,'P5LintFloatReplacement');		
				if (output !== null) output.innerHTML += input.replace( /\n/g, '<br />\n' );
				return input;
				
		}	

		function removePublicPrivateStaticFinalStuff(input,output,classesArray) {

			  //alert('starting function declarations adjustments');
			  //alert('input: ' + input);
			  if (output !== null) output.innerHTML = "";

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
							
						
				
				if (output !== null) output.innerHTML += input.replace( /\n/g, '<br />\n' );
				return input;

		}	

		function removeImports(input,output,classesArray) {

			  if (output !== null) output.innerHTML = "";
			  
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
						var secondPart = "import\\s*[a-zA-Z\\.\\*0-9]*\\s*;";
						var myRe = new RegExp(secondPart,"g");
						//alert('turning classes into functions regexp: ' + myRe);
						var foundLeftSideArrays = input.search(myRe);

						// go to the next class if there are no more results for this one
						if (foundLeftSideArrays == -1){
	                        //alert('found no classes');
							break;
						}
						
						someImportsHaveBeenFound = true;
						
                        //alert('found a class');

						var foundLeftSideArraysMatch = input.match(myRe);
                        //alert('matched');
						var matchPortion = foundLeftSideArraysMatch[0];
                        //alert('old class header: ' + matchPortion);
						var foundLeftSideArraysMatchLength = matchPortion.length;  
						
						//to do this is not exactly right cause the function name could contain the string class, you
						// have to use a proper regular expression here
						// replace class with function, and add the empty parameters
                        //alert('new function header: ' + matchPortion);
												
						//alert('found a match for right side array declaration of class ' + );
					
						input= input.substring(0,foundLeftSideArrays) + "/* P5LintCommentedOutImport " + matchPortion.substring(6,matchPortion.length) + " */ " + input.substring(foundLeftSideArrays+foundLeftSideArraysMatchLength);
					}
				if (output !== null) output.innerHTML += input.replace( /\n/g, '<br />\n' );
				return input;

		}	
		
function P5LintDoTheChecks(input,output,tolerate_text_fonts_checkbox, tolerate_print_println_checkbox, tolerate_3d_checkbox, tolerate_imports_checkbox, tolerate_multimensional_arrays, tolerate_Minim_import_checkbox) {

			// some problems are caught during the transformations,
			// before passing the transformed program to JSLint,
			// so we better clean up the space now.
			problemsLinesArray = [];
			problemsSummariesArray = [];
			problemsSnippetsArray = [];
			classesList = [];
			classesListStartLines = [];
			classesListEndLines = [];
			classesWithExtensionsList = [];
			classesExtensionsNamesList = [];
			classesWithZeroArgumentConstructors = [];

			//alert('adding line numbers');
            var programWithoutComments = removeComments(input);
            var strippedProgram = addLineNumbers(programWithoutComments,document.getElementById("WITH_LINE_NUMBERS"));
			var noSinglequotes = noSinglequoteStrings(strippedProgram);

			//////// ignore the minim package import
			// to do: the replace should match one or more spaces after "import" and before the semicolon
			var programWithNoMinimImport = noSinglequotes;
			if (document.getElementsByName("tolerate_Minim_import_checkbox")[0] !== undefined) tolerate_Minim_import_checkbox = document.getElementsByName("tolerate_Minim_import_checkbox")[0].checked;

			if (tolerate_Minim_import_checkbox){
				programWithNoMinimImport = programWithNoMinimImport.replace(new RegExp("import\\s*ddf.minim.\*\\s*;", "g"), " ");
			}
			///////////////////////////////////////

			var theClassList = findTheClasses(programWithNoMinimImport,document.getElementById("LIST_OF_CLASSES_OUTPUT"));
			//alert('theClassList done');
			var simplifiedStringArrayDeclarationsWithLiteralInit = simplifyStringArrayDeclarationsWithLiteralInit(programWithNoMinimImport,document.getElementById("simplifyStringArrayDeclarationsWithLiteralInit"),theClassList);
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
			
			someImportsHaveBeenFound = false;
			var noImports = removeImports(noPublicPrivateStaticFinalStuff,document.getElementById("NO_IMPORTS"),theClassList);
			
			var finalSourceCode = noImports;
	
			
			// now call JSLint and display the report.

			//alert('calling jslint');
            JSLINT(finalSourceCode, null, null);
            //alert('called jslint, generating report');
			
			//alert("number of errors found before JSLint:"+problemsSummariesArray.length);
            var theReport = P5Report(finalSourceCode,input,theClassList,noSinglequotes);
			//alert('generated report');
            
			var fullDebugReport = '';

			///////////////////////////////
			if (document.getElementsByName("tolerate_text_fonts_checkbox")[0] !== undefined) tolerate_text_fonts_checkbox = document.getElementsByName("tolerate_text_fonts_checkbox")[0].checked;
			if (!tolerate_text_fonts_checkbox){
				var regexForFindingPFont = new RegExp("PFont",'g');
				var regexForFindingloadFont = new RegExp("loadFont\\s*\\(",'g');
				var regexForFindingTextOrTextFont = new RegExp("text(Font)?\\s*\\(",'g');

				var thePFontUses = finalSourceCode.match(regexForFindingPFont);
				var theloadFontUses = finalSourceCode.match(regexForFindingloadFont);
				var theTextOrTextFontUses = finalSourceCode.match(regexForFindingTextOrTextFont);
				
				if (thePFontUses !== null || theloadFontUses !== null || theTextOrTextFontUses !== null ){
					fullDebugReport +="Sorry, text/font features are not supported yet\n";
					problemsLinesArray.push('');
					problemsSummariesArray.push('Sorry, text/font features are not supported yet');
					problemsSnippetsArray.push('');
				}				
			}	
			///////////////////////////////
			if (tolerate_print_println_checkbox === ''){
			tolerate_print_println_checkbox = document.getElementsByName("tolerate_print_println_checkbox")[0];
			}
			
			if (!tolerate_print_println_checkbox){
				var regexForFindingPrintsPrintlns = new RegExp("print(ln)?\\s*\\(",'g');
				var thePrintPrintlnUses = finalSourceCode.match(regexForFindingPrintsPrintlns);
				
				if (thePrintPrintlnUses !== null){
					fullDebugReport +="Sorry, print/println are not supported yet\n";
					problemsLinesArray.push('');
					problemsSummariesArray.push('Sorry, print/println are not supported yet');
					problemsSnippetsArray.push('');

				}				
			}			
			///////////////////////////////
			//alert('document.P5LintCheckboxes.tolerate_3d_checkbox.value: '+document.getElementsByName("tolerate_3d_checkbox")[0].checked);
			if (document.getElementsByName("tolerate_3d_checkbox")[0] !== undefined) tolerate_3d_checkbox = document.getElementsByName("tolerate_3d_checkbox")[0].checked;

			if (!tolerate_3d_checkbox){
				//alert('checking 3d uses');
				var regexForFinding3dUse = new RegExp("(size|createGraphics)\\s*\\(\\s*[0123456789]*\\s*,\\s*[0123456789]*\\s*,\\s*(P3D|OPENGL)\\s*\\)\\s*;",'g');
				var the3duses = finalSourceCode.match(regexForFinding3dUse);
				
				if (the3duses !== null){
					fullDebugReport +="Sorry, 3d functions are not supported yet\n";
					problemsLinesArray.push('');
					problemsSummariesArray.push('Sorry, 3d functions are not supported yet');
					problemsSnippetsArray.push('');
				}				
			}			
			/////////////////////////////////


			///////////////////////////////
			if (document.getElementsByName("tolerate_multimensional_arrays")[0] !== undefined) tolerate_multimensional_arrays = document.getElementsByName("tolerate_multimensional_arrays")[0].checked;

			if (!tolerate_multimensional_arrays){
				//alert('checking 3d uses');
				var regexForFindingMultidimensionalArraysUse = new RegExp("\\[\\s*[0123456789]*\\s*\\]\\s*\\[\\s*[0123456789]*\\s*\\]",'g');
				var theMultidimensionalArraysUses = finalSourceCode.match(regexForFindingMultidimensionalArraysUse);
				
				if (theMultidimensionalArraysUses !== null){
					fullDebugReport +="Sorry, multidimensional arrays are not supported yet\n";
					problemsLinesArray.push('');
					problemsSummariesArray.push('Sorry, multidimensional arrays are not supported yet');
					problemsSnippetsArray.push('');
				}				
			}			
			/////////////////////////////////


			if (document.getElementsByName("tolerate_imports_checkbox")[0] !== undefined) tolerate_imports_checkbox = document.getElementsByName("tolerate_imports_checkbox")[0].checked;

			if (!tolerate_imports_checkbox && someImportsHaveBeenFound){
					fullDebugReport +="Sorry, package imports are not supported yet\n";
					problemsLinesArray.push('');
					problemsSummariesArray.push('Sorry, package imports are not supported yet');
					problemsSnippetsArray.push('');

			}
			/////////////////////////////////

			fullDebugReport += theReport;
			
			/*
			document.getElementById("P5LINT_OUTPUT").value += '\n\nSummary of warning/errors ---------------------';
			
			for (var i = 0; i < problemsSummariesArray.length; i += 1) {
				document.getElementById("P5LINT_OUTPUT").value += "\n";	
				if (problemsLinesArray[i] !== '')
					document.getElementById("P5LINT_OUTPUT").value += "line: " + problemsLinesArray[i] + " ";	
				document.getElementById("P5LINT_OUTPUT").value += problemsSummariesArray[i] + " " + problemsSnippetsArray[i];
			}
			*/

			
			            
            return [problemsLinesArray,problemsSummariesArray,problemsSnippetsArray,fullDebugReport,];
        //}
        }
        


