/*jslint node:true*/

'use strict';

var parseWildcard = function parseWildcard(str) {
    str = str.trim();
    str.split('.').join('\\.')
        .split('?').join('\\?')
        .split('-').join('\\-')
        .split('{').join('\\{')
        .split('}').join('\\}')
        .split('|').join('\\|')
        .split('*').join('.*');
    return new RegExp('^' + str);

};
var parseAllows = function parseAllows(str, entry) {
    var i,
        arr,
        tmpStr;

    arr = str.split('Allow: ');

    entry.allow = entry.allow || [];

    for (i = 1; i < arr.length; i += 1) {
        tmpStr = arr[i].split(/\r?\n/)[0].trim();
        if (tmpStr !== '') {
            entry.allow.push(parseWildcard(tmpStr));
        }
    }
};
var parseDisallows = function parseDisallows(str, entry) {
    var i,
        arr,
        tmpStr;

    arr = str.split('Disallow: ');

    entry.disallow = entry.disallow || [];
    for (i = 1; i < arr.length; i += 1) {
        tmpStr = arr[i].split(/\r?\n/)[0].trim();
        if (tmpStr !== '') {
            entry.disallow.push(parseWildcard(tmpStr));
        }
    }
};
var parseDelay = function parseDelay(str, entry) {
    var delay;

    delay = str.split('Crawl-delay: ');

    if (delay.length > 1) {
        entry.delay = parseInt(delay[1].split(/\r?\n/)[0], 10) * 1000;
    }
};

var removeComments = function removeComments(str) {
    var i,
        arr = str.split(/\r?\n/),
        result = [];

    for (i = 0; i < arr.length; i += 1) {
        if (!/^ *#/.test(arr[i])) {
            result.push(arr[i]);
        }
    }

    return result.join('\n');
};

var parse = function (str, entry) {
    str = str.trim();

    str = removeComments(str);

    parseAllows(str, entry);
    parseDisallows(str, entry);
    parseDelay(str, entry);
};

parse.allow = parseAllows;
parse.disallow = parseDisallows;
parse.wildcard = parseWildcard;

module.exports = parse;