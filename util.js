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

function foreach(array, func) {
  var len = array.length;
  var x;
  for (x = 0; x < len; x++) {
    func(array[x]);
  }
}
