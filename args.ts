// @ts-ignore
const { args } = Deno;

if (!args.length) {
    console.error('No manga provided.');
}

// No cache: --no-cache
export const noCache = args.findIndex((arg) => arg === '--no-cache') > -1;

// Name: <uri>
export const uri = args[args.length - 1];
