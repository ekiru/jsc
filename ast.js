var util = require("./util");

var global = window;

function defineSimpleLiteral (name) {
    global[name] = function (value) {
	this.value = value;
    };
}

function defineUnary (name) {
    global[name] = function (expr) {
	this.expr = expr;
    };
}

function defineBinary (name) {
    global[name] = function (left, right) {
	this.left = left;
	this.right = right;
    }
}

function defineAssignment (name) {
    global[name] = function (lhs, rhs) {
	this.lhs = lhs;
	this.rhs = rhs;
    };
}

function ReservedWord (name) {
    this.name = name;
}

/// Literals
function NullLiteral () { }
defineSimpleLiteral("BooleanLiteral");
defineSimpleLiteral("NumberLiteral");
defineSimpleLiteral("RegularExpressionLiteral");
defineSimpleLiteral("StringLiteral");


/// PrimaryExpressions
function ArrayLiteral (value, length) {
    this.value = value;
    this.length = length;
}

function Identifier (name) {
    this.name = name;
}

function ObjectLiteral (properties) {
    this.properties = properties;
}

// Helpers for ObjectLiteral
function GetProperty (name, getBody) {
    this.name = name;
    this.getter = new FunctionLiteral([], getBody);
}


function Property (name, value) {
    this.name = name;
    this.value = value;
}

function SetProperty (name, arg, body) {
    this.name = name;
    this.setter = new FunctionExpression ([arg], body);
}

/// MemberExpressions or NewExpressions or CallExpressions

function Call (func, args) {
    this.func = func;
    this.args = args;
}

function FunctionExpression (args, body) {
    this.args = args;
    this.body = body;
}

function New (constr, args) {
    this.constr = constr;
    this.args = args || [];
}

function Subscript (container, index) {
    this.container = container;
    this.index = index;
}

/// PostfixExpressions

defineUnary("PostDecrement");
defineUnary("PostIncrement");

/// UnaryExpressions

defineUnary("BitwiseNot");
defineUnary("Delete");
defineUnary("LogicalNot");
defineUnary("PreDecrement");
defineUnary("PreIncrement");
defineUnary("TypeOf");
defineUnary("UnaryMinus");
defineUnary("UnaryPlus");
defineUnary("Void");

/// MultiplicativeExpressions

defineBinary("Divide");
defineBinary("Modulo");
defineBinary("Multiply");

/// AdditiveExpression

defineBinary("Add");
defineBinary("Subtract");

/// ShiftExpression

defineBinary("LeftShift");
defineBinary("SignedRightShift");
defineBinary("UnsignedRightShift");

/// RelationalExpression

defineBinary("LessThan");
defineBinary("LessThanOrEqual");
defineBinary("GreaterThan");
defineBinary("GreaterThanOrEqual");
defineBinary("InstanceOf");
defineBinary("In");

/// EqualityExpression

defineBinary("Equal");
defineBinary("NotEqual");
defineBinary("StrictEqual");
defineBinary("StrictNotEqual");

/// BitwiseANDExpression/BitwiseXORExpression/BitwiseORExpression

defineBinary("BitwiseAnd");
defineBinary("BitwiseOr");
defineBinary("BitwiseXor");

/// LogicalANDExpression/LogicalORExpression

defineBinary("LogicalAnd");
defineBinary("LogicalOr");

/// ConditionalExpression

function Conditional (condition, thenBranch, elseBranch) {
    this.condition = condition;
    this.thenBranch = thenBranch;
    this.elseBranch = elseBranch || new Block();
}

/// AssignmentExpression

defineAssignment("Assign");
defineAssignment("AddAssign");
defineAssignment("BitwiseAndAssign");
defineAssignment("BitwiseOrAssign");
defineAssignment("BitwiseXorAssign");
defineAssignment("DivideAssign");
defineAssignment("LeftShiftAssign");
defineAssignment("ModuloAssign");
defineAssignment("MultiplyAssign");
defineAssignment("SignedRightShiftAssign");
defineAssignment("SubtractAssign");
defineAssignment("UnsignedRightShiftAssign");

/// Expression

defineBinary("Comma");

/// Block

function Block (statements) {
    this.statements = statements;
}

/// VariableStatement and helpers

function VariableStatement (decls) {
    this.declarations = decls;
}

function VariableDeclaration (name, initialiser) {
    this.name = name;
    this.initialiser = initialiser;
}

/// EmptyStatement

function Empty () { }

/// ExpressionStatement

function ExpressionStatement (expr) {
    this.expr = expr;
}

/// IfStatement

