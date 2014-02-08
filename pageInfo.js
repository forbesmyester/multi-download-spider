(function (root, factory) { // UMD from https://github.com/umdjs/umd/blob/master/returnExports.js
	"use strict";
	module.exports = factory(require('mout/array/map'), require('mout/array/filter'));
})(this, function (arrayMap, arrayFilter) {
	
// Author: Matthew Forrester <test_at_keyboardwritescode.com>
// Copyright: Matthew Forrester
// License: MIT/BSD-style

"use strict";

/**
 * Prepares a jQuery like DOM query from an assetmap (see pageInfo function).
 */
var _buildDOMQuery = function(staticAssetMap) {
	var r = [];
	for (var k in staticAssetMap) {
		if (staticAssetMap.hasOwnProperty(k)) {
			r.push(k + '[' + staticAssetMap[k] + ']');
		}
	}
	return r.join(', ');
};

/**
 * remove starting a trailing forward slashes.
 */
var _normalizePath = function(path) {
	return path.replace(/^\/+/,'').replace(/\/+$/,'');
};

/**
 * Splits a local url (after the http://) into a directory part and a file part.
 */
var _getPath = function(localUrl) {
	
	var fle = _normalizePath(localUrl).replace(/.*\//,'');
	return localUrl.substring(0, localUrl.length - fle.length).replace(/\/$/,'');
};

/**
 * Extra a domain from a full url eg: "http://domain.com/a/b.html" would return
 * "domain.com".
 */
var _extractUrlDomain = function(url) {
	return url.replace(/^https?\:\/\//, '').replace(/\/.*/, '');
};

/**
 * Converts a `url` found at `domain` within a page located in path `path` to a
 * path from the site root.
 *
 * Note: null return means the url is not valid or cross domain/protocol.
 */
var _linkToAbsolute = function(protocol, domain, path, url) {
	var normalizedPath = _normalizePath(path);
	
	if (url.substring(0, 2) == '//') {
		url = 'http:' + url;
	}
	
	if (url.substring(0, 1) == '#') { return null; }
	
	url = url.replace(/#.*/,'');
	
	if (url.match(/^https?\:/)) {
		if (url.replace(/\:.*/,'') != protocol) {
			return null;
		}
		if (_extractUrlDomain(url) != domain) { return null; }
		return url.replace(/^https?\:\/\/[^\/]+\//, '');
	}
	
	if (url.match(/^[a-z]+\:/)) { return null; }
	
	if (url.substring(0, 1) != '/') {
		return normalizedPath +
			(normalizedPath.length ? '/' : '') + 
			_normalizePath(url);
	}
	
	return _normalizePath(url);
};

/**
 * Given a tagAttribMap it will extract the first data from an attribute, note
 * this function assumes it __does__ exist.
 */
var _extractTagAttrib = function(tagAttribMap, tag) {
	return tag.attribs[tagAttribMap[tag.name]];
};


/**
 * Extracts links and assets from a page.
 *
 * Note functions are at the beginning as it is anticipated these are 
 * configuration options and should be taken away using Function.bind()
 * 
 * ### Params:
 *  * cheerio: see https://github.com/MatthewMueller/cheerio
 *  * protocol: http or https
 *  * domain: fqdn without protocol etc, example domain.com.
 *  * path: without domain, all urls are relative to this, for example if scanning http://domain.com/path/abc.html this would be "path".
 *  * staticAssetTagAttribMap: Key value pairs, for example {a: 'href', img: 'src'}..
 *  * linkTagAttribMap: Similar to staticAssetTagAttribMap but for links, for example { a: 'href' }.
 *  * html: A big string of html
 */
var pageInfo = function(cheerio, staticAssetTagAttribMap, linkTagAttribMap, protocol, domain, localUrl, html) {
	var $ = cheerio.load(html),
		path = _getPath(localUrl);
	
	var process = function(tagAttribMap) {
		
		var mapper = function(tag) {
			return _linkToAbsolute(
				protocol,
				domain,
				path,
				_extractTagAttrib(tagAttribMap, tag)
			);
		};
		
		var filterer = function(url) {
			
			if (url === null) { return false; }
			return true;
		};
		
		return arrayFilter(
			arrayMap(
				$(_buildDOMQuery(tagAttribMap)),
				mapper
			),
			filterer
		);
	};
	
	var notQueryString = function(url) {
		if (url.indexOf('?') > -1) { return false; }
		return true;
	};
	
	return {
		assets: process(staticAssetTagAttribMap),
		links: arrayFilter(process(linkTagAttribMap), notQueryString)
	};
};

pageInfo._buildDOMQuery = _buildDOMQuery;
pageInfo._linkToAbsolute = _linkToAbsolute;
pageInfo._extractUrlDomain = _extractUrlDomain;
pageInfo._normalizePath = _normalizePath;
pageInfo._extractTagAttrib = _extractTagAttrib;
pageInfo._getPath = _getPath;

return pageInfo;

});
