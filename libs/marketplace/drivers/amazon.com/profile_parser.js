(function() {
  var AmazonComProfileParser, async, cheerio, helper;

  async = require('async');

  cheerio = require('cheerio');

  helper = require('./helpers/parser_helper');

  AmazonComProfileParser = (function() {
    function AmazonComProfileParser() {
      this.baseUrl = 'http://www.amazon.com';
      this.profile = {};
      this.getReviews = false;
    }

    AmazonComProfileParser.prototype.download = function(id, callback) {
      this.id = id;
      this.profile.id = this.id;
      this.profile.url = helper.buildProfileUrl(this.id);
      return helper.downloadPage(this.profile.url, (function(_this) {
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

    AmazonComProfileParser.prototype.load = function(html, callback) {
      this.cheerio = cheerio.load(html, {decodeEntities: true});
      if (!this.profile.id) {
        this.profile.id = this.parseId();
      }
      if (!this.profile.url) {
        this.profile.url = this.parseUrl();
      }
      return callback();
    };

    AmazonComProfileParser.prototype.getTextFromSelectors = function(selectors, cheerio) {
      var cheerio = cheerio || this.cheerio;
      return helper.getTextFromSelectors(selectors, cheerio);
    };

    AmazonComProfileParser.prototype.getElementsFromSelectors = function(selectors, cheerio) {
      var cheerio = cheerio || this.cheerio;
      return helper.getElementsFromSelectors(selectors, cheerio);
    };

    AmazonComProfileParser.prototype.parse = function(callback) {
      var about, elements, interests, caption;
      this.profileInfo = this.cheerio('.profile-info');
      this.profile.name = this.parseName();
      this.profile.email = this.parseEmail();
      this.profile.website = this.parseWebsite();
      this.profile.photo = this.parsePhoto();
      this.profile.totalReviews = this.parseTotalReviews();
      elements = this.profileInfo.find('span.a-size-small.a-color-secondary');
      if(elements.length > 0){
        this.profile.caption = this.parseCaption(elements);
        this.profile.votes = this.parseVotes(elements);
        this.profile.ranking = this.parseRanking(elements);
        if(this.profile.ranking){
          if (this.profile.ranking === 'Reviewer ranking') {
            this.profile.ranking = helper.extractProfileRanking(this.profileInfo.find('span.a-size-large.a-text-bold').html());
            this.profile.helpfulness = parseInt(this.profileInfo.find('div.a-row.customer-helpfulness > span.a-size-large.a-text-bold').html().replace(/%/, ''));
          } else {
            this.profile.ranking = helper.extractProfileRanking(this.profile.ranking);
            this.profile.helpfulness = parseInt(this.profileInfo.find('span.a-size-large.a-text-bold').html().replace(/%/, ''));
          }
        }        
      }
      this.profile.about = this.parseAbout().trim();
      this.profile.interests = this.parseInterests().trim();

      // if we called parse before with getReviews = true we may already have old reviews.
      delete this.profile.reviews;
      if (this.getReviews) {
        this.parseLatestsReviews();
      }

      return callback();
    };

    AmazonComProfileParser.prototype.parseRanking = function(elements) {
      var position = {
        3: 0,
        4: 1
      }
      if(position[elements.length]){
        return elements[position[elements.length]].children[0].data;
      }
      return '';
    };

    AmazonComProfileParser.prototype.parseInterests = function() {
      return this.profileInfo.parent().next().find('span.a-size-small').html() || '';
    };

    AmazonComProfileParser.prototype.parseAbout = function() {
      return this.profileInfo.find('span.activity-heading').next().text() || '';
    };

    AmazonComProfileParser.prototype.parseCaption = function(elements) {
      if(elements.length !== 3 && elements[0]){
        return elements[0].children[0].data.trim();
      }
      return '';
    };

    AmazonComProfileParser.prototype.parseVotes = function(elements) {
      var position = elements.length - 1;
      return helper.extractProfileVotes(elements[position].children[0].data);
    };

    AmazonComProfileParser.prototype.parseId = function() {
      return this.cheerio('tr > td:nth-child(1) > a').attr('name');
    };

    AmazonComProfileParser.prototype.parseUrl = function() {
      return this.cheerio('tr > td:nth-child(1) > a').attr('name');
    };

    AmazonComProfileParser.prototype.parseName = function() {
      return this.getTextFromSelectors([
        '.a-col-left .a-section',
        '.profile-info > .profile-display-name',
      ]);
    };

    AmazonComProfileParser.prototype.parseEmail = function() {
      return this.cheerio('.a-row.break-word').text().trim();
    };

    AmazonComProfileParser.prototype.parseWebsite = function() {
      return this.cheerio('.a-row.customer-website a').attr('href') || '';
    };

    AmazonComProfileParser.prototype.parsePhoto = function() {
      return this.cheerio('div.profile-image-holder > img').attr('src');
    };

    AmazonComProfileParser.prototype.parseTotalReviews = function() {
      return parseInt(helper.extractString(this.cheerio('.reviews-link').html(), 'Reviews (', ')') || 0);
    };

    AmazonComProfileParser.prototype.parseLatestsReviews = function() {
      var $, parsedReviews, reviews;
      $ = this.cheerio;
      reviews = $('div.a-box-inner');
      parsedReviews = [];
      reviews.each(function(index, el) {
        var ok, date, description, from, link, productId, productLink, rating, reviewId, summary;
        if (index !== 0) {
          productLink = $(this).find('.a-link-normal').attr('href');
          if (productLink) {
            productId = helper.extractString(productLink, '/products/', '?');
          }

          summary = $(this).find('img').attr('alt');

          description = $(this).find('.review-text p').html();
          if (description) {
            description = description.trim();
          }

          date = $(this).find('.a-color-tertiary').text();
          if (date) {
            date = date.trim();
          }

          link = $(this).find('.review-title').attr('href');
          if (link) {
            from = link.indexOf('#');
            reviewId = link.substring(from + 1);
          }

          rating = $(this).find('.a-icon')[0];
          if (rating) {
            rating = rating.attribs["class"].substring(40);
          }

          ok = description && date && link && rating;
          if (!ok) {
            return;
          }

          return parsedReviews.push({
            id: reviewId,
            product: productId,
            rating: rating,
            summary: summary,
            description: description,
            date: new Date(date)
          });
        }
      });
      return this.profile.reviews = parsedReviews;
    };

    AmazonComProfileParser.prototype.get = function(id, getReviews, callback) {
      this.id = id;

      if (typeof getReviews === 'function') {
        callback = getReviews;
        this.getReviews = true;
      } else {
        this.getReviews = getReviews;
      }

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
          return callback(err, _this.profile);
        };
      })(this));
    };

    return AmazonComProfileParser;

  })();

  module.exports = new AmazonComProfileParser;

}).call(this);
