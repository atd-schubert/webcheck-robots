/// <reference path="./typings/main.d.ts" />

import {Plugin as WebcheckPlugin, IResult, ICallback, ICrawlOptions} from 'webcheck';
import * as url from 'url';
import { parse, IWebcheckRobotsEntry } from './parser';
import * as pkg from './package.json';

export interface ISimplifiedRegExpr {
    test(txt: string): boolean;
}
export interface IRobotsPluginOptions {
    userAgent?: string;
    sitemapLookup?: boolean;
    respectDelay?: boolean;
    filterUrl?: ISimplifiedRegExpr | RegExp;
}

/**
 * A helper function for empty regular expressions
 * @private
 * @type {{test: Function}}
 */
var emptyFilter: ISimplifiedRegExpr = { // a spoofed RegExpr...
    test: (): boolean => {
        return true;
    }
};

/**
 * A helper function to handle errors
 * @private
 * @param {null|undefined|error} err - Error to log if there is one
 */
var logError: ICallback = (err: Error): void => {
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
 * @augments WebcheckPlugin
 * @constructor
 */

export class RobotsPlugin extends WebcheckPlugin {

    hosts: {};
    public userAgent: string;
    public package: any = pkg;

    constructor(opts: IRobotsPluginOptions) {
        super();
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

        this.middleware = (result: IResult, next: ICallback) => {
            var parsedUrl: url.Url,
                chunks: string[] = [];

            if (!opts.filterUrl.test(result.url)) {
                return next();
            }

            parsedUrl = url.parse(result.url);
            if (parsedUrl.path !== '/robots.txt') {
                if (!this.hosts[parsedUrl.protocol + '//' + parsedUrl.host]) {
                    this.handle.crawl({
                        url: parsedUrl.protocol + '//' + parsedUrl.host + '/robots.txt'
                        /* tslint:disable:align */
                    }, (err: Error): void => {
                        /* tslint:enable:align */
                        if (err) {
                            console.error(err);
                        }
                    });
                }
                return next();
            }

            if (result.response.statusCode !== 200) { // If there is no robots.txt
                this.hosts[parsedUrl.protocol + '//' + parsedUrl.host] = {
                    allow: [{
                        test: (): boolean => {
                            return true;
                        }
                    }],
                    disallow: []
                };
                return next();
            }

            // Can not be set on instantiation, because of missing handle!
            this.userAgent = this.userAgent || this.handle.headers['User-Agent'];

            result.response.on('data', (chunk: Buffer): void => {
                chunks.push(chunk.toString());
            });

            result.response.on('end', (): void => {
                var thisUserAgent: any,
                    allAgents: any,
                    str: string,
                    entry: any = {},
                    tmpSitemapUrl: string,
                    sitemap: string[];

                str = chunks.join('');

                thisUserAgent = str.split('User-Agent: ' + this.userAgent);

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
                    for (let i: number = 1; i < sitemap.length; i += 1) {
                        tmpSitemapUrl = sitemap[i].split(/\r?\n/)[0].trim();
                        entry.sitemap.push(tmpSitemapUrl);
                        if (opts.sitemapLookup) {
                            this.handle.crawl({
                                parameters: {
                                    sitemap: true
                                },
                                url: tmpSitemapUrl
                                /* tslint:disable:align */
                            }, logError);
                            /* tslint:enable:align */
                        }
                    }
                }

                if (allAgents) {
                    parse(allAgents, entry);
                }
                if (thisUserAgent) {
                    parse(thisUserAgent, entry);
                }

                this.hosts[parsedUrl.protocol + '//' + parsedUrl.host] = entry;

            });

            return next();
        };

        /* tslint:disable:no-string-literal */
        this.on['crawl'] = (settings: ICrawlOptions): void => {
            /* tslint:enable:no-string-literal */
            var parsedUrl: url.Url = url.parse(settings.url),
                entry: IWebcheckRobotsEntry;

            if (parsedUrl.path === '/robots.txt') { // to give the possibility to crawl robots again
                return;
            }
            entry = this.hosts[parsedUrl.protocol + '//' + parsedUrl.host];

            if (!entry) {
                this.handle.crawl({
                    immediately: true,
                    url: parsedUrl.protocol + '//' + parsedUrl.host + '/robots.txt'
                    /* tslint:disable:align */
                }, (err: Error): void => {
                    /* tslint:enable:align */
                    if (err) {
                        console.error(err);
                    }
                });
                return;
            }

            if (entry.delay && opts.respectDelay) {
                settings.wait = entry.delay;
            }

            for (let i: number = 0; i < entry.allow.length; i += 1) {
                if (entry.allow[i].test(parsedUrl.path)) {
                    return;
                }
            }

            for (let i: number = 0; i < entry.disallow.length; i += 1) {
                if (entry.disallow[i].test(parsedUrl.path)) {
                    settings.preventCrawl = true;
                    return;
                }
            }

        };
    }
}
