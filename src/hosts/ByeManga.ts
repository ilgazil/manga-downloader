// @ts-ignore
import hostFactory from '../core/hostFactory.ts';

// @ts-ignore
import {getCloudflareCookies, BeautifulDom, HTMLElementData} from '../../vendor.ts';

// @ts-ignore
import HostInterface from './HostInterface.ts';

// @ts-ignore
import Filesystem from '../core/Filesystem.ts';

// @ts-ignore
import Manga from '../manga/Manga.ts';
// @ts-ignore
import Chapter from '../manga/Chapter.ts';
// @ts-ignore
import Scan from '../manga/Scan.ts';

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

export default class ByeManga implements HostInterface {
  private uri = 'https://byemanga.com/';

  match(url: string): boolean {
    return url.indexOf(this.uri) === 0;
  }

  getManga(uri: string, filesystem: Filesystem): Promise<Manga> {
    return getCloudflareCookies(this.uri)
      .then((headers: Headers) => request(uri, headers))

      // Resolve name and chapters
      .then(({headers, response, html}: HostResponse) => {
        console.debug('Retrieving manga info');
        const parser = hostFactory(response.url);

        return Promise
          .all([
            parser.parseId(uri),
            parser.parseName(html),
            parser.parseChapterUris(html)
          ])
          .then(([id, title, uris]: [string, string, string[]]) => {
            const manga = new Manga(id);
            manga.setTitle(title);
            manga.setChapters(uris.map((uri: string) => new Chapter(uri.substring(this.uri.length, uri.lastIndexOf('/')), uri)));

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

        // @todo Enqueue this. Requests can't be async because it may cause too many requests in the same time.
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
                return hostFactory(response.url)
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
              chapter.setScans(uris.map((uri: string) => {
                const scan = new Scan(uri.substring(uri.lastIndexOf('/') + 1), uri);
                scan.setHeaders(headers);

                return scan;
              }));
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
    const element = dom.querySelector('h1.entry-title');

    return Promise.resolve(element.innerText);
  }

  parseChapterUris(html: string): Promise<string[]> {
    return new Promise<string[]>((resolve) => {
      const dom = new BeautifulDom(html);

      const invertedUris = dom.querySelectorAll('#chapter_list li a')
        .map((element: HTMLElementData) => {
          const dom = new BeautifulDom(element.innerHTML);

          if (dom.querySelector('.dashicons-book')) {
            return element.getAttribute('href');
          }

          return '';
        })

        // Remove empty and duplicate entries
        .filter((id: string, index, self) => !!id && self.indexOf(id) === index)
      ;

      // Inverting chapter order
      const uris = [];

      while (invertedUris.length) {
        uris.unshift(invertedUris.shift());
      }

      resolve(uris);
    });
  }

  parseScanUris(html: string): Promise<string[]> {
    return new Promise<string[]>((resolve) => {
      const dom = new BeautifulDom(html);

      if (dom.querySelector('.maxbutton-acheter-tome')) {
        return resolve([]);
      }

      resolve(dom
        .querySelectorAll('#readerarea img.alignnone')
        .map((element) => element
          .getAttribute('src')
          // @todo Find a way to avoid this
          .replace(/i\d\.wp\.com\//, '')
        )
      );
    });
  }
}
