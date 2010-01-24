#ifndef JSC_JS_IO_H_
#define JSC_JS_IO_H_

#include <stdio.h>

void js_print(const char *s) 
{
     printf(s);
}

void js_println(const char *s) 
{
     printf(s);
     printf("\n");
}

#endif /* JSC_JS_IO_H_ */
