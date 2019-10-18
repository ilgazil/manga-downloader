// @ts-ignore
const { lstatSync } = Deno;

function sanitizePath(path: string): string {
    if (!path) {
        return '';
    }

    // Filter '.' entries
    const parts = path.split('/').filter((part: string, index: number) => (!!part || index === 0) && part !== '.');

    // Resolve '..' entries
    let index;
    while ((index = parts.indexOf('..')) > -1) {
        parts.splice(index - 1, 2);
    }

    return parts.join('/');
}

export default class Filesystem {
    private readonly root: string;

    constructor(root: string) {
        this.root = sanitizePath(root);
    }

    filesystem(path: string = ''): Filesystem {
        return new Filesystem(this.resolve(path));
    }

    resolve(path: string = ''): string {
        path = sanitizePath(path);

        if (path) {
            return `${this.root}/${path}`;
        }

        return this.root;
    }

    isFile(path: string): boolean {
        try {
            return lstatSync(this.resolve(path)).isFile();
        } catch (e) {
            return false;
        }
    }

    isDirectory(path: string = ''): boolean {
        try {
            return lstatSync(this.resolve(path)).isDirectory();
        } catch (e) {
            return false;
        }
    }
}
