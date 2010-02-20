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

function rest(array) {
  return array.slice(1, array.length);
}

function map(array, func) {
  var len = array.length;
  var result = new Array(len);
  var x;
  for (x = 0; x < len; x++) {
    result[x] = func(array[x]);
  }
  return result;
}

function foreach(coll, func) {
  if (Array.isArray(coll)) {
    var len = coll.length;
    var x;
    for (x = 0; x < len; x++) {
      func(coll[x]);
    }
  } else {
    var x;
    for (x in coll) {
      func(coll[x]);
    }
  }
}

function nconc(arr1, arr2) {
  arr1.splice.apply(arr1, [arr1.length, 0].concat(arr2));
  return arr1;
}

function objnconc(obj1, obj2) {
    var x;
    for (x in obj2) {
	if (!obj1[x]) {
	    obj1[x] = obj2[x];
	} else {
	    throw Error("Both objects had a " + x + " key!.");
	}
    };
    return obj1;
}

function defined(o) {
  return o !== undefined;
}
