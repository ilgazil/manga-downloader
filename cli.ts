#! /usr/bin/env -S deno run -A
import { existsSync } from 'https://deno.land/std@0.97.0/fs/exists.ts';
import PQueue from 'https://deno.land/x/p_queue@1.0.1/mod.ts';

import createPdf from './src/createPdf.ts';
import fetchBook from './src/fetchBook.ts';
import fetchImages from './src/fetchImages.ts';
import { Book } from './src/types.ts';

const { args } = Deno;

// const parser = args
//   .describe('Download scans and create a pdf with it')
//   .with(EarlyExitFlag('help', {
//     alias: ['?'],
//     describe: 'Show help',
//     exit() {
//       console.log('USAGE:');
//       console.log('  ./cli.ts [options] ...urls');
//       console.log(parser.help());
//       return Deno.exit(0);
//     },
//   }));

// const parserRes = parser.parse(Deno.args);
// if (parserRes.tag !== MAIN_COMMAND) {
//   console.error(parserRes.error.toString());
//   throw Deno.exit(1);
// }
// if (parserRes.remaining().rawFlags().length) {
//   console.error('Unknown flags:', ...parserRes.remaining().rawFlags());
//   throw Deno.exit(1);
// }

if (!args.length || args[0] == '--help') {
  console.log('USAGE:');
  console.log('  ./cli.ts target_dir ...urls');
  Deno.exit(0);
}

const [target, ...urls] = args;

if (!existsSync(target)) {
  console.error(`${target} does not exist or is not readable`);
  throw Deno.exit(1);
}

const queue = new PQueue({
  concurrency: 1,
});

// parserRes.remaining().rawValues().forEach(async (url: string) => {
urls.forEach(async (url: string) => {
  await queue.add(async () => {
    try {
      const book = new Book(target);
      await fetchBook(book, url);

      await fetchImages(book);
      await createPdf(book);

      console.log(`${book.title}: ${book.pdfFilePaths.length} chapters generated in ${book.path}`);
    } catch (e) {
      console.error(`Error while handling ${url}`, e.message);
      throw e;
    }
  });
});
