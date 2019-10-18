const cloudscraper = require('cloudscraper');
const request = require('request');
const { getDefaultHeaders } = require('cloudscraper/lib/headers');

const headers = getDefaultHeaders();

const host = process.argv[2]; // Remove node script_path

const jar = request.jar();
cloudscraper.get(host, { jar, headers }).then(() => {
    console.log(
`User-Agent: ${headers['User-Agent']}
Cache-Control: private
Accept: ${headers['Accept']}
Cookie: ${jar.getCookies(host).map((cookie) => `${cookie.key}=${cookie.value}`).join('; ')}`
    );
}, console.error);
