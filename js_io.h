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

void js_print2ln(const char *s1, const char *s2) 
{
     js_print(s1);
     js_print(" ");
     js_println(s2);
}


#endif /* JSC_JS_IO_H_ */
