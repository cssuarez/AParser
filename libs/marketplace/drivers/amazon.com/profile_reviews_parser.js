(function() {
  var AmazonComProfileReviewsParser, async, cheerio, helper, _;

  async = require('async');

  cheerio = require('cheerio');

  helper = require('./helpers/parser_helper');

  _ = require('underscore');

  AmazonComProfileReviewsParser = (function() {
    function AmazonComProfileReviewsParser() {
      this.baseUrl = 'http://www.amazon.com';
      this.reviews = {};
    }

    AmazonComProfileReviewsParser.prototype.download = function(id, page, callback) {
      this.id = id;
      this.page = page;
      if (typeof this.page === 'function') {
        callback = this.page;
        this.page = 1;
      }
      this.reviews.profile = this.id;
      this.reviews.page = this.page;
      this.reviews.url = helper.buildReviewsUrl(this.id, this.page);
      return helper.downloadPage(this.reviews.url, (function(_this) {
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

    AmazonComProfileReviewsParser.prototype.load = function(html, callback) {
      this.cheerio = cheerio.load(html, {decodeEntities: true});
      return callback();
    };

    AmazonComProfileReviewsParser.prototype.parse = function(callback) {
      var $, items, reviews;
      $ = this.cheerio;
      this.reviews.totalReviews = parseInt(helper.extractString($('.h3color').parent().html().trim(), ': '));
      reviews = $('.reviewText');
      items = [];
      var self = this;
      reviews.each(function(index, el) {

        var date, description, fullReview, photos, product, productBrand, productId, productPhoto, productThumbnail, productTitle, rating, review, reviewId, summary, verified, video, videoLength, videoUrl;

        self.fullReview = $(this).parent().parent();

        reviewId = self.parseReviewId();
        summary = self.parseSummary();
        description = self.parseDescription($(this).html());
        date = self.parseDate();
        rating = self.parseRating();
        verified = self.parseVerified();
        productId = self.parseProductId();
        photos = self.parsePhotos();
        productTitle = self.parseProductTitle();
        productBrand = self.parseProductBrand();
        productThumbnail = self.parseProductThumbnail();
        productPhoto = self.parseProductPhoto(productThumbnail);
        videoUrl = self.parseVideoUrl();
        videoLength = self.parseVideoLength();

        if (videoUrl && videoLength) {
          video = {
            'url': videoUrl,
            'length': videoLength
          };
        }
        product = {
          id: productId,
          title: productTitle,
          photo: productPhoto,
          thumbnail: productThumbnail
        };
        if (productBrand) {
          product.brand = productBrand;
        }
        review = {
          id: reviewId,
          rating: rating,
          summary: summary,
          description: description.trim(),
          date: date,
          verified: verified,
          product: product
        };
        if (photos) {
          review.photos = photos;
        }
        if (video) {
          review.video = video;
        }
        return items.push(review);
      });
      this.reviews.count = items.length;

      if (this.reviews.count) {
        this.reviews.pages = Math.ceil(this.reviews.totalReviews / this.reviews.count);
      } else {
        this.reviews.pages = 1;
      }

      this.reviews.items = items;
      return callback();
    };

    AmazonComProfileReviewsParser.prototype.parseId = function() {
      return this.cheerio('tr > td:nth-child(1) > a').attr('name');
    };

    AmazonComProfileReviewsParser.prototype.parsePage = function() {
      return this.cheerio('tr > td:nth-child(1) > a').attr('name');
    };

    AmazonComProfileReviewsParser.prototype.parseUrl = function() {
      return this.cheerio('.hReview').find('.best').text();
    };

    AmazonComProfileReviewsParser.prototype.parseReviewId = function() {
      return this.fullReview.find('a').attr('name');
    };

    AmazonComProfileReviewsParser.prototype.parseDescription = function(html) {
      var description = helper.removeUpTo(html, '<br><br></span>');
      if(description) {
        description = description.trim();
      }
      return description;
    };

    AmazonComProfileReviewsParser.prototype.parseSummary = function() {
      summary = this.fullReview.find('b').html();
      if(summary) {
        summary = summary.trim();
      }
      return summary;
    };

    AmazonComProfileReviewsParser.prototype.parseDate = function() {
      return new Date(this.fullReview.find('nobr').text());
    };

    AmazonComProfileReviewsParser.prototype.parseRating = function() {
      return parseInt(this.fullReview.find('span img').attr('title').substring(0, 1));
    };

    AmazonComProfileReviewsParser.prototype.parseVerified = function() {
      return this.fullReview.html().indexOf('Verified Purchase') !== -1;
    };

    AmazonComProfileReviewsParser.prototype.parseProductId = function() {
      return helper.extractString(this.fullReview.html(), ';ASIN=', '#wasThisHelpful');
    };

    AmazonComProfileReviewsParser.prototype.parsePhotos = function() {
      return helper.extractPhotos(this.fullReview.find('img.review-image-thumbnail'));
    };

    AmazonComProfileReviewsParser.prototype.parseProductTitle = function() {
      return this.fullReview.parent().prev().find('img').attr('alt');
    };

    AmazonComProfileReviewsParser.prototype.parseProductBrand = function() {
      return helper.extractString(this.fullReview.parent().prev().html(), 'Offered by ', '</span>');
    };

    AmazonComProfileReviewsParser.prototype.parseProductThumbnail = function() {
      return this.fullReview.parent().prev().find('img').attr('src');
    };

    AmazonComProfileReviewsParser.prototype.parseProductPhoto = function(productThumbnail) {
      return helper.convertToPhoto(productThumbnail);
    };

    AmazonComProfileReviewsParser.prototype.parseVideoUrl = function() {
      return helper.extractVideoUrl(this.fullReview.html());
    };

    AmazonComProfileReviewsParser.prototype.parseVideoLength = function() {
      return helper.extractVideoLength(this.fullReview.find('.tiny').text());
    };

    AmazonComProfileReviewsParser.prototype.get = function(id, page, callback) {
      this.id = id;
      this.page = page;
      if (typeof this.page === 'function') {
        callback = this.page;
        this.page = 1;
      }
      return async.series([
        (function(_this) {
          return function(done) {
            return _this.download(_this.id, _this.page, done);
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
          return callback(err, _this.reviews);
        };
      })(this));
    };

    AmazonComProfileReviewsParser.prototype.getAll = function(id, callback) {
      var self = this;

      //Get first page to know how many page do i have to get
      this.get(id, 1, function(err, review) {
        if(err) {
          return callback(err, null);
        }

        var _review = _.clone(review);

        var times = _review.pages - 1;
        async.timesSeries(
          times,
          function(n, next) {
            var page = n + 2;
            self.get(id, page, function(err, result) {
              next(err, _.clone(result));
            });

          },
          function(err, results) {
            results.unshift(_review);
            return callback(err, results);
          }
        );
      });
    };

    return AmazonComProfileReviewsParser;

  })();

  module.exports = new AmazonComProfileReviewsParser;

}).call(this);
