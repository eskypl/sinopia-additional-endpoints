var path = require('path');
var marked = require('marked');
var hljs = require('highlight.js');

var formatTypes = {
    '.md': 'text/html',
    '.html': 'text/html',
    '.json': 'application/json'
};

var formatParsers = {
    '.md': marked,
    '.json': JSON.parse
};

var defaultParser = function(content) {
    return content;
};

var defaultType = 'text/plain';

marked.setOptions({
    gfm: true,
    breaks: true,
    sanitize: true,
    highlight: function (code) {
        return hljs.highlightAuto(code).value;
    }
});

function Content(fileName) {
    this.extension = path.extname(fileName);
}

/**
 * Returns Content-Type.
 * @returns {*|string}
 */
Content.prototype.type = function type() {
    return formatTypes[this.extension] || defaultType;
};

/**
 * Returns parsed and formatted content.
 * For example JSON string will be parsed to JSON object,
 * markdown file will be parsed to HTML file, etc.
 * Supported parsers are defined in `formatParsers`.
 * If parser is missing, then content will be returned as it is.
 * @param content
 * @returns {*}
 */
Content.prototype.parse = function parse(content) {
    return (formatParsers[this.extension] || defaultParser).call(null, content);
};

module.exports =  Content;
