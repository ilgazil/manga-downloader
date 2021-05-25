import { DOMParser, Node } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts';
import PQueue from 'https://deno.land/x/p_queue@1.0.1/mod.ts';

import { Book, Chapter, Driver, Sheet } from '../types.ts';

function matchUrl(url: string): boolean {
  return /\/\/attaquetitans\.com/.test(url);
}

async function fetchChapterUrls(book: Book): Promise<void> {
  const response = await fetch('https://attaquetitans.com/');
  const html = (await response.text()).toString();

  const document = new DOMParser().parseFromString(html, 'text/html');

  if (!document) {
    return;
  }

  document
    .querySelectorAll('#ceo_latest_comics_widget-3 li a')
    .forEach((node: Node) => {
      const url = node.parentElement?.querySelector('a')?.getAttribute('href');

      if (url) {
        const regResults = /scan-(\d+)/.exec(url);
        const chapter = new Chapter(book);
        chapter.url = url;
        chapter.name = `Chapter ${regResults ? regResults[1] : 'x'}`;
        book.chapters.push(chapter);
      }
    });

  book.chapters.reverse();

  console.debug(`${book.chapters.length} chapters found`);
}

async function fetchBook(book: Book): Promise<Book> {
  const queue = new PQueue({
    concurrency: 1,
  });

  book.title = 'Shingeki No Kyojin';

  await fetchChapterUrls(book);

  book.chapters.forEach(async (chapter: Chapter) => {
    await queue.add(async () => {
      const response = await fetch(chapter.url);
      const html = (await response.text()).toString();

      const document = new DOMParser().parseFromString(html, 'text/html');

      if (!document) {
        return [];
      }

      document
        .querySelectorAll('.entry-content div a img')
        .forEach((node: Node) => {
          // @note a[href] has the same url as img[src]
          const url = node.parentElement?.getAttribute('href');

          if (url) {
            const scan = new Sheet(chapter);
            scan.url = url;
            chapter.sheets.push(scan);
          }
        });
    });
  });

  await queue.onIdle();
  return book;
}

const driver: Driver = {
  match: matchUrl,
  fetchBook,
}

export default driver;
