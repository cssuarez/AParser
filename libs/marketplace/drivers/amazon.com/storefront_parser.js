(function() {
  var AmazonComStorefrontParser, async, cheerio, helper, _;

  async = require('async');

  cheerio = require('cheerio');

  helper = require('./helpers/parser_helper');

  _ = require('underscore');

  AmazonComStorefrontParser = (function() {
    function AmazonComStorefrontParser() {
      this.baseUrl = 'http://www.amazon.com';
      this.storefront = {};
    }

    AmazonComStorefrontParser.prototype.download = function(id, callback) {
      this.id = id;
      this.storefront.id = this.id;
      this.storefront.url = helper.buildStorefrontUrl(this.id);
      return helper.downloadPage(this.storefront.url, (function(_this) {
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

    AmazonComStorefrontParser.prototype.validate = function(url_or_id, callback) {
      var target = url_or_id && url_or_id.trim() || '';

      if (!target) {
        return callback('Missing id or url to validate');
      }

      if (!target.match(/^http(s)?:\/\/(www\.)?amazon/)) {
        var target = helper.buildStorefrontUrl(target);
      }

      helper.downloadPage(target, function(err, response, body) {
        if (err) {
          return callback(err.toString());
        }

        if (!response) {
          return callback('Can not get a response from Amazon. Try again later.');
        }

        if (response.statusCode == 404) {
          return callback('StoreFront not found.');
        }

        if (response.statusCode != 200) {
          return callback('Unkown error. Try again later.');
        }

        var store = {};
        var query = response.request.uri.query;
        var pairs = query.split('&');

        _.each(pairs, function(pair) {
          var kv = pair.split('=');
          var k = decodeURIComponent(kv[0]).toLowerCase();
          var v = decodeURIComponent(kv[1]);

          store[k] = v;
        });

        callback(null, store);
      });
    }

    AmazonComStorefrontParser.prototype.load = function(html, callback) {
      this.cheerio = cheerio.load(html, {decodeEntities: true});
      if (!this.storefront.id) {
        this.storefront.id = this.parseId();
      }
      if (!this.storefront.url) {
        this.storefront.url = this.parseUrl();
      }
      return callback();
    };

    AmazonComStorefrontParser.prototype.parse = function(callback) {
      this.storefront.products = this.parseProductsIds();
      return callback();
    };

    AmazonComStorefrontParser.prototype.pushAsins = function(elem, productIds){
      if (elem.attribs['data-asin']){
        productIds.push(elem.attribs['data-asin']);
      }
    };

    AmazonComStorefrontParser.prototype.parseProductsIds = function() {
      var productsIds = [];
      var self = this;
      this.cheerio('#atfResults').find(this.cheerio('.s-result-list')).children().each(function(i, elem) {
        self.pushAsins(elem, productsIds);
      });
      this.cheerio('#btfResults').find(this.cheerio('.s-result-list')).children().each(function(i, elem) {
        self.pushAsins(elem, productsIds);
      });
      return productsIds;
    };

    AmazonComStorefrontParser.prototype.get = function(id, callback) {
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
          return callback(err, _this.storefront);
        };
      })(this));
    };

    return AmazonComStorefrontParser;

  })();

  module.exports = new AmazonComStorefrontParser;

}).call(this);
