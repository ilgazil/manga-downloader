// @ts-ignore
const { run } = Deno;

export default function mergePdf(files: string[], { output }) {
    const process = run({
        args: ['pdftk', ...files, 'output', output],
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
