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
  '}\n';
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
  '}\n';
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
  '}\n';
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
  'js_print(js_strlen(js_create_string("Hello world")));\n' +
  'js_println(js_create_string("bytes."));\n' +
  '}\n' +
  'return 0;\n' +
  '}\n';
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
  '{\n' +
  'user_hello_world();\n' +
  '}\n' +
  'return 0;\n' +
  '}\n' +
  'void user_hello_world() {\n' +
  'js_println(js_create_string("Hello, world!"));\n' +
  '}\n';
function test_defun() {
  if (compile(defun) == defun_result) {
    print("Nullary function definition compiled correctly.");
    return true;
  } else {
    print("Nullary function definition failed.");
    return false;
  }
}

var int_literal_result = 
  '#include "js_types.h"\n' +
  '#include "js_io.h"\n' +
  'int main() {\n' +
  'js_println(js_create_fixnum(11));\n' +
  'return 0;\n' +
  '}\n';
function test_int_literal() {
  if (compile(int_literal) == int_literal_result) {
    print("Int literal compiled correctly.");
    return true;
  } else {
    print("Int literal failed.");
    return false;
  }
}

var cond_result =
  '#include "js_types.h"\n' +
  '#include "js_io.h"\n' +
  'int main() {\n' +
  '{\n' +
  ('if (js_is_true(js_create_fixnum(1))) ' +
   'js_println(js_create_string("1 is true."));\n' +
   'else js_println(js_create_string("wrong 1 is false."));\n') +
  ('if (js_is_true(js_create_fixnum(0))) ' +
   'js_println(js_create_string("wrong 0 is true."));\n' +
   'else js_println(js_create_string("0 is false."));\n') +
  ('if (js_is_true(js_create_string(""))) ' +
   'js_println(js_create_string("wrong \'\' is true."));\n' +
   'else js_println(js_create_string("\'\' is false."));\n') +
  ('if (js_is_true(js_create_string("Hello"))) ' +
   'js_println(js_create_string("\'Hello\' is true."));\n' +
   'else js_println(js_create_string("wrong \'Hello\' is false."));\n') +
  '}\n' +
  'return 0;\n' +
  '}\n';
function test_cond() {
  if (compile(cond) == cond_result) {
    print("Conditionals compiled correctly.");
    return true;
  } else {
    print("Conditionals failed.");
    return false;
  }
}

var lambda_usage_result =
  '#include "js_types.h"\n' +
  '#include "js_io.h"\n' +
  'void user_lambda_0();\n' +
  'int main() {\n' +
  'user_lambda_0();\n' +
  'return 0;\n' +
  '}\n' +
  'void user_lambda_0() {\n' +
  'js_println(js_create_string("Hello, world!"));\n' +
  '}\n';
function test_lambda_usage() {
  if (compile(lambda_usage) == lambda_usage_result) {
    print("Nullary lambda compiled correctly.");
    return true;
  } else {
    print("Nullary lambda failed.");
    return false;
  }
}

var defun_args_result =
  '#include "js_types.h"\n' +
  '#include "js_io.h"\n' +
  ('void user_print_two_things(struct js_value *s1, ' + 
   'struct js_value *s2);\n') +
  'int main() {\n' +
  '{\n' +
  ('user_print_two_things(js_create_string("Hello, "),' +
   'js_create_string("World!"));\n') +
  '}\n' +
  'return 0;\n' +
  '}\n' +
  ('void user_print_two_things(struct js_value *s1, ' + 
   'struct js_value *s2) {\n') +
  '{\n' +
  'js_print(s1);\n' +
  'js_println(s2);\n' +
  '}\n' +
  '}\n';
function test_defun_args() {
  if (compile(defun_args) == defun_args_result) {
    print("Defun args compiled correctly.");
    return true;
  } else {
    print("Defun args failed.");
    return false;
  }
}

var assignment_result = 
    '#include "js_types.h"\n' +
    '#include "js_io.h"\n' +
    'int main() {\n' +
    '{\n' +
    'struct js_value *f = js_create_fixnum(5);\n' +
    'js_println(f);\n' +
    'f = js_create_string("Hello, there.");\n' +
    'js_println(f);\n' +
    '}\n' +
    'return 0;\n' +
    '}\n';
function test_assignment() {
    if (compile(assignment) == assignment_result) {
	print("Assignment compiled correctly.");
	return true;
    } else {
	print("Assignment failed.");
	return false;
    }
}

function test_all() {
  var result = true;
  result = test_hello_world() && result;
  result = test_hello_world_2_arg() && result;
  result = test_multiple_exprs() && result;
  result = test_subexprs() && result;
  result = test_defun() && result;
  result = test_int_literal() && result;
  result = test_cond() && result;
  result = test_lambda_usage() && result;
  result = test_defun_args() && result;
  result = test_assignment() && result;

  if (result) {
    print("Everything succeeded!");
  } else {
    print("Some tests failed.");
  }
  return result;
}

test_all();
   
