// @ts-ignore
const { run, removeSync } = Deno;

// @ts-ignore
import Queue from './Queue.ts';

export default class PdfConverter {
    convert(files: string[]) {
        return Queue.process(files, (file: string): Promise<string> => {
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
}
