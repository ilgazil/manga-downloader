// @ts-ignore
import Scan from './Scan.ts';

export default class Chapter {
    id: string;
    uri: string;
    scans :Scan[] = [];

    constructor(id: string, uri: string) {
        this.id = id;
        this.uri = uri;
    }

    setScans(scans: Scan[]) {
        this.scans = scans;

        return this;
    }
}
