var MarketplaceParser = require('../index.js');
var amazonParser = new MarketplaceParser('amazon.com');

sellercentral = amazonParser.sellercentral;
sellercentral.setCredentials({
  username:'charly@shatwo.com',
  password:'BVzCs9wFTr7NZs8bDggVgYab'
});

order_id = '109-3880274-4561042';

p = sellercentral.login().then(function() {
  return sellercentral.getOrderDetails(order_id);
});

p.then(function(order_details) {
  console.log('Got order details: ', order_details);
});

p.catch(function(err) {
  console.log('Error: ', err);
  process.exit(1);
});

p.finally(function(){
  process.exit(0);
});

