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

    this.argumentsList() = function argumentsList() {
	if (this.accept('(')) {
	    var result = [];
	    var expr;
	    while (expr = this.assignmentExpression()) {
		result.push(expr);
		if (!this.accept(',')) {
		    break;
		}
	    }
	    this.expect(this.accept(')'));
	    return result;
	} else {
	    return false;
	}
    };

    this.leftHandSideExpression = function leftHandSideExpression() {
	return this.callExpression();
    };

    this.postfixExpression = function postfixExpression() {
	var expr;
	if (expr = this.leftHandSideExpression()) {
	    if (this.accept('++')) {
		return ["post_increment", expr];
	    } else if (this.accept('--')) {
		return ["post_decrement", expr];
	    } else {
		return expr;
	    }
	} else {
	    return false
	}
    };

    this.unaryExpression = function unaryExpression() {
	var expr;
	if (expr = this.postfixExpression()) {
	    return expr;
	} else if (this.accept('delete')) {
	    return ['delete', this.expect(this.unaryExpression())];
	} else if (this.accept('void')) {
	    return ['void', this.expect(this.unaryExpression())];
	} else if (this.accept('typeof')) {
	    return ['typeof', this.expect(this.unaryExpression())];
	} else if (this.accept('++')) {
	    return ['pre_increment', this.expect(this.unaryExpression())];
	} else if (this.accept('--')) {
	    return ['pre_decrement', this.expect(this.unaryExpression())];
	} else if (this.accept('+')) {
	    return ['unary_plus', this.expect(this.unaryExpression())];
	} else if (this.accept('-')) {
	    return ['unary_negate', this.expect(this.unaryExpression())];
	} else if (this.accept('~')) {
	    return ['unary_bitwise_not', this.expect(this.unaryExpression())];
	} else if (this.accept('!')) {
	    return ['unary_logical_not', this.expect(this.unaryExpression())];
	} else {
	    return false;
	}
    };

    this.multiplicativeExpressionRest = function multiplicativeExpressionRest(first) {
	if (this.accept('*')) {
	    var second = this.expect(this.unaryExpression());
	    var result = ['mul', first, second];
	    return this.multiplicativeExpressionRest(result) || result;
	} else if (this.accept('/')) {
	    var second = this.expect(this.unaryExpression());
	    var result = ['div', first, second];
	    return this.multiplicativeExpressionRest(result) || result;
	} else if (this.accept('%')) {
	    var second = this.expect(this.unaryExpression());
	    var result = ['mod', first, second];
	    return this.multiplicativeExpressionRest(result) || result;
	} else {
	    return false;
	}
    };

    this.multiplicativeExpression = function multiplicativeExpression() {
	var first = this.unaryExpression();
	return this.multiplicativeExpressionRest(first) || first;
    };

    this.additiveExpressionRest = function additiveExpressionRest(first) {
	if (this.accept('+')) {
	    var result = ["add", first, this.expect(this.multiplicativeExpression())];
	    return this.additiveExpressionRest(result) || result;
	} else if (this.accept('-')) {
	    var result = ["sub", first, this.expect(this.multiplicativeExpression())];
	    return this.additiveExpressionRest(result) || result;
	} else {
	    return false;
	}
    };

    this.additiveExpression = function additiveExpression() {
	var expr = this.multiplicativeExpression();
	if (expr) {
	    return this.additiveExpressionRest(expr) || expr;
	} else {
	    return false;
	}
    };

    this.shiftExpressionRest = function shiftExpressionRest(first) {
	if (this.accept('<<')) {
	    var second = this.additiveExpression();
	    var result = ["shift_left", first, second];
	    return this.shiftExpressionRest(result) || result;
	} else if (this.accept('>>')) {
	    var second = this.additiveExpression();
	    var result = ["shift_right", first, second];
	    return this.shiftExpressionRest(result) || result;
	} else if (this.accept('>>>')) {
	    var second = this.additiveExpression();
	    var result = ["shift_right_zero", first, second];
	    return this.shiftExpressionRest(result) || result;
	} else {
	    return false;
	}
    };

    this.shiftExpression = function shiftExpression() {
	var expr = this.additiveExpression();
	if (expr) {
	    return this.shiftExpressionRest(expr) || expr;
	} else {
	    return false;
	}
    };

    this.relationalExpressionRest = function relationalExpressionRest(first, noIn) {
	if (this.accept('<')) {
	    var second = this.expect(this.shiftExpression());
	    var result = ["less_than", first, second];
	    return this.relationalExpressionRest(result, noIn) || result;
	} else if (this.accept('>')) {
	    var second = this.expect(this.shiftExpression());
	    var result = ["greater_than", first, second];
	    return this.relationalExpressionRest(result, noIn) || result;
	} else if (this.accept('<=')) {
	    var second = this.expect(this.shiftExpression());
	    var result = ["less_than_or_equal", first, second];
	    return this.relationalExpressionRest(result, noIn) || result;
	} else if (this.accept('>=')) {
	    var second = this.expect(this.shiftExpression());
	    var result = ["greater_than_or_equal", first, second];
	    return this.relationalExpressionRest(result, noIn) || result;
	} else if (this.accept('instanceof')) {
	    var second = this.expect(this.shiftExpression());
	    var result = ["instanceof", first, second];
	    return this.relationalExpressionRest(result, noIn) || result;
	} else if (!noIn && this.accept('in')) {
	    var second = this.expect(this.shiftExpression());
	    var result = ["in", first, second];
	    return this.relationalExpressionRest(result, noIn) || result;
	} else {
	    return false;
	}
    };

    this.relationalExpression = function relationalExpression(noIn) {
	var expr = this.shiftExpression();
	if (expr) {
	    return this.relationalExpressionRest(expr, noIn) || expr;
	} else {
	    return false;
	}
    };

    this.equalityExpressionRest = function equalityExpressionRest(first, noIn) {
	if (this.accept('==')) {
	    var second = this.relationalExpression(noIn);
	    var result = ["equal", first, second];
	    return this.equalityExpressionRest(result, noIn) || result;
	} else if (this.accept('!=')) {
	    var second = this.relationalExpression(noIn);
	    var result = ["not_equal", first, second];
	    return this.equalityExpressionRest(result, noIn) || result;	
	} else if (this.accept('===')) {
	    var second = this.relationalExpression(noIn);
	    var result = ["strict_equal", first, second];
	    return this.equalityExpressionRest(result, noIn) || result;
	} else if (this.accept('!==')) {
	    var second = this.relationalExpression(noIn);
	    var result = ["strict_not_equal", first, second];
	    return this.equalityExpressionRest(result, noIn) || result;
	} else {
	    return false;
	}
    };

    this.equalityExpression = function equalityExpression(noIn) {
	var expr = this.relationalExpression(noIn);
	if (expr) {
	    return this.equalityExpressionRest(expr, noIn) || expr;
	} else {
	    return false;
	}
    };

    this.bitwiseAndExpressionRest = function (first, noIn) {
	if (this.accept('&')) {
	    var second = this.expect(this.equalityExpression());
	    var result = ['bitwise_and', first, second];
	    return this.bitwiseAndExpressionRest(result, noIn) || result;
	} else {
	    return false;
	}
    };

    this.bitwiseAndExpression = function (noIn) {
	var expr = this.equalityExpression(noIn);
	if (expr) {
	    return this.bitwiseAndExpressionRest(expr, noIn) || expr;
	} else {
	    return false;
	}
    };

    this.bitwiseXorExpressionRest = function (first, noIn) {
	if (this.accept('^')) {
	    var second = this.expect(this.bitwiseAndExpression(noIn));
	    var result = ['bitwise_xor', first, second];
	    return this.bitwiseXorExpressionRest(result, NoIn) || result;
	} else {
	    return false;
	}
    };

    this.bitwiseXorExpression = function (noIn) {
	var expr = this.bitwiseAndExpression(noIn);
	if (expr) {
	    return this.bitwiseXorExpressionRest(expr, noIn) || expr;
	} else {
	    return false;
	} 
    };

    this.bitwiseOrExpressionRest = function (first, noIn) {
	if (this.accept('|')) {
	    var second = this.expect(this.bitwiseXorExpression(noIn));
	    var result = ['bitwise_or', first, second];
	    return this.bitwiseOrExpressionRest(result, noIn) || result;
	} else {
	    return false;
	}
    };

    this.bitwiseOrExpression = function (noIn) {
	var expr = this.bitwiseXorExpression(noIn);
	if (expr) {
	    return this.bitwiseOrExpressionRest(expr, noIn) || expr;
	} else {
	    return false;
	}
    };

    this.logicalAndExpressionRest = function (first, noIn) {
	if (this.accept('&&')) {
	    var second = this.expect(this.bitwiseOrExpression(noIn));
	    var result = ['logical_and', first, second];
	    return this.logicalAndExpressionRest(result, noIn) || result;
	} else {
	    return false;
	}
    };

    this.logicalAndExpression = function (noIn) {
	var expr = this.bitwiseOrExpression(noIn);
	if (expr) {
	    return this.logicalAndExpressionRest(expr, noIn) || expr;
	} else {
	    return false;
	}
    };

    this.logicalOrExpressionRest = function (first, noIn) {
	if (this.accept('||')) {
	    var second = this.expect(this.logicalAndExpression(noIn));
	    var result = ['logical_or', first, second];
	    return this.logicalOrExpressionRest(result, noIn) || result;
	} else {
	    return false;
	}
    };

    this.logicalOrExpression = function (noIn) {
	var expr = this.logicalAndExpression(noIn);
	if (expr) {
	    return this.logicalOrExpressionRest(expr, noIn) || expr;
	} else {
	    return false;
	}
    };

    this.conditionalExpression = function (noIn) {
	var cond = this.logicalOrExpression(noIn);
	if (cond) {
	    if (this.accept('?')) {
		var thenBranch = this.expect(this.assignmentExpression(noIn));
		this.expect(this.accept(':'));
		var elseBranch = this.expect(this.assignmentExpression(noIn));
		return ['cond', cond, thenBranch, elseBranch];
	    } else {
		return cond;
	    }
	} else {
	    return false;
	}
    };

    this.assignmentOperator = function () {
	if (this.accept('=')) {
	    return 'assign';
	} else if (this.accept('+=')) {
	    return 'aug_assign_add';
	} else if (this.accept('-=')) {
	    return 'aug_assign_sub';
	} else if (this.accept('*=')) {
	    return 'aug_assign_mul';
	} else if (this.accept('/=')) {
	    return 'aug_assign_div';
	} else if (this.accept('%=')) {
	    return 'aug_assign_mod';
	} else if (this.accept('<<=')) {
	    return 'aug_assign_left_shift';
	} else if (this.accept('>>=')) {
	    return 'aug_assign_right_shift';
	} else if (this.accept('>>>=')) {
	    return 'aug_assign_right_shift_zero';
	} else if (this.accept('&=')) {
	    return 'aug_assign_bitwise_and';
	} else if (this.accept('^=')) {
	    return 'aug_assign_bitwise_xor';
	} else if (this.accept('|=')) {
	    return 'aug_assign_bitwise_or';
	} else {
	    return false;
	};
    };

    this.assignmentExpression = function (noIn) {
	var expr;
	if (expr = this.leftHandSideExpression()) {
	    var op = this.expect(this.assignmentOperator());
	    var val = this.expect(this.assignmentExpression(noIn));
	    return [op, expr, val];
	} else if (expr = this.conditionalExpression(noIn)) {
	    return expr;
	} else {
	    return false;
	}
    };

    this.expression = function (noIn) {
	var expr = this.assignmentExpression(noIn);
	if (expr) {
	    var exprs = [expr];
	    var hasMultiple = false;
	    while (this.accept(',')) {
		hasMultiple = true;
		exprs.push(this.expect(this.assignmentExpression(noIn)));
	    }
	    if (hasMultiple) {
		exprs.shift('comma');
		return exprs;
	    } else {
		return expr;
	    }
	} else {
	    return false;
	}
    };

    this.getToken();
}
