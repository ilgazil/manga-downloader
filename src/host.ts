// @ts-ignore
import ByeManga from './hosts/ByeManga.ts';
// @ts-ignore
import JapScan from './hosts/JapScan.ts';
// @ts-ignore
import LaBayScan from './hosts/LaBayScan.ts';

// @ts-ignore
import {getCloudflareCookies} from '../_vendor.ts';
// @ts-ignore
import {Filesystem} from './filesystem.ts';
// @ts-ignore
import {Manga} from './types.ts';

export interface HostInterface {
  match(url: string): boolean

  getManga(uri: string, filesystem: Filesystem): Promise<Manga>

  parseId(uri: string): Promise<string>

  parseName(html: string): Promise<string>

  parseChapterUris(html): Promise<string[]>

  parseScanUris(html): Promise<string[]>
}

const hosts: HostInterface[] = [
  new ByeManga(),
  // new JapScan(),
  new LaBayScan(),
];

export function factory(url: string): HostInterface {
  const host = hosts.find((host: HostInterface) => host.match(url));

  if (!host) {
    throw `No host matching ${url}`;
  }

  return host;
}

export {getCloudflareCookies};