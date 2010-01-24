importPackage(java.io, java.lang);

load("util.js");

symbol_locations = { 
  "js_print": "js_io.h",
  "js_println" : "js_io.h"
};

builtins = { 
  "print" : "js_print",
  "println" : "js_println"
}


function compile (expr) {
  var main = wrapMain(compileExpr(expr));
  var text = main[0];
  var symbols_used = main[1];

  var include_text = "";
  map(symbols_used, 
      function (symbol) {
	if (symbol_locations[symbol]) {
	  include_text += "#include " + 
	    "\"" + symbol_locations[symbol] + "\"\n";
	}
      });

  return include_text + text;
}

function wrapMain (main) {
  var body = main[0];
  var symbols_used = main[1];
  var resultText = 
    "int main() {" + "\n" +
    "\t" + body +
    "\t" + "return 0;" + "\n" +
    "}";
  return [resultText, symbols_used];
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
  resultString += ");\n";

  var symbols_used = ["js_" + func];

  return [resultString, symbols_used];
}

function compileLiteral(expr) {
  if (expr[0] == "string") {
    return "\"" + expr[1] + "\"";
  }
}

program = ["print", ["string", "Hello, world!"]];

print(compile(program));