function If (condition, thenBlock, elseBlock) {
    this.condition = condition;
    this.thenBlock = thenBlock;
    this.elseBlock = elseBlock;
}

/// IterationStatement

function Do (body, condition) {
    this.body = body;
    this.condition = condition;
}

function For (initial, condition, step) {
    this.initial = initial;
    this.condition = condition;
    this.step = step;
}

function ForIn (lhs, container, condition, step) {
    this.lhs = lhs;
    this.container = container;
    this.condition = condition;
    this.step = step;
}

function While (condition, body) {
    this.condition = condition;
    this.body = body;
}

/// ContinueStatement

function Continue (label) {
    if (util.defined(label)) {
	this.label = label;
    }
}

/// BreakStatement

function Break (label) {
    if (util.defined(label)) {
	this.label = label;
    }
}

/// ReturnStatement

function Return (value) {
    if (util.defined(value)) {
	this.value = value;
    }
}

/// WithStatement

function With (context, body) {
    this.context = context;
    this.body = body;
}

if (typeof exports !== "undefined") {
    exports.Add = Add;
    exports.AddAssign = AddAssign;
    exports.ArrayLiteral = ArrayLiteral;
    exports.Assign = Assign;
    exports.BitwiseAnd = BitwiseAnd;
    exports.BitwiseAndAssign = BitwiseAndAssign;
    exports.BitwiseNot = BitwiseNot;
    exports.BitwiseOr = BitwiseOr;
    exports.BitwiseOrAssign = BitwiseOrAssign;
    exports.BitwiseXor = BitwiseXor;
    exports.BitwiseXorAssign = BitwiseXorAssign;
    exports.Block = Block;
    exports.BooleanLiteral = BooleanLiteral;
    exports.Break = Break;
    exports.Call = Call;
    exports.Comma = Comma;
    exports.Conditional = Conditional;
    exports.Continue = Continue;
    exports.Delete = Delete;
    exports.Divide = Divide;
    exports.DivideAssign = DivideAssign;
    exports.Do = Do;
    exports.Equal = Equal;
    exports.Empty = Empty;
    exports.ExpressionStatement = ExpressionStatement;
    exports.For = For;
    exports.ForIn = ForIn;
    exports.GetProperty = GetProperty;
    exports.GreaterThan = GreaterThan;
    exports.GreaterThanOrEqual = GreaterThanOrEqual;
    exports.Identifier = Identifier;
    exports.If = If;
    exports.In = In;
    exports.InstanceOf = InstanceOf;
    exports.LeftShift = LeftShift;
    exports.LeftShiftAssign = LeftShiftAssign;
    exports.LessThan = LessThan;
    exports.LessThanOrEqual = LessThanOrEqual;
    exports.LogicalAnd = LogicalAnd;
    exports.LogicalNot = LogicalNot;
    exports.LogicalOr = LogicalOr;
    exports.Modulo = Modulo;
    exports.ModuloAssign = ModuloAssign;
    exports.Multiply = Multiply;
    exports.MultiplyAssign = MultiplyAssign;
    exports.New = New;
    exports.NotEqual = NotEqual;
    exports.NullLiteral = NullLiteral;
    exports.NumberLiteral = NumberLiteral;
    exports.ObjectLiteral = ObjectLiteral;
    exports.PreDecrement = PreDecrement;
    exports.PreIncrement = PreIncrement;
    exports.PostDecrement = PostDecrement;
    exports.PostIncrement = PostIncrement;
    exports.Property = Property;
    exports.RegularExpressionLiteral = RegularExpressionLiteral;
    exports.ReservedWord = ReservedWord;
    exports.Return = Return;
    exports.SetProperty = SetProperty;
    exports.SignedRightShift = SignedRightShift;
    exports.SignedRightShiftAssign = SignedRightShiftAssign;
    exports.StrictEqual = StrictEqual;
    exports.StrictNotEqual = StrictNotEqual;
    exports.StringLiteral = StringLiteral;
    exports.Subscript = Subscript;
    exports.Subtract = Subtract;
    exports.SubtractAssign = SubtractAssign;
    exports.TypeOf = TypeOf;
    exports.UnaryMinus = UnaryMinus;
    exports.UnaryPlus = UnaryPlus;
    exports.UnsignedRightShift = UnsignedRightShift;
    exports.UnsignedRightShiftAssign = UnsignedRightShiftAssign;
    exports.VariableDeclaration = VariableDeclaration;
    exports.VariableStatement = VariableStatement;
    exports.Void = Void;
    exports.While = While;
    exports.With = With;
}