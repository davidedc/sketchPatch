/* 
from: http://james.padolsey.com/javascript/removing-comments-in-javascript/
by James Padolsey
    This function is loosely based on the one found here:
    http://www.weanswer.it/blog/optimize-css-javascript-remove-comments-php/
*/

/* Note: this is a very good comment stripper. I.e. it deals with single lines, multilines, strings, escapes etc, but there are some corner cases that are handled differently
by other comment strippers though, so there is still a chance that some programs might jam right at this
phase. It looks like common cases are handled well though.
*/

/* this code works by going through the string and setting to empty the parts that are within comments
I made some changes so that comments are removed, but then line numbers are inserted AS COMMENTS.

This is done by initialising an array that stores for each character of the original source the number of its original line. The characters within the comments of the original source are wiped out, but the ones remaining still have their original line number in this special array, so scan the final program inserting those line numbers whenever there is a change of line in the de-commented program.

Also, I had to handle the case where multiline comments that cause two original rows to collapse maintain two line numbers in each row. 

This is achieved by the pieces of code below that look similar to this:

            if (str[i] === '\n') {
				str[i] = ' lineNumber'+(lineNumbers[i]+1)+' ';
            }
			else {
				str[i] = '';
			}
			
i.e. before wiping a carriage return, we insert in the program a comment whith the line number.
			
*/

/* to do: all of the regular expressions that check for spaces have to also assume that there could
be a comment with a line number, so that has to be added as well.
*/

function removeComments(str) {
				
    str = ('__' + str + '__').split('');

	var i;
	var lineNumbers = [];
	var currentLineNumber = 1;
	for(i=0; i<str.length; i++) {
		lineNumbers[i] = currentLineNumber;
		if (str[i] === '\n') {
			currentLineNumber++;
		}
	}
	
				
    var mode = {
        singleQuote: false,
        doubleQuote: false,
        regex: false,
        blockComment: false,
        lineComment: false,
    };
    for (i = 0, l = str.length; i < l; i++) {
 

        if (mode.regex) {
            if (str[i] === '/' && str[i-1] !== '\\') {
                mode.regex = false;
            }
            continue;
        }
 
        if (mode.singleQuote) {
            if (str[i] === "'" && str[i-1] !== '\\') {
                mode.singleQuote = false;
            }
            continue;
        }
 
        if (mode.doubleQuote) {
            if (str[i] === '"' && str[i-1] !== '\\') {
                mode.doubleQuote = false;
            }
            continue;
        }
 
        if (mode.blockComment) {
            if (str[i] === '*' && str[i+1] === '/') {
				//alert("CLOSED BLOCK COMMENT "+str[i]+str[i+1]+str[i+2]+str[i+3]+str[i+4]);
				str[i+1] = '';
                str[i] = '';
				mode.blockComment = false;
				continue;
            }
            if (str[i] === '\n' ) {
				//str[i] = ' /*lineNumber'+(lineNumbers[i]+1)+'*/ ';
				str[i] = '';
				continue;
            }
			
			str[i] = '';
			continue;
        }
 
        if (mode.lineComment) {
            if (str[i+1] === '\n' || str[i+1] === '\r') {
                mode.lineComment = false;
            }
            if (str[i] === '\n' ) {
				str[i] = ' /*lineNumber'+(lineNumbers[i]+1)+'*/ ';
            }
			else {
				str[i] = '';
			}
            continue;
        }
 
 
        mode.doubleQuote = str[i] === '"';
        mode.singleQuote = str[i] === "'";
 
        if (str[i] === '/') {
			//alert("almost catching a multiline comment. next chara are is >" + str[i+1] + str[i+2] +str[i+3] +str[i+4] + "<");
			//alert("modes mode.regex , mode.singleQuote , mode.doubleQuote , mode.regex , mode.blockComment , mode.lineComment" + mode.regex +" "+ mode.singleQuote +" "+ mode.doubleQuote +" "+ mode.regex +" "+ mode.blockComment +" "+ mode.lineComment);

                
            if (str[i+1] === '*') {
				//alert("catching a multiline comment");
				str[i] = '';
                mode.blockComment = true;
                continue;
            }
            if (str[i+1] === '/') {
				str[i] = '';
				mode.lineComment = true;
                continue;
            }
            //mode.regex = true;
 
        }
 
    }
	
	
		
	var finalString = [];
	finalString[0] = str[0];		
	finalString[1] = str[1];		
	finalString[2] = ' /*lineNumber1*/ '+str[2];		
	for(i=3; i<str.length; i++) {
		finalString[i] = str[i];
		if (str[i] === '\n') {
			finalString[i] += ' /*lineNumber'+(lineNumbers[i]+1)+'*/  ';
		}
	}
	
    return finalString.join('').slice(2, -2);
}