var ast = require('./ast');
var grammar = require('./grammar');
var util = require('./util');

var lex = require('jslex');

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
    
    this.acceptClass = function (cls) {
	return function () {
	    var tok = this.peek();
	    if (util.isa(tok, cls)) {
		this.getToken();
		return tok;
	    } else {
		return false;
	    }
	};
    };

    this.expect = function expect (nonterm) {
	if (nonterm) {
	    return nonterm;
	} else {
	    throw SyntaxError("in expect: unexpected " + this.peek() 
			      + " in " + this.tokens);
	}
    };

    this.identifier = this.acceptClass(ast.Identifier);

    this.acceptIdentifier = function acceptIdentifier(id) {
	var tok = this.peek();
	if (util.isa(tok, ast.Identifier) && tok.name === id) {
	    this.getToken();
	    return tok;
	} else {
	    return false;
	}
    };

    this.acceptReservedWord = function (word) {
	var tok = this.peek();
	if (util.isa(tok, ast.ReservedWord(tok)) && tok.name === word) {
	    this.getToken();
	    return tok;
	} else {
	    return false;
	}
    }

    this.booleanLiteral = this.acceptClass(ast.BooleanLiteral);

    this.nullLiteral = this.acceptClass(ast.NullLiteral);

    this.numberLiteral = this.acceptClass(ast.NumberLiteral);

    this.regexLiteral = this.acceptClass(ast.RegularExpressionLiteral);

    this.stringLiteral = this.acceptClass(ast.StringLiteral);

    this.literal = function literal() {
	return this.nullLiteral() ||
	    this.booleanLiteral() ||
	    this.numberLiteral() ||
	    this.regexLiteral() ||
	    this.stringLiteral();
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
		return new ast.ArrayLiteral([], 0);
	    } else if (beginElision = this.elision()) {
		length = beginElision;
		if (expr = this.assignmentExpression()) {
		    ary[length] = expr;
		    length++;
		    if (rest = this.elementListRest()) {
			ary = ary.concat(rest);
			length += rest.length;
		    }
			this.expect(this.accept(']'));
			return new ast.ArrayLiteral(ary, length);
		}
	    } else if (expr = this.assignmentExpression()) {
		if (rest = this.elementListRest()) {
		    ary = rest.shift(expr);
		    this.expect(this.accept(']'));
		    return new ast.ArrayLiteral(ary, ary.length);
		} else {
		    this.except(this.accept(']'));
		    return new ast.ArrayLiteral([expr], 1);
		}
	    } else {
		throw SyntaxError("in arrayLiteral");
	    }
	} else {
	    return false;
	}
    };

    this.propertyName = function propertyName() {
	return this.identifier()
	    || this.stringLiteral()
	    || this.numericLiteral();
    };

    this.propertyAssignment = function propertyAssignment() {
	if (this.acceptIdentifier('get')) {
	    var name = this.propertyName();
	    this.expect(this.accept('('));
	    this.expect(this.accept(')'));
	    this.expect(this.accept('{'));
	    var body = this.expect(this.functionBody);
	    this.expect(this.accept('}'));
	    return new ast.GetProperty(name, body);
	} else if (this.acceptIdentifier('set')) {
	    var name = this.propertyName();
	    this.expect(this.accept('('));
	    var arg = this.expect(this.identifier());
	    this.expect(this.accept(')'));
	    this.expect(this.accept('{'));
	    var body = this.expect(this.functionBody);
	    this.expect(this.accept('}'));
	    return new ast.SetProperty(name, arg, body);
	} else {
	    var name = (this.identifier() || this.stringLiteral() ||
			this.numberLiteral());
	    if (name) {
		this.expect(this.accept(':'));
		var val = this.expect(this.expression());
		return new ast.Property(name, val);
	    } else {
		return false;
	    }
	}
    };

    this.objectLiteral = function objectLiteral() {
	if (this.accept('{')) {
	    var props = [];
	    var assn;
	    while (assn = this.propertyAssignment()) {
		props.push(assn);
		if (!this.accept(',')) {
		    break;
		}
	    }
	    this.accept(',');
	    if (this.accept('}')) {
		return new ast.ObjectLiteral(props);
	    } else {
		throw SyntaxError("in objectLiteral: expected }");
	    }
	} else {
	    return false;
	}
    };

    this.primaryExpression = function primaryExpression () {
	if  (this.accept('(')) {
	    var result = this.expression();
	    return this.accept(')') && result;
	} else {
	    return this.acceptReservedWord("this")
		|| this.identifier()
		|| this.literal()
		|| this.arrayLiteral()
		|| this.objectLiteral();
	}
    };

    this.memberExpression = function memberExpression() {
	var expr;
	var result;
	if (this.accept('new')) {
	    expr = this.expect(this.memberExpression());
	    var args;
	    if (args = this.argumentsList()) {
		result = new ast.New(expr, args);
		return this.memberExpressionRest(result) || result;
	    } else {
		return new ast.New(expr);
	    }
	} else if ((expr = this.primaryExpression()) || 
		   (expr = this.functionExpression())) {
	    return this.memberExpressionRest(expr) || expr;
	} else {
	    return false;
	}
    };

    this.memberExpressionRest = function memberExpressionRest (firstE) {
	if (this.accept('[')) {
	    var indexExpr = this.expect(this.expression());
	    this.expect(this.accept(']'));
	    var result = new ast.Subscript(firstE, indexExpr);
	    return this.memberExpressionRest(result) || result;
	} else if (this.accept('.')) {
	    var propName = this.expect(this.identifier()).name;
	    var result = new ast.Subscript(firstE,
					   new ast.StringLiteral(propName));
	    return this.memberExpressionRest(result) || result;
	} else {
	    return false;
	}
    };

    this.callExpressionRest = function callExpressionRest(first) {
	var args;
	if (args = this.argumentsList()) {
	    var result = new ast.Call(first, args);
	    return this.callExpressionRest(result) || result;
	} else if (this.accept('[')) {
	    var expr = this.expect(this.expression());
	    this.expect(this.accept(']'));
	    var result = new ast.Subscript(first, expr);
	    return this.callExpressionRest(result) || result;
	} else if (this.accept('.')) {
	    var propName = this.expect(this.identifier()).name;
	    var result = new ast.Subscript(first,
					   new ast.StringLiteral(propName));
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
		return new ast.PostIncrement(expr);
	    } else if (this.accept('--')) {
		return new ast.PostDecrement(expr);
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
	    return new ast.Delete(this.expect(this.unaryExpression()));
	} else if (this.accept('void')) {
	    return new ast.Void(this.expect(this.unaryExpression()));
	} else if (this.accept('typeof')) {
	    return new ast.TypeOf(this.expect(this.unaryExpression()));
	} else if (this.accept('++')) {
	    return new ast.PreIncrement(this.expect(this.unaryExpression()));
	} else if (this.accept('--')) {
	    return new ast.PreDecrement(this.expect(this.unaryExpression()));
	} else if (this.accept('+')) {
	    return new ast.UnaryPlus(this.expect(this.unaryExpression()));
	} else if (this.accept('-')) {
	    return new ast.UnaryMinus(this.expect(this.unaryExpression()));
	} else if (this.accept('~')) {
	    return new ast.BitwiseNot(this.expect(this.unaryExpression()));
	} else if (this.accept('!')) {
	    return new ast.LogicalNot(this.expect(this.unaryExpression()));
	} else {
	    return false;
	}
    };

    this.multiplicativeExpressionRest = function multiplicativeExpressionRest(first) {
	if (this.accept('*')) {
	    var second = this.expect(this.unaryExpression());
	    var result = new ast.Multiply(first, second);
	    return this.multiplicativeExpressionRest(result) || result;
	} else if (this.accept('/')) {
	    var second = this.expect(this.unaryExpression());
	    var result = new ast.Divide(first, second);
	    return this.multiplicativeExpressionRest(result) || result;
	} else if (this.accept('%')) {
	    var second = this.expect(this.unaryExpression());
	    var result = new ast.Modulo(first, second);
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
	    var result = 
		new ast.Add(first, 
			    this.expect(this.multiplicativeExpression()));
	    return this.additiveExpressionRest(result) || result;
	} else if (this.accept('-')) {
	    var result = 
		(new 
		 ast.Subtract(first,
			      this.expect(this.multiplicativeExpression())));
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
	    var result = new ast.ShiftLeft(first, second);
	    return this.shiftExpressionRest(result) || result;
	} else if (this.accept('>>')) {
	    var second = this.additiveExpression();
	    var result = new ast.SignedShiftRight(first, second);
	    return this.shiftExpressionRest(result) || result;
	} else if (this.accept('>>>')) {
	    var second = this.additiveExpression();
	    var result = new ast.UnsignedShiftRight(first, second);
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
	    var result = new ast.LessThan(first, second);
	    return this.relationalExpressionRest(result, noIn) || result;
	} else if (this.accept('>')) {
	    var second = this.expect(this.shiftExpression());
	    var result = new ast.GreaterThan(first, second);
	    return this.relationalExpressionRest(result, noIn) || result;
	} else if (this.accept('<=')) {
	    var second = this.expect(this.shiftExpression());
	    var result = new ast.LessThanOrEqual(first, second);
	    return this.relationalExpressionRest(result, noIn) || result;
	} else if (this.accept('>=')) {
	    var second = this.expect(this.shiftExpression());
	    var result = new ast.GreaterThanOrEqual(first, second);
	    return this.relationalExpressionRest(result, noIn) || result;
	} else if (this.accept('instanceof')) {
	    var second = this.expect(this.shiftExpression());
	    var result = new ast.InstanceOf(first, second);
	    return this.relationalExpressionRest(result, noIn) || result;
	} else if (!noIn && this.accept('in')) {
	    var second = this.expect(this.shiftExpression());
	    var result = new ast.In(first, second);
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
	    var result = new ast.Equal(first, second);
	    return this.equalityExpressionRest(result, noIn) || result;
	} else if (this.accept('!=')) {
	    var second = this.relationalExpression(noIn);
	    var result = new ast.NotEqual(first, second);
	    return this.equalityExpressionRest(result, noIn) || result;	
	} else if (this.accept('===')) {
	    var second = this.relationalExpression(noIn);
	    var result = new ast.StrictEqual(first, second);
	    return this.equalityExpressionRest(result, noIn) || result;
	} else if (this.accept('!==')) {
	    var second = this.relationalExpression(noIn);
	    var result = new ast.StrictNotEqual(first, second);
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
	    var result = ast.BitwiseAnd(first, second);
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
	    var result = new ast.BitwiseXor(first, second);
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
	    var result = new ast.BitwiseOr(first, second);
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
	    var result = new ast.LogicalAnd(first, second);
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
	    var result = new ast.LogicalOr(first, second);
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
		return new ast.Conditional(cond, thenBranch, elseBranch);
	    } else {
		return cond;
	    }
	} else {
	    return false;
	}
    };

    this.assignmentOperator = function () {
	if (this.accept('=')) {
	    return ast.Assign;
	} else if (this.accept('+=')) {
	    return ast.AddAssign;
	} else if (this.accept('-=')) {
	    return ast.SubtractAssign;
	} else if (this.accept('*=')) {
	    return ast.MultiplyAssign;
	} else if (this.accept('/=')) {
	    return ast.DivideAssign;
	} else if (this.accept('%=')) {
	    return ast.ModuloAssign;
	} else if (this.accept('<<=')) {
	    return ast.LeftShiftAssign;
	} else if (this.accept('>>=')) {
	    return ast.SignedRightShiftAssign;
	} else if (this.accept('>>>=')) {
	    return ast.UnsignedRightShiftAssign;
	} else if (this.accept('&=')) {
	    return ast.BitwiseAndAssign;
	} else if (this.accept('^=')) {
	    return ast.BitwiseXorAssign;
	} else if (this.accept('|=')) {
	    return ast.BitwiseOrAssign;
	} else {
	    return false;
	};
    };

    this.assignmentExpression = function (noIn) {
	var expr;
	if (expr = this.conditionalExpression(noIn)) {
	    var opConstr;
	    if (opConstr = this.assignmentOperator()) {
		var val = this.expect(this.assignmentExpression(noIn));
		return opConstr(expr, val);
	    } else {
		return expr;
	    }
	} else {
	    return false;
	}
    };

    this.expression = function (noIn) {
	var expr = this.assignmentExpression(noIn);
	var result = expr;
	if (!expr) {
	    return false;
	}
	while (this.accept(',')) {
	    result = 
		(new 
		 ast.Comma(result,
			   this.expect(this.assignmentExpression(noIn))));
	}
	return result;	
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

    this.block = function () {
	if (this.accept('{')) {
	    var result = new ast.Block(this.statementList() || []);
	    this.expect('}');
	    return result;
	} else {
	    return false;
	}
    };

    this.variableStatement = function () {
	if (this.acceptReservedWord("var")) {
	    var decls = this.variableDeclarationList();
	    this.expect(this.accept(';'));
	    return new ast.VariableStatement(decls);
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
	    var result = earlierDecls.push(nextDecl);
	    return this.variableDeclarationListRest(result, noIn) || result;
	} else {
	    return false;
	}
    };

    this.variableDeclaration = function (noIn) {
	var id = this.identifier();
	if (id) {
	    var init = this.initialiser(noIn);
	    if (init) {
		return new ast.VariableDeclaration(id, init);
	    } else {
		return new ast.VariableDeclaration(id);
	    }
	} else {
	    return false;
	}
    };

    this.initialiser = function (noIn) {
	if (this.accept('=')) {
	    return this.expect(this.assignmentExpression(noIn));
	} else {
	    return false;
	}
    };

    this.emptyStatement = function () {
	return this.accept(';') && new ast.Empty();
    };

    this.expressionStatement = function () {
	var tok = this.peek();
	var expr;
	if (tok === "{") {
	    return false;
	}
	if (util.isa(tok, ast.ReservedWord) && tok.name === "function") {
	    return false;
	}
	if (expr = this.expression()) {
	    this.expect(this.accept(';'));
	    return new ast.ExpressionStatement(expr);
	} else {
	    return false;
	}
    };

    this.ifStatement = function () {
	if (this.accept('if')) {
	    this.expect(this.accept('('));
	    var cond = this.expect(this.expression());
	    this.expect(this.accept(')'));
	    var thenBlock = this.expect(this.statement());
	    if (this.accept('else')) {
		return new ast.If(cond,
				  thenBlock,
				  this.expect(this.statement()));
	    } else {
		return new ast.If(cond, thenBlock);
	    }
	} else {
	    return false;
	}
    };

    this.iterationStatement = function () {
	return this.doStatement()
	    || this.whileStatement()
	    || this.forStatement();
    };

    this.doStatement = function () {
	if (this.accept('do')) {
	    var body = this.expect(this.statement());
	    this.expect(this.accept('while'));
	    this.expect(this.accept('('));
	    var cond = this.expect(this.expression());
	    this.expect(this.accept(')'));
	    this.expect(this.accept(';'));
	    return new ast.Do(body, cond);
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
	    return new ast.While(cond, body);
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
		return new ast.ForIn(init, container, cond, step, body);
	    } else {
		return new ast.For(init, cond, step, body);
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
		return new ast.Continue(id);
	    } else {
		return new ast.Continue();
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
		return new ast.Break(id);
	    } else {
		return new ast.Break();
	    }
	} else {
	    return false;
	}
    };

    this.returnStatement = function () {
	if (this.accept('return')) {
	    var expr = this.expression();
	    this.expect(this.accept(';'));
	    if (expr) {
		return new ast.Return(expr);
	    } else {
		return new ast.Return();
	    }
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
	    return new ast.With(expr, statement);
	} else {
	    return false;
	}
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
    return new Parser(
	lex.jsLex(grammar.lexicalGrammar, str)).program();
}

function parseFile(file) {
    return new Parser(
	lex.jsLex(grammar.lexicalGrammar, readFile(file))).program();
}

if (typeof exports !== "undefined") {
    exports.Parser = Parser;
    exports.parseString = parseString;
    exports.parseFile = parseFile; 
}