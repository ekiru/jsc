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

load("util.js");

symbol_locations = { 
  "js_print": "js_io.h",
  "js_println" : "js_io.h",
  "js_print2ln" : "js_io.h",
  "js_print_int" : "js_io.h",
  "js_strlen" : "js_string.h"
};

builtins = { 
  "print" : "js_print",
  "println" : "js_println",
  "print2ln" : "js_print2ln",
  "print_int" : "js_print_int",
  "strlen" : "js_strlen"
}


function compile (prog) {
  var main = wrapMain(compileProgram(prog));
  var text = main[0];
  var symbols_used = main[1];

  var include_text = "";
  var included_files = {};
  foreach(symbols_used, 
      function (symbol) {
	var file = symbol_locations[symbol];
	if (file != undefined && included_files[file] == undefined) {
	  include_text += "#include " + 
	    "\"" + file + "\"\n";
	  included_files[file] = true;
	}
      });

  return include_text + text;
}

function wrapMain (main) {
  var body = main[0];
  var symbols_used = main[1];
  var resultText = 
    "int main() {" + "\n" +
    body +
    "return 0;" + "\n" +
    "}";
  return [resultText, symbols_used];
}

function compileProgram(prog) {
  if (prog[0] == "do") {
    return compileDo(prog);
  } else {
    return compileStatement(prog);
  }
}

function compileDo(prog) {
  var statements = rest(prog);
  var resultText = "{\n";
  var symbolsUsed = [];

  foreach(statements, 
      function (statement) {
	var comp = compileStatement(statement);
	resultText += comp[0];
	symbolsUsed = symbolsUsed.concat(comp[1]);
      });
  resultText += "}\n";

  return [resultText, symbolsUsed];
}

function compileStatement(prog) {
  var expr = compileExpr(prog);
  
  return [expr[0] + ";\n",
	  expr[1]];
}

function compileExpr(expr) {
  if (expr[0] == "call") {
    var resultString = "";
    var func = expr[1];
    var args = rest(rest(expr));

    
    var symbols_used = [];
    
    if (builtins[func] !== undefined) {
      resultString += builtins[func];
      symbols_used = [builtins[func]];
    } else {
      resultString += "user_" + func;
    }
    resultString += "(";

    if (args.length > 0) {
      foreach(args, 
	      function (arg) {
		var comp = compileExpr(arg);
		resultString += comp[0] + ","; 
		symbols_used = symbols_used.concat(comp[1]);
	      });
      resultString = resultString.substring(0, resultString.length - 1);
    }
    resultString += ")";

    return [resultString, symbols_used];
  } else if (expr[0] == "string") {
    return ["\"" + expr[1] + "\"", []];
  }
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
	    ["call", "println", ["string", "bytes."]]]
