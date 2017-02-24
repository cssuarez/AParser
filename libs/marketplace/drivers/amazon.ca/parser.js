(function() {
  var AmazonComParser;

  AmazonComParser = (function() {
    function AmazonComParser() {}

    AmazonComParser.prototype.getProfile = function(profileId, callback) {
      return callback(null, 'CA-' + profileId);
    };

    AmazonComParser.prototype.getProduct = function(productId, callback) {
      return callback(null, 'CA-' + productId);
    };

    AmazonComParser.prototype.getReview = function(reviewId, callback) {
      return callback(null, 'CA-' + reviewId);
    };

    return AmazonComParser;

  })();

  module.exports = new AmazonComParser;

}).call(this);
