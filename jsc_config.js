exports.jsc_symbol_locations = { 
  /* Implementation details */
  "js_is_true" : "js_types.h",

  /* Basic type constructors */
  "js_create_string" : "js_types.h",
  "js_create_fixnum" : "js_types.h",
  
  /* I/O */
  "js_print" : "js_io.h",
  "js_println" : "js_io.h",
  "js_print2ln" : "js_io.h",
  "js_print_int" : "js_io.h",

  /* String manipulation */
  "js_strlen" : "js_string.h"
};

exports.jsc_builtins = { 
  /* Implementation details */
  "is_true" : "js_is_true",

  /* Basic type constructors */
  "create_string" : "js_create_string",
  "create_fixnum" : "js_create_fixnum",

  /* I/O */
  "print" : "js_print",
  "println" : "js_println",
  "print2ln" : "js_print2ln",
  "print_int" : "js_print_int",

  /* String manipulation */
  "strlen" : "js_strlen"
}
