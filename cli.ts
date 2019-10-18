// @ts-ignore
import { uri, noCache } from './args.ts';

// @ts-ignore
import { tako } from './main.ts';

tako(uri, { noCache })
    .then((filepath: string) => {
        console.log(`Created ${filepath}`);
    });
