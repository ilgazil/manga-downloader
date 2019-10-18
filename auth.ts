const baseUri = 'https://byemanga.com/';

fetch(baseUri)
    .then((response) => {
        console.log(response.status);
        response.headers.forEach((header, name) => {
            console.log(name, header);
        })
    });