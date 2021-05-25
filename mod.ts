import {getMangaInfos} from './src/host.ts';
import {PipelinePayload, downloadChapters, createChapterPdfs, createFinalPdf, clearCache} from './src/pipeline.ts';
import {getWorkingFilesystem, getTargetFilesystem} from './src/filesystem.ts';

import {Manga} from './src/types.ts';

export interface TakoOptionList {
  output?: string;
  noCache?: boolean;
}

export function tako(
  uri: string,
  {
    output = '',
    noCache = false,
  }: TakoOptionList = {}
) {
  const workingFilesystem = getWorkingFilesystem(noCache);
  const targetFilesystem = getTargetFilesystem(output);

  console.debug(`Cache directory: ${workingFilesystem.resolve()}`);

  return getMangaInfos(uri, getWorkingFilesystem(noCache))

    // Creating payload for pipeline
    .then((manga: Manga): PipelinePayload => {
      return {
        noCache,
        manga,
        workingFilesystem,
        targetFilesystem,
      }
    })

    // Processing pipeline
    .then(downloadChapters)
    .then(createChapterPdfs)
    .then(createFinalPdf)
    .then(clearCache)

    // Return final output
    .then((payload: PipelinePayload): string => payload.output)
  ;
}
