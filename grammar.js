var jslex_path = "../jslex/jslex.js"; // The path to jslex.js

load(jslex_path) 

var multiLineCommentRegex = /\/\*(([^*]|(\*[^/]))*)\*+\//;
var singleLineCommentRegex = /\/\/.*$/m;

var commentLexicalGrammar = [
    new TokenDef(multiLineCommentRegex, TokenDef.ignore),
    new TokenDef(singleLineCommentRegex, TokenDef.ignore)
    ];

var reservedWordList = [
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
    ];

var reservedWordLexicalGrammar = reservedWordList.map(function (word) {
	return (new TokenDef(RegExp(word), TokenDef.identity));
    });

var identifierRegex = 
    /([A-Za-z$_]|(\\u[0-9A-Fa-f]{4}))(([\w$_\d]|(\\u[0-9A-Fa-f]{4})))*/;

var identifierLexicalGrammar = [
    new TokenDef(identifierRegex, function (string) {
	    return ["ident", string];
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

var literalLexicalGrammar = [
    new TokenDef(numericLiteralRegex, function (string) {
	    return ["number", parseFloat(string)];
	}),
    new TokenDef(doubleQuoteStringLiteralRegex, function (string) {
	    return ["string", string];
	}),
    new TokenDef(singleQuoteStringLiteralRegex, function (string) {
	    return ["string", string];
	}),
    new TokenDef(regularExpressionRegex, function (regex) {
	    return ["regex", regex];
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
	return new TokenDef(symb, TokenDef.identity);
    });

var lexicalGrammar = commentLexicalGrammar.
    concat(reservedWordLexicalGrammar).
    concat(identifierLexicalGrammar).
    concat(literalLexicalGrammar).
    concat(punctuatorLexicalGrammar);
