var config = require("./jsc_config");
var modules = require("./jsc_modules");
var scopes = require("./jsc_scopes");
var util = require("./util");

var jsc_symbol_locations = config.jsc_symbol_locations;
var jsc_builtins = config.jsc_builtins;

function compile (prog) {
    var symbols_used = [];
    var functions_defined = {};
    var globalScope = new scopes.Scope(null);
    var main_text = wrapMain(prog, symbols_used, functions_defined, globalScope);
    
    var include_text = '#include "js_types.h"\n';
    var included_files = { "js_types.h" : true };
    util.foreach(symbols_used, 
	    function (symbol) {
		var file = jsc_symbol_locations[symbol];
		if (file != undefined && included_files[file] == undefined) {
		    include_text += "#include " + 
			"\"" + file + "\"\n";
		    included_files[file] = true;
		}
	    });
    
    
    var declaration_text = "";
    var definition_text = "";
    util.foreach(functions_defined,
		 function (func) {
		     declaration_text += func["declaration"];
		     definition_text += func["definition"];
		 });
    
    return include_text + declaration_text + main_text + definition_text;
}

function wrapMain (main, symbols_used, functions_defined, scope) {
    var body = compileProgram(main, symbols_used, functions_defined, scope);
    var resultText = 
	"int main() {" + "\n" +
	body +
	"return 0;" + "\n" +
	"}\n";
    return resultText;
}

function compileProgram(prog, symbols_used, functions_defined, scope) {
    if (!prog) {
	return "{}\n";
    } else  if (prog[0] == "do") {
	return compileDo(prog, symbols_used, functions_defined, scope);
    } else if (prog[0] == "defun") {
	compileDefun(prog, symbols_used, functions_defined, scope);
	return "";
    } else if (prog[0] == "if") {
	return compileIf(prog, symbols_used, functions_defined, scope);
    } else {
	return compileStatement(prog, symbols_used, functions_defined, scope);
    }
}

function compileDo(prog, symbols_used, functions_defined, scope) {
    var statements = util.rest(prog);
    var resultText = "{\n";
    
    util.foreach(statements, 
		 function (statement) {
		     var comp = 
			 compileProgram(statement, symbols_used,
					functions_defined, scope);
		     resultText += comp;
		 });
    resultText += "}\n";
    
    return resultText;
}

function compileDefun(defun, symbols_used, functions_defined, scope) {
    var internalScope = new scopes.Scope(scope);

    var name = modules.moduleFunction("user", defun[1]);
    if (util.defined(functions_defined[name])) {
	throw Error("Multiple definitions of function " + name + ".");
    }
    var args = defun[2];
    util.foreach(args, function (arg) {
	internalScope.bind(arg);
    });
    
    var body = defun[3];
    var signature = 
	"void " + name +
	"(" + util.map(args, function(str) {
	    return "struct js_value *" + str;
	}).join(", ") + ")";
    
    var declText = signature + ";\n"
    var defText = 
	signature + " {\n" +
	compileProgram(body, symbols_used,
		       functions_defined, internalScope) +
	"}\n";
    
    functions_defined[name] = { "declaration" : declText,
				"definition" : defText };
}

function compileIf(cond, symbols_used, functions_defined, scope) {
    var condition = cond[1];
    var thenb = cond[2];
    var elseb = cond[3];
    
    symbols_used.push(jsc_builtins["is_true"]);
    var text = 
	("if (" + jsc_builtins["is_true"] + "(" + 
	 compileExpr(condition, symbols_used, 
		     functions_defined, scope) + ")) " +
	 compileProgram(thenb, symbols_used, functions_defined, scope)) +
	("else " + compileProgram(elseb, symbols_used, 
				  functions_defined, scope));
    
    return text;
}

function compileStatement(prog, symbols_used, functions_defined, scope) {
    return compileExpr(prog, symbols_used, functions_defined, scope) + ";\n";
}

function compileExpr(expr, symbols_used, functions_defined, scope) {
    switch (expr[0]) {
    case "call":
	return compileCall(expr, symbols_used, functions_defined, scope);
    case "lambda":
	return compileLambda(expr, symbols_used, functions_defined, scope);
    case "int":
	symbols_used.push(jsc_builtins['create_fixnum']);
	return jsc_builtins['create_fixnum'] + '(' + expr[1].toString() + ')';
    case "string":
	symbols_used.push(jsc_builtins['create_string']);
	return jsc_builtins['create_string'] + '("' + expr[1] + '")';
    case "assign":
	return compileAssign(expr, symbols_used, functions_defined, scope);
    case "varget":
	if (scope.binds(expr[1])) {
	    return expr[1].toString();
	} else {
	    throw Error("Variable " + expr[1] + " not bound.");
	}
    default:
	throw TypeError("Invalid expression type: " + expr + ".");
    }
}

function compileAssign(expr, symbols_used, functions_defined, scope) {
    var assign = expr[1] + " = " + compileExpr(expr[2], symbols_used, 
					       functions_defined, scope);
    if (scope.binds(expr[1])) {
	return assign;
    } else {
	scope.bind(expr[1]);
	return "struct js_value *" + assign;
    }
}

function compileCall(expr, symbols_used, functions_defined, scope) {
    var resultString = "";
    var func = expr[1];
    var args = util.rest(util.rest(expr));
    if (Array.isArray(func)) {
	func = compileExpr(func, symbols_used, functions_defined, scope);
    }
    
    if (jsc_builtins[func] !== undefined) {
	resultString += jsc_builtins[func];
	symbols_used.push(jsc_builtins[func]);
    } else {
	resultString += modules.moduleFunction("user", func);
    }
    resultString += "(";
    
    if (args.length > 0) {
	util.foreach(args, 
		     function (arg) {
			 var comp = compileExpr(arg, symbols_used,
						functions_defined, scope);
			 resultString += comp + ",";
		     });
	resultString = resultString.substring(0, resultString.length - 1);
    }
    resultString += ")";
    
    return resultString;
}

var lambda_count = 0;
function compileLambda(lambda, symbols_used, functions_defined, scope) {
    var name = "lambda_" + lambda_count;
    lambda_count++;
    compileDefun(["defun", name, lambda[1],
		  lambda[2]], symbols_used, functions_defined, scope);
    
    return name;
}

if (typeof exports !== "undefined") {
    exports.compile = compile;
}