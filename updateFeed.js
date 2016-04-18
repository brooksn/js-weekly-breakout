#!/usr/bin/env node
'use strict';
require('dotenv').config({silent: true});
var fs = require('fs');
var fetch = require('node-fetch')
var RSS = require('rss');
var cheerio = require('cheerio');

const bucket = process.env.S3_BUCKET;
const awsid = process.env.AWS_ID;
const awskey = process.env.AWS_KEY;
const feedurl = process.env.FEEDURL;
var useS3 = false;
if (bucket && awsid && awskey && feedurl) {
  useS3 = true;
  var aws = require('aws-s3-promisified')({
      accessKeyId: awsid,
      secretAccessKey: awskey
  });
}

var feed = new RSS({
  title: 'JavaScript Weekly',
  feed_url: feedurl,
  site_url: 'http://javascriptweekly.com/'
});

var latesturl = 'http://javascriptweekly.com/latest';

var articles = [];
var jobs = [];
var inBrief = [];

const jqSelector = 'html > body > div.containerweb > main > div.issue-html > table > tbody > tr > td > table:nth-of-type(2) > tbody > tr:nth-of-type(2) > td > table.gowide > tbody > tr > td'
const mainSelector = 'div.issue-html > table > tr > td > table:nth-of-type(2) > tr:nth-of-type(2) > td > table.gowide > tr > td';
const jobsSelector = 'div.issue-html > table > tr > td > table:nth-of-type(2) > tr:nth-of-type(2) > td > ul:nth-of-type(1) > li';
const briefSelector = 'div.issue-html > table > tr > td > table:nth-of-type(2) > tr:nth-of-type(2) > td > ul:nth-of-type(2) > li';

module.exports = function(){
  var p = new Promise(function(resolve, reject){
    fetch(latesturl).then(function(res){
      return res.text()
    }).then(function(text){
      var $ = cheerio.load(text);
      
      $(mainSelector).each(function(index, td){
        let title = $('div',td).eq(0).text();
        let href = $('a',td).eq(0).attr('href');
        let desc = $('div',td).eq(1).text();
        let pub = $('div',td).eq(2).text();
        let combo = title + href;
        let guid = combo.replace(/\W/gi, "");
        articles.push({title: title, href: href, description: desc, publisher: pub});
        feed.item({
          title: title,
          description: desc,
          url: href,
          guid: guid,
          author: pub
        });
      });
      
      $(jobsSelector).each(function(index, li){
        let title = $('a',li).eq(0).text();
        let href = $('a',li).eq(0).attr('href');
        let desc = $('span',li).first().text();
        let pub = $('span',li).last().text();
        let combo = title + href;
        let guid = combo.replace(/\W/gi, "");
        jobs.push({title: title, href: href, description: desc, publisher: pub});
        feed.item({
          title: title,
          description: desc,
          url: href,
          guid: guid,
          author: pub
        });
      });
      
      $(briefSelector).each(function(index, li){
        const spanCount = $('div',li).length;
        let title = $('a',li).eq(0).text();
        let href = $('a',li).eq(0).attr('href');
        let tag = $('span',li).first().text();
        let pub = $('span',li).last().text();
        if (spanCount > 2) {
          var desc = $('a',li).eq(1).text();
        }
        let combo = title + href;
        let guid = combo.replace(/\W/gi, "");
        inBrief.push({title: title, href: href, description: desc, publisher: pub, tag: tag});
        feed.item({
          title: title,
          description: desc,
          url: href,
          guid: guid,
          author: pub,
          categories: [ tag ]
        });
      });
      var xml = feed.xml();
      if (useS3 === true) {
        //fs.writeFileSync('feed.xml', xml);
        fs.writeFileSync(__dirname + '/feed.xml', xml);
        aws.putFile(bucket, 'jsweekly/feed.xml', __dirname + '/feed.xml');
      }
      resolve(xml);
    });
  });
  return p;
};
