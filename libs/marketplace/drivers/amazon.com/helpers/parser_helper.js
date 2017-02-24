(function() {
  var request, Entities;

  request = require('request');
  Entities = require('html-entities').AllHtmlEntities;
  var iconv = require('iconv-lite');
  var charset = require('charset');

  var doRequest = exports.doRequest = function(method, options, __request, callback) {
    // This way we can have custom cookie jars.
    var __request = __request || request;

    methodMap = {
      get:  __request.get,
      post: __request.post,
    };

    var __method = methodMap[method.toLowerCase()];

    if (!__method) {
      return callback('Unknown or unsupported method: ' + method);
    }

    var __callback = function(err, response, body){
      if(err) {
        callback(err);
        return;
      }

      var charsetToConvert = charset(response.headers, body);

      if(charsetToConvert) {
        response.body = iconv.decode(body, charsetToConvert);
      }

      callback(err, response, body);
    };

    return __method(options, __callback);
  };

  exports.downloadPage = function(url, callback) {
    var options = {
      url: url,
      encoding: null,
    };

    return doRequest('get', options, null, callback);
  };

  exports.doPost = function(url, data, callback) {
    var options = {
      url: url,
      encoding: null,
      formData: data,
    };

    return doRequest('post', options, null, callback);
  };

  exports.getTextFromSelectors = function(selectors, cheerio) {
    var selectors = selectors.slice(0);
    var selector;
    while(selector = selectors.shift()) {
      var content = cheerio(selector).first().text();
      content = content ? content.trim() : '';
      if (content) {
        return content;
      }
    }
  };

  /* istanbul ignore next */
  exports.getElementsFromSelectors = function(selectors, cheerio) {
    var selectors = selectors.slice(0);
    var selector;
    while(selector = selectors.shift()) {
      var matched = cheerio(selector);
      if (matched.length) {
        return matched;
      }
    }
  };

  exports.buildReviewUrl = function(id) {
    return 'http://www.amazon.com/review/' + id;
  };

  exports.buildReviewsUrl = function(id, page) {
    return 'http://www.amazon.com/gp/cdp/member-reviews/' + id + '?ie=UTF8&display=public&page=' + page + '&sort_by=MostRecentReview';
  };

  exports.extractFromString = function(string, sepator, pos) {
    return string.split(sepator, pos + 1).slice(pos).toString();
  };

  exports.removeRef = function(string) {
    var pos;
    pos = string.indexOf('/ref=');
    if (pos !== -1) {
      string = string.substring(0, pos);
    }
    return string;
  };

  exports.removeUpTo = function(html, patern) {
    var pos;
    pos = html.indexOf(patern);
    if (pos !== -1) {
      html = html.substring(pos + patern.length);
    }
    return html;
  };

  exports.extractString = function(string, start, end) {
    var result, stringEnd, stringStart;
    if(string){
      stringStart = string.indexOf(start);
      if (stringStart !== -1) {
        result = string.substring(stringStart + start.length);
        if (end) {
          stringEnd = result.indexOf(end);
          if (stringEnd !== -1) {
            result = result.substring(0, stringEnd);
          }
        }
      }
      return result;
    }
    return;
  };

  exports.convertToPhoto = function(img) {
    var pos;
    pos = img.indexOf('._');
    if (pos != -1) {
      img = img.substring(0, pos) + '.jpg';
    }
    return img;
  };

  exports.extractVideoUrl = function(html) {
    return exports.extractString(html, ',"streamingUrls":"', '","');
  };

  exports.extractVideoLength = function(text) {
    return exports.extractString(text, 'Length:: ', ' Mins');
  };

  exports.extractPhotos = function(elements) {
    var photos = [];
    if (elements && elements.length > 0) {
      elements.each(function(i, el) {
        return photos.push({
          photo: el.attribs['large-image-url'],
          thumbnail: el.attribs.src
        });
      });
    }
    return photos;
  };

  exports.extractProductsPhotos = function(elements) {
    var photos = [];
    if (elements && elements.length > 0) {
      // remove the _SSNN_ to make it a medium size image.
      // may break in the future.

      elements.each(function(i, el) {
        return photos.push({
          photo: el.attribs.src.replace(/\._SS\d\d_\./, '.'),
          thumbnail: el.attribs.src
        });
      });
    }
    return photos;
  };

  exports.extractVotes = function(text) {
    var votes;
    if (text && text.indexOf('people found the following review helpful') !== -1) {
      votes = text.split(' ', 3);
      return {
        helpful: parseInt(votes.slice(0, 1).toString()),
        total: parseInt(votes.slice(2).toString())
      };
    }
  };

  exports.removeVideoLink = function(html) {
    var patern, pos;
    patern = 'See video on Amazon.com</a>&#xA0; ';
    pos = html.indexOf(patern);
    if (pos !== -1) {
      html = html.substring(pos + patern.length);
    }
    return html;
  };

  exports.buildProfileUrl = function(id) {
    return 'http://www.amazon.com/gp/profile/' + id;
  };

  exports.extractProfileVotes = function(text) {
    var helpfulVotes, totalVotes, votes;
    if (!text) {
      return undefined;
    }

    var matches = text.match(/(\d+) of (\d+)/);
    if (!matches) {
      return undefined;
    }

    helpfulVotes = parseInt(matches[1]);
    totalVotes = parseInt(matches[2]);

    if (helpfulVotes > 0 && totalVotes > 0) {
      return {
        helpful: helpfulVotes,
        total: totalVotes
      };
    } else {
      return undefined;
    }
  };

  exports.extractProfileRanking = function(text) {
    var ranking;
    ranking = exports.extractString(text, '#');
    if (ranking) {
      return parseInt(ranking.replace(/,/g, ''));
    } else {
      return undefined;
    }
  };

  exports.buildProductUrl = function(id) {
    return 'http://www.amazon.com/dp/' + id;
  };

  exports.buildStorefrontUrl = function(id) {
    return 'http://www.amazon.com/shops/' + id;
  };

  exports.removeCurrency = function(price) {
    return parseFloat(price.replace(/[^0-9-.]/g, ''));
  };

  /* istanbul ignore next */
  exports.decodeEntities = function(string) {
    var entities = new Entities();
    return entities.decode(string);
  };

}).call(this);
