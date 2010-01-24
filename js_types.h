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

#ifndef JSC_JS_TYPES_H_
#define JSC_JS_TYPES_H_

#include "js_memory.h"

#include <stdlib.h>
#include <string.h>

enum js_value_type_tag {
     JS_STRING_TAG,
     JS_FIXNUM_TAG
};

struct js_string 
{
     int length;
     char *c_str;
};

struct js_value 
{
     enum js_value_type_tag type;
     union 
     {
	  struct js_string *string_value;
	  int fixnum_value;
     };	  
};

struct js_value *js_create_string(const char *s) 
{
     int len = strlen(s);
     
     struct js_string *string_v = js_malloc(sizeof(*string_v));
     string_v->length = len;
     string_v->c_str = s;

     struct js_value *result = js_malloc(sizeof(*result));
     result->type = JS_STRING_TAG;
     result->string_value = string_v;
     
     return result;
}

struct js_value *js_create_fixnum(int i) 
{
     struct js_value *result = js_malloc(sizeof(*result));
     result->type = JS_FIXNUM_TAG;
     result->fixnum_value = i;
     return result;
}

char js_is_true(struct js_value *value) 
{
     if (value == NULL) {
	  return 0;
     }
     switch (value->type) {
     case JS_STRING_TAG:
	  return value->string_value->length > 0;
     case JS_FIXNUM_TAG:
	  return value->fixnum_value != 0;
     }
}

#endif /* JSC_JS_TYPES_H_ */
