// @ts-ignore
const {run, removeSync} = Deno;

// @ts-ignore
import {queue} from './queue.ts';

export function convert(files: string[]): Promise<string[]> {
  return queue(files, (file: string): Promise<string> => {
    if (file.substr(file.lastIndexOf('.') + 1) === 'pdf') {
      return Promise.resolve(file);
    }

    const output = `${file.substr(0, file.lastIndexOf('.'))}.pdf`;

    const process = run({
      args: ['convert', file, output],
      stdout: 'piped',
      stderr: 'piped',
    });

    return process.status()
      .then(({success}) => {
        if (success) {
          return process
            .output()
            .then((buffer) => new TextDecoder('utf-8').decode(buffer))
            .then(() => {
              removeSync(file);
              return output;
            });
        } else {
          return process
            .stderrOutput()
            .then((buffer) => new TextDecoder('utf-8').decode(buffer))
            .then((error) => {
              throw error;
            });
        }
      });
  });
}

export interface MergePdfOptions {
  output: string;
}

export function merge(files: string[], {output}: MergePdfOptions) {
  // const args = ['pdftk', ...files, 'output', output];
  const args = ['pdfunite', ...files, output];

  const process = run({
    args,
    stdout: 'piped',
    stderr: 'piped',
  });

  return process.status()
    .then(({success}) => {
      if (!success) {
        return process
          .stderrOutput()
          .then((buffer) => new TextDecoder('utf-8').decode(buffer))
          .then((error) => {
            throw error;
          });
      }
    });
}
