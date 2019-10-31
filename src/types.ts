// @ts-ignore
import {BeautifulDom, HTMLElementData} from '../_vendor.ts';

export interface Manga {
  id: string;
  title?: string;
  chapters?: Chapter[];
}

export interface Chapter {
  id: string;
  uri: string;
  scans?: Scan[];
}

export interface Scan {
  name: string;
  uri: string;
  headers?: Headers;
}

export {
  BeautifulDom,
  HTMLElementData
}