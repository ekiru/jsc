importPackage(java.io, java.lang);

load("util.js");

symbol_locations = { 
  "js_print": "js_io.h",
  "js_println" : "js_io.h",
  "js_print2ln" : "js_io.h"
};

builtins = { 
  "print" : "js_print",
  "println" : "js_println",
  "print2ln" : "js_print2ln"
}


function compile (prog) {
  var main = wrapMain(compileProgram(prog));
  var text = main[0];
  var symbols_used = main[1];

  var include_text = "";
  var included_files = {};
  map(symbols_used, 
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
  var resultString = "";
  var func = expr[0];
  var args = rest(expr);

  if (builtins[func] !== undefined) {
    resultString += builtins[func];
  } else {
    resultString += "user_" + func;
  }
  resultString += "(";
  resultString += map(args, compileLiteral).join(",");
  resultString += ")";

  var symbols_used = ["js_" + func];

  return [resultString, symbols_used];
}

function compileLiteral(expr) {
  if (expr[0] == "string") {
    return "\"" + expr[1] + "\"";
  }
}

hello_world = ["println", ["string", "Hello, world!"]];
hello_world_2_arg = ["print2ln", ["string", "Hello,"],
		     ["string", "World!"]];
multiple_exprs = ["do", 
		  ["print", ["string", "Hello,"]],
		  ["print", ["string", " "]],
		  ["println", ["string", "World!"]]];
