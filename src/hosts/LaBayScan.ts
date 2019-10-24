// @ts-ignore
import hostFactory from '../core/hostFactory.ts';
// @ts-ignore
import BeautifulDom from '../../vendor/beautiful-dom/beautifuldom.ts';

// @ts-ignore
import Filesystem from '../core/Filesystem.ts';

// @ts-ignore
import HostInterface from './HostInterface.ts';

// @ts-ignore
import Manga from '../manga/Manga.ts';
// @ts-ignore
import Chapter from '../manga/Chapter.ts';
// @ts-ignore
import Scan from '../manga/Scan.ts';

export default class LaBayScan implements HostInterface {
  private uri = 'http://labayscan.com/';

  match(url: string): boolean {
    return url.indexOf(this.uri) === 0;
  }

  getManga(uri: string, filesystem: Filesystem): Promise<Manga> {
    return fetch(uri)
      .then((response) => response.text().then((html) => ({response, html})))

      // Resolve name and chapters
      .then(({response, html}) => {
        console.debug('Retrieving manga info');
        const parser = hostFactory(response.url);

        return Promise
          .all([
            parser.parseId(uri),
            parser.parseName(html),
            parser.parseChapterUris(html),
          ])
          .then(([id, title, chapterUris]: [string, string, string[]]) => {
            const manga = new Manga(id);
            manga.setTitle(title);
            manga.setChapters(chapterUris.map((uri) => new Chapter(uri.substring(uri.lastIndexOf('/', uri.length - 2) + 1, uri.lastIndexOf('/')), uri)));

            return manga;
          });
      })

      .then((manga: Manga) => {
        const requests: Promise<any>[] = manga.chapters.map((chapter: Chapter) => {
          if (filesystem.isFile(`${manga.id}/${chapter.id}.pdf`)) {
            console.debug(`${chapter.id}.pdf is cached`);

            return Promise.resolve();
          }

          return fetch(chapter.uri)
            .then((response) => response.text().then((html) => ({response, html, chapter})));
        });

        return Promise
        // Get all chapter uris
          .all(requests)

          // Get all scan uris, for non cached chapters
          .then((results) => Promise
            .all(results
              .filter((result) => !!result)
              .map(({response, html, chapter}) => {
                return hostFactory(response.url)
                  .parseScanUris(html)
                  .then((uris) => ({chapter, uris}));
              })
            )
          )

          // Instantiate all scans having an uri
          .then((results) => {
            results.forEach((
              {chapter, uris}: { chapter: Chapter, uris: string[] }
            ) => {
              chapter.setScans(uris.map((uri: string) => new Scan(uri.substring(uri.lastIndexOf('/') + 1), uri)));
            });

            return manga;
          });
      });
  }

  parseId(uri: string): Promise<string> {
    return Promise.resolve((new RegExp(`${this.uri}scans\/([^\/]+)-scan-.+/`)).exec(uri)[1]);
  }

  parseName(html: string): Promise<string> {
    const dom = new BeautifulDom(html);
    const element = dom
      .querySelector('nav.top_nav .open_manga.mangas select')
      .querySelectorAll('option')
      .find((element) => element.outerHTML.indexOf('option selected') === 1);

    return Promise.resolve(element.innerText.trim());
  }

  parseChapterUris(html: string): Promise<string[]> {
    const dom = new BeautifulDom(html);

    const uris = dom
      .querySelector('select.selectpicker.open_manga.chapter')
      .querySelectorAll('option')
      .map((element) => element.getAttribute('data-url'));

    return Promise.resolve(uris);
  }

  parseScanUris(html: string): Promise<string[]> {
    const uris = [];
    const dom = new BeautifulDom(html);

    dom.querySelectorAll('.desktop_nav .pagination .page-item a')
      .forEach((link) => {
        if (!~~link.innerText) {
          return;
        }

        uris.push(link.getAttribute('href'));
      });

    return Promise.all(uris.map((uri) => fetch(uri)
      .then((response) => response.text())
      .then((html) => {
        const dom = new BeautifulDom(html);

        return dom.querySelector('img.scan_img').getAttribute('src');
      })));
  }
}
