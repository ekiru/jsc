#!/usr/bin/env narwhal
load("jsc.js");

var hello_world_result = 
  '#include "js_io.h"\n' +
  'int main() {\n' + 
  'js_println("Hello, world!");\n' +
  'return 0;\n' +
  '}';
function test_hello_world() {
  if (compile(hello_world) == hello_world_result) {
    print("Hello world compiled correctly.");
    return true;
  } else {
    print("Hello world failed!");
    return false;
  }
}

var hello_world_2_arg_result =
  '#include "js_io.h"\n' +
  'int main() {\n' +
  'js_print2ln("Hello,","World!");\n' +
  'return 0;\n' +
  '}';
function test_hello_world_2_arg() {
  if (compile(hello_world_2_arg) == hello_world_2_arg_result) {
    print("Multiple arguments compiled correctly.");
    return true;
  } else {
    print("Multiple arguments failed!");
    return false;
  }
}

var multiple_exprs_result =
  '#include "js_io.h"\n' +
  'int main() {\n' +
  '{\n' +
  'js_print("Hello,");\n' +
  'js_print(" ");\n' +
  'js_println("World!");\n' +
  '}\n' +
  'return 0;\n' +
  '}';
function test_multiple_exprs() {
  if (compile(multiple_exprs) == multiple_exprs_result) {
    print("Multiple expressions compiled correctly.");
    return true;
  } else {
    print("Multiple expressions failed.");
    return false;
  }
}

var subexprs_result =
  '#include "js_io.h"\n' +
  '#include "js_string.h"\n' +
  'int main() {\n' +
  '{\n' +
  'js_print("\'Hello world\' takes ");\n' +
  'js_print_int(js_strlen("Hello world"));\n' +
  'js_println("bytes.");\n' +
  '}\n' +
  'return 0;\n' +
  '}';
function test_subexprs() {
  if (compile(subexprs) == subexprs_result) {
    print("Subexpressions in function arguments compiled correctly.");
    return true;
  } else {
    print("Subexpressions in function arguments failed.");
    return false;
  }
}

function test_all() {
  var result = true;
  result = test_hello_world() && result;
  result = test_hello_world_2_arg() && result;
  result = test_multiple_exprs() && result;
  result = test_subexprs() && result;

  if (result) {
    print("Everything succeeded!");
  } else {
    print("Some tests failed.");
  }
  return result;
}

test_all();
   
