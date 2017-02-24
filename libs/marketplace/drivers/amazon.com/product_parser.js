(function() {
  var AmazonComProductParser, async, cheerio, helper;

  async = require('async');

  cheerio = require('cheerio');

  helper = require('./helpers/parser_helper');

  AmazonComProductParser = (function() {
    function AmazonComProductParser() {
      this.baseUrl = 'http://www.amazon.com';
      this.product = {};
    }

    AmazonComProductParser.prototype.download = function(id, callback) {
      this.id = id;
      this.product.id = this.id;
      this.product.url = helper.buildProductUrl(this.id);
      return helper.downloadPage(this.product.url, (function(_this) {
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

    AmazonComProductParser.prototype.load = function(html, callback) {
      this.cheerio = cheerio.load(html, {decodeEntities: true});
      if (!this.product.id || !this.product.url) {
        this.parseIdUrl();
      }
      return callback();
    };

    AmazonComProductParser.prototype.getTextFromSelectors = function(selectors, cheerio) {
      var cheerio = cheerio || this.cheerio;
      return helper.getTextFromSelectors(selectors, cheerio);
    };

    AmazonComProductParser.prototype.getElementsFromSelectors = function(selectors, cheerio) {
      var cheerio = cheerio || this.cheerio;
      return helper.getElementsFromSelectors(selectors, cheerio);
    };

    AmazonComProductParser.prototype.parse = function(callback) {
      this.product.title = this.parseProductTitle();
      this.product.images = this.parsePhotos();
      this.product.description = this.parseDescription();
      this.product.price = this.parsePrice();
      this.product.category = this.parseCategory();
      this.product.ASIN = this.id;
      return callback();
    };

    AmazonComProductParser.prototype.parseProductTitle = function() {
      return this.getTextFromSelectors(['#btAsinTitle', '#productTitle']);
    };

    AmazonComProductParser.prototype.parsePhotos = function() {
      var imgs = this.getElementsFromSelectors(
      [
        '#thumbs-image img.border',
        'span.a-button-thumbnail img',
      ]);

      var photos = helper.extractProductsPhotos(imgs);

      if (photos) {
        return this.product.images = photos;
      }
    };

    AmazonComProductParser.prototype.parseDescription = function() {
      var selectors = [
        '#productDescription',
        '#productDescription .productDescriptionWrapper',
        '#rpdDescriptionColumn p',
        '#rich-product-description p',
        '#feature-bullets',
      ]

      var description = this.getTextFromSelectors(selectors);

      if (description) {
        return description;
      }

      var script;

      var self = this;
      self.cheerio('script').each(function(idx, el) {
        var text = self.cheerio(el).text();
        if (text.search('iframeContent') != -1) {
          script = text.match(/ +var iframeContent = "(.+)";/);
          if (script) {
            script = decodeURIComponent(script[1]);
          }
        }
      });

      if (script) {
        var script_cheerio = cheerio.load(script, {decodeEntities: true});
        description = this.getTextFromSelectors(selectors, script_cheerio);
      }

      return description || '';
    };

    AmazonComProductParser.prototype.parsePrice = function() {
      var price = this.getTextFromSelectors(
      [
        'span.price.bxgy-item-price',
        'span.a-color-price',
        '#actualPriceValue .priceLarge',
      ]);

      if(price) {
        return helper.removeCurrency(price);
      }
    };

    AmazonComProductParser.prototype.parseCategory = function() {
      var category = this.getTextFromSelectors(
      [
        '#wayfinding-breadcrumbs_feature_div .breadcrumb > a',
        '#wayfinding-breadcrumbs_feature_div .a-list-item > a:first-child',
      ]);

      if(category) {
        return category.trim();
      }
    };

    AmazonComProductParser.prototype.parseIdUrl = function() {
      return this.cheerio('tr > td:nth-child(1) > a').attr('name');
    };

    AmazonComProductParser.prototype.get = function(id, callback) {
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
          return callback(err, _this.product);
        };
      })(this));
    };

    return AmazonComProductParser;

  })();

  module.exports = AmazonComProductParser;

}).call(this);
