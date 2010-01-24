#!/usr/bin/env narwhal
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

load("jsc.js");

var hello_world_result = 
  '#include "js_types.h"\n' +
  '#include "js_io.h"\n' +
  'int main() {\n' + 
  'js_println(js_create_string("Hello, world!"));\n' +
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
  '#include "js_types.h"\n' +
  '#include "js_io.h"\n' +
  'int main() {\n' +
  'js_print2ln(js_create_string("Hello,"),js_create_string("World!"));\n' +
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
  '#include "js_types.h"\n' +
  '#include "js_io.h"\n' +
  'int main() {\n' +
  '{\n' +
  'js_print(js_create_string("Hello,"));\n' +
  'js_print(js_create_string(" "));\n' +
  'js_println(js_create_string("World!"));\n' +
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
  '#include "js_types.h"\n' +
  '#include "js_io.h"\n' +
  '#include "js_string.h"\n' +
  'int main() {\n' +
  '{\n' +
  'js_print(js_create_string("\'Hello world\' takes "));\n' +
  'js_print_int(js_strlen(js_create_string("Hello world")));\n' +
  'js_println(js_create_string("bytes."));\n' +
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

var defun_result =
  '#include "js_types.h"\n' +
  '#include "js_io.h"\n' +
  'void user_hello_world();\n' +
  'int main() {\n' +
  'user_hello_world();\n' +
  'return 0;\n' +
  '}';
function test_defun() {
  if (compile(defun) == defun_result) {
    print("Nullary function definition compiled correctly.");
    return true;
  } else {
    print("Nullary function definition failed.");
    return fasle;
  }
}

function test_all() {
  var result = true;
  result = test_hello_world() && result;
  result = test_hello_world_2_arg() && result;
  result = test_multiple_exprs() && result;
  result = test_subexprs() && result;
  result = test_defun() && result;

  if (result) {
    print("Everything succeeded!");
  } else {
    print("Some tests failed.");
  }
  return result;
}

test_all();
   
