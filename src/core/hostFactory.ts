// @ts-ignore
import HostInterface from '../hosts/HostInterface.ts';
// @ts-ignore
import ByeManga from '../hosts/ByeManga.ts';
// @ts-ignore
import JapScan from '../hosts/JapScan.ts';
// @ts-ignore
import LaBayScan from '../hosts/LaBayScan.ts';

const hosts: HostInterface[] = [
    new ByeManga(),
    // new JapScan(),
    new LaBayScan(),
];

export default function hostFactory(url: string) {
    const host = hosts.find((host: HostInterface) => host.match(url));

    if (!host) {
        throw `No host matching ${url}`;
    }

    return host;
}
