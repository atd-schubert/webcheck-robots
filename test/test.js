/*jslint node:true*/

/*global describe, it, before, after, beforeEach, afterEach*/

'use strict';

var RobotsPlugin = require('../');

var Webcheck = require('webcheck');
var freeport = require('freeport');
var express = require('express');

describe('Robots Plugin', function () {
    var portWithRobots, portWithoutRobots;
    before(function (done) {
        var app = express();

        /*jslint unparam: true*/
        app.get('/', function (req, res) {
            res.send('<html><head></head><body><p>index</p></body></html>');
        });
        app.get('/private/index.html', function (req, res) {
            res.send('<html><head></head><body><p>private</p></body></html>');
        });
        app.get('/private/allowed', function (req, res) {
            res.send('<html><head></head><body><p>private but allowed</p></body></html>');
        });
        app.get('/public/index.html', function (req, res) {
            res.send('<html><head></head><body><p>private</p></body></html>');
        });
        app.get('/robots.txt', function (req, res) {
            res.set('Content-Type', 'text/plain').send('User-Agent: Delay\nCrawl-delay: 1\n\nUser-Agent: Test\nDisallow: /private\nAllow: /private/allowed\n\nUser-Agent: DisallowAll\nDisallow: /\n\nUser-Agent: *\nDisallow: /private');
        });
        /*jslint unparam: false*/

        freeport(function (err, p) {
            if (err) {
                done(err);
            }
            portWithRobots = p;
            app.listen(portWithRobots);

            app = express();

            /*jslint unparam: true*/
            app.get('/', function (req, res) {
                res.send('<html><head></head><body><p>index</p></body></html>');
            });
            app.get('/private/index.html', function (req, res) {
                res.send('<html><head></head><body><p>private</p></body></html>');
            });
            app.get('/private/allowed', function (req, res) {
                res.send('<html><head></head><body><p>private but allowed</p></body></html>');
            });
            app.get('/public/index.html', function (req, res) {
                res.send('<html><head></head><body><p>private</p></body></html>');
            });
            /*jslint unparam: false*/
            freeport(function (err, p) {
                if (err) {
                    done(err);
                }
                portWithoutRobots = p;
                app.listen(portWithoutRobots);

                done();
            });
        });
    });
    describe('With robots', function () {
        var webcheck, plugin;

        before(function () {
            webcheck = new Webcheck();
            plugin = new RobotsPlugin({});
            webcheck.addPlugin(plugin);
            plugin.enable();
        });

        it('should allow public resources', function (done) {
            var allowed;

            webcheck.on('request', function (settings) {
                if (settings.url === 'http://localhost:' + portWithRobots + '/public/index.html') {
                    allowed = true;
                }
            });
            webcheck.crawl({
                url: 'http://localhost:' + portWithRobots + '/public/index.html'
            }, function (err) {
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
        it('should disallow private resources', function (done) {
            var allowed;

            webcheck.on('request', function (settings) {
                if (settings.url === 'http://localhost:' + portWithRobots + '/private/index.html') {
                    allowed = true;
                }
            });
            webcheck.crawl({
                url: 'http://localhost:' + portWithRobots + '/private/index.html'
            }, function (err) {
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
    describe('Without robots', function () {
        var webcheck, plugin;

        before(function () {
            webcheck = new Webcheck();
            plugin = new RobotsPlugin({});
            webcheck.addPlugin(plugin);
            plugin.enable();
        });

        it('should allow public resources', function (done) {
            var allowed;

            webcheck.on('request', function (settings) {
                if (settings.url === 'http://localhost:' + portWithoutRobots + '/public/index.html') {
                    allowed = true;
                }
            });
            webcheck.crawl({
                url: 'http://localhost:' + portWithoutRobots + '/public/index.html'
            }, function (err) {
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
        it('should disallow private resources', function (done) {
            var allowed;

            webcheck.on('request', function (settings) {
                if (settings.url === 'http://localhost:' + portWithoutRobots + '/private/index.html') {
                    allowed = true;
                }
            });
            webcheck.crawl({
                url: 'http://localhost:' + portWithoutRobots + '/private/index.html'
            }, function (err) {
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
    describe('With specified User-Agent', function () {
        var webcheck, plugin;
        before(function () {
            webcheck = new Webcheck();
            plugin = new RobotsPlugin({
                userAgent: 'Test'
            });
            webcheck.addPlugin(plugin);
            plugin.enable();
        });

        it('should allow public resources', function (done) {
            var allowed;

            webcheck.on('request', function (settings) {
                if (settings.url === 'http://localhost:' + portWithRobots + '/public/index.html') {
                    allowed = true;
                }
            });
            webcheck.crawl({
                url: 'http://localhost:' + portWithRobots + '/public/index.html'
            }, function (err) {
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
        it('should disallow private resources', function (done) {
            var allowed;

            webcheck.on('request', function (settings) {
                if (settings.url === 'http://localhost:' + portWithRobots + '/private/index.html') {
                    allowed = true;
                }
            });
            webcheck.crawl({
                url: 'http://localhost:' + portWithRobots + '/private/index.html'
            }, function (err) {
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
        it('should allow public resources within private scope', function (done) {
            var allowed;

            webcheck.on('request', function (settings) {
                if (settings.url === 'http://localhost:' + portWithRobots + '/private/allowed') {
                    allowed = true;
                }
            });
            webcheck.crawl({
                url: 'http://localhost:' + portWithRobots + '/private/allowed'
            }, function (err) {
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
    describe('Respect the delay', function () {
        var webcheck, plugin;
        before(function () {
            webcheck = new Webcheck();
            plugin = new RobotsPlugin({
                userAgent: 'Delay'
            });
            webcheck.addPlugin(plugin);
            plugin.enable();
        });
        it('do not have to respect the delay on first crawl', function (done) {
            webcheck.crawl({
                url: 'http://localhost:' + portWithRobots + '/public/index.html'
            }, function (err) {
                if (err) {
                    return done(err);
                }
                return done();
            });
        });
        it('should respect delay', function (done) {
            var delayed;
            webcheck.on('wait', function (settings) {
                if (settings.url === 'http://localhost:' + portWithRobots + '/public/index.html') {
                    delayed = true;
                }
            });
            webcheck.crawl({
                url: 'http://localhost:' + portWithRobots + '/public/index.html'
            }, function (err) {
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
