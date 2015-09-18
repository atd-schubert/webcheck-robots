/*jslint node:true*/
'use strict';

var WebcheckPlugin = require('webcheck/plugin');
var url = require('url');

var parser = require('./parser');
var pkg = require('./package.json');
/**
 * A helper function for empty regular expressions
 * @private
 * @type {{test: Function}}
 */
var emptyFilter = {
    test: function () {
        return true;
    }
};

/**
 * A helper function to handle errors
 * @private
 * @param {null|undefined|error} err - Error to log if there is one
 */
var logError = function (err) {
    if (err) {
        console.error(err);
    }
};


/**
 * Robots Exclusion Standard plugin for webcheck.
 * @author Arne Schubert <atd.schubert@gmail.com>
 * @param {{}} [opts] - Options for this plugin
 * @param {string} [opts.userAgent] - User Agent for robots.txt
 * @param {boolean} [opts.sitemapLookup] - Should it crawl the sitemap if there is a information
 * @param {boolean} [opts.respectDelay] - Should it respect the delay
 * @param {RegExp|{test:Function}} [opts.filterUrl] - Look for robots.txt only in matching urls
 * @augments Webcheck.Plugin
 * @constructor
 */
var RobotsPlugin = function (opts) {
    var self;

    self = this;
    WebcheckPlugin.apply(this, arguments);

    opts = opts || {};

    opts.filterUrl = opts.filterUrl || emptyFilter;
    if (!opts.hasOwnProperty('sitemapLookup')) {
        opts.sitemapLookup = true;
    }
    if (!opts.hasOwnProperty('respectDelay')) {
        opts.respectDelay = true;
    }

    this.hosts = {};

    this.userAgent = opts.userAgent;

    this.middleware = function (result, next) {
        var parsedUrl,
            chunks = [];

        if (!opts.filterUrl.test(result.url)) {
            return next();
        }

        parsedUrl = url.parse(result.url);
        if (parsedUrl.path !== '/robots.txt') {
            if (!self.hosts[parsedUrl.protocol + '//' + parsedUrl.host]) {
                self.handle.crawl({
                    url: parsedUrl.protocol + '//' + parsedUrl.host + '/robots.txt'
                }, function (err) {
                    if (err) {
                        console.error(err);
                    }
                });
            }
            return next();
        }

        if (result.response.statusCode !== 200) { // If there is no robots.txt
            self.hosts[parsedUrl.protocol + '//' + parsedUrl.host] = {
                allow: [{
                    test: function () {
                        return true;
                    }
                }],
                disallow: []
            };
            return next();
        }

        self.userAgent = self.userAgent || self.handle.headers['User-Agent']; // Can not be set on instantiation, because of missing handle!

        result.response.on('data', function (chunk) {
            chunks.push(chunk.toString());
        });

        result.response.on('end', function () {
            var thisUserAgent,
                allAgents,
                str,
                entry = {},
                i,
                tmpSitemapUrl,
                sitemap;

            str = chunks.join('');

            thisUserAgent = str.split('User-Agent: ' + self.userAgent);

            if (thisUserAgent.length !== 1) {
                thisUserAgent = thisUserAgent[1].split('User-Agent:')[0];
            } else {
                thisUserAgent = false;
            }

            allAgents = str.split('User-Agent: *');
            if (allAgents.length > 1) {
                allAgents = allAgents[1].split('User-Agent:')[0];
            } else {
                allAgents = false;
            }

            entry.sitemap = [];
            sitemap = str.split('Sitemap: ');
            if (sitemap.length > 1) {
                for (i = 1; i < sitemap.length; i += 1) {
                    tmpSitemapUrl = sitemap[i].split(/\r?\n/)[0].trim();
                    entry.sitemap.push(tmpSitemapUrl);
                    if (opts.sitemapLookup) {
                        self.handle.crawl({
                            url: tmpSitemapUrl,
                            parameters: {
                                sitemap: true
                            }
                        }, logError);
                    }
                }
            }

            if (allAgents) {
                parser(allAgents, entry);
            }
            if (thisUserAgent) {
                parser(thisUserAgent, entry);
            }

            self.hosts[parsedUrl.protocol + '//' + parsedUrl.host] = entry;

        });

        return next();
    };

    this.on.crawl = function (settings) {
        var parsedUrl = url.parse(settings.url),
            i,
            entry;

        if (parsedUrl.path === '/robots.txt') { // to give the possibility to crawl robots again
            return;
        }
        entry = self.hosts[parsedUrl.protocol + '//' + parsedUrl.host];

        if (!entry) {
            self.handle.crawl({
                immediately: true,
                url: parsedUrl.protocol + '//' + parsedUrl.host + '/robots.txt'
            }, function (err) {
                if (err) {
                    console.error(err);
                }
            });
            return;
        }

        if (entry.delay && opts.respectDelay) {
            settings.wait = entry.delay;
        }

        for (i = 0; i < entry.allow.length; i += 1) {
            if (entry.allow[i].test(parsedUrl.path)) {
                return;
            }
        }

        for (i = 0; i < entry.disallow.length; i += 1) {
            if (entry.disallow[i].test(parsedUrl.path)) {
                settings.preventCrawl = true;
                return;
            }
        }

    };
};

RobotsPlugin.prototype = {
    '__proto__': WebcheckPlugin.prototype,
    package: pkg,

    /**
     * List of hosts with their parsed robots.txt information
     * @type {{}}
     */
    hosts: null,
    /**
     * User Agent information for robots.txt
     * @type {{string}}
     */
    userAgent: null
};

module.exports = RobotsPlugin;
