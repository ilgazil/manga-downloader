import { Book, Driver, NoDriverException } from "./types.ts";
import attaqueTitanDriver from "./drivers/attaquetitans.ts";

const drivers: Driver[] = [
  attaqueTitanDriver,
];

export default async function fetchBook(book: Book, url: string): Promise<Book> {
  const driver = drivers.find((driver: Driver) => driver.match(url));

  if (!driver) {
    throw new NoDriverException(url);
  }

  return await driver.fetchBook(book, url);
}
