export class Sheet {
  public chapter!: Chapter;
  public url = '';
  public path = '';
  public error?: Error;

  public constructor(chapter: Chapter) {
    this.chapter = chapter;
  }

  public get basePath(): string {
    return this.chapter.path;
  }

  public get fileName(): string {
    return this.url.substr(this.url.lastIndexOf('/') + 1);
  }

  public get filePath(): string {
    return `${this.basePath}/${this.fileName}`;
  }
}

export class Chapter {
  public book!: Book;
  public url = '';
  public name = '';
  public sheets: Sheet[] = [];

  public constructor(book: Book) {
    this.book = book;
  }

  public get basePath(): string {
    return this.book.path;
  }

  public get dirName(): string {
    return this.name.replace(/\W/g, '-').toLowerCase();
  }

  public get path(): string {
    return `${this.basePath}/${this.dirName}`;
  }

  public get filePath(): string {
    return `${this.basePath}/${this.dirName}.pdf`;
  }
}

export class Book {
  public basePath!: string;
  public title = '';
  public chapters: Chapter[] = [];

  public constructor(basePath: string) {
    this.basePath = basePath;
  }

  public get dirName(): string {
    return this.title.replace(/\W/g, '-').toLowerCase();
  }

  public get path(): string {
    if (!this.dirName) {
      return '';
    }

    return `${this.basePath}/${this.dirName}`;
  }

  public get pdfFilePaths(): string[] {
    if (!this.path) {
      return [];
    }

    return this.chapters.map(({ filePath }: Chapter) => filePath);
  }
}

export interface Driver {
  match: (url: string) => boolean;
  fetchBook: (book: Book, url: string) => Promise<Book>;
}

export class NoDriverException extends Error {}
