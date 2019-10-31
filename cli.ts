// @ts-ignore
const {args} = Deno;
// @ts-ignore
import {tako} from './mod.ts';

if (!args.length) {
  console.error('No manga provided.');
}

// No cache: --no-cache
const noCache = args.findIndex((arg) => arg === '--no-cache') > -1;

// Manga URI: <uri>
const uri = args[args.length - 1];

tako(uri, {noCache})
  .then((filepath: string) => {
    console.log(`Created ${filepath}`);
  });
