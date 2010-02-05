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
    this.tokens = tokens;

    this.getToken = function getToken () {
	this.token = this.tokens.shift();
    }

    this.peek = function peek() {
	return this.token
    }

    this.accept = function accept (targ) {
	var tok = this.peek()
	if (tok == targ) {
	    this.getToken();
	    return tok;
	} else {
	    return false;
	}
    }

    this.expect = function expect (nonterm) {
	if (nonterm) {
	    return nonterm;
	} else {
	    throw SyntaxError("in expect: unexpected " + token);
	}
    };

    this.identifier = function identifier() {
	var tok = this.peek();
	if (Array.isArray(tok) && tok[0] == "ident") {
	    this.getToken();
	    return tok;
	} else {
	    return false;
	}
    };

    this.acceptIdentifier = function acceptIdentifier(id) {
	var t = this.peek();
	if (Array.isArray(t) && t[0] == "ident" && t[1] == id) {
	    this.getToken();
	    return true;
	} else {
	    return false;
	}
    };

    this.numberLiteral = function numberLiteral() {
	var tok = this.peek();
	if (Array.isArray(tok) && tok[0] == "number") {
	    this.getToken();
	    return tok;
	} else {
	    return false;
	}
    };

    this.regexLiteral = function regexLiteral() {
	var tok = this.peek()
	if (Array.isArray(tok) && tok[0] == "regex") {
	    this.getToken();
	    return tok
	} else {
	    return false;
	}
    }

    this.stringLiteral = function stringLiteral() {
	var tok = this.peek();
	if (Array.isArray(tok) && tok[0] == "string") {
	    this.getToken();
	    return tok;
	} else {
	    return false;
	}
    };

    this.literal = function literal() {
	var result;
	if (result = this.accept('null')) {
	    return result;
	} else if (result = this.accept('true')) {
	    return result;
	} else if (result = this.accept('false')) {
	    return result;
	} else if (result = this.numberLiteral()) {
	    return result;
	} else if (result = this.regexLiteral()) {
	    return result;
	} else if (result = this.stringLiteral()) {
	    return result;
	} else {
	    return false;
	}
    };
    
    this.elision = function elision() {
	var length = 0;
	while (this.accept(',')) {
	    length++;
	}
	return length > 0 && length;
    };

    this.elementListRest = function elementListRest() {
	if (this.accept(',')) {
	    var expr;
	    var elis = this.elision() || 0;
	    if (expr = this.assignmentExpression()) {
		var ary = [];
		ary[elis] = expr;
		var rest;
		if (rest = this.elementListRest()) {
		    return ary.concat(rest);
		} else {
		    return ary;
		}
	    } else {
		return false;
	    }
	} else {
	    return false;
	}
    }

    this.arrayLiteral = function arrayLiteral() {
	if (this.accept('[')) {
	    var beginElision;
	    var expr;
	    var ary = [];
	    var length = 0;
	    var rest;
	    if (this.accept(']')) {
		return ["array", [], 0];
	    } else if (beginElision = this.elision()) {
		length = beginElision;
		if (expr = this.assignmentExpression()) {
		    ary[length] = expr;
		    length++;
		    if (rest = this.elementListRest()) {
			ary = ary.concat(rest);
			length += rest.length;
			this.expect(this.accept(']'));
			return ["array", ary, length];
		    } else {
			this.expect(this.accept(']'));
			return ["array", ary, length];
		    }
		}
	    } else if (expr = this.assignmentExpression()) {
		if (rest = this.elementListRest()) {
		    ary = rest.shift(expr);
		    this.expect(this.accept(']'));
		    return ["array", ary, ary.length];
		} else {
		    this.except(this.accept(']'));
		    return ["array", [expr], 1];
		}
	    } else {
		throw SyntaxError("in arrayLiteral");
	    }
	} else {
	    return false;
	}
    }

    this.propertyName = function propertyName() {
	var result;
	if (result = this.identifier()) {
	    return result;
	} else if (result = this.stringLiteral()) {
	    return result;
	} else if (result = this.numericLiteral()) {
	    return result;
	} else {
	    return false;
	}
    };

    this.propertyAssignment = function propertyAssignment() {
	var name;
	if (this.acceptIdentifier('get')) {
	    name = this.propertyName();
	    this.expect(this.accept('('));
	    this.expect(this.accept(')'));
	    this.expect(this.accept('{'));
	    var body = this.expect(this.functionBody);
	    this.expect(this.accept('}'));
	    return ["get", name, body];
	} else if (this.acceptIdentifier('set')) {
	    name = this.propertyName();
	    this.expect(this.accept('('));
	    var arg = this.expect(this.identifier());
	    this.expect(this.accept(')'));
	    this.expect(this.accept('{'));
	    var body = this.expect(this.functionBody);
	    this.expect(this.accept('}'));
	    return ["set", name, arg, body];
	}
    };

    this.objectLiteral = function objectLiteral() {
	if (this.accept('{')) {
	    var props = [];
	    var assn;
	    while (assn = this.propertyAssignment()) {
		props.push(assn);
		if (!accept(',')) {
		    break;
		}
	    }
	    this.accept(',');
	    if (this.accept('}')) {
		return ["object", props];
	    } else {
		throw SyntaxError("in objectLiteral: expected }");
	    }
	} else {
	    return false;
	}
    };

    this.primaryExpression = function primaryExpression () {
	var result;
	if (result = this.accept('this')) {
	    return result;
	} else if (result = this.identifier()) {
	    return result;
	} else if (result = this.literal()) {
	    return result;
	} else if (result = this.arrayLiteral()) {
	    return result;
	} else if (result = this.objectLiteral()) {
	    return result;
	} else if (this.accept('(')) {
	    result = this.expression();
	    return this.accept(')') && result;
	} else {
	    throw Error("in primaryExpression: failed to match " + tokens);
	}
    }

    this.memberExpression = function memberExpression() {
	var expr;
	var result;
	if (this.accept('new')) {
	    expr = this.expect(this.memberExpression());
	    var args;
	    if (args = this.argumentsList()) {
		result = ['new', expr, args];
		return this.memberExpressionRest(result) || result;
	    } else {
		return ['new', expr, []];
	    }
	} else if ((expr = this.primaryExpression()) || 
		   (expr = this.functionExpression())) {
	    if (result = this.memberExpressionRest(expr)) {
		return result;
	    } else {
		return expr;
	    }
	} else {
	    return false;
	}
    };

    this.memberExpressionRest = function memberExpressionRest (firstE) {
	if (this.accept('[')) {
	    var indexExpr = this.expect(this.expression());
	    this.expect(this.accept(']'));
	    var result = ["subscript", firstE, indexExpr];
	    return this.memberExpressionRest(result) || result;
	} else if (this.accept('.')) {
	    var propName = this.expect(this.identifier());
	    var result = ["propertyGet", firstE, propName];
	    return this.memberExpressionRest(result) || result;
	} else {
	    return false;
	}
    };

    this.callExpressionRest = function callExpressionRest(first) {
	var args;
	if (args = this.argumentsList()) {
	    var result = ["call", first, args];
	    return this.callExpressionRest(result) || result;
	} else if (this.accept('[')) {
	    var expr = this.expect(this.expression());
	    this.expect(this.accept(']'));
	    var result = ["subscript", first, expr];
	    return this.callExpressionRest(result) || result;
	} else if (this.accept('.')) {
	    var prop = this.expect(this.identifier());
	    var result = ["propertyGet", first, prop];
	    return this.callExpressionRest(result) || result;
	} else {
	    return false;
	}
    };

    this.callExpression = function callExpression() {
	var first = this.memberExpression();
	if (first) {
	    var result = first;
	    return callExpressionRest(result) || result;
	} else {
	    return false;
	}
    };

    this.getToken();
}
