// @ts-ignore
import {HostInterface, factory, getCloudflareCookies} from '../host.ts';
// @ts-ignore
import {Filesystem} from '../filesystem.ts';
// @ts-ignore
import {Manga, Chapter, BeautifulDom, HTMLElementData} from '../types.ts';

interface HostResponse {
  headers: Headers;
  response: Response;
  html: string;
}

function request(uri: string, headers: Headers): Promise<HostResponse> {
  return fetch(uri, {headers})
    .then((response) => ({response, headers}))
    .then(({response, headers}) => {
      return response.text()
        .then((buffer) => buffer.toString())
        .then((html) => {
          return {
            headers,
            response,
            html,
          }
        })
    });
}

export default class JapScan implements HostInterface {
  private uri = 'https://www.japscan.co/';

  match(url: string): boolean {
    return url.indexOf(this.uri) === 0;
  }

  getManga(uri: string, filesystem: Filesystem): Promise<Manga> {
    return getCloudflareCookies(this.uri)
      .then((headers: Headers) => request(uri, headers))

      // Resolve name and chapters
      .then(({headers, response, html}: HostResponse) => {
        console.debug('Retrieving manga info');
        const parser = factory(response.url);

        return Promise
          .all([
            parser.parseId(uri),
            parser.parseName(html),
            parser.parseChapterUris(html)
          ])
          .then(([id, title, uris]: [string, string, string[]]) => {
            const manga = {
              id,
              title,
              chapters: uris.map((uri: string) => {
                return {
                  id: uri.substring(this.uri.length, uri.lastIndexOf('/')),
                  uri,
                }
              })
            };

            return {headers, manga}
          });
      })

      .then(({headers, manga}: { headers: Headers, manga: Manga }) => {
        const requests: Promise<any>[] = manga.chapters.map((chapter: Chapter) => {
          if (filesystem.isFile(`${manga.id}/${chapter.id}.pdf`)) {
            console.debug(`${chapter.id}.pdf is cached`);

            return Promise.resolve();
          }

          return request(chapter.uri, headers)
            .then((response: HostResponse) => ({
              ...response,
              chapter,
            }));
        });

        return Promise
        // Get all chapter uris
          .all(requests)

          // Get all scan uris, for non cached chapters
          .then((results) => Promise
            .all(results
              .filter((result) => !!result)
              .map((
                {headers, chapter, response, html}: { headers: Headers, chapter: Chapter, response; HostResponse, html: string }
              ) => {
                return factory(response.url)
                  .parseScanUris(html)
                  .then((uris) => ({headers, chapter, uris}));
              })
            )
          )

          // Instantiate all scans having an uri
          .then((results) => {
            results.forEach((
              {headers, chapter, uris}: { headers: Headers, chapter: Chapter, uris: string[] }
            ) => {
              chapter.scans = uris.map((uri: string) => {
                return {
                  name: uri.substring(uri.lastIndexOf('/') + 1),
                  uri,
                  headers,
                };
              });
            });

            return manga;
          });
      });
  }

  parseId(uri: string): Promise<string> {
    return Promise.resolve((new RegExp(`${this.uri}manga/([^\/]+)/`)).exec(uri)[1]);
  }

  parseName(html: string): Promise<string> {
    const dom = new BeautifulDom(html);
    const element = dom.querySelector('h1');

    return Promise.resolve(element.innerText);
  }

  parseChapterUris(html: string): Promise<string[]> {
    return new Promise<string[]>((resolve) => {
      const dom = new BeautifulDom(html);

      const invertedUris = dom.querySelectorAll('#chapters_list .chapters_list a')
        .map((element: HTMLElementData) => {
          return element.getAttribute('href');
        })
      ;

      // Inverting chapter order
      const uris = [];

      while (invertedUris.length) {
        uris.unshift(invertedUris.shift());
      }

      resolve(uris);
    });
  }

  parseScanUris(html: string) {
    const dom = new BeautifulDom(html);

    const uris = dom
      .querySelectorAll('#pages option')
      .map((link) => `${this.uri}${link.getAttribute('value').substr(1)}`);

    return Promise.all(uris.map((uri) => fetch(uri)
      .then((response) => response.text())
      .then((html) => {
        const dom = new BeautifulDom(html);

        return dom.querySelector('#image img').getAttribute('src');
      })));
  }
}
