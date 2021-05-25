const { remove, writeFile } = Deno;
import { PDFDocument, PDFImage } from 'https://cdn.skypack.dev/pdf-lib@^1.11.1?dts';
import PQueue from 'https://deno.land/x/p_queue@1.0.1/mod.ts';

import { Book, Chapter, Sheet } from './types.ts';

export default async function createPdf(book: Book) {
  console.debug(`Creating PDFs...`);

  if (!book.path) {
    throw 'Book is wrongly configured (no file path)';
  }

  const chapterQueue = new PQueue({
    concurrency: 4,
  });

  book.chapters.forEach(async (chapter: Chapter) => {
    await chapterQueue.add(async () => {
      let hasError = false;
      const pdf = await PDFDocument.create();

      const sheetQueue = new PQueue({
        concurrency: 1,
      });

      chapter.sheets.forEach(async (sheet: Sheet) => {
        await sheetQueue.add(async () => {
          // @todo handle sheet.error
          let image!: PDFImage;

          if (/\.jpe?g$/.test(sheet.fileName)) {
            image = await pdf.embedJpg(await Deno.readFile(`${sheet.filePath}`));
          } else if (/\.png$/.test(sheet.fileName)) {
            image = await pdf.embedPng(await Deno.readFile(`${sheet.filePath}`));
          } else {
            console.error(`Unable to embed ${sheet.filePath} : unhandled file type`);
            hasError = true;
            return;
          }

          const page = pdf.addPage();
          page.setSize(image.width, image.height);
          page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
          });
        });
      });

      await sheetQueue.onIdle();

      await writeFile(`${chapter.filePath}`, await pdf.save());

      if (!hasError) {
        await remove(chapter.path, { recursive: true });
      }
    });
  });

  await chapterQueue.onIdle();
}
