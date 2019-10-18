// @ts-ignore
const { cwd, makeTempDirSync, mkdirSync, removeSync } = Deno;

// @ts-ignore
import Filesystem from './src/core/Filesystem.ts';
// @ts-ignore
import PdfConverter from './src/core/PdfConverter.ts';
// @ts-ignore
import Queue from './src/core/Queue.ts';

// @ts-ignore
import hostFactory from './src/core/hostFactory.ts';
// @ts-ignore
import mergePdf from './src/core/mergePdf.ts';
// @ts-ignore
import Downloader from './src/core/Downloader.ts';

// @ts-ignore
import Manga from './src/manga/Manga.ts';
// @ts-ignore
import Chapter from './src/manga/Chapter.ts';
// @ts-ignore
import Scan from './src/manga/Scan.ts';

export interface TakoOptionList {
    output?: string;
    noCache?: boolean;
}

function getWorkingFilesystem(noCache: boolean): Filesystem {
    let workingDir: string;

    if (noCache) {
        workingDir = makeTempDirSync({ prefix: 'tako' });
    } else {
        // @todo get system temp dir
        workingDir = `/tmp/tako`;
        mkdirSync(workingDir, true);
    }

    return new Filesystem(workingDir);
}

function getTargetFilesystem(output: string): Filesystem {
    // If path is empty or relative, prepending current directory
    if (output.substr(0, 1) !== '/') {
        output = `${cwd()}/${output}`;
    }
    return new Filesystem(output);
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
        .getManga(uri, workingFilesystem)

        .then((manga: Manga) => {
            const mangaFilesystem = workingFilesystem.filesystem(manga.id);
            const downloader = new Downloader(mangaFilesystem);

            return Queue
                .process(manga.chapters, (chapter: Chapter) => {
                    if (mangaFilesystem.isFile(`${chapter.id}.pdf`)) {
                        return Promise.resolve();
                    }

                    if (!chapter.scans.length) {
                        console.debug(`${chapter.id} has no available scan for download`);
                        return Promise.resolve();
                    }

                    console.debug(`Downloading ${chapter.id} scans (${chapter.scans.length})`);
                    return downloader.downloadChapterQueue(chapter);
                })
                .then(() => manga);
        })

        .then((manga: Manga) => {
            const converter = new PdfConverter();

            return Queue.process(manga.chapters, (chapter: Chapter): Promise<string> => {
                const target = `${manga.id}/${chapter.id}`;

                if (workingFilesystem.isFile(`${target}.pdf`)) {
                    return Promise.resolve(`${target}.pdf`);
                }

                console.debug(`Creating chapter ${target}.pdf with ${chapter.scans.length} files`);

                return converter
                    .convert(chapter.scans.map((scan: Scan) => workingFilesystem.resolve(`${target}/${scan.name}`)))
                    .then((files: string[]) => mergePdf(
                        files,
                        { output: workingFilesystem.resolve(`${target}.pdf`) }
                    ))
                    .then(() => {
                        removeSync(workingFilesystem.resolve(target), { recursive: true });
                        return `${target}.pdf`;
                    });
            }).then((chapterFiles: string[]): Promise<string> => {
                const output = targetFilesystem.resolve(`${manga.title || manga.id}.pdf`);

                console.debug(`Creating final ${output} with ${chapterFiles.length} files`);

                return mergePdf(
                    chapterFiles.map((chapterFile: string) => workingFilesystem.resolve(chapterFile)),
                    { output }
                ).then (() => output);
            }).then((output): string => {
                if (noCache) {
                    removeSync(workingFilesystem.resolve(), { recursive: true });
                }

                return output;
            });
        })
    ;
}
