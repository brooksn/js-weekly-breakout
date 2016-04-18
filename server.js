'use strict';
require('dotenv').config({silent: true});
var updateFeed = require('./updateFeed.js');
const http = require('http');
const feedurl = process.env.FEEDURL;

const hostname = 'localhost';
const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  updateFeed().then(function(xml){
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/rss+xml');
    res.end(xml);
  })
  //res.end('Hello World\n');
})

server.listen(port, () => {
  console.log(`Server running at ${feedurl}:${port}`);
});
