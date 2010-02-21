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

load('grammar.js');

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
	    throw SyntaxError("in expect: unexpected " + this.peek() + " in " +
		this.tokens);
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
	    return false;
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
	    return this.callExpressionRest(result) || result;
	} else {
	    return false;
	}
    };

    this.argumentsList = function argumentsList() {
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
	if (expr = this.conditionalExpression(noIn)) {
	    var op;
	    if (op = this.assignmentOperator()) {
		var val = this.expect(this.assignmentExpression(noIn));
		return [op, expr, val];
	    } else {
		return expr;
	    }
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

    this.debuggerStatement = function () {
	return this.accept('debugger');
    };

    this.finallyStatement = function () {
	if (this.accept('finally')) {
	    var block = this.expect(this.block());
	    return block;
	}
    };

    this.catchStatement = function () {
	if (this.accept('catch')) {
	    this.expect(this.accept('('));
	    var exc = this.expect(this.identifier());
	    this.expect(this.accept(')'));
	    var block = this.expect(this.block());
	    return [exc, block];
	} else {
	    return false;
	}
    };

    this.tryStatement = function () {
	if (this.accept('try')) {
	    var block = this.expect(this.block());
	    var catchB;
	    var finallyB;
	    if (catchB = this.catchStatement()) {
		if (finallyB = this.finallyStatement()) {
		    return ['try', catchB, finallyB];
		} else {
		    return ['try', catchB, null];
		}
	    } else if (finallyB = this.finallyStatement()) {
		return ['try', null, finallyB];
	    } else {
		throw SyntaxError('in tryS: need either catch or finally block.');
	    }
	} else {
	    return false;
	}
    };

    this.throwStatement = function () {
	if (this.accept('throw')) {
	    var expr = this.expect(this.expression());
	    this.expect(this.accept(';'));
	    return ['throw', expr];
	} else {
	    return false;
	}
    };

    this.labelledStatement = function () {
	var label;
	if (label = this.identifier()) {
	    this.expect(this.accept(':'));
	    var st = this.expect(this.statement());
	    return ["labelled", label, st];
	} else {
	    return false;
	}
    };

    this.caseClause = function () {
	if (this.accept('case')) {
	    var expr = this.expect(this.expression());
	    this.expect(this.accept(':'));
	    var statements = this.statementList() || [];
	    statements.unshift(expr);
	    return statements;
	} else {
	    return false;
	}
    };

    this.caseClausesRest = function (firstCs) {
	var nextC = this.caseClause();
	if (nextC) {
	    var result = firstCs.concat([nextC]);
	    return this.caseClausesRest(result) || result;
	} else {
	    return false;
	}
    };

    this.caseClauses = function () {
	var firstC = this.caseClause();
	if (firstC) {
	    return this.caseClausesRest([firstC]) || firstC;
	} else {
	    return false;
	}
    };

    this.defaultClause = function () {
	if (this.accept('default')) {
	    this.expect(this.accept(':'));
	    var statements = this.statementList() || [];
	    statements.unshift('default');
	    return statements;
	} else {
	    return false;
	}
    };

    this.caseBlock = function () {
	if (this.accept('{')) {
	    var firstClauses = this.caseClauses();
	    if (firstClauses) {
		var defaultClause = this.defaultClause();
		if (defaultClause) {
		    firstClauses.push(['default', defaultClause]);
		    var otherClauses = this.caseClauses();
		    if (otherClauses) {
			firstClauses.concat(otherClauses);
		    } else {
			return firstClauses;
		    }
		} else {
		    return firstClauses;
		}
	    } else {
		this.expect(this.accept('}'));
		return [];
	    } 
	} else {
	    return false;
	}
    };

    this.switchStatement = function () {
	if (this.accept('switch')) {
	    this.expect(this.accept('('));
	    var val = this.expect(this.expression());
	    this.expect(this.accept(')'));
	    var cases = this.expect(this.caseBlock());
	    return ['switch', val, cases];
	} else {
	    return false;
	}
    };

    this.withStatement = function () {
	if (this.accept('with')) {
	    this.expect(this.accept('('));
	    var expr = this.expect(this.expression());
	    this.expect(this.accept(')'));
	    var statement = this.expect(this.statement());
	    return ['with', expr, statement];
	} else {
	    return false;
	}
    };

    this.returnStatement = function () {
	if (this.accept('return')) {
	    var expr = this.expression();
	    this.expect(this.accept(';'));
	    if (expr) {
		return ['return', expr];
	    } else {
		return ['return'];
	    }
	} else {
	    return false;
	}
    };

    this.breakStatement = function () {
	if (this.accept('break')) {
	    var id = this.identifier();
	    this.expect(this.accept(';'));
	    if (id) {
		return ['break', id];
	    } else {
		return ['break'];
	    }
	} else {
	    return false;
	}
    };

    this.continueStatement = function () {
	if (this.accept('continue')) {
	    var id = this.identifier();
	    this.expect(this.accept(';'));
	    if (id) {
		return ['continue', id];
	    } else {
		return ['continue'];
	    }
	} else {
	    return false;
	}
    };

    this.doStatement = function () {
	if (this.accept('do')) {
	    var body = this.expect(this.statement());
	    this.expect(this.accept('while'));
	    this.expect(this.accept('('));
	    var cond = this.expect(this.expression());
	    this.expect(this.accept(')'));
	    this.expect(this.accept(';'));
	    return ['do', body, cond];
	} else {
	    return false;
	}
    };

    this.whileStatement = function () {
	if (this.accept('while')) {
	    this.expect(this.accept('('));
	    var cond = this.expect(this.expression());
	    this.expect(this.accept(')'));
	    var body = this.expect(this.statement());
	    return ['while', cond, body];
	} else {
	    return false;
	}
    };

    this.forStatement = function () {
	if (this.accept('for')) {
	    this.expect(this.accept('('));
	    var isForIn = false;
	    var init;
	    var container;
	    var cond;
	    var step;
	    var body;
	    if (this.accept('var')) {
		init = this.expect(this.variableDeclaration(true));
	    } else {
		init = this.expect(this.expression(true));
	    }
	    if (this.accept('in')) {
		isForIn = true;
		container = this.expect(this.expression());
	    }
	    if (!isForIn) {
		this.expect(this.accept(';'));
		cond = this.expression();
		this.expect(this.accept(';'));
		step = this.expression();
	    }
	    this.expect(this.accept(')'));
	    body = this.expect(this.statement());
	    if (isForIn) {
		return ['forin', [init, container], cond, step,
			body];
	    } else {
		return ['for', init, cond, step,
			body];
	    }
	} else {
	    return false;
	}
    };

    this.iterationStatement = function () {
	return this.doStatement() || this.whileStatement() || this.forStatement();
    };

    this.ifStatement = function () {
	if (this.accept('if')) {
	    this.expect(this.accept('('));
	    var cond = this.expect(this.expression());
	    this.expect(this.accept(')'));
	    var thenBlock = this.expect(this.statement());
	    if (this.accept('else')) {
		return ['if', cond, thenBlock, this.expect(this.statement())];
	    } else {
		return ['if', cond, thenBlock];
	    }
	} else {
	    return false;
	}
    };

    this.expressionStatement = function () {
	var t = this.peek();
	var expr;
	if (!(t in ['{', 'function']) && (expr = this.expression())) {
	    this.expect(this.accept(';'));
	    return ['expr', expr];
	} else {
	    return false;
	}
    };

    this.emptyStatement = function () {
	return this.accept(';') && ['empty'];
    };

    this.initialiser = function (noIn) {
	if (this.accept('=')) {
	    return this.expect(this.assignmentExpression(noIn));
	} else {
	    return false;
	}
    };

    this.variableDeclaration = function (noIn) {
	var id = this.identifier();
	if (id) {
	    var init = this.initialiser(noIn);
	    if (init) {
		return ['init', id, init];
	    } else {
		return id;
	    }
	} else {
	    return false;
	}
    };

    this.variableDeclarationList = function (noIn) {
	var decl = this.variableDeclaration(noIn);
	if (decl) {
	    return this.variableDeclarationListRest([decl], noIn) || decl;
	} else {
	    return false;
	}
    };

    this.variableDeclarationListRest = function (earlierDecls, noIn) {
	if (this.accept(',')) {
	    var nextDecl = this.expect(this.variableDeclaration(noIn));
	    var result = earlierDecls.concat([nextDecl]);
	    return this.variableDeclarationListRest(result, noIn) || result;
	} else {
	    return false;
	}
    };

    this.variableStatement = function () {
	if (this.accept('var')) {
	    var decls = this.variableDeclarationList();
	    this.expect(this.accept(';'));
	    decls.unshift('declarations');
	    return decls;
	} else {
	    return false;
	}
    };
    
    this.statementListRest = function (firstStatements) {
	var nextSt;
	if (nextSt = this.statement()) {
	    var result = firstStatements.concat([nextSt]);
	    return this.statementListRest(result) || result;
	} else {
	    return false;
	}
    };

    this.statementList = function () {
	var st;
	if (st = this.statement()) {
	    var result = [st];
	    return this.statementListRest(result) || result;
	} else {
	    return false;
	}
    };

    this.block = function () {
	if (this.accept('{')) {
	    var result = ['do'].concat(this.statementList());
	    this.expect('}');
	    return result;
	} else {
	    return false;
	}
    };

    this.statement = function () {
	return (this.block() ||
		this.variableStatement() ||
		this.emptyStatement() ||
		this.expressionStatement() ||
		this.ifStatement() ||
		this.iterationStatement() ||
		this.continueStatement() ||
		this.breakStatement() ||
		this.returnStatement() ||
		this.withStatement() ||
		this.labelledStatement() ||
		this.switchStatement() ||
		this.throwStatement() ||
		this.tryStatement() ||
		this.debuggerStatement());	
    };

    this.functionBody = function () {
	return this.sourceElements() || [];
    };

    this.formalParameterList = function () {
	var result = [];
	var id;
	while (id = this.identifier()) {
	    result.push(id);
	    if (!this.accept(',')) {
		break;
	    }
	}
	return result;
    };

    this.functionDeclaration = function () {
	if (this.accept('function')) {
	    var name = this.expect(this.identifier());
	    this.expect(this.accept('('));
	    var params = this.formalParameterList() || [];
	    this.expect(this.accept(')'));
	    this.expect(this.accept('{'));
	    var body = this.functionBody();
	    this.expect(this.accept('}'));
	    return ['defun', name, params, body];
	} else {
	    return false;
	}
    };

    this.functionExpression = function () {
	if (this.accept('function')) {
	    var name = this.identifier();
	    this.expect(this.accept('('));
	    var params = this.formalParameterList() || [];
	    this.expect(this.accept(')'));
	    this.expect(this.accept('{'));
	    var body = this.functionBody();
	    this.expect(this.accept('}'));
	    if (name) {
		return ['named_lambda', name, params, body];
	    } else {
		return ['lambda', params, body];
	    }
	} else {
	    return false;
	}
    };

    this.sourceElement = function () {
	return this.functionDeclaration() || this.statement();
    };

    this.sourceElements = function () {
	var result = [];
	var se;
	while (se = this.sourceElement()) {
	    result.push(se);
	}
	if (result.length) {
	    return result;
	} else {
	    return false;
	}
    };

    this.program = function () {
	return ['program', this.sourceElements()];
    }

    this.getToken();
}

function parseString(str) {
    return new Parser(jsLex(lexicalGrammar, str)).program();
}

function parseFile(file) {
    return new Parser(jsLex(lexicalGrammar, readFile(file))).program();
}
