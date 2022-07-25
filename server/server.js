import express from 'express'
import {Client} from "@elastic/elasticsearch";
import fs from 'fs';
import cors from 'cors';
// import * as https from "https";

const app = express();
const PORT = 5000;
const router = express.Router();


app.use(cors());

const client = new Client({
    node: 'https://localhost:9200',
    auth: {
        username: 'elastic',
        password: 'elastic'
    },
    tls: {
        ca: fs.readFileSync('./certs/http_ca.crt'),
        rejectUnauthorized: true
    },
    requestTimeout: 600000
})

//https server
// https.createServer({
//     key: fs.readFileSync('./certs/client-key.pem'),
//     cert: fs.readFileSync('./certs/client-cert.pem')
// }, app).listen(PORT, () => {
//     console.log('Your node.js server is running on PORT: ', PORT);
// })

app.listen(PORT, () => {
    console.log('Your node.js server is running on PORT: ', PORT);
})

// Vse poti imajo spredaj /api
app.use('/api', router);

export {app, client, router}

import('./searchController.js');
import('./dataController.js');
import('./dataHelperController.js');