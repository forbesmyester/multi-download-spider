// Author: Matthew Forrester <matt_at_keyboardwritescode.com>
// Copyright: Matthew Forrester
// License: MIT/BSD-style

var pageInfo = require('../pageInfo.js'),
	expect = require('expect.js'),
	cheerio = require('cheerio');

(function() {

"use strict";

describe('pageInfo...',function() {
	
	it('can build a query', function() {
		
		expect(
			pageInfo._buildDOMQuery({a: 'href', img: 'src'})
		).to.equal('a[href], img[src]');
		
	});
	
	it('can normalize a path', function() {
		expect(pageInfo._normalizePath('/a/b/c/')).to.equal('a/b/c');
	});
	
	it('can normalize a path', function() {
		expect(pageInfo._normalizePath('/a/b/c/')).to.equal('a/b/c');
	});
	
	it('can extract a domain from a url', function() {
		expect(
			pageInfo._extractUrlDomain('http://bob.com/abc/def.html')
		).to.equal('bob.com');
	});
	
	it('can get a path from an internal location', function() {
		expect(pageInfo._getPath('a/b/c/')).to.equal('a/b/c');
		expect(pageInfo._getPath('a/b/c.html')).to.equal('a/b');
		expect(pageInfo._getPath('c.html')).to.equal('');
		expect(pageInfo._getPath('a/b/c')).to.equal('a/b');
	});
	
	it('can change links to absolute urls', function() {
		
		expect(
			pageInfo._linkToAbsolute('http', 'domain.com', '/a', 'abc.jpg#123')
		).to.equal('a/abc.jpg');
		expect(
			pageInfo._linkToAbsolute('http', 'domain.com', '/a', '#bob')
		).to.equal(null);
		expect(
			pageInfo._linkToAbsolute('http', 'domain.com', '/a/b/c', '/d.jpg')
		).to.equal('d.jpg');
		expect(
			pageInfo._linkToAbsolute('http', 'domain.com', '/a/b/c', 'http://domain.com/x/d.jpg')
		).to.equal('x/d.jpg');
		expect(
			pageInfo._linkToAbsolute('http', 'domain.com', '/a/b/c', 'http://different.com/x/d.jpg')
		).to.equal(null);
		expect(
			pageInfo._linkToAbsolute('http', 'domain.com', '', 'a.html')
		).to.equal('a.html');
		expect(
			pageInfo._linkToAbsolute('http', 'domain.com', '/a/b/c/', 'd.jpg')
		).to.equal('a/b/c/d.jpg');   
		expect(
			pageInfo._linkToAbsolute('http', 'domain.com', '/a/b/c///', 'd.jpg')
		).to.equal('a/b/c/d.jpg');   
		
	});
	
	it('can process one tag', function() {
		expect(
			pageInfo._extractTagAttrib(
				{a: 'href', img: 'src'},
				{ type: 'tag', name: 'img', attribs: { href: "b.html", src: 'a.jpg' } }
			)
		).to.equal('a.jpg');
	});
	
	it('can interrogate a simple document', function() {
		
		var document = "" +
			"<html>" +
			"<head>" +
			"  <title>Simple Test</title>" +
			'  <link href="/x.css" media="all" rel="stylesheet" type="text/css" />' +
			'  <script src="x.js" type="text/javascript"></script>' +
			"</head>" +
			"<body>" +
			"  <div class='main'>" +
			"    <input type='text' name='name' value='bob'/>" +
			'    <img src="http://otherdomain.com/bob.jpg"/>' +
			'    <img src="/jane.jpg" alt="Picture of Jane"/>' +
			'    <img src="freddy.jpg" alt="Picture of Freddy"/>' +
			'    <a href="#">Something Javascript</a>' +
			'    <a href="mailto:spider@bob.com">Mail Me!</a>' +
			"    <div><a href='news.php?id=23'>Should be skipped</a>" +
			"  </div>" +
			"  <div class='left'>" +
			"    <div><a href='profile.html'>Profile</a>" +
			'    <div><a href="http://domain.com/team.html">Team</a>' +
			'    <div><a href="https://domain.com/bank.html">Wont follow https</a>' +
			'    <div><a href="//domain.com/press.html">Team</a>' +
			"  </div>" +
			"  <script type='text/javascript'>alert('hi');</script>" +
			"</body></html>";
		
		expect(
			pageInfo(
				cheerio,
				{ img: 'src', script: 'src', link: 'href'},
				{ a: 'href'},
				'http',
				'domain.com',
				'page/x.html',
				document
			)
		).to.eql({
			assets: [
				'x.css',
				'page/x.js',
				'jane.jpg',
				'page/freddy.jpg'
			],
			links: ['page/profile.html', 'team.html', 'press.html']
		});
		
	});
	
});

}());
