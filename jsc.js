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

importPackage(java.io, java.lang);

load("jsc_config.js");
load("jsc_modules.js");
load("util.js");


function compile (prog) {
    var symbols_used = [];
    var functions_defined = {};
    var main_text = wrapMain(prog, symbols_used, functions_defined);

    var include_text = '#include "js_types.h"\n';
    var included_files = { "js_types.h" : true };
    foreach(symbols_used, 
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
    foreach(functions_defined,
	    function (func) {
		declaration_text += func["declaration"];
		definition_text += func["definition"];
	    });

    return include_text + declaration_text + main_text + definition_text;
}

function wrapMain (main, symbols_used, functions_defined) {
    var body = compileProgram(main, symbols_used, functions_defined);
    var resultText = 
	"int main() {" + "\n" +
	body +
	"return 0;" + "\n" +
	"}\n";
    return resultText;
}

function compileProgram(prog, symbols_used, functions_defined) {
    if (!prog) {
	return "{}\n";
    } else  if (prog[0] == "do") {
	return compileDo(prog, symbols_used, functions_defined);
    } else if (prog[0] == "defun") {
	compileDefun(prog, symbols_used, functions_defined);
	return "";
    } else if (prog[0] == "if") {
	return compileIf(prog, symbols_used, functions_defined);
    } else {
	return compileStatement(prog, symbols_used, functions_defined);
    }
}

function compileDo(prog, symbols_used, functions_defined) {
    var statements = rest(prog);
    var resultText = "{\n";

    foreach(statements, 
	    function (statement) {
		var comp = compileProgram(statement,
					  symbols_used, functions_defined);
		resultText += comp;
	    });
    resultText += "}\n";

    return resultText;
}

function compileDefun(defun, symbols_used, functions_defined) {
    var name = moduleFunction("user", defun[1]);
    if (defined(functions_defined[name])) {
	throw Error("Multiple definitions of function " + name + ".");
    }
    var args = defun[2];
    var body = defun[3];
    var signature = 
	"void " + name +
	"(" + map(args, function(str) {
		return "struct js_value *" + str;
	    }).join(", ") + ")";

    var declText = signature + ";\n"
	var defText = 
	signature + " {\n" +
	compileProgram(body, symbols_used, functions_defined) +
	"}\n";
  
    functions_defined[name] = { "declaration" : declText,
				"definition" : defText };
}

function compileIf(cond, symbols_used, functions_defined) {
    var condition = cond[1];
    var thenb = cond[2];
    var elseb = cond[3];

    symbols_used.push(jsc_builtins["is_true"]);
    var text = 
	("if (" + jsc_builtins["is_true"] + "(" + 
	 compileExpr(condition, symbols_used, functions_defined) + ")) " +
	 compileProgram(thenb, symbols_used, functions_defined)) +
	("else " + compileProgram(elseb, symbols_used, functions_defined));

    return text;
}

function compileStatement(prog, symbols_used, functions_defined) {
    return compileExpr(prog, symbols_used, functions_defined) + ";\n";
}

function compileExpr(expr, symbols_used, functions_defined) {
    switch (expr[0]) {
    case "call":
	return compileCall(expr, symbols_used, functions_defined);
    case "lambda":
	return compileLambda(expr, symbols_used, functions_defined);
    case "int":
	symbols_used.push(jsc_builtins['create_fixnum']);
	return jsc_builtins['create_fixnum'] + '(' + expr[1].toString() + ')';
    case "string":
	symbols_used.push(jsc_builtins['create_string']);
	return jsc_builtins['create_string'] + '("' + expr[1] + '")';
    case "varget":
	return expr[1].toString();
    default:
	throw TypeError("Invalid expression type.");
    }
}

function compileCall(expr, symbols_used, functions_defined) {
    var resultString = "";
    var func = expr[1];
    var args = rest(rest(expr));
    if (Array.isArray(func)) {
	func = compileExpr(func, symbols_used, functions_defined);
    }

    if (jsc_builtins[func] !== undefined) {
	resultString += jsc_builtins[func];
	symbols_used.push(jsc_builtins[func]);
    } else {
	resultString += moduleFunction("user", func);
    }
    resultString += "(";
 
    if (args.length > 0) {
	foreach(args, 
		function (arg) {
		    var comp = compileExpr(arg, symbols_used, functions_defined);
		    resultString += comp + ",";
		});
	resultString = resultString.substring(0, resultString.length - 1);
    }
    resultString += ")";
 
    return resultString;
}

var lambda_count = 0;
function compileLambda(lambda, symbols_used, functions_defined) {
    var name = "lambda_" + lambda_count;
    lambda_count++;
    compileDefun(["defun", name, lambda[1],
		  lambda[2]], symbols_used, functions_defined);

    return name;
}

hello_world = ["call", "println", ["string", "Hello, world!"]];
hello_world_2_arg = ["call", "print2ln", ["string", "Hello,"],
		     ["string", "World!"]];
multiple_exprs = ["do", 
		  ["call", "print", ["string", "Hello,"]],
		  ["call", "print", ["string", " "]],
		  ["call", "println", ["string", "World!"]]];
subexprs = ["do", 
	    ["call", "print", ["string", "'Hello world' takes "]],
	    ["call", "print_int", ["call", "strlen", 
				   ["string", "Hello world"]]],
	    ["call", "println", ["string", "bytes."]]];

defun = ["do",
	 ["defun", "hello_world", [], 
	  ["call", "println", ["string", "Hello, world!"]]],
	 ["call", "hello_world"]];

int_literal = ["call", "print_int", ["int", 11]];

cond = ["do",
	["if", ["int", 1],
	 ["call", "println", ["string", "1 is true."]],
	 ["call", "println", ["string", "wrong 1 is false."]]],
	["if", ["int", 0],
	 ["call", "println", ["string", "wrong 0 is true."]],
	 ["call", "println", ["string", "0 is false."]]],
	["if", ["string", ""],
	 ["call", "println", ["string", "wrong \'\' is true."]],
	 ["call", "println", ["string", "\'\' is false."]]],
	["if", ["string", "Hello"],
	 ["call", "println", ["string", "\'Hello\' is true."]],
	 ["call", "println", ["string", "wrong \'Hello\' is false."]]]];

lambda_usage = ["call", ["lambda", [],
			 ["call", "println", 
			  ["string", "Hello, world!"]]]];

defun_args = ["do", 
	      ["defun", "print_two_things", ["s1", "s2"],
	       ["do", 
		["call", "print", ["varget", "s1"]],
		["call", "println", ["varget", "s2"]]]],
	      ["call", "print_two_things", 
	       ["string", "Hello, "],
	       ["string", "World!"]]];

assignment = ["do",
	      ["assign", "f", ["fixnum", 5]]
	      ["call", "println", ["varget", "f"]],
	      ["assign", "f", ["string", "Hello, there."]],
	      ["call", "println", ["varget", "f"]]]
