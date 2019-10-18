// @ts-ignore
const { mkdirSync, openSync } = Deno;

// @ts-ignore
import Queue from './Queue.ts';
// @ts-ignore
import Filesystem from './Filesystem.ts';

// @ts-ignore
import Chapter from '../manga/Chapter.ts';
// @ts-ignore
import Scan from '../manga/Scan.ts';

export default class Downloader {
    private readonly filesystem: Filesystem;

    constructor(filesystem: Filesystem) {
        this.filesystem = filesystem;
    }

    downloadChapterQueue(chapter: Chapter): Promise<Chapter> {
        if (!this.filesystem.isDirectory(chapter.id)) {
            mkdirSync(this.filesystem.resolve(chapter.id), true);
        }

        const requests: Promise<any>[] = chapter.scans.map((scan: Scan) => {
            const target = `${chapter.id}/${scan.name}`;

            if (this.filesystem.isFile(target)) {
                return Promise.resolve();
            } else if (this.filesystem.isFile(`${target.substring(0, target.lastIndexOf('.'))}.pdf`)) {
                scan.name = `${scan.name.substring(0, scan.name.lastIndexOf('.'))}.pdf`;
                return Promise.resolve();
            }

            return scan.fetch()
                .then((response) => {
                    if (response.status !== 200) {
                        throw `Warning: ${scan.uri} got a HTTP/${response.status} response.`;
                    }

                    return response.arrayBuffer();
                })
                .then((buffer) => openSync(this.filesystem.resolve(target), 'w').write(new Uint8Array(buffer)));
        });

        return Promise
            .all(requests)
            .then(() => chapter);
    }

    downloadChapter(chapter: Chapter): Promise<Chapter> {
        if (!this.filesystem.isDirectory(chapter.id)) {
            mkdirSync(this.filesystem.resolve(chapter.id), true);
        }

        return Queue
            .process(chapter.scans, (scan: Scan): Promise<number|void> => {
                const target = `${chapter.id}/${scan.name}`;

                if (this.filesystem.isFile(target)) {
                    return Promise.resolve();
                } else if (this.filesystem.isFile(`${target.substring(0, target.lastIndexOf('.'))}.pdf`)) {
                    scan.name = `${scan.name.substring(0, scan.name.lastIndexOf('.'))}.pdf`;
                    return Promise.resolve();
                }

                return scan.fetch()
                    .then((response) => {
                        if (response.status !== 200) {
                            throw `Warning: ${scan.uri} got a HTTP/${response.status} response.`;
                        }

                        return response.arrayBuffer();
                    })
                    .then((buffer) => openSync(this.filesystem.resolve(target), 'w').write(new Uint8Array(buffer)));
                }
            ).then(() => chapter);
    }
};
