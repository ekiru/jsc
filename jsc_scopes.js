function Scope (parent) {
    this.names = [];
    this.parent = parent;
    this.binds = function (name) {
	if (this.names.indexOf(name) >= 0) {
	    return true;
	} else {
	    return parent && parent.binds(name);
	}
    };
    this.bind = function (name) {
	this.names.push(name);
    }

}

if (typeof exports !== "undefined") {
    exports.Scope = Scope;
}