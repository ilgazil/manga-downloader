// @ts-ignore
const {removeSync} = Deno;

// @ts-ignore
import {queue} from './queue.ts';
// @ts-ignore
import {downloadChapter} from './download.ts';
// @ts-ignore
import {convert as img2pdf, merge as mergePdf} from './pdf.ts';
// @ts-ignore
import {Filesystem} from './filesystem.ts';
// @ts-ignore
import {Manga, Chapter, Scan} from './types.ts';

export interface PipelinePayload {
  noCache: boolean;
  manga: Manga;
  workingFilesystem: Filesystem;
  targetFilesystem: Filesystem;
  files?: string[];
  output?: string;
}

/** Downloads all chapters' scans, except if the chapter exists in pdf format */
export function downloadChapters(payload: PipelinePayload): Promise<PipelinePayload> {
  console.debug(`downloadChapters`);

  const options = {
    filesystem: payload.workingFilesystem.filesystem(payload.manga.id),
  };

  return queue(payload.manga.chapters, (chapter: Chapter): Promise<string[]> => {
    if (options.filesystem.isFile(`${chapter.id}.pdf`)) {
      return Promise.resolve([options.filesystem.resolve(`${chapter.id}.pdf`)]);
    }

    if (!chapter.scans.length) {
      console.debug(`${chapter.id} has no available scan for download`);
      return Promise.resolve([]);
    }

    console.debug(`Downloading ${chapter.id} contents (${chapter.scans.length} scans)`);
    return downloadChapter(chapter, options);
  })

  .then(() => payload);
}

/** Creates a pdf for each chapter with all scan images and removes that lasts */
export function createChapterPdfs(payload: PipelinePayload): Promise<PipelinePayload> {
  console.debug(`createChapterPdfs ${payload.manga.chapters.length} chapters`);

  return queue(payload.manga.chapters, (chapter: Chapter): Promise<string> => {
    const target = `${payload.manga.id}/${chapter.id}`;

    if (payload.workingFilesystem.isFile(`${target}.pdf`)) {
      return Promise.resolve(`${target}.pdf`);
    }

    console.debug(`Creating chapter ${target}.pdf with ${chapter.scans.length} files`);

    return img2pdf(chapter.scans.map((scan: Scan) => payload.workingFilesystem.resolve(`${target}/${scan.name}`)))
      .then((files: string[]) => mergePdf(
        files,
        {output: payload.workingFilesystem.resolve(`${target}.pdf`)}
      ))
      .then(() => {
        removeSync(payload.workingFilesystem.resolve(target), {recursive: true});
        return `${target}.pdf`;
      });
  })

  .then((files: string[]) => {
    payload.files = files;

    return payload;
  });
}

/** Merges all chapters to a final pdf file */
export function createFinalPdf(payload: PipelinePayload): Promise<PipelinePayload> {
  console.debug(`createFinalPdf`);

  const output = payload.targetFilesystem.resolve(`${payload.manga.title || payload.manga.id}.pdf`);

  console.debug(`Creating final ${output} with ${payload.files.length} files`);

  return mergePdf(
    payload.files.map((chapterFile: string) => payload.workingFilesystem.resolve(chapterFile)),
    {output}
  )

  .then(() => {
    payload.output = output;

    return payload;
  });
}

/** Clears cache if asked in options */
export function clearCache(payload: PipelinePayload): Promise<PipelinePayload> {
  console.debug(`clearCache`);

  if (payload.noCache) {
    removeSync(payload.workingFilesystem.resolve(), {recursive: true});
  }

  return Promise.resolve(payload);
}