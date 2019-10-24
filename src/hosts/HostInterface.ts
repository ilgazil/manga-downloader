// @ts-ignore
import Filesystem from '../core/Filesystem.ts';

// @ts-ignore
import Manga from '../manga/Manga.ts';

export default interface HostInterface {
  match(url: string): boolean

  getManga(uri: string, filesystem: Filesystem): Promise<Manga>

  parseId(uri: string): Promise<string>

  parseName(html: string): Promise<string>

  parseChapterUris(html): Promise<string[]>

  parseScanUris(html): Promise<string[]>
}
