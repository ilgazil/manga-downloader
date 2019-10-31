// @ts-ignore
const {mkdirSync, openSync} = Deno;

// @ts-ignore
import {queue} from './queue.ts';
// @ts-ignore
import {Filesystem} from './filesystem.ts';

// @ts-ignore
import {Chapter, Scan} from './types.ts';

function createPromise(chapter: Chapter, scan: Scan, options): Promise<string> {
  const target = `${chapter.id}/${scan.name}`;

  if (options.filesystem.isFile(target)) {
    return Promise.resolve(options.filesystem.resolve(target));
  } else if (options.filesystem.isFile(`${target.substring(0, target.lastIndexOf('.'))}.pdf`)) {
    scan.name = `${scan.name.substring(0, scan.name.lastIndexOf('.'))}.pdf`;
    return Promise.resolve(options.filesystem.resolve(scan.name));
  }

  return downloadScan(scan, target, options);
}

export interface DownloadOptions {
  filesystem: Filesystem,
  async?: boolean,
}

export function downloadScan(scan: Scan, target: string, options: DownloadOptions): Promise<string> {
  target = options.filesystem.resolve(target);

  return fetch(scan.uri, {headers: scan.headers})
    .then((response) => {
      if (response.status !== 200) {
        throw `Warning: ${scan.uri} got a HTTP/${response.status} response.`;
      }

      return response.arrayBuffer();
    })
    .then((buffer) => openSync(target, 'w').write(new Uint8Array(buffer)))
    .then(() => target);
}

export function downloadChapter(chapter: Chapter, options: DownloadOptions): Promise<string[]> {
  if (!options.filesystem.isDirectory(chapter.id)) {
    mkdirSync(options.filesystem.resolve(chapter.id), true);
  }

  if (options.async) {
    return Promise
      .all(chapter.scans.map((scan: Scan) => createPromise(chapter, scan, options)));
  }

  return queue(chapter.scans, (scan: Scan) => createPromise(chapter, scan, options));
}
