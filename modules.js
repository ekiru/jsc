function moduleFunction (module, fun) {
    return module + "_" + fun;
}

if (typeof exports !== "undefined") {
    exports.moduleFunction = moduleFunction;
}