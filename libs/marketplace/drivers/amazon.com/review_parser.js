(function() {
  var AmazonComReviewParser, async, cheerio, helper;

  async = require('async');

  cheerio = require('cheerio');

  helper = require('./helpers/parser_helper');

  AmazonComReviewParser = (function() {
    function AmazonComReviewParser() {
      this.baseUrl = 'http://www.amazon.com';
      this.review = {};
    }

    AmazonComReviewParser.prototype.download = function(id, callback) {
      this.id = id;
      this.review.id = this.id;
      this.review.url = helper.buildReviewUrl(this.id);
      return helper.downloadPage(this.review.url, (function(_this) {
        return function(err, response) {
          if(err) {
            return callback(err);
          }

          if (response && response.statusCode === 200) {
            _this.response = response;
            return callback();
          } else {
            return callback('Download Failed with Status Code: ' + response.statusCode);
          }
        };
      })(this));
    };

    AmazonComReviewParser.prototype.load = function(html, callback) {
      this.cheerio = cheerio.load(html, {decodeEntities: true});
      if (!this.review.id) {
        this.review.id = this.parseId();
      }
      if (!this.review.url) {
        this.review.url = this.parseUrl();
      }
      return callback();
    };

    AmazonComReviewParser.prototype.parse = function(callback) {
      this.review.rating = this.parseRating();
      this.review.date = this.parseDate();
      this.review.summary = this.parseSummary();
      this.review.description = this.parseDescription();
      this.review.verified = this.parseVerifiedPurchase();
      this.review.reviewer = {};
      this.review.reviewer.url = this.parseReviewerUrl();
      this.review.reviewer.id = this.parseReviewerId();
      this.review.reviewer.name = this.parseReviewerName();
      this.review.reviewer.photo = this.parseReviewerPhoto();
      this.review.product = {};
      this.review.product.id = this.parseProductId();
      this.review.product.url = this.parseProductUrl();
      this.review.product.title = this.parseProductTitle();
      this.review.product.brand = this.parseProductBrand();
      this.review.product.category = this.parseProductCategory();
      this.review.product.thumbnail = this.parseProductThumbnail();
      this.review.product.photo = this.parseProductPhoto();
      this.parseVideo();
      this.parsePhotos();
      this.parseHelpfulness();
      return callback();
    };

    AmazonComReviewParser.prototype.parseId = function() {
      return this.cheerio('tr > td:nth-child(1) > a').attr('name');
    };

    AmazonComReviewParser.prototype.parseUrl = function() {
      return this.cheerio('.hReview').find('.best').text();
    };

    AmazonComReviewParser.prototype.parseRating = function() {
      return this.cheerio('.hReview').find('.rating').find('.value').attr('title');
    };

    AmazonComReviewParser.prototype.parseDate = function() {
      return this.cheerio('.hReview').find('.dtreviewed').attr('title');
    };

    AmazonComReviewParser.prototype.parseSummary = function() {
      return this.cheerio('.hReview').find('.summary').html().trim();
    };

    AmazonComReviewParser.prototype.parseDescription = function() {
      return helper.removeVideoLink(this.cheerio('.hReview').find('.description').html().trim());
    };

    AmazonComReviewParser.prototype.parseVerifiedPurchase = function() {
      return this.cheerio('span.crVerifiedStripe > b').text() === 'Verified Purchase';
    };

    AmazonComReviewParser.prototype.parseReviewerId = function() {
      return helper.extractFromString(this.review.reviewer.url, '/', 6);
    };

    AmazonComReviewParser.prototype.parseReviewerUrl = function() {
      return helper.removeRef(this.baseUrl + this.cheerio('.hReview').find('.vcard').find('a').attr('href'));
    };

    AmazonComReviewParser.prototype.parseReviewerName = function() {
      return this.cheerio('.hReview').find('.vcard').find('a').html();
    };

    AmazonComReviewParser.prototype.parseReviewerPhoto = function() {
      return this.cheerio('#rdpReviewerInfo .crPicture img').attr('src');
    };

    AmazonComReviewParser.prototype.parseProductId = function() {
      return this.cheerio('.hReview').find('.asin').text();
    };

    AmazonComReviewParser.prototype.parseProductUrl = function() {
      return helper.removeRef(this.baseUrl + '/dp/' + this.review.product.id);
    };

    AmazonComReviewParser.prototype.parseProductTitle = function() {
      return this.cheerio('.hReview').find('.title').html();
    };

    AmazonComReviewParser.prototype.parseProductBrand = function() {
      return this.cheerio('.hReview').find('.brand').html();
    };

    AmazonComReviewParser.prototype.parseProductCategory = function() {
      return this.cheerio('.hReview').find('.category').text();
    };

    AmazonComReviewParser.prototype.parseProductThumbnail = function() {
      return this.cheerio('.crPicture').find('img').attr('src');
    };

    AmazonComReviewParser.prototype.parseProductPhoto = function() {
      return helper.convertToPhoto(this.review.product.thumbnail);
    };

    AmazonComReviewParser.prototype.parseVideo = function() {
      var videoLength, videoUrl;
      videoUrl = helper.extractVideoUrl(this.cheerio('.reviewText').html());
      videoLength = helper.extractVideoLength(this.cheerio('.reviewText').find('.tiny').text());
      if (videoUrl && videoLength) {
        return this.review.video = {
          'url': videoUrl,
          'length': videoLength
        };
      }
    };

    AmazonComReviewParser.prototype.parsePhotos = function() {
      var photos;
      photos = helper.extractPhotos(this.cheerio('img.review-image-thumbnail'));
      if (photos) {
        return this.review.photos = photos;
      }
    };

    AmazonComReviewParser.prototype.parseHelpfulness = function() {
      var helpfulness, votes;
      helpfulness = this.cheerio('tr > td:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1)').text().trim();
      votes = helper.extractVotes(helpfulness);
      if (votes) {
        return this.review.helpfulness = votes;
      }
    };

    AmazonComReviewParser.prototype.get = function(id, callback) {
      this.id = id;
      return async.series([
        (function(_this) {
          return function(done) {
            return _this.download(_this.id, done);
          };
        })(this), (function(_this) {
          return function(done) {
            return _this.load(_this.response.body, done);
          };
        })(this), (function(_this) {
          return function(done) {
            return _this.parse(done);
          };
        })(this)
      ], (function(_this) {
        return function(err) {
          return callback(err, _this.review);
        };
      })(this));
    };

    return AmazonComReviewParser;

  })();

  module.exports = new AmazonComReviewParser;

}).call(this);
