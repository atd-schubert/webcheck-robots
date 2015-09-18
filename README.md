# webcheck-robots
A plugin for [Robots Exclusion Standard](http://www.robotstxt.org/) for [webcheck](https://github.com/atd-schubert/node-webcheck)

## How to install

```bash
npm install --save webcheck-robots
```

## How to use

```js
var Webcheck = require('webcheck');
var RobotsPlugin = require('webcheck-robots');

var plugin = RobotsPlugin();

var webcheck = new Webcheck();
webcheck.addPlugin(plugin);

plugin.enable();

// now continue with your code...

```

## Options

- `filterUrl`: Filter urls that should only crawled once (default all urls).
- `userAgent`: User Agent for robots.txt (defaults to webcheck user agent).
- `sitemapLookup`: Should the plugin crawl the sitemap if there is a information in robots.txt (default: true).
- `respectDelay`: Should the plugin respect the delay automatically (default: true).

### Note for filters

Filters are regular expressions, but the plugin uses only the `.test(str)` method to proof. You are able to write
your own and much complexer functions by writing the logic in the test method of an object like this:

```js
opts = {
   filterSomething: {
       test: function (val) {
           return false || true;
       }
   }
}
```

## Properties

- `hosts`: Object of robots.txt information sorted by host.
- `userAgent`: User Agent string to identify corresponding settings in robots.txt.

