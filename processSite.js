// Author: Matthew Forrester <test_at_keyboardwritescode.com>
// Copyright: Matthew Forrester
// License: MIT/BSD-style

(function() {

"use strict";

var pageInfo = require('./pageInfo'),
	SiteSpider = require('./SiteSpider'),
	cheerio = require('cheerio'),
	request = require('request'),
	arrayUnique = require('mout/array/unique');

var cmdlineArguments = (function() {
	/* global process: false */
	return process.argv.slice(2);
}());

var output = function(str) {
	/* global console: false */
	console.log(str);
};

if (!cmdlineArguments.length) {
	output("Basic output of site maps for domains");
	output("Limitations:");
	output("  Will not follow links with a ? inside them");
	output("  Will not follow external links");
	output("  Will not switch protocol (http to https for example)");
	output("  It is NOT FINISHED!");
	output("");
	return output("Usage node processSite.js CONNECTION_COUNT PROTOCOL DOMAIN [PAGE TO START ON]");
}

var errorList = [];

var siteSpider = new SiteSpider(
	function(protocol, host, internalLocation, next) {
		var url = protocol + '://' + host + '/' + internalLocation;
		output('Processing: ' + url);
		request(url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				return next(null, protocol, host, internalLocation, body);
			}
			errorList.push(url);
			return next(null, protocol, host, internalLocation, false);
		});
	},
	pageInfo.bind(
		this,
		cheerio,
		{ img: 'src', script: 'src', link: 'href'},
		{ a: 'href'}
	),
	parseInt(cmdlineArguments[0],10) > 0 ? parseInt(cmdlineArguments[0],10) : 1,
	cmdlineArguments[1],
	cmdlineArguments[2]
);

siteSpider.run(
	(cmdlineArguments.length < 4) ? '' : cmdlineArguments[3],
	function(err) {
		if (err) { output("ERROR: " + err); }
		output(JSON.stringify(
			siteSpider.getSiteMap(),
			null,
			4
		));
		output("");
		output("Errors encountered processing: " + JSON.stringify(arrayUnique(errorList)));
	}
);

}());
