export default class Scan {
  name: string;
  uri: string;
  headers: Headers;

  constructor(name: string, uri: string) {
    this.name = name;
    this.uri = uri;
  }

  setHeaders(headers: Headers): Scan {
    this.headers = headers;
    return this;
  }

  fetch() {
    if (this.headers) {
      return fetch(this.uri, {headers: this.headers, redirect: 'follow'});
    }

    return fetch(this.uri);
  }
}
