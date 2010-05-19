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

if (typeof exports !== "undefined") {
    exports.rest = rest;
    exports.map = map;
    exports.foreach = foreach;
    exports.nconc = nconc;
    exports.objnconc = objnconc;
    exports.defined = defined;
}