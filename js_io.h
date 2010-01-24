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

#ifndef JSC_JS_IO_H_
#define JSC_JS_IO_H_

#include "js_types.h"

#include <assert.h>
#include <stdio.h>

void js_print(struct js_value *string) 
{
     assert(string->type == JS_STRING_TAG);
     printf(string->string_value->c_str);
}

void js_println(struct js_value *string) 
{
     assert(string->type == JS_STRING_TAG);
     printf(string->string_value->c_str);
     printf("\n");
}

void js_print2ln(struct js_value *s1, struct js_value *s2) 
{
     js_print(s1);
     js_print(js_create_string(" "));
     js_println(s2);
}

void js_print_int(struct js_value *i)
{
     assert(i->type == JS_FIXNUM_TAG);
     printf("%d", i->fixnum_value);
}



#endif /* JSC_JS_IO_H_ */
