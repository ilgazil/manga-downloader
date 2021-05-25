import { ensureDir } from 'https://deno.land/std@0.97.0/fs/ensure_dir.ts';
import { exists } from 'https://deno.land/std@0.97.0/fs/exists.ts';
import PQueue from 'https://deno.land/x/p_queue@1.0.1/mod.ts';

import { Book, Chapter, Sheet } from './types.ts';

async function downloadSheet(sheet: Sheet): Promise<void> {
  if (await exists(`${sheet.filePath}`)) {
    return Promise.resolve();
  }

  const response = await fetch(sheet.url);

  if (response.status !== 200) {
    throw `Warning: ${sheet.url} got a HTTP/${response.status} response.`;
  }

  await Deno.writeFile(`${sheet.filePath}`, new Uint8Array(await response.arrayBuffer()));
}

export default async function fetchImages(book: Book) {
  await ensureDir(book.path);
  await Deno.chmod(book.path, 0o776);

  // @todo filter in error scans
  const count = book.chapters.reduce((count: number, chapter: Chapter) => count += chapter.sheets.length, 0);
  console.debug(`Downloading ${count} scans in ${book.path}...`);

  const chapterQueue = new PQueue({
    concurrency: 1,
  });

  book.chapters.forEach(async (chapter: Chapter) => {
    await chapterQueue.add(async () => {
      await ensureDir(chapter.path);
      await Deno.chmod(chapter.path, 0o776);

      const sheetQueue = new PQueue({
        concurrency: 4,
      });

      chapter.sheets.forEach(async (sheet: Sheet) => {
        await sheetQueue.add(async () => {
          try {
            await downloadSheet(sheet);
          } catch (e) {
            sheet.error = e;
            console.error(e);
          }
        });
      });

      await sheetQueue.onIdle();
    });
  });

  await chapterQueue.onIdle();
}
