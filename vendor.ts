// @ts-ignore
const { run, cwd } = Deno;

// @ts-ignore
import BeautifulDom from './vendor/beautiful-dom/beautifuldom.ts';
// @ts-ignore
import HTMLElementData from './vendor/beautiful-dom/htmlelement.ts';

const headers = {};

export function getCloudflareCookies(url: string): Promise<Headers> {
    const host = /https?:\/\/[^\/]+\//.exec(url)[0];

    if (headers[host]) {
        return Promise.resolve(headers[host]);
    }

    const process = run({
        args: ['node', `${cwd()}/vendor/cloudscraper.js`, url],
        stdout: 'piped',
    });

    return process.output()
        .then((buffer) => new TextDecoder('utf-8').decode(buffer))
        .then((output) => {
            headers[host] = new Headers();

            output
                .split(`\n`)
                .filter((header) => !!header)
                .forEach((header) => {
                    headers[host].append(
                        header.substr(0, header.indexOf(':')),
                        header.substr(header.indexOf(':') + 2)
                    );
                });

            return headers[host];
        });
}

export {
    BeautifulDom,
    HTMLElementData
}
