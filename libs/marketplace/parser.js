(function() {
  var MarketplaceParser, fs;

  fs = require('fs');

  MarketplaceParser = (function() {
    function MarketplaceParser(marketplaceId) {
      var err;
      this.marketplaceId = marketplaceId;

      function errCb(err) {
        console.log('Loading Marketplace Parser Driver Failed! ' + err.code + ' :(');
      };

      try {
        this.profile = module.require('./drivers/' + this.marketplaceId + '/profile_parser');
      } catch (_error) { errCb(_error);}
      try {
        this.profileReviews = module.require('./drivers/' + this.marketplaceId + '/profile_reviews_parser');
      } catch (_error) { errCb(_error);}
      try {
        var ProductParser = module.require('./drivers/' + this.marketplaceId + '/product_parser');
        this.product = new ProductParser();
      } catch (_error) { errCb(_error);}
      try {
        this.productReviews = module.require('./drivers/' + this.marketplaceId + '/product_reviews_parser');
      } catch (_error) { errCb(_error);}
      try {
        this.review = module.require('./drivers/' + this.marketplaceId + '/review_parser');
      } catch (_error) { errCb(_error);}
      try {
        this.storefront = module.require('./drivers/' + this.marketplaceId + '/storefront_parser');
      } catch (_error) { errCb(_error);}
      try {
        var SellerCentralParser = module.require('./drivers/' + this.marketplaceId + '/sellercentral_parser');
        this.sellercentral = new SellerCentralParser();
      } catch (_error) { errCb(_error);}
    }

    MarketplaceParser.prototype.getProfile = function(profileId, getReviews, callback) {
      if (!this.profile) {
        return callback('Profile Parser Unavailable :(');
      } else {
        return this.profile.get(profileId, getReviews, callback);
      }
    };

    MarketplaceParser.prototype.getProfileReviews = function(profileId, page, callback) {
      if (!this.profileReviews) {
        return callback('Reviews Parser Unavailable :(');
      } else {
        return this.profileReviews.get(profileId, page, callback);
      }
    };

    MarketplaceParser.prototype.getAllProfileReviews = function(profileId, callback) {
      if (!this.profileReviews) {
        return callback('Reviews Parser Unavailable :(');
      } else {
        return this.profileReviews.getAll(profileId, callback);
      }
    };

    MarketplaceParser.prototype.getProduct = function(productId, callback) {
      if (!this.product) {
        return callback('Product Parser Unavailable :(');
      } else {
        return this.product.get(productId, callback);
      }
    };

    MarketplaceParser.prototype.getProductReviews = function(profileId, page, callback) {
      if (!this.productReviews) {
        return callback('Product Reviews Parser Unavailable :(');
      } else {
        return this.productReviews.get(profileId, page, callback);
      }
    };

    MarketplaceParser.prototype.getReview = function(reviewId, callback) {
      if (!this.review) {
        return callback('Review Parser Unavailable :(');
      } else {
        return this.review.get(reviewId, callback);
      }
    };

    MarketplaceParser.prototype.getStorefront = function(merchantId, callback) {
      if (!this.storefront) {
        return callback('Review Parser Unavailable :(');
      } else {
        return this.storefront.get(merchantId, callback);
      }
    };

    return MarketplaceParser;

  })();

  module.exports = MarketplaceParser;

}).call(this);
