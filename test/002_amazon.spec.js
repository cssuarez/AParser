/* global describe: false, it: false, done: false, require: false */
'use strict';

var chai = require('chai');
var expect = chai.expect;

var path = require('path');
var _ = require('underscore');

var MarketplaceParser = require('../index.js');

describe('MarketPlaceParse', function() {

  var amazonParser = new MarketplaceParser('amazon.com');

  var _descProfileFn = function(profileId) {
    describe('Profile', function() {
      it('should get info for ' + profileId, function(done) {
        amazonParser.getProfile(profileId, false, function(err, profile) {
          if (err) {
            done(err);
            return;
          } else {
            expect(profile).to.have.property('id', profileId);
            expect(profile).to.have.property('name').to.be.a('string');
            expect(profile).to.have.property('about').to.be.a('string');
            expect(profile).to.have.property('interests').to.be.a('string');
            expect(profile).to.have.property('ranking');
            expect(profile).to.have.property('url');
            done();
          }
        });
      });

      it('should NOT parse reviews for ' + profileId + ' when getReviews is false', function(done) {
        amazonParser.getProfile(profileId, false, function(err, profile) {
          if (err) {
            done(err);
            return;
          } else {
            expect(profile).not.to.have.property('reviews');
            done();
          }
        });
      });

      it('SHOULD parse reviews for ' + profileId + ' when getReviews is true', function(done) {
        amazonParser.getProfile(profileId, true, function(err, profile) {
          if (err) {
            done(err);
            return;
          } else {
            expect(profile).to.have.property('reviews');
            done();
          }
        });
      });


      it('SHOULD parse reviews for ' + profileId + ' when passing a function instead of getReviews', function(done) {
        amazonParser.getProfile(profileId, function(err, profile) {
          if (err) {
            done(err);
            return;
          } else {
            expect(profile).to.have.property('reviews');
            done();
          }
        });
      });

    });
  };

  var _descStorefrontFn = function(profileId) {
    describe('StoreFront', function() {
      it('should get storefront for ' + profileId, function(done) {
        amazonParser.getStorefront(profileId, function(err, store) {
          if (err) {
            done(err);
            return;
          } else {
            expect(store).to.have.property('id', profileId);
            expect(store).to.have.property('url');
            expect(store).to.have.property('products').to.be.an('array');
            done();
          }
        });
      });
    });
  };

  var _descProductFn = function(productId) {
    describe('Product', function() {
      it('should get product for ' + productId, function(done) {
        amazonParser.getProduct(productId, function(err, product) {
          if (err) {
            done(err);
            return;
          } else {
            expect(product).to.have.property('id', productId);
            expect(product).to.have.property('ASIN', productId);
            expect(product).to.have.property('url');
            expect(product).to.have.property('title').to.be.a('string');
            expect(product).to.have.property('description').to.be.a('string');
            expect(product).to.have.property('images').to.be.an('array');
            expect(product).to.have.property('price').to.be.a('number');
            expect(product).to.have.property('category').to.be.a('string');
            done();
          }
        });
      });
    });
  };

  var _descProfileReviewsFn = function(profileId) {
    describe('Profile Reviews', function() {
      it('should get reviews for profile ' + profileId, function(done) {
        var page = 1;
        amazonParser.getProfileReviews(profileId, page, function(err, reviews) {
          if (err) {
            done(err);
            return;
          } else {
            _expectedProfileReviews(profileId, page, reviews);
            done();
          }
        });
      });
    });
  };

  var _descAllProfileReviewsFn = function(profileId) {
    describe('All Profile Reviews', function() {
      it('should get all reviews for profile ' + profileId, function(done) {
        amazonParser.getAllProfileReviews(profileId, function(err, reviews) {
          if (err) {
            done(err);
            return;
          } else {

            var totalReviews = _.reduce(reviews, function(memo, obj){ return memo + obj.count; }, 0);

            _.each(reviews, function(review) {
              _expectedProfileReviews(profileId, review.page, review);
              expect(review).to.have.property('totalReviews', totalReviews);
            });

            expect(reviews).to.have.length(reviews[0].pages);

            done();
          }
        });
      });
    });
  };


  var _expectedProfileReviews = function(profileId, page, reviews) {
    expect(reviews).to.have.property('profile', profileId);
    expect(reviews).to.have.property('page', page);
    expect(reviews).to.have.property('url');
    expect(reviews).to.have.property('totalReviews').to.be.a('number');
    expect(reviews).to.have.property('pages').to.be.a('number').to.be.above(0);
    expect(reviews).to.have.property('count').to.be.a('number');
    if (reviews.count) {
      expect(reviews).to.have.property('items').to.be.an('array').to.have.length.above(0);
    } else {
      expect(reviews).to.have.property('items').to.be.an('array');
      expect(reviews).to.have.property('items').to.have.length(0);
    }

    _.each(reviews.items, function(item) {
      expect(item).to.have.property('id');
      expect(item).to.have.property('rating').to.be.a('number').to.be.at.least(0).to.be.at.most(5);
      expect(item).to.have.property('summary').to.be.a('string');
      expect(item).to.have.property('description').to.be.a('string');
      expect(item).to.have.property('verified').to.be.a('boolean');
      expect(item).to.have.property('product').to.be.a('object');
    });
  };


  var _descReviewFn = function(reviewId) {
    describe('Reviews', function() {
      it('should get review ' + reviewId, function(done) {
        amazonParser.getReview(reviewId, function(err, review) {
          if (err) {
            done(err);
            return;
          } else {
            expect(review).to.have.property('id', reviewId);
            expect(review).to.have.property('url');
            expect(review).to.have.property('rating').to.be.a('string').to.be.at.least(0).to.be.at.most(5);
            expect(review).to.have.property('summary').to.be.a('string');
            expect(review).to.have.property('description').to.be.a('string');
            expect(review).to.have.property('verified').to.be.a('boolean');
            expect(review).to.have.property('product').to.be.a('object');
            expect(review).to.have.property('reviewer').to.be.a('object');
            done();
          }
        });
      });
    });
  };

  describe('StoreFront validation', function() {
    it('should fail for missing ids/urls', function(done) {
      amazonParser.storefront.validate(undefined, function(err, store) {
        expect(err).to.exist;
        done();
      });
    });

    it('should fail for invalid ids/urls', function(done) {
      amazonParser.storefront.validate('some-invalid-id', function(err, store) {
        expect(err).to.exist;
        done();
      });
    });

    it('should download info from a merchant id', function(done) {
      var id = 'A32DGYOAL6LMZV';

      amazonParser.storefront.validate(id, function(err, store) {
        expect(err).to.be.null;
        expect(store).to.exist;
        expect(store).to.have.property('me', id);
        expect(store).to.have.property('merchant', id);
        expect(store).to.have.property('marketplaceid', 'ATVPDKIKX0DER');
        done(err);
      });
    });


    it('should download info from an url without params, like http://www.amazon.com/shops/schwartz', function(done) {
      var url = 'http://www.amazon.com/shops/schwartz';

      amazonParser.storefront.validate(url, function(err, store) {
        expect(err).to.be.null;
        expect(store).to.exist;
        expect(store).to.have.property('me', 'A32DGYOAL6LMZV');
        expect(store).to.have.property('merchant', 'A32DGYOAL6LMZV');
        expect(store).to.have.property('marketplaceid', 'ATVPDKIKX0DER');
        done(err);
      });
    });

  });

  var _descStoreFrontUrlFn = function(info) {
    describe('StoreFront url validation', function() {
      it('should download info from an url with params: ' + info.url, function(done) {
        var url = 'http://www.amazon.com/s?marketplaceID=ATVPDKIKX0DER&me=A32DGYOAL6LMZV&merchant=A32DGYOAL6LMZV&redirect=true';
        var url = 'http://www.amazon.com/gp/aag/details/ref=aag_m_ss?ie=UTF8&asin=&isAmazonFulfilled=1&isCBA=&marketplaceID=ATVPDKIKX0DER&seller=A32DGYOAL6LMZV#aag_legalInfo';

        amazonParser.storefront.validate(info.url, function(err, store) {
          expect(err).to.be.null;
          expect(store).to.exist;
          expect(store).to.have.property('marketplaceid', info.marketplaceid);
          expect(store).to.have.any.keys('seller', 'merchant');

          if (store.merchant) {
            expect(store).to.have.property('merchant', info.merchant);
          }

          if (store.seller) {
            expect(store).to.have.property('seller', info.seller);
          }

          done(err);
        });
      });

    });
  };
  var profileIds  = [ 'A3M86MJ0HLAN5', 'A32DGYOAL6LMZV', 'A1HLDSUXZ3ZCNZ', 'A1M74T97U3FXCU' ];
  var merchantIds = [ 'A3M86MJ0HLAN5', 'A32DGYOAL6LMZV' ];
  var productIds  = [ 'B00S1TICIE', 'B00SXWRNB6', 'B00S1RX3JE', 'B00RY3OHPU', 'B00S47ZJDO', 'B00SGF5N1M', 'B00VIA4HCS' ];
  var reviewIds = [ 'R1ISJ0PB9HYXO6', 'R2P86YI5RNRE2A', 'R125MIYGUSTXEM', 'R6H3541QRHHGZ' ];

  var storeFrontInfos = [
    {
      url: 'http://www.amazon.com/gp/aag/main?ie=UTF8&asin=&isAmazonFulfilled=1&isCBA=&marketplaceID=ATVPDKIKX0DER&orderID=&protocol=current&seller=A32DGYOAL6LMZV&sshmPath=',
      marketplaceid: 'ATVPDKIKX0DER',
      merchant: 'A32DGYOAL6LMZV',
      seller: 'A32DGYOAL6LMZV',
    },
    {
      url: 'http://www.amazon.com/gp/aag/details/ref=aag_m_ss?ie=UTF8&asin=&isAmazonFulfilled=1&isCBA=&marketplaceID=ATVPDKIKX0DER&seller=A32DGYOAL6LMZV#aag_legalInfo',
      marketplaceid: 'ATVPDKIKX0DER',
      merchant: 'A32DGYOAL6LMZV',
      seller: 'A32DGYOAL6LMZV',
    },
    {
      url: 'http://www.amazon.com/s?marketplaceID=ATVPDKIKX0DER&me=A32DGYOAL6LMZV&merchant=A32DGYOAL6LMZV&redirect=true',
      marketplaceid: 'ATVPDKIKX0DER',
      merchant: 'A32DGYOAL6LMZV',
      seller: 'A32DGYOAL6LMZV',
    },
  ];

  _.each(profileIds, _descProfileFn);
  _.each(merchantIds, _descStorefrontFn);
  _.each(productIds, _descProductFn);
  _.each(reviewIds, _descReviewFn);

  _.each(storeFrontInfos, _descStoreFrontUrlFn);

  //XXX Maybe we need to do a test for 0 review and another for more than 0 (parse might return error or something)
  _.each(profileIds, _descProfileReviewsFn);
  _.each(profileIds,  _descAllProfileReviewsFn);
});

