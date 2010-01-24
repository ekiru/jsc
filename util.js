function rest(array) {
  return array.slice(1, array.length);
}

function map(array, func) {
  var result = new Array(array.length);
  for (x in array) {
    result[x] = func(array[x]);
  }
  return result;
}
