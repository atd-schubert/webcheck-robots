/// <reference path="../typings/main.d.ts" />

import { RobotsPlugin } from '../webcheck-robots';
import { Webcheck, ICrawlOptions } from 'webcheck';
import * as freeport from 'freeport';
import * as express from 'express';

/* tslint:disable:align */

describe('Robots Plugin', (): void => {
    var portWithRobots: number,
        portWithoutRobots: number;

    before((done: MochaDone): void => {
        var app: express.Application = express();

        app.get('/', (req: express.Request, res: express.Response): void => {
            res.send('<html><head></head><body><p>index</p></body></html>');
        });
        app.get('/private/index.html', (req: express.Request, res: express.Response): void => {
            res.send('<html><head></head><body><p>private</p></body></html>');
        });
        app.get('/private/allowed', (req: express.Request, res: express.Response): void => {
            res.send('<html><head></head><body><p>private but allowed</p></body></html>');
        });
        app.get('/public/index.html', (req: express.Request, res: express.Response): void => {
            res.send('<html><head></head><body><p>private</p></body></html>');
        });
        app.get('/robots.txt', (req: express.Request, res: express.Response): void => {
            /* tslint:disable:max-line-length */
            res.set('Content-Type', 'text/plain').send('User-Agent: Delay\nCrawl-delay: 1\n\nUser-Agent: Test\nDisallow: /private\nAllow: /private/allowed\n\nUser-Agent: DisallowAll\nDisallow: /\n\nUser-Agent: *\nDisallow: /private');
            /* tslint:disable:max-line-length */
        });

        freeport((err: Error, p: number): void => {
            if (err) {
                done(err);
            }
            portWithRobots = p;
            app.listen(portWithRobots);

            app = express();

            app.get('/', (req: express.Request, res: express.Response): void => {
                res.send('<html><head></head><body><p>index</p></body></html>');
            });
            app.get('/private/index.html', (req: express.Request, res: express.Response): void => {
                res.send('<html><head></head><body><p>private</p></body></html>');
            });
            app.get('/private/allowed', (req: express.Request, res: express.Response): void => {
                res.send('<html><head></head><body><p>private but allowed</p></body></html>');
            });
            app.get('/public/index.html', (req: express.Request, res: express.Response): void => {
                res.send('<html><head></head><body><p>private</p></body></html>');
            });
            freeport((err2: Error, p2: number): void => {
                if (err2) {
                    done(err2);
                }
                portWithoutRobots = p2;
                app.listen(portWithoutRobots);

                done();
            });
        });
    });
    describe('With robots', (): void => {
        var webcheck: Webcheck,
            plugin: RobotsPlugin;

        before((): void => {
            webcheck = new Webcheck({});
            plugin = new RobotsPlugin({});
            webcheck.addPlugin(plugin);
            plugin.enable();
        });

        it('should allow public resources', (done: MochaDone): void => {
            var allowed: boolean;

            webcheck.on('request', (settings: ICrawlOptions): void => {
                if (settings.url === 'http://localhost:' + portWithRobots + '/public/index.html') {
                    allowed = true;
                }
            });
            webcheck.crawl({
                url: 'http://localhost:' + portWithRobots + '/public/index.html'
            }, (err: Error): void => {
                webcheck.removeAllListeners('request');
                if (err) {
                    return done(err);
                }
                if (allowed) {
                    return done();
                }
                return done(new Error('Public resource was not allowed'));
            });
        });
        it('should disallow private resources', (done: MochaDone): void => {
            var allowed: boolean;

            webcheck.on('request', (settings: ICrawlOptions): void => {
                if (settings.url === 'http://localhost:' + portWithRobots + '/private/index.html') {
                    allowed = true;
                }
            });
            webcheck.crawl({
                url: 'http://localhost:' + portWithRobots + '/private/index.html'
            }, (err: Error): void => {
                webcheck.removeAllListeners('request');
                if (err) {
                    return done(err);
                }
                if (allowed) {
                    return done(new Error('Private resource was allowed'));
                }
                return done();
            });
        });
    });
    describe('Without robots', (): void => {
        var webcheck: Webcheck,
            plugin: RobotsPlugin;

        before((): void => {
            webcheck = new Webcheck({});
            plugin = new RobotsPlugin({});
            webcheck.addPlugin(plugin);
            plugin.enable();
        });

        it('should allow public resources', (done: MochaDone): void => {
            var allowed: boolean;

            webcheck.on('request', (settings: ICrawlOptions): void => {
                if (settings.url === 'http://localhost:' + portWithoutRobots + '/public/index.html') {
                    allowed = true;
                }
            });
            webcheck.crawl({
                url: 'http://localhost:' + portWithoutRobots + '/public/index.html'
            }, (err: Error): void => {
                webcheck.removeAllListeners('request');
                if (err) {
                    return done(err);
                }
                if (allowed) {
                    return done();
                }
                return done(new Error('Public resource was not allowed'));
            });
        });
        it('should disallow private resources', (done: MochaDone): void => {
            var allowed: boolean;

            webcheck.on('request', (settings: ICrawlOptions): void => {
                if (settings.url === 'http://localhost:' + portWithoutRobots + '/private/index.html') {
                    allowed = true;
                }
            });
            webcheck.crawl({
                url: 'http://localhost:' + portWithoutRobots + '/private/index.html'
            }, (err: Error): void => {
                webcheck.removeAllListeners('request');
                if (err) {
                    return done(err);
                }
                if (allowed) {
                    return done();
                }
                return done(new Error('Public resource was allowed'));
            });
        });
    });
    describe('With specified User-Agent', (): void => {
        var webcheck: Webcheck,
            plugin: RobotsPlugin;
        before((): void => {
            webcheck = new Webcheck({});
            plugin = new RobotsPlugin({
                userAgent: 'Test'
            });
            webcheck.addPlugin(plugin);
            plugin.enable();
        });

        it('should allow public resources', (done: MochaDone): void => {
            var allowed: boolean;

            webcheck.on('request', (settings: ICrawlOptions): void => {
                if (settings.url === 'http://localhost:' + portWithRobots + '/public/index.html') {
                    allowed = true;
                }
            });
            webcheck.crawl({
                url: 'http://localhost:' + portWithRobots + '/public/index.html'
            }, (err: Error): void => {
                webcheck.removeAllListeners('request');
                if (err) {
                    return done(err);
                }
                if (allowed) {
                    return done();
                }
                return done(new Error('Public resource was not allowed'));
            });
        });
        it('should disallow private resources', (done: MochaDone): void => {
            var allowed: boolean;

            webcheck.on('request', (settings: ICrawlOptions): void => {
                if (settings.url === 'http://localhost:' + portWithRobots + '/private/index.html') {
                    allowed = true;
                }
            });
            webcheck.crawl({
                url: 'http://localhost:' + portWithRobots + '/private/index.html'
            }, (err: Error): void => {
                webcheck.removeAllListeners('request');
                if (err) {
                    return done(err);
                }
                if (allowed) {
                    return done(new Error('Private resource was allowed'));
                }
                return done();
            });
        });
        it('should allow public resources within private scope', (done: MochaDone): void => {
            var allowed: boolean;

            webcheck.on('request', (settings: ICrawlOptions): void => {
                if (settings.url === 'http://localhost:' + portWithRobots + '/private/allowed') {
                    allowed = true;
                }
            });
            webcheck.crawl({
                url: 'http://localhost:' + portWithRobots + '/private/allowed'
            }, (err: Error): void => {
                webcheck.removeAllListeners('request');
                if (err) {
                    return done(err);
                }
                if (allowed) {
                    return done();
                }
                return done(new Error('Public resource was not allowed'));
            });
        });
    });
    describe('Respect the delay', (): void => {
        var webcheck: Webcheck,
            plugin: RobotsPlugin;
        before((): void => {
            webcheck = new Webcheck({});
            plugin = new RobotsPlugin({
                userAgent: 'Delay'
            });
            webcheck.addPlugin(plugin);
            plugin.enable();
        });
        it('do not have to respect the delay on first crawl', (done: MochaDone): void => {
            webcheck.crawl({
                url: 'http://localhost:' + portWithRobots + '/public/index.html'
            }, (err: Error): void => {
                if (err) {
                    return done(err);
                }
                return done();
            });
        });
        it('should respect delay', (done: MochaDone): void => {
            var delayed: boolean;
            webcheck.on('wait', (settings: ICrawlOptions): void => {
                if (settings.url === 'http://localhost:' + portWithRobots + '/public/index.html') {
                    delayed = true;
                }
            });
            webcheck.crawl({
                url: 'http://localhost:' + portWithRobots + '/public/index.html'
            }, (err: Error): void => {
                webcheck.removeAllListeners('wait');
                if (err) {
                    return done(err);
                }
                if (delayed) {
                    return done();
                }
                return done(new Error('Not respected the delay'));
            });
        });
    });
});
