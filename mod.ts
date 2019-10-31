// @ts-ignore
import {PipelinePayload, downloadChapters, createChapterPdfs, createFinalPdf, clearCache} from './src/pipeline.ts';
// @ts-ignore
import {getWorkingFilesystem, getTargetFilesystem} from './src/filesystem.ts';
// @ts-ignore
import {factory as hostFactory} from './src/host.ts';

// @ts-ignore
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

  return hostFactory(uri)
    // Get manga definition
    .getManga(uri, getWorkingFilesystem(noCache))

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
