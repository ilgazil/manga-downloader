// @ts-ignore
const {cwd, lstatSync, makeTempDirSync, mkdirSync} = Deno;

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

export class Filesystem {
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

export function getWorkingFilesystem(noCache: boolean): Filesystem {
  let workingDir: string;

  if (noCache) {
    workingDir = makeTempDirSync({prefix: 'tako'});
  } else {
    // @todo get system temp dir
    workingDir = `/tmp/tako`;
    mkdirSync(workingDir, true);
  }

  return new Filesystem(workingDir);
}

export function getTargetFilesystem(output: string): Filesystem {
  // If path is empty or relative, prepending current directory
  if (output.substr(0, 1) !== '/') {
    output = `${cwd()}/${output}`;
  }
  return new Filesystem(output);
}
