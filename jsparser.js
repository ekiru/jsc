/*
  Copyright (c) 2010 Tyler Leslie Curtis <ekiru.0@gmail.com>

  Permission is hereby granted, free of charge, to any person
  obtaining a copy of this software and associated documentation
  files (the "Software"), to deal in the Software without
  restriction, including without limitation the rights to use,
  copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the
  Software is furnished to do so, subject to the following
  conditions:

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
  OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
  HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
  WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
  OTHER DEALINGS IN THE SOFTWARE.
*/

function Parser (tokens) {
    var token;

    function getToken () {
	token = tokens.pop();
    }

    function accept (targ) {
	if (token == targ) {
	    getToken();
	    return token;
	} else {
	    throw SyntaxError("in identifier: unexpected " + token);
	}
    }

    function identifier() {
	if (Array.isArray(token) && token[0] == "ident") {
	    getToken();
	    return token;
	} else {
	    return false;
	}
    }

    function numberLiteral() {
	if (Array.isArray(token) && token[0] == "number") {
	    getToken();
	    return token;
	} else {
	    return false;
	}
    }

    function stringLiteral() {
	if (Array.isArray(token) && token[0] == "string") {
	    getToken();
	    return token;
	} else {
	    return false;
	}
    }

    function literal() {
	var result;
	if (result = accept('null')) {
	    return result;
	} else if (result = accept('true')) {
	    return result;
	} else if (result = accept('false')) {
	    return result;
	} else if (result = numberLiteral()) {
	    return result;
	} else if (result = stringLiteral()) {
	    return result;
	} else {
	    throw SyntaxError("in literal, did not expect " + tokens);
	}
    }
    
    function elision() {
	var length = 0;
	while (accept(',')) {
	    length++;
	}
	return ["array", [], length];
    }


    function arrayLiteral() {
	if (accept('[')) {
	    var beginElision;
	    var expr;
	    var ary;
	    var length = 0;
	    var rest;
	    if (accept(']')) {
		return ["array", [], 0];
	    } else if (beginElision = elision()) {
		length = beginElision.length;
		if (expr = assignmentExpression()) {
		    ary[length] = expr;
		    length++;
		    if (rest = elementListRest(length)) {
			ary = ary.concat(rest);
			length += rest.length;
			return accept(']') && ["array", ary, length];
		    } else {
			return accept(']') && ["array", ary, length];
		    }
		}
	    } else if (expr = assignmentExpression()) {
		if (rest = elementListRest(1)) {
		    ary = rest.shift(expr);
		    return accept(']') && ["array", ary, ary.length];
		} else {
		    return accept(']') && ["array", [expr], 1];
		}
	    } else {
		throw SyntaxError("in arrayLiteral");
	    }
	} else {
	    return false;
	}
    }

    function primaryExpression () {
	var result;
	if (result = accept('this')) {
	    return result;
	} else if (result = identifier()) {
	    return result;
	} else if (result = literal()) {
	    return result;
	} else if (result = arrayLiteral()) {
	    return result;
	} else if (result = objectLiteral()) {
	    return result;
	} else if (accept('(')) {
	    result = expression();
	    return accept(')') && result;
	} else {
	    throw Error("in primaryExpression: failed to match " + tokens);
	}
    }
}
