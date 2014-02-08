(function (root, factory) { // UMD from https://github.com/umdjs/umd/blob/master/returnExports.js
	"use strict";
	module.exports = factory(require('async'), require('return_func_to_async_func'));
})(this, function (async) {
	
// Author: Matthew Forrester <test_at_keyboardwritescode.com>
// Copyright: Matthew Forrester
// License: MIT/BSD-style

"use strict";

/**
 * Constructor.
 * 
 * @param {Function} requester - A download function Signature: function(url, next)
 * @param {String} requester.protocol - "http" or "https"
 * @param {String} requester.host - a FQDN
 * @param {String} requester.internalLocation - The location of the document to get within that server
 * @param {Function} requester.next - Callback fired when downloading done Signature: function(err, protocol, host, internalLocation, body)
 * @param {} requester.next.err - null means no error
 * @param {String} requester.next.protocol - "http" or "https"
 * @param {String} requester.next.host - a FQDN
 * @param {String} requester.next.internalLocation - The location of the document to get within that server
 * @param {null|Object} requester.next.body - The result of the download
 * @param {Function} pageInfoExtractor - Signature: function(domain, path, staticAssetTagAttribMap, linkTagAttribMap, html)
 * @param {Object} pageInfoExtractor.protocol - http or https
 * @param {String} pageInfoExtractor.domain - fqdn without protocol etc, example domain.com.
 * @param {String} pageInfoExtractor.path - without domain, all urls are relative to this, for example if scanning http://domain.com/path/abc.html this would be "path".
 * @param {String} pageInfoExtractor.html - A big string of html
 * @param {Integer} simultaneous - How many connections to process at once (must be above 0)
 * @param {String} protocol - 'http' or 'https'
 * @param {String} domain - The host and domain of an url such as "www.domain.com"
 */
var SiteSpider = function(requester, pageInfoExtractor, simultaneous, protocol, domain) {
	this._protocol = protocol;
	this._domain = domain;
	this._results = {};
	this._requester = requester;
	this._pageInfoExtractor = pageInfoExtractor.bind(this, protocol, domain);
	this._simultaneous = simultaneous;
};

/**
 * Lists all pages which have been spidered
 */
SiteSpider.prototype.listPages = function() {
	var r = [];
	for (var k in this._results) {
		if (this._results.hasOwnProperty(k)) {
			r.push(k);
		}
	}
	r.sort();
	return r;
};

/**
 * Lists the assets on a page, or null if the page is not known
 */
SiteSpider.prototype.getAssets = function(page) {
	if (!this._results.hasOwnProperty(page)) { return null; }
	return this._results[page].assets;
};

/**
 * Lists the links on a page, or null if the page is not known
 */
SiteSpider.prototype.getLinks = function(page) {
	if (!this._results.hasOwnProperty(page)) { return null; }
	return this._results[page].links;
};

/**
 * Dumps the JSON structure of what has been spidered so far
 */
SiteSpider.prototype.getSiteMap = function() {
	var r = {},
		pages = this.listPages(),
		i, l;
	
	for (i=0, l=pages.length; i<l; i++) {
		r[pages[i]] = this._results[pages[i]];
	}
	return r;
};

/**
 * Start spidering, calls callback "done" when complete.
 */
SiteSpider.prototype.run = function(page, done) {
	
	/**
	 * When the page is fully parsed we will add the results to this._results 
	 * and queue up any links from that page.
	 */
	var _jobComplete = function(intServerLocation, info, done) {
		if (info === false) { // skip if already processing elsewhere
			return done(null);
		}
		this._results[intServerLocation] = info;
		for (var i=0, l=info.links.length; i<l; i++) {
			if (!this._results.hasOwnProperty(info.links[i])) {
				queue.push(info.links[i]);
			}
		}
		done(null);
	}.bind(this);
	
	/**
	 * Extracts information from the document and passes information on as a
	 * callback for waterfall.
	 */
	var _pageInfoExtractorWrapper = function(protocol, host, intServerLocation, document, done) {
		if (document === false) { // skip if already processing elsewhere
			return done(null, intServerLocation, false);
		}
		done(
			null,
			intServerLocation,
			this._pageInfoExtractor(intServerLocation, document)
		);
	}.bind(this);
	
	/**
	 * Combines the internal server location with other properties of this and
	 * passes them on as into a callback.
	 */
	var _feeder = function(intServerLocation, done) {
		done(
			null,
			this._protocol,
			this._domain,
			intServerLocation
		);
	}.bind(this);
	
	var _dontRequestThingsTwice = function(protocol, host, intServerLocation, done) {
		if (this._results.hasOwnProperty(intServerLocation)) {
			return done(null, protocol, host, intServerLocation, false);
		}
		this._results[intServerLocation] = null; // Block further requests.
		return this._requester(protocol, host, intServerLocation, done);
	}.bind(this);
	
	// Prepare for processing...
	var queue = async.queue(
		function(intServerLocation, done) {
			async.waterfall(
				[
					function(done) { done(null, intServerLocation); },
					_feeder,
					_dontRequestThingsTwice,
					_pageInfoExtractorWrapper,
					_jobComplete
				],
				function(err) {
					done(err);
				}
			);
		}.bind(this),
		this._simultaneous
	);
	
	// Attach our done callback to the queue (so when processed it gets called
	// and push the first item onto the queue to kick it all off...
	queue.push(page);
	queue.drain = function() {
		done(null);
	};
	
};

return SiteSpider;

});
