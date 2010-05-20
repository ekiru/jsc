var ast = require("./ast");

var lex = require('jslex');

var multiLineCommentRegex = /\/\*(([^*]|(\*[^/]))*)\*+\//;
var singleLineCommentRegex = /\/\/.*$/m;

var commentLexicalGrammar = [
    new lex.TokenDef(multiLineCommentRegex, lex.TokenDef.ignore),
    new lex.TokenDef(singleLineCommentRegex, lex.TokenDef.ignore)
    ];

var reservedWordList = {
    "break", "case", "catch", "continue", "debugger", "default", "delete",
    "do", "else", "finally", "for", "function", "if", "in",
    "instanceof", "new", "return", "switch", "this", "throw", "try",
    "typeof", "var", "void", "while", "with",
    // Future reserved words
    "class", "const", "enum", "export", "extends", "import", "super",
    // Strict mode future reserved words
    "implements", "interface", "let", "package",
    "private", "protected", "public", "static", "yield",
    // Null literal
    "null",
    // Boolean literal
    "true", "false"
};

var reservedWordLexicalGrammar = reservedWordList.map(function (word) {
    return new lex.TokenDef(RegExp(word),
			    function () {
				switch (word) {
				case "true":
				    return new ast.BooleanLiteral(true);
				case "false":
				    return new ast.BooleanLiteral(false);
				case "null":
				    return new ast.NullLiteral();
				default:
				    return new ast.ReservedWord(word);
				}
			    });
});

var identifierRegex = 
    /([A-Za-z$_]|(\\u[0-9A-Fa-f]{4}))(([\w$_\d]|(\\u[0-9A-Fa-f]{4})))*/;

var identifierLexicalGrammar = [
    new lex.TokenDef(identifierRegex, function (string) {
	return new ast.Identifier(string);
    })
];

var decimalLiteral =
    /[-+]?(([0-9]+\.[0-9]*)|(\.[0-9]+)|([0-9]+))((e|E)([-+]?[0-9]+))?/;

var hexIntegerLiteral =
    /0x[0-9a-fA-F]+/;

var numericLiteralRegex = 
    RegExp('(' + decimalLiteral.source + ')|(' + hexIntegerLiteral.source +')');

var doubleQuoteStringLiteralRegex = 
    /\"([^\\\"]|(\\(0|(u[0-9A-Fa-f]{4})|(x[0-9A-Fa-f]{2})|.)))*\"/;

var singleQuoteStringLiteralRegex =
    /\'([^\\\']|(\\(0|(u[0-9A-Fa-f]{4})|(x[0-9A-Fa-f]{2})|.)))*\'/;

var regularExpressionRegex =
    /\/([^*\\/\[])?([^\\/\[]|(\\.)|(\[([^\]\\]|(\\.))*\]))*\/[a-zA-Z]*/;

function stringConstr (str) {
    return new ast.StringLiteral(str.splice(1, -1));
}
var literalLexicalGrammar = [
    new lex.TokenDef(numericLiteralRegex, function (string) {
	return new ast.NumberLiteral(parseFloat(string));
    }),
    new lex.TokenDef(doubleQuoteStringLiteralRegex, stringConstr),
    new lex.TokenDef(singleQuoteStringLiteralRegex, stringConstr),
    new lex.TokenDef(regularExpressionRegex, function (regex) {
        return new ast.RegularExpressionLiteral(regex);
    })
];

var punctuators = [
    /\{/, /\}/, /\(/, /\)/, /\[/, /\]/,
    /\+\+/, /\+=/, /\+/,
    /--/, /-=/, /-/,
    /\*=/, /\*/,
    /\/=/, /\//,
    /%=/, /%/,
    /<<=/, /<</, /<=/, /</,
    />>>=/, />>>/, />>=/, />>/, />=/, />/,
    /&&/, /&=/, /&/,
    /||/, /|=/, /|/,
    /^=/, /^/,
    /~/,
    /===/, /==/, /=/,
    /!==/, /!=/, /!/,
    /\./, /;/, /,/,
    /\?/, /:/
];

var punctuatorLexicalGrammar = punctuators.map(function (symb) {
    return new lex.TokenDef(symb, lex.TokenDef.identity);
});

var lexicalGrammar = commentLexicalGrammar.
    concat(reservedWordLexicalGrammar).
    concat(identifierLexicalGrammar).
    concat(literalLexicalGrammar).
    concat(punctuatorLexicalGrammar);

if (typeof exports !== 'undefined') {
    exports.lexical = lexicalGrammar;
}