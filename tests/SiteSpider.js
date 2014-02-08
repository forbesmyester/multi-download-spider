// Author: Matthew Forrester <matt_at_keyboardwritescode.com>
// Copyright: Matthew Forrester
// License: MIT/BSD-style

/* global setTimeout */
var pageInfo = require('../pageInfo.js'),
	SiteSpider = require('../SiteSpider.js'),
	expect = require('expect.js'),
	cheerio = require('cheerio');

(function() {

"use strict";

describe('siteSpider...',function() {
	
	it('can process a single page', function(done) {
		
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
			"  </div>" +
			"</body></html>";
		
		var siteSpider = new SiteSpider(
			function(protocol, host, internalLoc, next) {
				setTimeout(function() {
					next(null, protocol, host, internalLoc, document);
				}, 100);
			},
			pageInfo.bind(
				this,
				cheerio,
				{ img: 'src', script: 'src', link: 'href'},
				{ a: 'href'}
			),
			1,
			'http',
			'domain.com'
		);
		
		siteSpider.run('page/index.html', function(err) {
			expect(err).to.equal(null);
			expect(siteSpider.listPages()).to.eql(['page/index.html']);
			expect(siteSpider.getAssets('page/index.html')).to.eql(
				['x.css', 'page/x.js', 'jane.jpg', 'page/freddy.jpg']
			);
			done();
		});
		
	});
	
	var setupMultipageSiteSpider = function() {
		var documents = {
			'page/index': 
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
				"  </div>" +
				"  <div class='left'>" +
				"    <div><a href='profile.html'>Profile</a>" +
				'    <div><a href="http://domain.com/team.html">Team</a>' +
				"  </div>" +
				"  <script type='text/javascript'>alert('hi');</script>" +
				"</body></html>",
			'page/profile': '<img src="me.jpg"/>',
			'team': '<a href="page/index.html"><img src="logo.gif"></a>' // bad html, link back!
		};
		
		var siteSpider = new SiteSpider(
			function(protocol, host, intLoc, next) {
				setTimeout(function() {
					next(
						null,
						protocol,
						host,
						intLoc,
						documents[intLoc.replace(/\..*/,'')]
					);
				}, 100);
			},
			pageInfo.bind(
				this,
				cheerio,
				{ img: 'src', script: 'src', link: 'href'},
				{ a: 'href'}
			),
			1,
			'http',
			'domain.com'
		);
		
		return siteSpider;
	};
	
	it('can process a multiple pages', function(done) {
		
		var siteSpider = setupMultipageSiteSpider();
		
		siteSpider.run('page/index.html', function(err) {
			expect(err).to.equal(null);
			expect(siteSpider.listPages()).to.eql(
				['page/index.html', 'page/profile.html', 'team.html']
			);
			expect(siteSpider.getAssets('page/index.html')).to.eql(
				['x.css', 'page/x.js', 'jane.jpg', 'page/freddy.jpg']
			);
			expect(siteSpider.getLinks('page/index.html')).to.eql(
				['page/profile.html', 'team.html']
			);
			expect(siteSpider.getAssets('page/profile.html')).to.eql(
				['page/me.jpg']
			);
			expect(siteSpider.getLinks('page/profile.html')).to.eql([]);
			expect(siteSpider.getAssets('team.html')).to.eql(
				['logo.gif']
			);
			expect(siteSpider.getLinks('team.html')).to.eql(['page/index.html']);
			done();
		});
		
	});

	it('can output data for multi page', function(done) {
		
		var siteSpider = setupMultipageSiteSpider();
		
		siteSpider.run('page/index.html', function(err) {
			expect(err).to.equal(null);
			expect(siteSpider.getSiteMap()).to.eql(
				{
					'page/index.html': {
						assets: ['x.css', 'page/x.js', 'jane.jpg', 'page/freddy.jpg'],
						links: ['page/profile.html', 'team.html']
					},
					'page/profile.html': {
						assets: ['page/me.jpg'],
						links: []
					},
					'team.html': {
						assets: ['logo.gif'],
						links: ['page/index.html']
					}
				}
			);
			done();
		});
	});
});

}());
