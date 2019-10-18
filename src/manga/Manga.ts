// @ts-ignore
import Chapter from './Chapter.ts';

export default class Manga {
    id: string;
    title: string = '';
    chapters: Chapter[] = [];

    constructor(id: string) {
        this.id = id;
    }

    setTitle(title: string): Manga {
        this.title = title;
        return this;
    }

    setChapters(chapters: Chapter[]): Manga {
        this.chapters = chapters;
        return this;
    }
}
