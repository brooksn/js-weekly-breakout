'use strict';
require('dotenv').config({silent: true});
var updateFeed = require('./updateFeed.js');
const http = require('http');
const feedurl = process.env.FEEDURL;

const hostname = '127.0.0.1';
const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  updateFeed().then(function(xml){
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/rss+xml');
    res.end(xml);
  })
  //res.end('Hello World\n');
})

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
