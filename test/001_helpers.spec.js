/* global describe: false, it: false, done: false, require: false */
'use strict';

var cheerio = require('cheerio');
var chai = require('chai');
var expect = chai.expect;

var _ = require('underscore');

var AmazonComParserHelper = require('../libs/marketplace/drivers/amazon.com/helpers/parser_helper.js');

describe('Amazon.com Parser Helpers', function() {

  describe('getTextFromSelectors', function() {
    var elements = cheerio.load("<span class='class1'> Text1 </span> <div id='outer'> outer text <div id='inner'> inner text </div> </div>");

    it('should return undefined if there is no match', function(done) {
      expect( AmazonComParserHelper.getTextFromSelectors([], elements) ).to.equal(undefined);
      expect( AmazonComParserHelper.getTextFromSelectors(['.class-not-present'], elements) ).to.equal(undefined);

      done();
    });

    it('should return the first match', function(done) {
      expect( AmazonComParserHelper.getTextFromSelectors(['.class1', '#inner'], elements) ).to.equal('Text1');
      expect( AmazonComParserHelper.getTextFromSelectors(['#outer',  '#inner'], elements) ).to.equal('outer text  inner text');
      expect( AmazonComParserHelper.getTextFromSelectors(['#inner',  '#outer'], elements) ).to.equal('inner text');

      done();
    });

  });


  describe('extractFromString', function() {
    it('should return the requested match', function(done) {
      expect( AmazonComParserHelper.extractFromString('aa,bb,cc,dd', ',' , 2) ).to.equal('cc');
      expect( AmazonComParserHelper.extractFromString('aa,bb,cc,dd', ',' , 3) ).to.equal('dd');

      done();
    });

    it('should return an empty string if there is no match or pos is outside range', function(done) {
      expect( AmazonComParserHelper.extractFromString('aa,bb,cc,dd', 'X' , 2) ).to.equal('');
      expect( AmazonComParserHelper.extractFromString('aa,bb,cc,dd', ',' , 30) ).to.equal('');

      done();
    });

  });


  describe('removeRef', function() {
    it('should remove from "/ref=" onwards', function(done) {
      expect( AmazonComParserHelper.removeRef('someprefix/ref=this-will-not-be') ).to.equal('someprefix');

      done();
    });

    it('should return the same input if "/ref=" is not there', function(done) {
      expect( AmazonComParserHelper.removeRef('someprefix/something-else') ).to.equal('someprefix/something-else');

      done();
    });
  });


  describe('removeUpTo', function() {
    it('should return only from the matched pattern to the end of input', function(done) {
      expect( AmazonComParserHelper.removeUpTo('someprefix/this-will-not-be/but-this-will/and-this-too', 'this-will-not-be') ).to.equal('/but-this-will/and-this-too');

      done();
    });

    it('should return the same input if there is no match', function(done) {
      expect( AmazonComParserHelper.removeUpTo('someprefix/something-else', 'not-found') ).to.equal('someprefix/something-else');

      done();
    });
  });


  describe('extractString', function() {
    it('should return undefined without input', function(done) {
      expect( AmazonComParserHelper.extractString() ).to.equal(undefined);

      done();
    });

    it('should return undefined if there is no match', function(done) {
      expect( AmazonComParserHelper.extractString('something', 'not-there') ).to.equal(undefined);

      done();
    });

    it('should return from after the match up to the end', function(done) {
      expect( AmazonComParserHelper.extractString('something matches tail', 'matches') ).to.equal(' tail');
      expect( AmazonComParserHelper.extractString('something matches tail', 'thing', 'ta') ).to.equal(' matches ');

      done();
    });

  });


  describe('convertToPhoto', function() {
    it('should return the same input if there is no match', function(done) {
      expect( AmazonComParserHelper.convertToPhoto('aaaa.jpg') ).to.equal('aaaa.jpg');

      done();
    });

    it('should remove everything from ._ to the end', function(done) {
      expect( AmazonComParserHelper.convertToPhoto('aaaa._bb.jpg') ).to.equal('aaaa.jpg');

      done();
    });
  });

  describe('extractVideoUrl', function() {
    it('should return the urls if there is a match', function(done) {
      expect( AmazonComParserHelper.extractVideoUrl(',"streamingUrls":"aaa, bbb, ccc') ).to.equal('aaa, bbb, ccc');

      done();
    });
  });

  describe('extractVideoLength', function() {
    it('should return the length if there is a match', function(done) {
      expect( AmazonComParserHelper.extractVideoLength('Length:: 33 Mins') ).to.equal('33');

      done();
    });
  });

  describe('extractPhotos', function() {
    it('should return an empty array if there are no photos', function(done) {
      expect( AmazonComParserHelper.extractPhotos() ).to.be.an('array');
      expect( AmazonComParserHelper.extractPhotos() ).to.have.length(0);

      var elements = cheerio.load("<marquee> <blink> AAAA </blink> </marquee>")("img");
      var photos = AmazonComParserHelper.extractPhotos(elements);

      expect( AmazonComParserHelper.extractPhotos(elements) ).to.be.an('array');
      expect( AmazonComParserHelper.extractPhotos(elements) ).to.have.length(0);

      done();
    });

    it('should return thumbnails and photos', function(done) {
      var elements = cheerio.load("<img src='the-image-source' large-image-url='the-large-source' >")("img");
      var photos = AmazonComParserHelper.extractPhotos(elements);

      expect(photos).to.be.an('array');
      expect(photos).to.have.length(1);

      expect(photos[0]).to.have.property('photo', 'the-large-source');
      expect(photos[0]).to.have.property('thumbnail', 'the-image-source');

      done();
    });
  });

  describe('extractProductsPhotos', function() {
    it('should return an empty array if there are no photos', function(done) {
      expect( AmazonComParserHelper.extractProductsPhotos() ).to.be.an('array');
      expect( AmazonComParserHelper.extractProductsPhotos() ).to.have.length(0);

      var elements = cheerio.load("<marquee> <blink> AAAA </blink> </marquee>")("img");
      var photos = AmazonComParserHelper.extractPhotos(elements);

      expect( AmazonComParserHelper.extractProductsPhotos(elements) ).to.be.an('array');
      expect( AmazonComParserHelper.extractProductsPhotos(elements) ).to.have.length(0);

      done();
    });

    it('should return thumbnails and photos', function(done) {
      var elements = cheerio.load("<img src='img._SS30_.jpg'>")("img");
      var photos = AmazonComParserHelper.extractProductsPhotos(elements);

      expect(photos).to.be.an('array');
      expect(photos).to.have.length(1);

      expect(photos[0]).to.have.property('photo', 'img.jpg');
      expect(photos[0]).to.have.property('thumbnail', 'img._SS30_.jpg');

      done();
    });

    it('should return the same source if it does not match a known pattern', function(done) {
      var elements = cheerio.load("<img src='img_something.jpg'>")("img");
      var photos = AmazonComParserHelper.extractProductsPhotos(elements);

      expect(photos).to.be.an('array');
      expect(photos).to.have.length(1);

      expect(photos[0]).to.have.property('photo', 'img_something.jpg');
      expect(photos[0]).to.have.property('thumbnail', 'img_something.jpg');

      done();
    });
  });


  describe('extractVotes', function() {
    it('should return undefined if there is no matching content', function(done) {
      expect( AmazonComParserHelper.extractVotes() ).to.equal(undefined);
      expect( AmazonComParserHelper.extractVotes('some meaningful text') ).to.equal(undefined);

      done();
    });

    it('should return the number of positive votes', function(done) {
      var votes = AmazonComParserHelper.extractVotes('14 of 133 people found the following review helpful');

      expect(votes).to.have.property('total', 133);
      expect(votes).to.have.property('helpful', 14);

      done();
    });
  });


  describe('extractProfileVotes', function() {
    it('should return undefined if there is no matching content', function(done) {
      expect( AmazonComParserHelper.extractProfileVotes() ).to.equal(undefined);
      expect( AmazonComParserHelper.extractProfileVotes('some meaningful text') ).to.equal(undefined);

      done();
    });

    it('should return total and helpful votes', function(done) {
      var votes = AmazonComParserHelper.extractProfileVotes('(14 of 133)');

      expect(votes).to.have.property('total', 133);
      expect(votes).to.have.property('helpful', 14);

      done();
    });
  });


  describe('extractProfileRanking', function() {
    it('should return undefined if there is no matching content', function(done) {
      expect( AmazonComParserHelper.extractProfileRanking() ).to.equal(undefined);

      done();
    });

    it('should return the current ranking', function(done) {
      expect( AmazonComParserHelper.extractProfileRanking('#49,374') ).to.equal(49374);

      done();
    });
  });


  describe('buildProfileUrl', function() {
    it('should return http://www.amazon.com/gp/profile/ + provided_id', function(done) {
      expect( AmazonComParserHelper.buildProfileUrl(195936478) ).to.equal('http://www.amazon.com/gp/profile/195936478');
      expect( AmazonComParserHelper.buildProfileUrl('some-id') ).to.equal('http://www.amazon.com/gp/profile/some-id');

      done();
    });
  });

  describe('buildReviewUrl', function() {
    it('should return http://www.amazon.com/review/ + provided_id', function(done) {
      expect( AmazonComParserHelper.buildReviewUrl(195936478) ).to.equal('http://www.amazon.com/review/195936478');
      expect( AmazonComParserHelper.buildReviewUrl('some-id') ).to.equal('http://www.amazon.com/review/some-id');

      done();
    });
  });

  describe('buildReviewsUrl', function() {
    it('should return http://www.amazon.com/gp/cdp/member-reviews/ + id + ?ie=UTF8&display=public&page= + page + &sort_by=MostRecentReview', function(done) {
    'http://www.amazon.com/gp/cdp/member-reviews/ + id + ?ie=UTF8&display=public&page= + page + &sort_by=MostRecentReview'
      expect( AmazonComParserHelper.buildReviewsUrl(195936478, 13) ).to.equal('http://www.amazon.com/gp/cdp/member-reviews/195936478?ie=UTF8&display=public&page=13&sort_by=MostRecentReview');
      expect( AmazonComParserHelper.buildReviewsUrl('some-id', 13) ).to.equal('http://www.amazon.com/gp/cdp/member-reviews/some-id?ie=UTF8&display=public&page=13&sort_by=MostRecentReview');

      done();
    });
  });

  describe('buildProductUrl', function() {
    it('should return http://www.amazon.com/dp/ + provided_id', function(done) {
      expect( AmazonComParserHelper.buildProductUrl(195936478) ).to.equal('http://www.amazon.com/dp/195936478');
      expect( AmazonComParserHelper.buildProductUrl('some-id') ).to.equal('http://www.amazon.com/dp/some-id');

      done();
    });
  });


  describe('buildStorefrontUrl', function() {
    it('should return http://www.amazon.com/shops/ + provided_id', function(done) {
      expect( AmazonComParserHelper.buildStorefrontUrl(195936478) ).to.equal('http://www.amazon.com/shops/195936478');
      expect( AmazonComParserHelper.buildStorefrontUrl('some-id') ).to.equal('http://www.amazon.com/shops/some-id');

      done();
    });
  });


  describe('removeCurrency', function() {
    it('should return the same provided number', function(done) {
      expect( AmazonComParserHelper.removeCurrency('48879') ).to.equal(48879);
      expect( AmazonComParserHelper.removeCurrency('USD48879') ).to.equal(48879);
      expect( AmazonComParserHelper.removeCurrency(' USD 48879 ö') ).to.equal(48879);

      done();
    });
  });


});

