/*jslint node:true*/

export interface IWebcheckRobotsEntry {
    allow: RegExp[];
    disallow: RegExp[];
    sitemap: string[];
    delay: number;
}
export function parseWildcard(str: string): RegExp {
    'use strict';
    str = str.trim();
    str.split('.').join('\\.')
        .split('?').join('\\?')
        .split('-').join('\\-')
        .split('{').join('\\{')
        .split('}').join('\\}')
        .split('|').join('\\|')
        .split('*').join('.*');
    return new RegExp('^' + str);

}
export function parseAllows(str: string, entry: IWebcheckRobotsEntry): void {
    'use strict';
    var arr: string[],
        tmpStr: string;

    arr = str.split('Allow: ');

    entry.allow = entry.allow || [];

    for (let i: number = 1; i < arr.length; i += 1) {
        tmpStr = arr[i].split(/\r?\n/)[0].trim();
        if (tmpStr !== '') {
            entry.allow.push(parseWildcard(tmpStr));
        }
    }
}
export function parseDisallows(str: string, entry: IWebcheckRobotsEntry): void {
    'use strict';
    var arr: string[],
        tmpStr: string;

    arr = str.split('Disallow: ');

    entry.disallow = entry.disallow || [];
    for (let i: number = 1; i < arr.length; i += 1) {
        tmpStr = arr[i].split(/\r?\n/)[0].trim();
        if (tmpStr !== '') {
            entry.disallow.push(parseWildcard(tmpStr));
        }
    }
}
export function parseDelay(str: string, entry: IWebcheckRobotsEntry): void {
    'use strict';
    var delay: string[];

    delay = str.split('Crawl-delay: ');

    if (delay.length > 1) {
        entry.delay = parseInt(delay[1].split(/\r?\n/)[0], 10) * 1000;
    }
}
export function removeComments(str: string): string {
    'use strict';
    var arr: string[] = str.split(/\r?\n/),
        result: string[] = [];

    for (let i: number = 0; i < arr.length; i += 1) {
        if (!/^ *#/.test(arr[i])) {
            result.push(arr[i]);
        }
    }

    return result.join('\n');
}
export function parse(str: string, entry: IWebcheckRobotsEntry): void {
    'use strict';
    str = str.trim();

    str = removeComments(str);

    parseAllows(str, entry);
    parseDisallows(str, entry);
    parseDelay(str, entry);
}
