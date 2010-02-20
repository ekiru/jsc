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
