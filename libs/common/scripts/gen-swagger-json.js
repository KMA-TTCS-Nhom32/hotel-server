import { request } from 'http';
import { writeFileSync } from 'fs';

const options = {
    hostname: 'localhost',
    port: process.env.API_PORT || 4005,
    path: '/docs-json',
    method: 'GET',
};

const req = request(options, (res) => {
    if (res.statusCode !== 200) {
        console.error(`HTTP ${res.statusCode}: ${res.statusMessage}`);
        return;
    }

    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        writeFileSync('swagger.json', data, 'utf8');
        console.log('Swagger JSON file has been saved!');
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.end();