(function() {
  var AmazonComSellercentralParser, helper, Horseman, cheerio, Q, request, tough, Cookie;

  helper = require('./helpers/parser_helper');

  Horseman = require("node-horseman");
  cheerio = require('cheerio');
  request = require('request');
  tough = require('tough-cookie');
  Cookie = tough.Cookie;

  Q = require('q');
  Q.longStackSupport = true;

  isLoginPage = function(html) {
    if (typeof(html) == 'string') {
      c = cheerio.load(html);
    } else {
      c = html;
    }
    items = 0
    items += c('input#password').length;
    items += c('input#ap_password').length;
    return items != 0;
  }

  _error_codes = {
    BAD_CREDENTIALS: 'BAD_CREDENTIALS',
    NOT_LOGGED: 'NOT_LOGGED',
    OTHER: 'OTHER',
  }

  buildError = function(code, description) {
    var ret = {
      code:        code        || _error_codes.OTHER,
      description: description || '',
    };

    ret.toString = function() {
      return this.code + this.description ? (': ' + this.description) : '';
    }
    return ret;
  }

  AmazonComSellercentralParser = (function() {
    function AmazonComSellercentralParser() {
      var self = this;
      self.baseUrl = 'https://sellercentral.amazon.com/gp/';
      self.isLoggedIn = false;
      self.credentials = {
        username: undefined,
        password: undefined,
      };

      self.cookieJar = request.jar();
      self._session = [];
      self.request = request.defaults({jar: this.cookieJar});

      self.doRequest = Q.denodeify(function(method, options, callback) {
        helper.doRequest(method, options, self.request, function(err, response, body) {
          callback(err, {response: response, body:body});
        });
      });
    }

    AmazonComSellercentralParser.prototype.ERROR_CODES = _error_codes;

    AmazonComSellercentralParser.prototype.getHorseman = function() {
      var self = this;

      if (self.horseman) {
        return self.horseman;
      }

      process.on('exit', self.cleanup);

      self.horseman = new Horseman();
      self.horseman.userAgent('Mozilla/5.0 (X11; Ubuntu; Linux i686; rv:41.0) Gecko/20100101 Firefox/41.0');

      return self.horseman.cookies(self._session);
    }

    AmazonComSellercentralParser.prototype.getSession = function(cached) {
      var self = this;

      if (!cached && self.horseman) {
        return self.horseman.cookies()
      } else {
        var dfd = Q.defer();
        dfd.resolve(self._session);
        return dfd.promise;
      }
    }

    AmazonComSellercentralParser.prototype.setSession = function(cookies) {
      var self = this;

      for (var k in cookies) {
        raw_cookie = cookies[k];
        raw_cookie.key = raw_cookie.name;
        cookie = new Cookie(raw_cookie).toString();
        domain = 'http://' + raw_cookie.domain.replace(/^\./, '')
        self.cookieJar._jar.setCookieSync(cookie, domain);
      }

      self._session = cookies;
      self.request = request.defaults({jar: self.cookieJar});

      if (self.horseman) {
        return self.horseman.cookies(cookies)
      } else {
        return Q.Promise(function(resolve, reject) {
          resolve(cookies);
        });
      }
    }

    AmazonComSellercentralParser.prototype.setCredentials = function(credentials) {
      credentials = credentials || {};

      this.credentials.username = credentials.username;
      this.credentials.password = credentials.password;
    }

    AmazonComSellercentralParser.prototype.login = function(credentials) {
      var self = this;
      var credentials = credentials || self.credentials;

      self.isLoggedIn = false;

      var homeurl = 'https://sellercentral.amazon.com/gp/homepage.html';
      var p = self.logout().open(homeurl)
          .waitForNextPage()
          .type('input#username', credentials.username)
          .type('input#password', credentials.password)
          .click('button#sign-in-button')
          .waitForNextPage()
          .html()
          .then(function(html) {
            return Q.Promise(function(resolve, reject) {
              if (isLoginPage(html)) {
                reject( buildError(self.ERROR_CODES.BAD_CREDENTIALS, JSON.stringify(credentials, null, 4)) );
              } else {
                return self.getSession().then(function(session) {
                  return self.setSession(session)
                }).then(function() {
                  resolve(self);
                });
              }
            });
          });

      p.then(function() {
        self.isLoggedIn = true;
      });

      p.catch(function() {
      });

      return p;
    }

    AmazonComSellercentralParser.prototype.logout = function() {
      var self = this;

      self.isLoggedIn = false;
      return self.getHorseman().open('https://sellercentral.amazon.com/gp/sign-in/logout.html/ref=ag_logout_head_orddet').waitForNextPage();
    }

    AmazonComSellercentralParser.prototype.cleanup = function() {
      var self = this;

      if (self.horseman) {
        self.horseman.close();
      }
    }

    parseOrderDetails = function(html) {
      if (typeof(html) == 'string') {
        c = cheerio.load(html);
      } else {
        c = html;
      }
      var data = {
        buyer: {
          // The content is something like '<a href="https://sellercentral.amazon.com/gp/orders-v2/contact?ie=UTF8&amp;buyerID=A3NKHRUZGD63VH&amp;orderID=109-3880274-4561042">bruce gifford</a>'
          name: c('#_myo_contact_buyer_link').text(),
          amazon_id: c('#_myo_contact_buyer_link > a').attr()['href'].split('?')[1].match(/buyerID=(\w+)/)[1],
        },
      };

      return data;
    };

    AmazonComSellercentralParser.prototype.getOrderDetailsRequest = function(order_id) {
      var self = this;

      var url = 'https://sellercentral.amazon.com/gp/orders-v2/details/ref=ag_orddet_cont_myo?ie=UTF8&orderID=' + order_id;
      var options = {
        url: url,
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux i686; rv:41.0) Gecko/20100101 Firefox/41.0'
        }
      };

      var p = self.doRequest('get', options).then(function(resp) {
        var html = resp.body;
        return Q.Promise(function(resolve, reject) {
          c = cheerio.load(html);
          if (isLoginPage(c)) {
            self.isLoggedIn = false;
            reject( buildError(self.ERROR_CODES.NOT_LOGGED) );
          } else {
            resolve(parseOrderDetails(html));
          }
        });
      });

      return p;
    };

    AmazonComSellercentralParser.prototype.getOrderDetailsPhantom = function(order_id) {
      var self = this;

      var url = 'https://sellercentral.amazon.com/gp/orders-v2/details/ref=ag_orddet_cont_myo?ie=UTF8&orderID=' + order_id;
      var p = self.getHorseman().open(url)
          .waitForNextPage()
          .html()
          .then(function(html) {
            return Q.Promise(function(resolve, reject) {
              c = cheerio.load(html);
              if (isLoginPage(c)) {
                self.isLoggedIn = false;
                reject( buildError(self.ERROR_CODES.NOT_LOGGED) );
              } else {
                resolve(parseOrderDetails(html));
              }
            });
          });

      return p;
    };
    AmazonComSellercentralParser.prototype.getOrderDetails = AmazonComSellercentralParser.prototype.getOrderDetailsRequest;

    return AmazonComSellercentralParser;

  })();

  module.exports = AmazonComSellercentralParser;

}).call(this);
